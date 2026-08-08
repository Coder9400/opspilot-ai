import { supabase, assertNoDbError, rowToCamel } from '../config/supabase';
import { ApprovalActionInput } from '../validators/approval.validator';
import { NotFoundError, ForbiddenError } from '../utils/errors';

const T = {
  ENQUIRIES: 'enquiries',
  QUOTATIONS: 'quotations',
  APPROVALS: 'approvals',
} as const;

export const ApprovalService = {
  // ── Get approval status for an enquiry ────────────────────────────────────

  async getApproval(enquiryId: string, userId: string) {
    // Verify ownership
    const { data: enquiry, error: eErr } = await supabase
      .from(T.ENQUIRIES)
      .select('id, user_id, status')
      .eq('id', enquiryId)
      .single();

    assertNoDbError(eErr, 'Enquiry');
    if (!enquiry) throw new NotFoundError('Enquiry');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((enquiry as any).user_id !== userId) throw new ForbiddenError('You do not have access to this enquiry');

    const { data: approvals } = await supabase
      .from(T.APPROVALS)
      .select('*')
      .eq('enquiry_id', enquiryId)
      .order('created_at', { ascending: false });

    const { data: quotations } = await supabase
      .from(T.QUOTATIONS)
      .select('*')
      .eq('enquiry_id', enquiryId)
      .order('created_at', { ascending: false })
      .limit(1);

    const rows = (approvals ?? []) as Record<string, unknown>[];
    const pendingApprovals = rows.filter((a) => a.status === 'PENDING');

    return {
      enquiryId,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      enquiryStatus: (enquiry as any).status,
      approvals: rows.map((a) => rowToCamel(a)),
      latestQuotation: quotations?.[0] ? rowToCamel(quotations[0] as Record<string, unknown>) : null,
      pendingApprovals: pendingApprovals.map((a) => rowToCamel(a)),
    };
  },

  // ── Approve an action ─────────────────────────────────────────────────────

  async approve(enquiryId: string, userId: string, input: ApprovalActionInput) {
    // Ownership check
    const { data: enquiry, error: eErr } = await supabase
      .from(T.ENQUIRIES)
      .select('id, user_id, status')
      .eq('id', enquiryId)
      .single();

    assertNoDbError(eErr, 'Enquiry');
    if (!enquiry) throw new NotFoundError('Enquiry');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((enquiry as any).user_id !== userId) throw new ForbiddenError('You do not have access to this enquiry');

    // Find or create approval record
    const { data: existingApproval } = await supabase
      .from(T.APPROVALS)
      .select('id')
      .eq('enquiry_id', enquiryId)
      .eq('action_type', input.actionType)
      .eq('status', 'PENDING')
      .maybeSingle();

    let approvalId: string;
    if (existingApproval) {
      approvalId = (existingApproval as Record<string, unknown>).id as string;
    } else {
      // Find the latest pending quotation if applicable
      let quotationId: string | null = null;
      if (input.actionType === 'SEND_QUOTATION') {
        const { data: q } = await supabase
          .from(T.QUOTATIONS)
          .select('id')
          .eq('enquiry_id', enquiryId)
          .eq('status', 'PENDING_APPROVAL')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        quotationId = q ? (q as Record<string, unknown>).id as string : null;
      }

      const { data: newApproval, error: createErr } = await supabase
        .from(T.APPROVALS)
        .insert({
          enquiry_id: enquiryId,
          quotation_id: quotationId,
          action_type: input.actionType,
          status: 'PENDING',
        })
        .select()
        .single();

      assertNoDbError(createErr, 'Approval create');
      approvalId = (newApproval as Record<string, unknown>).id as string;
    }

    // Mark approval as APPROVED
    const { data: updatedApproval, error: updateErr } = await supabase
      .from(T.APPROVALS)
      .update({
        status: 'APPROVED',
        approved_by: userId,
        comments: input.comments ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', approvalId)
      .select()
      .single();

    assertNoDbError(updateErr, 'Approval update');

    // Side effects
    if (input.actionType === 'SEND_QUOTATION') {
      const { data: q } = await supabase
        .from(T.APPROVALS)
        .select('quotation_id')
        .eq('id', approvalId)
        .single();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const qId = (q as any)?.quotation_id;
      if (qId) {
        await supabase.from(T.QUOTATIONS).update({ status: 'APPROVED' }).eq('id', qId);
      }
    }

    const newEnquiryStatus =
      input.actionType === 'COMPLETE_WORKFLOW' ? 'COMPLETED' : 'APPROVED';
    await supabase
      .from(T.ENQUIRIES)
      .update({ status: newEnquiryStatus, updated_at: new Date().toISOString() })
      .eq('id', enquiryId);

    return {
      approval: rowToCamel(updatedApproval as Record<string, unknown>),
      message:
        input.actionType === 'SEND_RESPONSE'
          ? 'Response approved. Ready to send to customer (simulated — no email sent).'
          : input.actionType === 'SEND_QUOTATION'
          ? 'Quotation approved. Ready to send to customer (simulated — no email sent).'
          : 'Workflow marked as completed.',
    };
  },

  // ── Reject an action ──────────────────────────────────────────────────────

  async reject(enquiryId: string, userId: string, input: ApprovalActionInput) {
    const { data: enquiry, error: eErr } = await supabase
      .from(T.ENQUIRIES)
      .select('id, user_id')
      .eq('id', enquiryId)
      .single();

    assertNoDbError(eErr, 'Enquiry');
    if (!enquiry) throw new NotFoundError('Enquiry');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((enquiry as any).user_id !== userId) throw new ForbiddenError('You do not have access to this enquiry');

    // Find or create approval record
    const { data: existingApproval } = await supabase
      .from(T.APPROVALS)
      .select('id')
      .eq('enquiry_id', enquiryId)
      .eq('action_type', input.actionType)
      .eq('status', 'PENDING')
      .maybeSingle();

    let approvalId: string;
    if (existingApproval) {
      approvalId = (existingApproval as Record<string, unknown>).id as string;
    } else {
      const { data: newApproval, error: createErr } = await supabase
        .from(T.APPROVALS)
        .insert({
          enquiry_id: enquiryId,
          action_type: input.actionType,
          status: 'PENDING',
        })
        .select()
        .single();
      assertNoDbError(createErr, 'Approval create');
      approvalId = (newApproval as Record<string, unknown>).id as string;
    }

    const { data: updatedApproval, error: updateErr } = await supabase
      .from(T.APPROVALS)
      .update({
        status: 'REJECTED',
        approved_by: userId,
        comments: input.comments ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', approvalId)
      .select()
      .single();

    assertNoDbError(updateErr, 'Approval update');

    if (input.actionType === 'SEND_QUOTATION') {
      const { data: q } = await supabase
        .from(T.APPROVALS)
        .select('quotation_id')
        .eq('id', approvalId)
        .single();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const qId = (q as any)?.quotation_id;
      if (qId) {
        await supabase.from(T.QUOTATIONS).update({ status: 'REJECTED' }).eq('id', qId);
      }
    }

    // Return to REVIEW status
    await supabase
      .from(T.ENQUIRIES)
      .update({ status: 'REVIEW', updated_at: new Date().toISOString() })
      .eq('id', enquiryId);

    return {
      approval: rowToCamel(updatedApproval as Record<string, unknown>),
      message: 'Action rejected. Enquiry returned to REVIEW status for revision.',
    };
  },
};
