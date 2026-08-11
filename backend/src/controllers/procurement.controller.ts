import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { ProcurementService } from '../services/procurement.service';
import { sendSuccess } from '../utils/response';
import {
  createProcurementRequestSchema,
  updateProcurementRequestSchema,
  answerQuestionSchema,
  updateRFQSchema,
} from '../validators/procurement.validator';

// ─── Procurement Requests ──────────────────────────────────────────────────────

export async function createRequest(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const input = createProcurementRequestSchema.parse(req.body);
    const result = await ProcurementService.createRequest(req.user!.id, input);
    sendSuccess(res, { request: result }, 201);
  } catch (err) { next(err); }
}

export async function listRequests(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const requests = await ProcurementService.listRequests(req.user!.id);
    sendSuccess(res, { requests });
  } catch (err) { next(err); }
}

export async function getRequest(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const request = await ProcurementService.getRequest(req.user!.id, req.params['id'] as string);
    sendSuccess(res, { request });
  } catch (err) { next(err); }
}

export async function updateRequest(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const input = updateProcurementRequestSchema.parse(req.body);
    const request = await ProcurementService.updateRequest(req.user!.id, req.params['id'] as string, input);
    sendSuccess(res, { request });
  } catch (err) { next(err); }
}

export async function analyzeRequest(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await ProcurementService.analyzeRequest(req.user!.id, req.params['id'] as string);
    sendSuccess(res, result);
  } catch (err) { next(err); }
}

export async function getQuestions(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const questions = await ProcurementService.getQuestions(req.user!.id, req.params['id'] as string);
    sendSuccess(res, { questions });
  } catch (err) { next(err); }
}

export async function getRequirements(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const requirements = await ProcurementService.getRequirements(req.user!.id, req.params['id'] as string);
    sendSuccess(res, { requirements });
  } catch (err) { next(err); }
}

export async function answerQuestion(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const input = answerQuestionSchema.parse(req.body);
    const question = await ProcurementService.answerQuestion(
      req.user!.id,
      req.params['id'] as string,
      req.params['questionId'] as string,
      input
    );
    sendSuccess(res, { question });
  } catch (err) { next(err); }
}

export async function reanalyzeRequest(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await ProcurementService.reanalyzeRequest(req.user!.id, req.params['id'] as string);
    sendSuccess(res, result);
  } catch (err) { next(err); }
}

export async function generateRFQ(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await ProcurementService.generateRFQ(req.user!.id, req.params['id'] as string);
    sendSuccess(res, result, 201);
  } catch (err) { next(err); }
}

// ─── RFQs ────────────────────────────────────────────────────────────────────

export async function listRFQs(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const rfqs = await ProcurementService.listRFQs(req.user!.id);
    sendSuccess(res, { rfqs });
  } catch (err) { next(err); }
}

export async function getRFQ(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const rfq = await ProcurementService.getRFQ(req.user!.id, req.params['id'] as string);
    sendSuccess(res, { rfq });
  } catch (err) { next(err); }
}

export async function updateRFQ(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const input = updateRFQSchema.parse(req.body);
    const rfq = await ProcurementService.updateRFQ(req.user!.id, req.params['id'] as string, input);
    sendSuccess(res, { rfq });
  } catch (err) { next(err); }
}

export async function approveRFQ(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const rfq = await ProcurementService.approveRFQ(req.user!.id, req.params['id'] as string);
    sendSuccess(res, { rfq, message: 'RFQ approved successfully. Ready for supplier matching.' });
  } catch (err) { next(err); }
}
