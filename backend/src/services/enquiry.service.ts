import { supabase, assertNoDbError, rowToCamel, rowsToCamel } from '../config/supabase';
import { CreateEnquiryInput, EnquiryFilterInput } from '../validators/enquiry.validator';
import { AIService } from '../ai/ai.service';
import { NotFoundError, ForbiddenError, AIError } from '../utils/errors';
import { EnquiryAnalysis, EnquiryContext } from '../ai/ai.types';

// ─── Table name constants ─────────────────────────────────────────────────────

const T = {
  ENQUIRIES: 'enquiries',
  QUOTATIONS: 'quotations',
  FOLLOW_UPS: 'follow_ups',
  APPROVALS: 'approvals',
} as const;

// ─── Shape enquiry row → frontend-compatible object ───────────────────────────
//
// Frontend expects:
//   enquiry.id, .content, .customer, .sourceType, .status, .priority
//   .createdAt, .updatedAt
//   .analysis  = { requirements, budget, timeline, priority, missingQuestions,
//                  summary, intent, recommendation }
//   .generatedResponse
//   .generatedQuotation  (from quotations relation or flat string)
//   .quotations[], .followUps[], .approvals[]

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function shapeEnquiry(row: Record<string, any>) {
  const base = rowToCamel(row);

  // Build the nested analysis object that the frontend AnalysisCard expects
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const analysis: Record<string, any> | null =
    (row.ai_summary || row.requirements || row.missing_questions || row.budget || row.timeline)
      ? {
          requirements: row.requirements ?? [],
          budget: row.budget ? `${row.currency || 'INR'} ${row.budget}` : undefined,
          timeline: row.timeline ?? undefined,
          priority: row.priority ?? 'MEDIUM',
          missingQuestions: Array.isArray(row.missing_questions) ? row.missing_questions : [],
          summary: row.ai_summary ?? undefined,
          intent: row.intent ?? undefined,
          recommendation: row.recommendation ?? undefined,
        }
      : null;

  return {
    ...base,
    // Aliases the frontend reads
    content: row.raw_content,               // frontend reads enquiry.content
    customer: row.customer_name ?? '',      // frontend reads enquiry.customer
    // Structured analysis object
    analysis,
    // Generated content aliases (camelCase already done by rowToCamel)
    generatedResponse: row.generated_response ?? null,
  };
}

// ─── Context builder for AI calls ─────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildEnquiryContext(row: Record<string, any>): EnquiryContext {
  return {
    rawContent: row.raw_content,
    customerName: row.customer_name,
    customerEmail: row.customer_email,
    customerPhone: row.customer_phone,
    requirements: Array.isArray(row.requirements) ? row.requirements : undefined,
    budget: row.budget,
    currency: row.currency,
    timeline: row.timeline,
    priority: row.priority,
    missingQuestions: Array.isArray(row.missing_questions) ? row.missing_questions : undefined,
    aiSummary: row.ai_summary,
  };
}

// ─── Enquiry Service ──────────────────────────────────────────────────────────

export const EnquiryService = {
  // ── Create ────────────────────────────────────────────────────────────────

  async create(userId: string, input: CreateEnquiryInput) {
    const { data, error } = await supabase
      .from(T.ENQUIRIES)
      .insert({
        user_id: userId,
        raw_content: input.content,
        source_type: input.sourceType ?? 'TEXT',
        customer_name: input.customer || null,   // store optional customer name
        status: 'NEW',
        priority: 'MEDIUM',
      })
      .select()
      .single();

    assertNoDbError(error, 'Enquiry create');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return shapeEnquiry(data as Record<string, any>);
  },

  // ── List ──────────────────────────────────────────────────────────────────

  async findAll(userId: string, filter: EnquiryFilterInput) {
    const { status, priority, page, limit } = filter;
    const skip = (page - 1) * limit;

    // Count query
    let countQuery = supabase
      .from(T.ENQUIRIES)
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);
    if (status) countQuery = countQuery.eq('status', status);
    if (priority) countQuery = countQuery.eq('priority', priority);

    const { count, error: countError } = await countQuery;
    assertNoDbError(countError, 'Enquiry count');

    // Data query
    let dataQuery = supabase
      .from(T.ENQUIRIES)
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(skip, skip + limit - 1);

    if (status) dataQuery = dataQuery.eq('status', status);
    if (priority) dataQuery = dataQuery.eq('priority', priority);

    const { data, error: dataError } = await dataQuery;
    assertNoDbError(dataError, 'Enquiry list');

    const total = count ?? 0;
    return {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      enquiries: (data as Record<string, any>[]).map(shapeEnquiry),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  // ── Get By ID (with relations) ────────────────────────────────────────────

  async findById(id: string, userId: string) {
    const { data, error } = await supabase
      .from(T.ENQUIRIES)
      .select(`
        *,
        quotations (*),
        follow_ups (*),
        approvals (*)
      `)
      .eq('id', id)
      .single();

    assertNoDbError(error, 'Enquiry');
    if (!data) throw new NotFoundError('Enquiry');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const row = data as Record<string, any>;
    if (row.user_id !== userId) throw new ForbiddenError('You do not have access to this enquiry');

    return shapeEnquiry(row);
  },

  // ── Analyze ───────────────────────────────────────────────────────────────

  async analyze(id: string, userId: string) {
    // Ownership check
    const { data: existing, error: findError } = await supabase
      .from(T.ENQUIRIES)
      .select('id, user_id, raw_content, customer_name, status')
      .eq('id', id)
      .single();

    assertNoDbError(findError, 'Enquiry');
    if (!existing) throw new NotFoundError('Enquiry');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const row = existing as Record<string, any>;
    if (row.user_id !== userId) throw new ForbiddenError('You do not have access to this enquiry');

    // Mark as analyzing
    await supabase.from(T.ENQUIRIES).update({ status: 'ANALYZING' }).eq('id', id);

    let analysis: EnquiryAnalysis;
    try {
      analysis = await AIService.analyzeEnquiry(row.raw_content);
    } catch (err) {
      await supabase.from(T.ENQUIRIES).update({ status: 'NEW' }).eq('id', id);
      throw err;
    }

    // Validate priority
    if (!['LOW', 'MEDIUM', 'HIGH'].includes(analysis.priority)) {
      analysis.priority = 'MEDIUM'; // Normalise invalid values instead of crashing
    }

    const { data: updated, error: updateError } = await supabase
      .from(T.ENQUIRIES)
      .update({
        customer_name: analysis.customerName || row.customer_name,
        customer_email: analysis.customerEmail,
        customer_phone: analysis.customerPhone,
        requirements: analysis.requirements,
        budget: analysis.budget,
        currency: analysis.currency,
        timeline: analysis.timeline,
        priority: analysis.priority,
        missing_questions: analysis.missingQuestions,
        ai_summary: analysis.summary,
        status: 'REVIEW',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    assertNoDbError(updateError, 'Enquiry update');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const shaped = shapeEnquiry(updated as Record<string, any>);
    return { enquiry: shaped, analysis: shaped.analysis };
  },

  // ── Generate Response ─────────────────────────────────────────────────────

  async generateResponse(id: string, userId: string) {
    const { data: existing, error: findError } = await supabase
      .from(T.ENQUIRIES)
      .select('*')
      .eq('id', id)
      .single();

    assertNoDbError(findError, 'Enquiry');
    if (!existing) throw new NotFoundError('Enquiry');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const row = existing as Record<string, any>;
    if (row.user_id !== userId) throw new ForbiddenError('You do not have access to this enquiry');

    const context = buildEnquiryContext(row);
    const result = await AIService.generateResponse(context);

    await supabase
      .from(T.ENQUIRIES)
      .update({
        generated_response: result.response,
        status: 'PENDING_APPROVAL',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    // Create approval record (idempotent)
    const { data: existingApproval } = await supabase
      .from(T.APPROVALS)
      .select('id')
      .eq('enquiry_id', id)
      .eq('action_type', 'SEND_RESPONSE')
      .eq('status', 'PENDING')
      .maybeSingle();

    if (!existingApproval) {
      await supabase.from(T.APPROVALS).insert({
        enquiry_id: id,
        action_type: 'SEND_RESPONSE',
        status: 'PENDING',
      });
    }

    return { response: result.response };
  },

  // ── Generate Quotation ────────────────────────────────────────────────────

  async generateQuotation(id: string, userId: string) {
    const { data: existing, error: findError } = await supabase
      .from(T.ENQUIRIES)
      .select('*')
      .eq('id', id)
      .single();

    assertNoDbError(findError, 'Enquiry');
    if (!existing) throw new NotFoundError('Enquiry');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const row = existing as Record<string, any>;
    if (row.user_id !== userId) throw new ForbiddenError('You do not have access to this enquiry');

    const context = buildEnquiryContext(row);
    const result = await AIService.generateQuotation(context);

    if (!result.items || !Array.isArray(result.items) || result.items.length === 0) {
      throw new AIError('AI generated an invalid quotation: items array is empty or missing');
    }

    const { data: quotation, error: quotationError } = await supabase
      .from(T.QUOTATIONS)
      .insert({
        enquiry_id: id,
        title: result.title,
        description: result.description,
        items: result.items,
        subtotal: result.subtotal,
        tax: result.tax,
        total: result.total,
        currency: result.currency || 'INR',
        validity_days: result.validityDays || 30,
        notes: result.notes,
        status: 'PENDING_APPROVAL',
      })
      .select()
      .single();

    assertNoDbError(quotationError, 'Quotation create');

    // Update enquiry status
    await supabase
      .from(T.ENQUIRIES)
      .update({ status: 'PENDING_APPROVAL', updated_at: new Date().toISOString() })
      .eq('id', id);

    // Create pending approval
    await supabase.from(T.APPROVALS).insert({
      enquiry_id: id,
      quotation_id: (quotation as Record<string, unknown>).id,
      action_type: 'SEND_QUOTATION',
      status: 'PENDING',
    });

    return rowToCamel(quotation as Record<string, unknown>);
  },

  // ── Generate Follow-Ups ───────────────────────────────────────────────────

  async generateFollowUps(id: string, userId: string) {
    const { data: existing, error: findError } = await supabase
      .from(T.ENQUIRIES)
      .select('*')
      .eq('id', id)
      .single();

    assertNoDbError(findError, 'Enquiry');
    if (!existing) throw new NotFoundError('Enquiry');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const row = existing as Record<string, any>;
    if (row.user_id !== userId) throw new ForbiddenError('You do not have access to this enquiry');

    const context = buildEnquiryContext(row);
    const result = await AIService.generateFollowUps(context);

    const now = new Date();
    const inserts = result.followUps.map((fu) => {
      const dueDate = new Date(now);
      dueDate.setDate(dueDate.getDate() + (fu.daysFromNow ?? 1));
      return {
        enquiry_id: id,
        title: fu.title,
        description: fu.description,
        due_date: dueDate.toISOString(),
        status: 'PENDING',
      };
    });

    const { data: followUps, error: fuError } = await supabase
      .from(T.FOLLOW_UPS)
      .insert(inserts)
      .select();

    assertNoDbError(fuError, 'Follow-up create');
    return { followUps: rowsToCamel(followUps as Record<string, unknown>[]) };
  },
};
