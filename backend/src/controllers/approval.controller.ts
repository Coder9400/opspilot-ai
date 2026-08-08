import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { ApprovalService } from '../services/approval.service';
import { approvalActionSchema } from '../validators/approval.validator';
import { sendSuccess } from '../utils/response';
import { ValidationError } from '../utils/errors';

export const ApprovalController = {
  async getApproval(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await ApprovalService.getApproval(req.params.id as string, req.user!.id);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  },

  async approve(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = approvalActionSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new ValidationError('Invalid approval data', parsed.error.flatten());
      }
      const result = await ApprovalService.approve(req.params.id as string, req.user!.id, parsed.data);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  },

  async reject(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = approvalActionSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new ValidationError('Invalid rejection data', parsed.error.flatten());
      }
      const result = await ApprovalService.reject(req.params.id as string, req.user!.id, parsed.data);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  },
};
