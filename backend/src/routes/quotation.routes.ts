import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { supabase, assertNoDbError, rowToCamel, rowsToCamel } from '../config/supabase';
import { sendSuccess } from '../utils/response';
import { NotFoundError, ForbiddenError } from '../utils/errors';
import { AuthRequest } from '../types';
import { Response, NextFunction, Request } from 'express';
import { ApprovalService } from '../services/approval.service';

const router = Router();

// ─── PUBLIC route — no auth required ─────────────────────────────────────────
// GET /api/quotations/shared/:token
// Company B uses this to view the quotation Company A shared with them
router.get('/shared/:token', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const quotation = await ApprovalService.getSharedQuotation(req.params.token as string);
    sendSuccess(res, {
      quotation,
      sharedView: true,
      message: 'This quotation was shared with you by the service provider.',
    });
  } catch (err) {
    next(err);
  }
});

// ─── PROTECTED routes ──────────────────────────────────────────────────────────
router.use(authenticate);

/**
 * Get all enquiry IDs for a user — two-step approach.
 * Supabase JS v2 cross-table .eq('joinedTable.column', value) is unreliable.
 */
async function getUserEnquiryIds(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('enquiries')
    .select('id')
    .eq('user_id', userId);
  assertNoDbError(error, 'Enquiry IDs');
  return (data ?? []).map((r) => r.id as string);
}

// GET /api/quotations — all quotations for authenticated user's enquiries
router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const enquiryIds = await getUserEnquiryIds(userId);

    if (enquiryIds.length === 0) {
      sendSuccess(res, { quotations: [] });
      return;
    }

    const { data, error } = await supabase
      .from('quotations')
      .select(`
        *,
        enquiries (
          customer_name,
          status,
          priority
        )
      `)
      .in('enquiry_id', enquiryIds)
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
    const enquiry = Array.isArray(row.enquiries) ? row.enquiries[0] : row.enquiries;
    if (enquiry?.user_id !== req.user!.id) throw new ForbiddenError();

    sendSuccess(res, { quotation: rowToCamel(row) });
  } catch (err) {
    next(err);
  }
});

export default router;
