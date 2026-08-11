import { getAdminClient, assertNoDbError, rowToCamel, rowsToCamel } from '../config/supabase';
import { CompanyService } from './company.service';
import { AIRequirementService, ProcurementAnalysis } from './aiRequirement.service';
import {
  CreateProcurementRequestInput,
  UpdateProcurementRequestInput,
  AnswerQuestionInput,
  UpdateRFQInput,
} from '../validators/procurement.validator';
import { ForbiddenError, NotFoundError, AppError, BadRequestError } from '../utils/errors';

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function requireCustomerContext(userId: string) {
  const ctx = await CompanyService.getCompanyContext(userId);
  if (!ctx) {
    throw new AppError('NO_COMPANY', 'No company found. Please complete company setup.', 404);
  }
  if (ctx.companyType !== 'CUSTOMER') {
    throw new ForbiddenError('Procurement requests are only available for Customer accounts');
  }
  return ctx;
}

async function verifyRequestOwnership(db: ReturnType<typeof getAdminClient>, requestId: string, companyId: string) {
  const { data, error } = await db
    .from('procurement_requests')
    .select('id, company_id, status, title, raw_requirement, ai_summary, project_id, created_by, created_at, updated_at')
    .eq('id', requestId)
    .eq('company_id', companyId)
    .maybeSingle();

  assertNoDbError(error, 'Procurement request fetch');
  if (!data) throw new NotFoundError('Procurement request');
  return rowToCamel(data as Record<string, unknown>) as Record<string, unknown>;
}

async function verifyRFQOwnership(db: ReturnType<typeof getAdminClient>, rfqId: string, companyId: string) {
  const { data, error } = await db
    .from('rfqs')
    .select('*')
    .eq('id', rfqId)
    .eq('company_id', companyId)
    .maybeSingle();

  assertNoDbError(error, 'RFQ fetch');
  if (!data) throw new NotFoundError('RFQ');
  return rowToCamel(data as Record<string, unknown>) as Record<string, unknown>;
}

// ─── Procurement Service ───────────────────────────────────────────────────────

export const ProcurementService = {

  // ── Create procurement request ─────────────────────────────────────────────

  async createRequest(userId: string, input: CreateProcurementRequestInput) {
    const ctx = await requireCustomerContext(userId);
    const db  = getAdminClient();

    const { data, error } = await db
      .from('procurement_requests')
      .insert({
        company_id:      ctx.companyId,
        created_by:      userId,
        title:           input.title,
        raw_requirement: input.raw_requirement,
        project_id:      input.project_id ?? null,
        status:          'DRAFT',
      })
      .select()
      .single();

    assertNoDbError(error, 'Procurement request create');
    return rowToCamel(data as Record<string, unknown>);
  },

  // ── List procurement requests ──────────────────────────────────────────────

  async listRequests(userId: string) {
    const ctx = await requireCustomerContext(userId);
    const db  = getAdminClient();

    const { data, error } = await db
      .from('procurement_requests')
      .select(`
        *,
        customer_projects(id, name)
      `)
      .eq('company_id', ctx.companyId)
      .order('created_at', { ascending: false });

    assertNoDbError(error, 'Procurement requests list');
    return rowsToCamel((data as Record<string, unknown>[]) ?? []);
  },

  // ── Get single procurement request ────────────────────────────────────────

  async getRequest(userId: string, requestId: string) {
    const ctx = await requireCustomerContext(userId);
    const db  = getAdminClient();
    return verifyRequestOwnership(db, requestId, ctx.companyId);
  },

  // ── Update procurement request ────────────────────────────────────────────

  async updateRequest(userId: string, requestId: string, input: UpdateProcurementRequestInput) {
    const ctx = await requireCustomerContext(userId);
    const db  = getAdminClient();

    await verifyRequestOwnership(db, requestId, ctx.companyId);

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (input.title           !== undefined) updates.title           = input.title;
    if (input.raw_requirement !== undefined) updates.raw_requirement = input.raw_requirement;
    if (input.project_id      !== undefined) updates.project_id      = input.project_id;
    if (input.status          !== undefined) updates.status          = input.status;

    const { data, error } = await db
      .from('procurement_requests')
      .update(updates)
      .eq('id', requestId)
      .eq('company_id', ctx.companyId)
      .select()
      .single();

    assertNoDbError(error, 'Procurement request update');
    return rowToCamel(data as Record<string, unknown>);
  },

  // ── Analyze requirement with AI ───────────────────────────────────────────

  async analyzeRequest(userId: string, requestId: string) {
    const ctx = await requireCustomerContext(userId);
    const db  = getAdminClient();

    const request = await verifyRequestOwnership(db, requestId, ctx.companyId);

    const status = request.status as string;
    if (status === 'APPROVED' || status === 'CANCELLED') {
      throw new BadRequestError(`Cannot analyze a request with status: ${status}`);
    }

    // Mark as ANALYZING
    await db
      .from('procurement_requests')
      .update({ status: 'ANALYZING', updated_at: new Date().toISOString() })
      .eq('id', requestId);

    try {
      // Call Mistral
      const analysis = await AIRequirementService.analyzeProcurementRequirement(
        request.rawRequirement as string
      );

      // Delete previous requirements and questions (re-analysis)
      await db.from('procurement_requirements').delete().eq('procurement_request_id', requestId);
      await db.from('requirement_questions').delete().eq('procurement_request_id', requestId);

      // Insert structured requirements
      if (analysis.requirements.length > 0) {
        const reqInserts = analysis.requirements.map((r) => ({
          procurement_request_id: requestId,
          category:               r.category,
          product_name:           r.product_name,
          description:            r.description,
          quantity:               r.quantity,
          unit:                   r.unit,
          specifications:         JSON.stringify(r.specifications),
          delivery_location:      r.delivery_requirement,
        }));
        const { error: reqErr } = await db.from('procurement_requirements').insert(reqInserts);
        if (reqErr) console.error('[ProcurementService] requirements insert error:', reqErr);
      }

      // Insert clarification questions
      if (analysis.missing_information.length > 0) {
        const qInserts = analysis.missing_information.map((m) => ({
          procurement_request_id: requestId,
          question:               m.question,
          reason:                 m.reason,
          status:                 'OPEN',
        }));
        const { error: qErr } = await db.from('requirement_questions').insert(qInserts);
        if (qErr) console.error('[ProcurementService] questions insert error:', qErr);
      }

      // Determine new status
      const newStatus = analysis.missing_information.length > 0 && analysis.confidence < 0.75
        ? 'NEEDS_CLARIFICATION'
        : 'READY_FOR_RFQ';

      // Update request status
      const { data: updated, error: updateErr } = await db
        .from('procurement_requests')
        .update({
          status:     newStatus,
          ai_summary: analysis.summary,
          updated_at: new Date().toISOString(),
        })
        .eq('id', requestId)
        .select()
        .single();

      assertNoDbError(updateErr, 'Procurement request status update');

      return {
        request:    rowToCamel(updated as Record<string, unknown>),
        analysis,
        status:     newStatus,
      };
    } catch (err) {
      // Revert status to DRAFT on AI failure
      await db
        .from('procurement_requests')
        .update({ status: 'DRAFT', updated_at: new Date().toISOString() })
        .eq('id', requestId);
      throw err;
    }
  },

  // ── Get clarification questions ────────────────────────────────────────────

  async getQuestions(userId: string, requestId: string) {
    const ctx = await requireCustomerContext(userId);
    const db  = getAdminClient();

    await verifyRequestOwnership(db, requestId, ctx.companyId);

    const { data, error } = await db
      .from('requirement_questions')
      .select('*')
      .eq('procurement_request_id', requestId)
      .order('created_at', { ascending: true });

    assertNoDbError(error, 'Questions fetch');
    return rowsToCamel((data as Record<string, unknown>[]) ?? []);
  },

  // ── Get requirements ───────────────────────────────────────────────────────

  async getRequirements(userId: string, requestId: string) {
    const ctx = await requireCustomerContext(userId);
    const db  = getAdminClient();

    await verifyRequestOwnership(db, requestId, ctx.companyId);

    const { data, error } = await db
      .from('procurement_requirements')
      .select('*')
      .eq('procurement_request_id', requestId)
      .order('created_at', { ascending: true });

    assertNoDbError(error, 'Requirements fetch');
    return rowsToCamel((data as Record<string, unknown>[]) ?? []);
  },

  // ── Answer a clarification question ───────────────────────────────────────

  async answerQuestion(
    userId:     string,
    requestId:  string,
    questionId: string,
    input:      AnswerQuestionInput
  ) {
    const ctx = await requireCustomerContext(userId);
    const db  = getAdminClient();

    // Verify request ownership
    await verifyRequestOwnership(db, requestId, ctx.companyId);

    // Verify question belongs to request
    const { data: existing, error: findErr } = await db
      .from('requirement_questions')
      .select('id')
      .eq('id', questionId)
      .eq('procurement_request_id', requestId)
      .maybeSingle();

    assertNoDbError(findErr, 'Question lookup');
    if (!existing) throw new NotFoundError('Question');

    const { data, error } = await db
      .from('requirement_questions')
      .update({
        answer:     input.answer,
        status:     input.status ?? 'ANSWERED',
        updated_at: new Date().toISOString(),
      })
      .eq('id', questionId)
      .select()
      .single();

    assertNoDbError(error, 'Question answer update');
    return rowToCamel(data as Record<string, unknown>);
  },

  // ── Re-analyze with customer answers ─────────────────────────────────────

  async reanalyzeRequest(userId: string, requestId: string) {
    const ctx = await requireCustomerContext(userId);
    const db  = getAdminClient();

    const request = await verifyRequestOwnership(db, requestId, ctx.companyId);

    const status = request.status as string;
    if (!['NEEDS_CLARIFICATION', 'READY_FOR_RFQ', 'DRAFT'].includes(status)) {
      throw new BadRequestError(`Cannot re-analyze a request with status: ${status}`);
    }

    // Fetch current questions with answers
    const { data: questionsData } = await db
      .from('requirement_questions')
      .select('*')
      .eq('procurement_request_id', requestId)
      .order('created_at', { ascending: true });

    const questions = rowsToCamel((questionsData as Record<string, unknown>[]) ?? []) as Array<{
      question: string;
      answer:   string | null;
      status:   string;
    }>;

    // Fetch previous requirements for context
    const { data: prevReqData } = await db
      .from('procurement_requirements')
      .select('*')
      .eq('procurement_request_id', requestId);

    const prevRequirements = rowsToCamel((prevReqData as Record<string, unknown>[]) ?? []) as Array<{
      category: string;
      productName: string;
      description: string;
      quantity: number | null;
      unit: string;
      specifications: unknown;
      deliveryLocation: string;
    }>;

    const prevAnalysis: ProcurementAnalysis = {
      summary:             (request.aiSummary as string) ?? '',
      project_context:     '',
      confidence:          0.5,
      requirements:        prevRequirements.map((r) => ({
        category:             r.category,
        product_name:         r.productName,
        description:          r.description,
        quantity:             r.quantity,
        unit:                 r.unit,
        specifications:       Array.isArray(r.specifications) ? r.specifications : [],
        delivery_requirement: r.deliveryLocation,
      })),
      missing_information: [],
    };

    // Mark as ANALYZING
    await db
      .from('procurement_requests')
      .update({ status: 'ANALYZING', updated_at: new Date().toISOString() })
      .eq('id', requestId);

    try {
      const analysis = await AIRequirementService.reanalyzeProcurementRequirement(
        request.rawRequirement as string,
        prevAnalysis,
        questions
      );

      // Update requirements
      await db.from('procurement_requirements').delete().eq('procurement_request_id', requestId);

      if (analysis.requirements.length > 0) {
        await db.from('procurement_requirements').insert(
          analysis.requirements.map((r) => ({
            procurement_request_id: requestId,
            category:               r.category,
            product_name:           r.product_name,
            description:            r.description,
            quantity:               r.quantity,
            unit:                   r.unit,
            specifications:         JSON.stringify(r.specifications),
            delivery_location:      r.delivery_requirement,
          }))
        );
      }

      // Handle new missing questions (add new ones, keep answered ones)
      await db
        .from('requirement_questions')
        .delete()
        .eq('procurement_request_id', requestId)
        .eq('status', 'OPEN');

      if (analysis.missing_information.length > 0) {
        await db.from('requirement_questions').insert(
          analysis.missing_information.map((m) => ({
            procurement_request_id: requestId,
            question:               m.question,
            reason:                 m.reason,
            status:                 'OPEN',
          }))
        );
      }

      const newStatus = analysis.missing_information.length > 0 && analysis.confidence < 0.75
        ? 'NEEDS_CLARIFICATION'
        : 'READY_FOR_RFQ';

      const { data: updated, error: updateErr } = await db
        .from('procurement_requests')
        .update({
          status:     newStatus,
          ai_summary: analysis.summary,
          updated_at: new Date().toISOString(),
        })
        .eq('id', requestId)
        .select()
        .single();

      assertNoDbError(updateErr, 'Re-analysis status update');

      return {
        request:  rowToCamel(updated as Record<string, unknown>),
        analysis,
        status:   newStatus,
      };
    } catch (err) {
      await db
        .from('procurement_requests')
        .update({ status: 'NEEDS_CLARIFICATION', updated_at: new Date().toISOString() })
        .eq('id', requestId);
      throw err;
    }
  },

  // ── Generate RFQ ──────────────────────────────────────────────────────────

  async generateRFQ(userId: string, requestId: string) {
    const ctx = await requireCustomerContext(userId);
    const db  = getAdminClient();

    const request = await verifyRequestOwnership(db, requestId, ctx.companyId);

    const status = request.status as string;
    if (!['READY_FOR_RFQ', 'NEEDS_CLARIFICATION'].includes(status)) {
      throw new BadRequestError(
        `Cannot generate RFQ for a request with status: ${status}. Please analyze the requirement first.`
      );
    }

    // Get requirements
    const { data: reqData } = await db
      .from('procurement_requirements')
      .select('*')
      .eq('procurement_request_id', requestId);

    if (!reqData || (reqData as unknown[]).length === 0) {
      throw new BadRequestError('No requirements found. Please analyze the requirement first.');
    }

    const requirements = rowsToCamel((reqData as Record<string, unknown>[]) ?? []) as Array<{
      category:         string;
      productName:      string;
      description:      string;
      quantity:         number | null;
      unit:             string;
      specifications:   unknown;
      deliveryLocation: string;
    }>;

    // Build analysis object for RFQ generation
    const analysis: ProcurementAnalysis = {
      summary:             (request.aiSummary as string) ?? '',
      project_context:     '',
      confidence:          0.8,
      requirements:        requirements.map((r) => ({
        category:             r.category,
        product_name:         r.productName,
        description:          r.description,
        quantity:             r.quantity,
        unit:                 r.unit,
        specifications:       Array.isArray(r.specifications) ? r.specifications : [],
        delivery_requirement: r.deliveryLocation,
      })),
      missing_information: [],
    };

    const company = ctx.company as Record<string, unknown>;
    const rfqDoc = await AIRequirementService.generateRFQFromRequirement(
      request.title as string,
      (company.name as string) ?? 'Company',
      analysis,
      request.rawRequirement as string
    );

    // Check if RFQ already exists for this request
    await db.from('rfqs').delete().eq('procurement_request_id', requestId);

    // Insert RFQ
    const { data: rfq, error: rfqErr } = await db
      .from('rfqs')
      .insert({
        procurement_request_id: requestId,
        company_id:             ctx.companyId,
        title:                  rfqDoc.title,
        description:            rfqDoc.description,
        status:                 'READY_FOR_REVIEW',
        delivery_location:      rfqDoc.delivery_location,
        response_deadline:      rfqDoc.response_deadline || null,
        terms:                  rfqDoc.terms,
      })
      .select()
      .single();

    assertNoDbError(rfqErr, 'RFQ create');
    const rfqId = (rfq as Record<string, unknown>).id as string;

    // Insert RFQ items
    if (rfqDoc.items.length > 0) {
      const { error: itemsErr } = await db.from('rfq_items').insert(
        rfqDoc.items.map((item) => ({
          rfq_id:         rfqId,
          category:       item.category,
          product_name:   item.product_name,
          description:    item.description,
          quantity:       item.quantity,
          unit:           item.unit,
          specifications: JSON.stringify(item.specifications),
        }))
      );
      if (itemsErr) console.error('[ProcurementService] rfq_items insert error:', itemsErr);
    }

    // Update procurement request status
    await db
      .from('procurement_requests')
      .update({ status: 'RFQ_GENERATED', updated_at: new Date().toISOString() })
      .eq('id', requestId);

    return {
      rfq:       rowToCamel(rfq as Record<string, unknown>),
      rfqId,
      requestId,
    };
  },

  // ── Get RFQ with items ────────────────────────────────────────────────────

  async getRFQ(userId: string, rfqId: string) {
    const ctx = await requireCustomerContext(userId);
    const db  = getAdminClient();

    const rfq = await verifyRFQOwnership(db, rfqId, ctx.companyId);

    // Get items
    const { data: itemsData, error: itemsErr } = await db
      .from('rfq_items')
      .select('*')
      .eq('rfq_id', rfqId)
      .order('created_at', { ascending: true });

    assertNoDbError(itemsErr, 'RFQ items fetch');
    const items = rowsToCamel((itemsData as Record<string, unknown>[]) ?? []);

    // Get procurement request
    const { data: requestData } = await db
      .from('procurement_requests')
      .select('id, title, raw_requirement, status, ai_summary, company_id')
      .eq('id', rfq.procurementRequestId as string)
      .maybeSingle();

    // Get company info
    const { data: companyData } = await db
      .from('companies')
      .select('id, name, email, phone, address, city, state, country')
      .eq('id', ctx.companyId)
      .maybeSingle();

    return {
      ...rfq,
      items,
      procurementRequest: requestData ? rowToCamel(requestData as Record<string, unknown>) : null,
      company:            companyData ? rowToCamel(companyData as Record<string, unknown>) : null,
    };
  },

  // ── Update RFQ ────────────────────────────────────────────────────────────

  async updateRFQ(userId: string, rfqId: string, input: UpdateRFQInput) {
    const ctx = await requireCustomerContext(userId);
    const db  = getAdminClient();

    const rfq = await verifyRFQOwnership(db, rfqId, ctx.companyId);

    if ((rfq.status as string) === 'APPROVED') {
      throw new BadRequestError('Cannot edit an approved RFQ');
    }

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (input.title             !== undefined) updates.title             = input.title;
    if (input.description       !== undefined) updates.description       = input.description;
    if (input.delivery_location !== undefined) updates.delivery_location = input.delivery_location;
    if (input.response_deadline !== undefined) updates.response_deadline = input.response_deadline || null;
    if (input.terms             !== undefined) updates.terms             = input.terms;

    const { data: updatedRFQ, error: updateErr } = await db
      .from('rfqs')
      .update(updates)
      .eq('id', rfqId)
      .select()
      .single();

    assertNoDbError(updateErr, 'RFQ update');

    // Update items if provided
    if (input.items && input.items.length > 0) {
      // Delete existing items and re-insert
      await db.from('rfq_items').delete().eq('rfq_id', rfqId);

      const { error: itemsErr } = await db.from('rfq_items').insert(
        input.items.map((item) => ({
          rfq_id:         rfqId,
          category:       item.category,
          product_name:   item.product_name,
          description:    item.description ?? null,
          quantity:       item.quantity ?? null,
          unit:           item.unit ?? null,
          specifications: JSON.stringify(item.specifications ?? []),
        }))
      );
      if (itemsErr) console.error('[ProcurementService] rfq_items update error:', itemsErr);
    }

    return rowToCamel(updatedRFQ as Record<string, unknown>);
  },

  // ── Approve RFQ ───────────────────────────────────────────────────────────

  async approveRFQ(userId: string, rfqId: string) {
    const ctx = await requireCustomerContext(userId);
    const db  = getAdminClient();

    const rfq = await verifyRFQOwnership(db, rfqId, ctx.companyId);

    if ((rfq.status as string) === 'APPROVED') {
      return rfq; // Already approved — idempotent
    }

    if (!['READY_FOR_REVIEW', 'DRAFT'].includes(rfq.status as string)) {
      throw new BadRequestError(`Cannot approve RFQ with status: ${rfq.status}`);
    }

    // Approve RFQ
    const { data: approvedRFQ, error: rfqErr } = await db
      .from('rfqs')
      .update({ status: 'APPROVED', updated_at: new Date().toISOString() })
      .eq('id', rfqId)
      .select()
      .single();

    assertNoDbError(rfqErr, 'RFQ approval');

    // Approve procurement request
    await db
      .from('procurement_requests')
      .update({ status: 'APPROVED', updated_at: new Date().toISOString() })
      .eq('id', rfq.procurementRequestId as string)
      .eq('company_id', ctx.companyId);

    return rowToCamel(approvedRFQ as Record<string, unknown>);
  },

  // ── List RFQs for company ─────────────────────────────────────────────────

  async listRFQs(userId: string) {
    const ctx = await requireCustomerContext(userId);
    const db  = getAdminClient();

    const { data, error } = await db
      .from('rfqs')
      .select('*, procurement_requests(id, title)')
      .eq('company_id', ctx.companyId)
      .order('created_at', { ascending: false });

    assertNoDbError(error, 'RFQs list');
    return rowsToCamel((data as Record<string, unknown>[]) ?? []);
  },
};
