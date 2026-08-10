import { Router, Response, NextFunction } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { sendSuccess } from '../utils/response';
import { AuthRequest } from '../types';
import { CompanyService } from '../services/company.service';
import { supabase, rowToCamel } from '../config/supabase';
import { AppError } from '../utils/errors';

const router = Router();
router.use(authenticate);

// ─── GET /api/companies/me — Get current user's company ─────────────────────
router.get('/me', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const ctx = await CompanyService.getCompanyContext(req.user!.id);

    if (!ctx) {
      throw new AppError(
        'NO_COMPANY',
        'No company workspace found. Please complete company setup.',
        404
      );
    }

    sendSuccess(res, { company: ctx.company, role: ctx.role });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/companies/:id — Get a specific company ────────────────────────
router.get('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const ctx = await CompanyService.getCompanyContext(req.user!.id);
    if (!ctx || ctx.companyId !== req.params.id) {
      throw new AppError('FORBIDDEN', 'Access denied to this company', 403);
    }
    sendSuccess(res, { company: ctx.company, role: ctx.role });
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/companies — Create company for user (onboarding) ─────────────
router.post('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const existing = await CompanyService.getMyCompany(req.user!.id);
    if (existing) {
      sendSuccess(res, { company: existing, created: false, message: 'Company already exists.' });
      return;
    }

    const body = req.body as Record<string, string>;
    const name = (body.name || body.companyName || body.businessName || '').trim()
      || req.user!.email.split('@')[0] + ' Company';

    const token = req.headers.authorization?.slice(7);
    const created = await CompanyService.createCompany(
      req.user!.id,
      {
        name,
        type:             body.type || body.companyType || 'CUSTOMER',
        email:            body.email || req.user!.email,
        city:             body.city,
        state:            body.state,
        country:          body.country,
        website:          body.website,
        industry:         body.industry,
        businessCategory: body.businessCategory,
      },
      token
    );
    sendSuccess(res, { company: created, created: true, message: 'Company workspace created.' });
  } catch (err) {
    next(err);
  }
});

// ─── PUT /api/companies/me — Update company profile ─────────────────────────
router.put('/me', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const updated = await CompanyService.updateCompany(req.user!.id, req.body as Record<string, unknown>);
    sendSuccess(res, { company: updated, message: 'Company profile updated.' });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/companies/me/members — List company members ───────────────────
router.get('/me/members', async (req: AuthRequest, res: Response, next: NextFunction) => {
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

    sendSuccess(res, {
      members: (data ?? []).map((m) => rowToCamel(m as Record<string, unknown>)),
    });
  } catch (err) {
    next(err);
  }
});

export default router;
