import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { sendSuccess } from '../utils/response';
import { supabase } from '../config/supabase';

const T = {
  ENQUIRIES: 'enquiries',
  QUOTATIONS: 'quotations',
  FOLLOW_UPS: 'follow_ups',
  APPROVALS: 'approvals',
} as const;

export const DashboardController = {
  async summary(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;

      // ── Step 1: Get enquiry IDs for this user ──────────────────────────────
      // Using two-step approach because Supabase JS v2 cross-table
      // .eq('joined_table.column', value) filters are unreliable.
      const { data: enquiryRows } = await supabase
        .from(T.ENQUIRIES)
        .select('id')
        .eq('user_id', userId);
      const enquiryIds = (enquiryRows ?? []).map((r) => r.id as string);

      // ── Step 2: Run all counts in parallel ─────────────────────────────────
      const [
        totalRes,
        newRes,
        analyzingRes,
        reviewRes,
        pendingApprovalRes,
        approvedRes,
        completedRes,
        highRes,
        mediumRes,
        lowRes,
        pendingApprovalsRes,
        totalQuotationsRes,
        approvedQuotationsRes,
        pendingFollowUpsRes,
        completedFollowUpsRes,
      ] = await Promise.all([
        // Enquiry status/priority counts — safe because we filter by user_id directly
        supabase.from(T.ENQUIRIES).select('*', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from(T.ENQUIRIES).select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'NEW'),
        supabase.from(T.ENQUIRIES).select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'ANALYZING'),
        supabase.from(T.ENQUIRIES).select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'REVIEW'),
        supabase.from(T.ENQUIRIES).select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'PENDING_APPROVAL'),
        supabase.from(T.ENQUIRIES).select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'APPROVED'),
        supabase.from(T.ENQUIRIES).select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'COMPLETED'),
        supabase.from(T.ENQUIRIES).select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('priority', 'HIGH'),
        supabase.from(T.ENQUIRIES).select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('priority', 'MEDIUM'),
        supabase.from(T.ENQUIRIES).select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('priority', 'LOW'),

        // Child table counts — use .in(enquiryIds) when enquiries exist, else return 0
        enquiryIds.length > 0
          ? supabase.from(T.APPROVALS).select('*', { count: 'exact', head: true }).in('enquiry_id', enquiryIds).eq('status', 'PENDING')
          : Promise.resolve({ count: 0, error: null }),

        enquiryIds.length > 0
          ? supabase.from(T.QUOTATIONS).select('*', { count: 'exact', head: true }).in('enquiry_id', enquiryIds)
          : Promise.resolve({ count: 0, error: null }),

        enquiryIds.length > 0
          ? supabase.from(T.QUOTATIONS).select('*', { count: 'exact', head: true }).in('enquiry_id', enquiryIds).eq('status', 'APPROVED')
          : Promise.resolve({ count: 0, error: null }),

        enquiryIds.length > 0
          ? supabase.from(T.FOLLOW_UPS).select('*', { count: 'exact', head: true }).in('enquiry_id', enquiryIds).eq('status', 'PENDING')
          : Promise.resolve({ count: 0, error: null }),

        enquiryIds.length > 0
          ? supabase.from(T.FOLLOW_UPS).select('*', { count: 'exact', head: true }).in('enquiry_id', enquiryIds).eq('status', 'COMPLETED')
          : Promise.resolve({ count: 0, error: null }),
      ]);

      // ── Recent high-priority items ─────────────────────────────────────────
      const { data: recentHighPriority } = await supabase
        .from(T.ENQUIRIES)
        .select('id, customer_name, ai_summary, status, priority, created_at')
        .eq('user_id', userId)
        .eq('priority', 'HIGH')
        .in('status', ['NEW', 'REVIEW', 'PENDING_APPROVAL'])
        .order('created_at', { ascending: false })
        .limit(5);

      const totalQuotations = totalQuotationsRes.count ?? 0;
      const approvedQuotations = approvedQuotationsRes.count ?? 0;
      const pendingFollowUps = pendingFollowUpsRes.count ?? 0;
      const completedFollowUps = completedFollowUpsRes.count ?? 0;
      const totalEnquiries = totalRes.count ?? 0;
      const highPriority = highRes.count ?? 0;
      const pendingApprovals = pendingApprovalsRes.count ?? 0;

      sendSuccess(res, {
        // ── Flat keys the frontend Dashboard KPI cards read ──────────────────
        totalEnquiries,
        highPriority,
        pendingApprovals,
        followupsDue: pendingFollowUps,

        // ── Detailed breakdown ───────────────────────────────────────────────
        enquiries: {
          total: totalEnquiries,
          byStatus: {
            new: newRes.count ?? 0,
            analyzing: analyzingRes.count ?? 0,
            review: reviewRes.count ?? 0,
            pendingApproval: pendingApprovalRes.count ?? 0,
            approved: approvedRes.count ?? 0,
            completed: completedRes.count ?? 0,
          },
          byPriority: {
            high: highPriority,
            medium: mediumRes.count ?? 0,
            low: lowRes.count ?? 0,
          },
        },
        approvals: {
          pending: pendingApprovals,
        },
        quotations: {
          total: totalQuotations,
          approved: approvedQuotations,
          pendingApproval: totalQuotations - approvedQuotations,
        },
        followUps: {
          pending: pendingFollowUps,
          completed: completedFollowUps,
          total: pendingFollowUps + completedFollowUps,
        },
        recentHighPriority: (recentHighPriority ?? []).map((r) => ({
          id: r.id,
          customerName: r.customer_name,
          aiSummary: r.ai_summary,
          status: r.status,
          priority: r.priority,
          createdAt: r.created_at,
        })),
      });
    } catch (err) {
      next(err);
    }
  },
};
