import { Router } from 'express';
import { EnquiryController } from '../controllers/enquiry.controller';
import { ApprovalController } from '../controllers/approval.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

// All enquiry routes require authentication
router.use(authenticate);

// ── Core CRUD ─────────────────────────────────────────────────────────────────
router.post('/', EnquiryController.create);
router.get('/', EnquiryController.findAll);
router.get('/:id', EnquiryController.findById);

// ── AI Workflow Actions ───────────────────────────────────────────────────────
router.post('/:id/analyze', EnquiryController.analyze);
router.post('/:id/generate-response', EnquiryController.generateResponse);
router.post('/:id/generate-quotation', EnquiryController.generateQuotation);
router.post('/:id/generate-followups', EnquiryController.generateFollowUps);

// ── Human Approval Gates ──────────────────────────────────────────────────────
router.get('/:id/approval', ApprovalController.getApproval);
router.post('/:id/approve', ApprovalController.approve);
router.post('/:id/reject', ApprovalController.reject);

export default router;
