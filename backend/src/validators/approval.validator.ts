import { z } from 'zod';

export const approvalActionSchema = z.object({
  actionType: z.enum(['SEND_RESPONSE', 'SEND_QUOTATION', 'COMPLETE_WORKFLOW'], {
    required_error: 'actionType is required',
    invalid_type_error:
      'actionType must be one of: SEND_RESPONSE, SEND_QUOTATION, COMPLETE_WORKFLOW',
  }),
  comments: z.string().max(2000).optional(),
});

export type ApprovalActionInput = z.infer<typeof approvalActionSchema>;
