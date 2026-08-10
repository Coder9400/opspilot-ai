import { z } from 'zod';

// ─── Company Type ─────────────────────────────────────────────────────────────

export const companyTypeSchema = z.enum(['CUSTOMER', 'SUPPLIER'], {
  errorMap: () => ({ message: 'Company type must be CUSTOMER or SUPPLIER' }),
});

// ─── Register Schema ──────────────────────────────────────────────────────────
// Accepts all registration fields from the 3-step onboarding form.

export const registerSchema = z.object({
  // Personal info
  fullName: z.string().min(2, 'Full name must be at least 2 characters').max(100).trim().optional(),
  name:     z.string().min(2).max(100).trim().optional(),

  email: z
    .string({ required_error: 'Email is required' })
    .email('Please provide a valid email address')
    .toLowerCase()
    .trim(),

  password: z
    .string({ required_error: 'Password is required' })
    .min(8, 'Password must be at least 8 characters')
    .max(128),

  // Company type — required from Step 2
  companyType: companyTypeSchema.optional(),

  // Company details — required from Step 3
  companyName:      z.string().min(1).max(200).trim().optional(),
  businessName:     z.string().max(200).trim().optional(), // legacy alias

  // Customer-specific
  industry:         z.string().max(100).trim().optional(),

  // Supplier-specific
  businessCategory: z.string().max(100).trim().optional(),
  serviceAreas:     z.string().max(500).trim().optional(),
  description:      z.string().max(2000).trim().optional(),

  // Common
  city:     z.string().max(100).trim().optional(),
  state:    z.string().max(100).trim().optional(),
  country:  z.string().max(100).trim().optional(),
  website:  z.string().url('Please provide a valid URL').optional().or(z.literal('')),
}).transform((data) => ({
  name:             (data.fullName || data.name || 'User').trim(),
  email:            data.email,
  password:         data.password,
  companyType:      data.companyType ?? 'CUSTOMER',
  companyName:      (data.companyName || data.businessName || '').trim(),
  businessName:     (data.companyName || data.businessName || '').trim(),
  industry:         data.industry ?? '',
  businessCategory: data.businessCategory ?? '',
  serviceAreas:     data.serviceAreas ?? '',
  description:      data.description ?? '',
  city:             data.city ?? '',
  state:            data.state ?? '',
  country:          data.country ?? 'India',
  website:          data.website ?? '',
}));

export type RegisterInput = z.infer<typeof registerSchema>;

// ─── Login Schema ─────────────────────────────────────────────────────────────

export const loginSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .email('Please provide a valid email address')
    .toLowerCase()
    .trim(),
  password: z
    .string({ required_error: 'Password is required' })
    .min(1, 'Password is required'),
});

export type LoginInput = z.infer<typeof loginSchema>;
