import { z } from 'zod';

// ─── Supplier Profile ─────────────────────────────────────────────────────────

export const updateSupplierProfileSchema = z.object({
  description:        z.string().max(5000).trim().optional().nullable(),
  businessCategory:   z.string().max(100).trim().optional().nullable(),
  business_category:  z.string().max(100).trim().optional().nullable(),
  serviceAreas:       z.union([z.array(z.string()), z.string()]).optional().nullable(),
  service_areas:      z.union([z.array(z.string()), z.string()]).optional().nullable(),
  minimumOrderValue:  z.number().min(0).optional().nullable(),
  minimum_order_value: z.number().min(0).optional().nullable(),
  certifications:     z.union([z.array(z.string()), z.string()]).optional().nullable(),
  capacity:           z.string().max(500).trim().optional().nullable(),
  deliveryInformation: z.string().max(1000).trim().optional().nullable(),
  delivery_information: z.string().max(1000).trim().optional().nullable(),
}).transform((d) => {
  const parseStringArray = (v: string | string[] | null | undefined): string[] | null => {
    if (v == null) return null;
    if (Array.isArray(v)) return v.filter(Boolean);
    return v.split(',').map((s) => s.trim()).filter(Boolean);
  };

  const out: Record<string, unknown> = {};
  if (d.description !== undefined)     out.description = d.description;
  const cat = d.businessCategory ?? d.business_category;
  if (cat !== undefined)               out.business_category = cat;
  const sa = d.serviceAreas ?? d.service_areas;
  if (sa !== undefined)                out.service_areas = parseStringArray(sa);
  const mov = d.minimumOrderValue ?? d.minimum_order_value;
  if (mov !== undefined)               out.minimum_order_value = mov;
  const cert = d.certifications;
  if (cert !== undefined)              out.certifications = parseStringArray(cert);
  if (d.capacity !== undefined)        out.capacity = d.capacity;
  const di = d.deliveryInformation ?? d.delivery_information;
  if (di !== undefined)                out.delivery_information = di;
  return out;
});

export type UpdateSupplierProfileInput = z.infer<typeof updateSupplierProfileSchema>;

// ─── Supplier Product ─────────────────────────────────────────────────────────

export const createProductSchema = z.object({
  name: z
    .string({ required_error: 'Product name is required' })
    .min(2, 'Product name must be at least 2 characters')
    .max(200)
    .trim(),
  category: z
    .string({ required_error: 'Category is required' })
    .min(1, 'Category is required')
    .max(100)
    .trim(),
  description:     z.string().max(5000).trim().optional().nullable(),
  unit: z
    .string({ required_error: 'Unit is required' })
    .min(1, 'Unit is required')
    .max(50)
    .trim(),
  minimumQuantity: z.number().min(0).optional().default(1),
  minimum_quantity: z.number().min(0).optional(),
  specifications:  z.record(z.unknown()).optional().nullable(),
}).transform((d) => ({
  name:             d.name,
  category:         d.category,
  description:      d.description ?? null,
  unit:             d.unit,
  minimum_quantity: d.minimumQuantity ?? d.minimum_quantity ?? 1,
  specifications:   d.specifications ?? null,
}));

export const updateProductSchema = z.object({
  name:             z.string().min(2).max(200).trim().optional(),
  category:         z.string().min(1).max(100).trim().optional(),
  description:      z.string().max(5000).trim().optional().nullable(),
  unit:             z.string().min(1).max(50).trim().optional(),
  minimumQuantity:  z.number().min(0).optional(),
  minimum_quantity: z.number().min(0).optional(),
  specifications:   z.record(z.unknown()).optional().nullable(),
}).transform((d) => {
  const out: Record<string, unknown> = {};
  if (d.name !== undefined)        out.name = d.name;
  if (d.category !== undefined)    out.category = d.category;
  if (d.description !== undefined) out.description = d.description;
  if (d.unit !== undefined)        out.unit = d.unit;
  const mq = d.minimumQuantity ?? d.minimum_quantity;
  if (mq !== undefined)            out.minimum_quantity = mq;
  if (d.specifications !== undefined) out.specifications = d.specifications;
  return out;
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
