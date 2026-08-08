import { z } from 'zod';

export const registerSchema = z.object({
  // Frontend sends "fullName" — map it to "name"
  fullName: z.string().min(2).max(100).trim().optional(),
  name: z.string().min(2).max(100).trim().optional(),
  businessName: z.string().max(200).trim().optional(),
  email: z
    .string({ required_error: 'Email is required' })
    .email('Please provide a valid email address')
    .toLowerCase()
    .trim(),
  password: z
    .string({ required_error: 'Password is required' })
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must not exceed 128 characters'),
}).transform((data) => ({
  // Normalise: accept fullName or name
  name: (data.fullName || data.name || 'User').trim(),
  businessName: data.businessName ?? '',
  email: data.email,
  password: data.password,
}));

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

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
