import { z } from 'zod';

// For approve — actionType required
export const approvalActionSchema = z.object({
  actionType: z
    .enum(['SEND_RESPONSE', 'SEND_QUOTATION', 'COMPLETE_WORKFLOW'], {
      required_error: 'actionType is required',
      invalid_type_error:
        'actionType must be one of: SEND_RESPONSE, SEND_QUOTATION, COMPLETE_WORKFLOW',
    })
    .default('SEND_QUOTATION'),
  comments: z.string().max(2000).optional(),
});

// For reject — actionType is optional; defaults to SEND_QUOTATION
export const rejectActionSchema = z.object({
  actionType: z
    .enum(['SEND_RESPONSE', 'SEND_QUOTATION', 'COMPLETE_WORKFLOW'])
    .default('SEND_QUOTATION'),
  comments: z.string().max(2000).optional(),
});

export type ApprovalActionInput = z.infer<typeof approvalActionSchema>;
export type RejectActionInput = z.infer<typeof rejectActionSchema>;
