import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { supabase, assertNoDbError, rowToCamel, rowsToCamel } from '../config/supabase';
import { sendSuccess } from '../utils/response';
import { NotFoundError, ForbiddenError } from '../utils/errors';
import { AuthRequest } from '../types';
import { Response, NextFunction } from 'express';

const router = Router();
router.use(authenticate);

// GET /api/followups
router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const statusParam = req.query.status as string | undefined;
    const allowedStatuses = ['PENDING', 'COMPLETED', 'CANCELLED'];

    let query = supabase
      .from('follow_ups')
      .select(`
        *,
        enquiries!inner (
          customer_name,
          priority,
          status,
          user_id
        )
      `)
      .eq('enquiries.user_id', req.user!.id)
      .order('due_date', { ascending: true });

    if (statusParam && allowedStatuses.includes(statusParam)) {
      query = query.eq('status', statusParam);
    }

    const { data, error } = await query;
    assertNoDbError(error, 'Follow-ups');
    sendSuccess(res, { followUps: rowsToCamel(data as Record<string, unknown>[]) });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/followups/:id — update status
router.patch('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { data: existing, error: findErr } = await supabase
      .from('follow_ups')
      .select('id, enquiries!inner(user_id)')
      .eq('id', req.params.id as string)
      .single();

    assertNoDbError(findErr, 'Follow-up');
    if (!existing) throw new NotFoundError('Follow-up');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const row = existing as Record<string, any>;
    if (row.enquiries?.user_id !== req.user!.id) throw new ForbiddenError();

    const allowedStatuses = ['PENDING', 'COMPLETED', 'CANCELLED'];
    const { status } = req.body as { status: string };
    if (!allowedStatuses.includes(status)) {
      throw new Error(`Invalid status. Must be one of: ${allowedStatuses.join(', ')}`);
    }

    const { data: updated, error: updateErr } = await supabase
      .from('follow_ups')
      .update({ status, updated_at: new Date().toISOString() })
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
