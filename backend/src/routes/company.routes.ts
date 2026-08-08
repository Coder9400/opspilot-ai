import { Router, Response, NextFunction } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { sendSuccess } from '../utils/response';
import { AuthRequest } from '../types';
import { CompanyService } from '../services/company.service';
import { supabase, rowToCamel } from '../config/supabase';
import { AppError } from '../utils/errors';

const router = Router();
router.use(authenticate);

// ─── GET /api/company — Get current user's company ────────────────────────────
router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const company = await CompanyService.getMyCompany(req.user!.id);

    if (!company) {
      // Do NOT auto-create here — this causes the constraint loop.
      // Return a clear error so the frontend can guide users to onboarding.
      throw new AppError(
        'NO_COMPANY',
        'No company workspace found. Please complete company setup.',
        404
      );
    }

    sendSuccess(res, { company });
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/company — Create company for user (onboarding) ─────────────────
router.post('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // Only create if user doesn't already have one
    const existing = await CompanyService.getMyCompany(req.user!.id);
    if (existing) {
      sendSuccess(res, { company: existing, created: false, message: 'Company already exists.' });
      return;
    }

    const body = req.body as Record<string, string>;
    const name = body.name?.trim() || body.businessName?.trim() || req.user!.email.split('@')[0] + ' Company';
    const email = body.email || req.user!.email;
    const created = await CompanyService.createCompany(req.user!.id, name, email);
    sendSuccess(res, { company: created, created: true, message: 'Company workspace created.' });
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
