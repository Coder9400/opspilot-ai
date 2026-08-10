import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { supabase, assertNoDbError, rowToCamel, rowsToCamel } from '../config/supabase';
import { sendSuccess } from '../utils/response';
import { NotFoundError, ForbiddenError } from '../utils/errors';
import { AuthRequest } from '../types';
import { Response, NextFunction } from 'express';

const router = Router();
router.use(authenticate);

/**
 * Get all enquiry IDs that belong to a user.
 * Used as a workaround because Supabase JS v2 doesn't reliably
 * filter child tables via .eq('joinedTable.column', value).
 */
async function getUserEnquiryIds(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('enquiries')
    .select('id')
    .eq('user_id', userId);
  assertNoDbError(error, 'Enquiry IDs');
  return (data ?? []).map((r) => r.id as string);
}

// GET /api/followups
router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const statusParam = req.query.status as string | undefined;
    const allowedStatuses = ['PENDING', 'COMPLETED', 'CANCELLED'];
    const userId = req.user!.id;

    // Step 1: get user's enquiry IDs
    const enquiryIds = await getUserEnquiryIds(userId);

    if (enquiryIds.length === 0) {
      const empty: unknown[] = [];
      sendSuccess(res, { followUps: empty, followups: empty });
      return;
    }

    // Step 2: get follow-ups for those enquiry IDs
    let query = supabase
      .from('follow_ups')
      .select(`
        *,
        enquiries (
          customer_name,
          priority,
          status
        )
      `)
      .in('enquiry_id', enquiryIds)
      .order('due_date', { ascending: true });

    if (statusParam && allowedStatuses.includes(statusParam)) {
      query = query.eq('status', statusParam);
    }

    const { data, error } = await query;
    assertNoDbError(error, 'Follow-ups');
    const shaped = rowsToCamel(data as Record<string, unknown>[]);
    // Return both keys: dashboard reads data.followups, followup page reads data.followUps
    sendSuccess(res, { followUps: shaped, followups: shaped });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/followups/:id — update status
router.patch('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;

    // Fetch the follow-up + its parent enquiry user_id
    const { data: existing, error: findErr } = await supabase
      .from('follow_ups')
      .select('id, enquiry_id, enquiries(user_id)')
      .eq('id', req.params.id as string)
      .single();

    assertNoDbError(findErr, 'Follow-up');
    if (!existing) throw new NotFoundError('Follow-up');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const row = existing as Record<string, any>;
    // enquiries is returned as object or array depending on the join type
    const enquiry = Array.isArray(row.enquiries) ? row.enquiries[0] : row.enquiries;
    if (enquiry?.user_id !== userId) throw new ForbiddenError();

    const allowedStatuses = ['PENDING', 'COMPLETED', 'CANCELLED'];
    const { status } = req.body as { status: string };
    if (!allowedStatuses.includes(status)) {
      throw new Error(`Invalid status. Must be one of: ${allowedStatuses.join(', ')}`);
    }

    const updateData: Record<string, any> = { status, updated_at: new Date().toISOString() };
    if (status === 'COMPLETED') {
      updateData.completed_at = new Date().toISOString();
    } else {
      updateData.completed_at = null;
    }

    const { data: updated, error: updateErr } = await supabase
      .from('follow_ups')
      .update(updateData)
      .eq('id', req.params.id as string)
      .select()
      .single();

    assertNoDbError(updateErr, 'Follow-up update');
    sendSuccess(res, { followUp: rowToCamel(updated as Record<string, unknown>) });
  } catch (err) {
    next(err);
  }
});

export default router;
