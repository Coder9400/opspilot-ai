import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { EnquiryService } from '../services/enquiry.service';
import { createEnquirySchema, enquiryFilterSchema } from '../validators/enquiry.validator';
import { sendSuccess } from '../utils/response';
import { ValidationError } from '../utils/errors';

export const EnquiryController = {
  async create(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = createEnquirySchema.safeParse(req.body);
      if (!parsed.success) {
        throw new ValidationError('Invalid enquiry data', parsed.error.flatten());
      }
      const enquiry = await EnquiryService.create(req.user!.id, parsed.data);
      sendSuccess(res, { enquiry }, 201);
    } catch (err) {
      next(err);
    }
  },

  async findAll(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = enquiryFilterSchema.safeParse(req.query);
      if (!parsed.success) {
        throw new ValidationError('Invalid query parameters', parsed.error.flatten());
      }
      const result = await EnquiryService.findAll(req.user!.id, parsed.data);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  },

  async findById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const enquiry = await EnquiryService.findById(req.params.id as string, req.user!.id);
      sendSuccess(res, { enquiry });
    } catch (err) {
      next(err);
    }
  },

  async analyze(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await EnquiryService.analyze(req.params.id as string, req.user!.id);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  },

  async generateResponse(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await EnquiryService.generateResponse(req.params.id as string, req.user!.id);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  },

  async generateQuotation(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const quotation = await EnquiryService.generateQuotation(req.params.id as string, req.user!.id);
      sendSuccess(res, { quotation }, 201);
    } catch (err) {
      next(err);
    }
  },

  async generateFollowUps(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await EnquiryService.generateFollowUps(req.params.id as string, req.user!.id);
      sendSuccess(res, result, 201);
    } catch (err) {
      next(err);
    }
  },
};
