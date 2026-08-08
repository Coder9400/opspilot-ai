import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { supabase, assertNoDbError, rowToCamel, rowsToCamel } from '../config/supabase';
import { sendSuccess } from '../utils/response';
import { NotFoundError, ForbiddenError } from '../utils/errors';
import { AuthRequest } from '../types';
import { Response, NextFunction } from 'express';

const router = Router();
router.use(authenticate);

// GET /api/quotations — all quotations for authenticated user's enquiries
router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { data, error } = await supabase
      .from('quotations')
      .select(`
        *,
        enquiries!inner (
          customer_name,
          status,
          priority,
          user_id
        )
      `)
      .eq('enquiries.user_id', req.user!.id)
      .order('created_at', { ascending: false });

    assertNoDbError(error, 'Quotations');
    sendSuccess(res, { quotations: rowsToCamel(data as Record<string, unknown>[]) });
  } catch (err) {
    next(err);
  }
});

// GET /api/quotations/:id — single quotation
router.get('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { data, error } = await supabase
      .from('quotations')
      .select(`
        *,
        enquiries (*)
      `)
      .eq('id', req.params.id as string)
      .single();

    assertNoDbError(error, 'Quotation');
    if (!data) throw new NotFoundError('Quotation');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const row = data as Record<string, any>;
    if (row.enquiries?.user_id !== req.user!.id) throw new ForbiddenError();

    sendSuccess(res, { quotation: rowToCamel(row) });
  } catch (err) {
    next(err);
  }
});

export default router;
