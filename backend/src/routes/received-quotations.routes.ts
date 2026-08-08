import { Router, Response, NextFunction } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { supabase, assertNoDbError, rowToCamel, rowsToCamel } from '../config/supabase';
import { sendSuccess } from '../utils/response';
import { NotFoundError, ForbiddenError, AppError } from '../utils/errors';
import { AuthRequest } from '../types';
import { CompanyService } from '../services/company.service';
import { processPDF } from '../services/pdf.service';
import multer from 'multer';

const router = Router();

// ─── Multer: in-memory storage for PDF uploads (max 20MB) ───────────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    if (file.mimetype === 'application/pdf' || file.originalname.toLowerCase().endsWith('.pdf')) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are accepted'));
    }
  },
});

// All routes require authentication
router.use(authenticate);

// ─── Helper: get company for user, throw if none ─────────────────────────────
async function requireCompany(userId: string): Promise<string> {
  let companyId = await CompanyService.getCompanyId(userId);
  if (!companyId) {
    // Auto-create company if user doesn't have one yet
    const { data: userData } = await supabase.auth.getUser();
    const email = userData?.user?.email ?? userId;
    const company = await CompanyService.ensureCompany(userId, email);
    companyId = (company as Record<string, unknown>).id as string;
  }
  return companyId!;
}

// ─── GET /api/received-quotations ────────────────────────────────────────────
router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const companyId = await requireCompany(req.user!.id);

    const { data, error } = await supabase
      .from('received_quotations')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    assertNoDbError(error, 'Received quotations');
    sendSuccess(res, { receivedQuotations: rowsToCamel((data ?? []) as Record<string, unknown>[]) });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/received-quotations/:id ────────────────────────────────────────
router.get('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const companyId = await requireCompany(req.user!.id);

    const { data, error } = await supabase
      .from('received_quotations')
      .select('*')
      .eq('id', req.params.id as string)
      .single();

    assertNoDbError(error, 'Received quotation');
    if (!data) throw new NotFoundError('Received quotation');

    const row = data as Record<string, unknown>;
    if (row.company_id !== companyId) throw new ForbiddenError();

    sendSuccess(res, { receivedQuotation: rowToCamel(row) });
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/received-quotations/upload — Upload + AI extract PDF ──────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
router.post('/upload', (upload as any).single('pdf'), async (req: AuthRequest & { file?: Express.Multer.File }, res: Response, next: NextFunction) => {
  try {
    if (!req.file) throw new AppError('MISSING_FILE', 'PDF file is required', 400);

    const companyId = await requireCompany(req.user!.id);
    const fileName = req.file.originalname;
    const { senderName, senderEmail, senderCompany, emailSubject } = req.body as Record<string, string>;

    // Step 1: Create initial record with PROCESSING status
    const { data: initial, error: iErr } = await supabase
      .from('received_quotations')
      .insert({
        company_id: companyId,
        attachment_name: fileName,
        sender_name: senderName ?? null,
        sender_email: senderEmail ?? null,
        sender_company: senderCompany ?? null,
        email_subject: emailSubject ?? `Quotation — ${fileName}`,
        extraction_status: 'PROCESSING',
        review_status: 'PENDING',
        source: 'UPLOAD',
      })
      .select()
      .single();

    assertNoDbError(iErr, 'Received quotation create');
    const recordId = (initial as Record<string, unknown>).id as string;

    // Step 2: Process PDF (extraction runs async, but we wait here for demo simplicity)
    const result = await processPDF(req.file.buffer, fileName);

    // Step 3: Build update payload from extraction result
    const updateData: Record<string, unknown> = {
      extraction_status: result.status,
      has_discrepancy: result.hasDiscrepancy,
      discrepancy_notes: result.discrepancyNotes,
      ai_insights: result.aiInsights,
      extracted_data: result.extracted,
      updated_at: new Date().toISOString(),
    };

    if (result.extracted) {
      const e = result.extracted;
      updateData.quotation_number = e.quotationNumber;
      updateData.quotation_title = e.quotationTitle ?? `Quotation from ${e.supplier?.name ?? 'Unknown'}`;
      updateData.currency = e.currency ?? 'INR';
      updateData.subtotal = e.subtotal;
      updateData.tax = e.tax;
      updateData.grand_total = e.grandTotal;
      updateData.quotation_date = e.date;
      updateData.valid_until = e.validUntil;
      updateData.items = e.items;
      updateData.terms = e.terms;
      // Override sender info if AI found it and user didn't provide it
      if (!senderName && e.supplier?.name) updateData.sender_name = e.supplier.name;
      if (!senderEmail && e.supplier?.email) updateData.sender_email = e.supplier.email;
      if (!senderCompany && e.supplier?.name) updateData.sender_company = e.supplier.name;
    }

    // Step 4: Save final result
    const { data: updated, error: uErr } = await supabase
      .from('received_quotations')
      .update(updateData)
      .eq('id', recordId)
      .select()
      .single();

    assertNoDbError(uErr, 'Received quotation update');

    sendSuccess(res, {
      receivedQuotation: rowToCamel(updated as Record<string, unknown>),
      extractionStatus: result.status,
      hasDiscrepancy: result.hasDiscrepancy,
      message:
        result.status === 'READY'
          ? 'PDF processed successfully. All financials validated.'
          : result.status === 'REVIEW_REQUIRED'
          ? 'PDF processed with warnings. Please review the extracted data.'
          : 'PDF processing failed. Please enter details manually.',
    });
  } catch (err) {
    next(err);
  }
});

// ─── PUT /api/received-quotations/:id — Manual correction ────────────────────
router.put('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const companyId = await requireCompany(req.user!.id);

    const { data: existing, error: fErr } = await supabase
      .from('received_quotations')
      .select('company_id')
      .eq('id', req.params.id as string)
      .single();

    assertNoDbError(fErr, 'Received quotation');
    if (!existing) throw new NotFoundError('Received quotation');
    if ((existing as Record<string, unknown>).company_id !== companyId) throw new ForbiddenError();

    const body = req.body as Record<string, unknown>;
    const allowed = [
      'sender_name', 'sender_email', 'sender_company', 'email_subject',
      'quotation_number', 'quotation_title', 'currency',
      'subtotal', 'tax', 'grand_total', 'quotation_date', 'valid_until',
      'items', 'terms', 'review_status',
    ];

    const safe: Record<string, unknown> = { updated_at: new Date().toISOString() };
    for (const key of allowed) {
      if (key in body) safe[key] = body[key];
    }

    // Mark as reviewed when user manually corrects
    safe['review_status'] = 'REVIEWED';
    safe['extraction_status'] = 'READY'; // Human reviewed = ready

    const { data, error } = await supabase
      .from('received_quotations')
      .update(safe)
      .eq('id', req.params.id as string)
      .select()
      .single();

    assertNoDbError(error, 'Received quotation update');
    sendSuccess(res, {
      receivedQuotation: rowToCamel(data as Record<string, unknown>),
      message: 'Quotation updated and marked as reviewed.',
    });
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/received-quotations/:id/reprocess — Re-run AI extraction ──────
router.post('/:id/reprocess', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const companyId = await requireCompany(req.user!.id);

    const { data: existing, error: fErr } = await supabase
      .from('received_quotations')
      .select('*')
      .eq('id', req.params.id as string)
      .single();

    assertNoDbError(fErr, 'Received quotation');
    if (!existing) throw new NotFoundError('Received quotation');
    if ((existing as Record<string, unknown>).company_id !== companyId) throw new ForbiddenError();

    const row = existing as Record<string, unknown>;

    // Check if we have stored extracted_data (raw text would be needed for re-extraction)
    // For now, tell user to re-upload
    if (!row.extracted_data) {
      throw new AppError('NO_SOURCE', 'No extraction data available. Please re-upload the PDF.', 400);
    }

    sendSuccess(res, {
      message: 'To reprocess this quotation, please upload the PDF again using the upload endpoint.',
      receivedQuotation: rowToCamel(row),
    });
  } catch (err) {
    next(err);
  }
});

export default router;
