import { z } from 'zod';

// ─── Project Status ───────────────────────────────────────────────────────────

export const projectStatusSchema = z.enum(['DRAFT', 'ACTIVE', 'COMPLETED', 'ARCHIVED'], {
  errorMap: () => ({ message: 'Status must be DRAFT, ACTIVE, COMPLETED, or ARCHIVED' }),
});

// ─── Create Project ───────────────────────────────────────────────────────────

export const createProjectSchema = z.object({
  name: z
    .string({ required_error: 'Project name is required' })
    .min(2, 'Project name must be at least 2 characters')
    .max(200)
    .trim(),
  description:      z.string().max(5000).trim().optional(),
  location:         z.string().max(300).trim().optional(),
  status:           projectStatusSchema.optional().default('DRAFT'),
  startDate:        z.string().optional().nullable(),
  expectedEndDate:  z.string().optional().nullable(),
  start_date:       z.string().optional().nullable(),
  expected_end_date: z.string().optional().nullable(),
}).transform((d) => ({
  name:              d.name,
  description:       d.description ?? null,
  location:          d.location ?? null,
  status:            d.status,
  start_date:        d.startDate ?? d.start_date ?? null,
  expected_end_date: d.expectedEndDate ?? d.expected_end_date ?? null,
}));

// ─── Update Project ───────────────────────────────────────────────────────────

export const updateProjectSchema = z.object({
  name:             z.string().min(2).max(200).trim().optional(),
  description:      z.string().max(5000).trim().optional().nullable(),
  location:         z.string().max(300).trim().optional().nullable(),
  status:           projectStatusSchema.optional(),
  startDate:        z.string().optional().nullable(),
  expectedEndDate:  z.string().optional().nullable(),
  start_date:       z.string().optional().nullable(),
  expected_end_date: z.string().optional().nullable(),
}).transform((d) => {
  const out: Record<string, unknown> = {};
  if (d.name !== undefined)             out.name = d.name;
  if (d.description !== undefined)      out.description = d.description;
  if (d.location !== undefined)         out.location = d.location;
  if (d.status !== undefined)           out.status = d.status;
  const sd = d.startDate ?? d.start_date;
  const ed = d.expectedEndDate ?? d.expected_end_date;
  if (sd !== undefined)                 out.start_date = sd;
  if (ed !== undefined)                 out.expected_end_date = ed;
  return out;
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
