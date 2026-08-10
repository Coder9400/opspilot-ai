import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { SupplierService } from '../services/supplier.service';
import {
  updateSupplierProfileSchema,
  createProductSchema,
  updateProductSchema,
} from '../validators/supplier.validator';
import { ValidationError } from '../utils/errors';
import { sendSuccess } from '../utils/response';

export const SupplierController = {

  // ── Profile ────────────────────────────────────────────────────────────────

  // GET /api/suppliers/profile
  async getProfile(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const profile = await SupplierService.getProfile(req.user!.id);
      sendSuccess(res, { profile });
    } catch (err) { next(err); }
  },

  // PUT /api/suppliers/profile
  async updateProfile(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = updateSupplierProfileSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new ValidationError('Invalid supplier profile data', parsed.error.flatten());
      }
      const profile = await SupplierService.upsertProfile(req.user!.id, parsed.data);
      sendSuccess(res, { profile });
    } catch (err) { next(err); }
  },

  // GET /api/suppliers/stats
  async getStats(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await SupplierService.getDashboardStats(req.user!.id);
      sendSuccess(res, { stats });
    } catch (err) { next(err); }
  },

  // ── Products ───────────────────────────────────────────────────────────────

  // GET /api/suppliers/products
  async listProducts(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const products = await SupplierService.listProducts(req.user!.id);
      sendSuccess(res, { products });
    } catch (err) { next(err); }
  },

  // POST /api/suppliers/products
  async createProduct(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = createProductSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new ValidationError('Invalid product data', parsed.error.flatten());
      }
      const product = await SupplierService.createProduct(req.user!.id, parsed.data);
      sendSuccess(res, { product }, 201);
    } catch (err) { next(err); }
  },

  // GET /api/suppliers/products/:id
  async getProduct(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const product = await SupplierService.getProduct(req.user!.id, req.params['id'] as string);
      sendSuccess(res, { product });
    } catch (err) { next(err); }
  },

  // PUT /api/suppliers/products/:id
  async updateProduct(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = updateProductSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new ValidationError('Invalid product update data', parsed.error.flatten());
      }
      const product = await SupplierService.updateProduct(req.user!.id, req.params['id'] as string, parsed.data);
      sendSuccess(res, { product });
    } catch (err) { next(err); }
  },

  // DELETE /api/suppliers/products/:id
  async deleteProduct(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await SupplierService.deleteProduct(req.user!.id, req.params['id'] as string);
      sendSuccess(res, result);
    } catch (err) { next(err); }
  },
};
