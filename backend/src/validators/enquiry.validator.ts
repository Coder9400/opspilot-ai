import { z } from 'zod';

export const createEnquirySchema = z.object({
  sourceType: z.enum(['TEXT', 'EMAIL', 'DOCUMENT']).default('TEXT'),
  content: z
    .string({ required_error: 'Enquiry content is required' })
    .min(10, 'Enquiry content must be at least 10 characters')
    .max(50000, 'Enquiry content is too long (max 50,000 characters)'),
  // Frontend sends optional customer/company name
  customer: z.string().max(200).trim().optional(),
});

export const enquiryFilterSchema = z.object({
  status: z
    .enum(['NEW', 'ANALYZING', 'REVIEW', 'PENDING_APPROVAL', 'APPROVED', 'COMPLETED'])
    .optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type CreateEnquiryInput = z.infer<typeof createEnquirySchema>;
export type EnquiryFilterInput = z.infer<typeof enquiryFilterSchema>;
