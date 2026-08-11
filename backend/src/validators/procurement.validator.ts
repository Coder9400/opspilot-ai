import { z } from 'zod';

// ─── Create Procurement Request ────────────────────────────────────────────────

export const createProcurementRequestSchema = z.object({
  title:           z.string().min(1, 'Title is required').max(255),
  raw_requirement: z.string().min(10, 'Please describe your requirement in more detail'),
  project_id:      z.string().uuid().optional().nullable(),
});

export type CreateProcurementRequestInput = z.infer<typeof createProcurementRequestSchema>;

// ─── Update Procurement Request ────────────────────────────────────────────────

export const updateProcurementRequestSchema = z.object({
  title:           z.string().min(1).max(255).optional(),
  raw_requirement: z.string().min(10).optional(),
  project_id:      z.string().uuid().nullable().optional(),
  status:          z.enum(['DRAFT', 'CANCELLED']).optional(),
});

export type UpdateProcurementRequestInput = z.infer<typeof updateProcurementRequestSchema>;

// ─── Answer Clarification Question ────────────────────────────────────────────

export const answerQuestionSchema = z.object({
  answer: z.string().min(1, 'Answer cannot be empty'),
  status: z.enum(['ANSWERED', 'SKIPPED']).optional().default('ANSWERED'),
});

export type AnswerQuestionInput = z.infer<typeof answerQuestionSchema>;

// ─── RFQ Item ────────────────────────────────────────────────────────────────

const rfqItemSchema = z.object({
  id:             z.string().uuid().optional(),
  category:       z.string().min(1),
  product_name:   z.string().min(1),
  description:    z.string().optional().nullable(),
  quantity:       z.number().optional().nullable(),
  unit:           z.string().optional().nullable(),
  specifications: z.array(z.string()).optional().default([]),
});

// ─── Update RFQ ───────────────────────────────────────────────────────────────

export const updateRFQSchema = z.object({
  title:             z.string().min(1).max(255).optional(),
  description:       z.string().optional().nullable(),
  delivery_location: z.string().optional().nullable(),
  response_deadline: z.string().optional().nullable(),
  terms:             z.string().optional().nullable(),
  items:             z.array(rfqItemSchema).optional(),
});

export type UpdateRFQInput = z.infer<typeof updateRFQSchema>;
