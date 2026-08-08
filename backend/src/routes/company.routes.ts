import { Router, Response, NextFunction } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { sendSuccess } from '../utils/response';
import { AuthRequest } from '../types';
import { CompanyService } from '../services/company.service';
import { supabase, rowToCamel } from '../config/supabase';

const router = Router();
router.use(authenticate);

// ─── GET /api/company — Get current user's company ────────────────────────────
router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const company = await CompanyService.getMyCompany(req.user!.id);

    if (!company) {
      // Auto-create company from auth metadata
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;
      const email = user?.email ?? req.user!.id;
      const meta = user?.user_metadata ?? {};
      const businessName = (meta.businessName as string) || (meta.full_name as string) || email.split('@')[0];
      const created = await CompanyService.createCompany(req.user!.id, businessName, email);
      sendSuccess(res, { company: created, created: true });
      return;
    }

    sendSuccess(res, { company });
  } catch (err) {
    next(err);
  }
});

// ─── PUT /api/company — Update company profile ────────────────────────────────
router.put('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const updated = await CompanyService.updateCompany(req.user!.id, req.body as Record<string, unknown>);
    sendSuccess(res, { company: updated, message: 'Company profile updated.' });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/company/members — List company members ─────────────────────────
router.get('/members', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const companyId = await CompanyService.getCompanyId(req.user!.id);
    if (!companyId) {
      sendSuccess(res, { members: [] });
      return;
    }

    const { data, error } = await supabase
      .from('company_members')
      .select('*')
      .eq('company_id', companyId);

    if (error) {
      sendSuccess(res, { members: [] });
      return;
    }

    sendSuccess(res, { members: (data ?? []).map((m) => rowToCamel(m as Record<string, unknown>)) });
  } catch (err) {
    next(err);
  }
});

export default router;
