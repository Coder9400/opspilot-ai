import { getAdminClient, assertNoDbError, rowToCamel, rowsToCamel } from '../config/supabase';
import { CompanyService } from './company.service';
import { UpdateSupplierProfileInput, CreateProductInput, UpdateProductInput } from '../validators/supplier.validator';
import { ForbiddenError, NotFoundError, AppError } from '../utils/errors';

// ─── Supplier Service ─────────────────────────────────────────────────────────
// All methods verify the user belongs to a SUPPLIER company.
// Backend enforces ownership — companyId is never trusted from request body.

async function requireSupplierContext(userId: string) {
  const ctx = await CompanyService.getCompanyContext(userId);
  if (!ctx) {
    throw new AppError('NO_COMPANY', 'No company found. Please complete company setup.', 404);
  }
  if (ctx.companyType !== 'SUPPLIER') {
    throw new ForbiddenError('Supplier features are only available for Supplier accounts');
  }
  return ctx;
}

export const SupplierService = {

  // ── Supplier Profile ───────────────────────────────────────────────────────

  async getProfile(userId: string) {
    const ctx = await requireSupplierContext(userId);
    const db = getAdminClient();

    const { data, error } = await db
      .from('supplier_profiles')
      .select('*')
      .eq('company_id', ctx.companyId)
      .maybeSingle();

    assertNoDbError(error, 'Supplier profile fetch');

    // If no profile row exists yet, return an empty profile shell
    if (!data) {
      return {
        id:                 null,
        companyId:          ctx.companyId,
        description:        null,
        businessCategory:   null,
        serviceAreas:       [],
        minimumOrderValue:  null,
        certifications:     [],
        capacity:           null,
        deliveryInformation: null,
        company:            ctx.company,
      };
    }

    return {
      ...rowToCamel(data as Record<string, unknown>),
      company: ctx.company,
    };
  },

  async upsertProfile(userId: string, input: UpdateSupplierProfileInput) {
    const ctx = await requireSupplierContext(userId);
    const db = getAdminClient();

    // Check if profile exists
    const { data: existing } = await db
      .from('supplier_profiles')
      .select('id')
      .eq('company_id', ctx.companyId)
      .maybeSingle();

    const payload = { ...input, updated_at: new Date().toISOString() };

    if (existing) {
      // Update
      const { data, error } = await db
        .from('supplier_profiles')
        .update(payload)
        .eq('company_id', ctx.companyId)
        .select()
        .single();
      assertNoDbError(error, 'Supplier profile update');
      return rowToCamel(data as Record<string, unknown>);
    } else {
      // Insert
      const { data, error } = await db
        .from('supplier_profiles')
        .insert({ company_id: ctx.companyId, ...payload })
        .select()
        .single();
      assertNoDbError(error, 'Supplier profile create');
      return rowToCamel(data as Record<string, unknown>);
    }
  },

  // ── Supplier Products ──────────────────────────────────────────────────────

  async listProducts(userId: string) {
    const ctx = await requireSupplierContext(userId);
    const db = getAdminClient();

    const { data, error } = await db
      .from('supplier_products')
      .select('*')
      .eq('company_id', ctx.companyId)
      .order('created_at', { ascending: false });

    assertNoDbError(error, 'Products list');
    return rowsToCamel(data as Record<string, unknown>[]);
  },

  async createProduct(userId: string, input: CreateProductInput) {
    const ctx = await requireSupplierContext(userId);
    const db = getAdminClient();

    const { data, error } = await db
      .from('supplier_products')
      .insert({ company_id: ctx.companyId, ...input })
      .select()
      .single();

    assertNoDbError(error, 'Product create');
    return rowToCamel(data as Record<string, unknown>);
  },

  async getProduct(userId: string, productId: string) {
    const ctx = await requireSupplierContext(userId);
    const db = getAdminClient();

    const { data, error } = await db
      .from('supplier_products')
      .select('*')
      .eq('id', productId)
      .eq('company_id', ctx.companyId)  // enforces ownership
      .maybeSingle();

    assertNoDbError(error, 'Product fetch');
    if (!data) throw new NotFoundError('Product');
    return rowToCamel(data as Record<string, unknown>);
  },

  async updateProduct(userId: string, productId: string, input: UpdateProductInput) {
    const ctx = await requireSupplierContext(userId);
    const db = getAdminClient();

    // Verify ownership
    const { data: existing } = await db
      .from('supplier_products')
      .select('id')
      .eq('id', productId)
      .eq('company_id', ctx.companyId)
      .maybeSingle();

    if (!existing) throw new NotFoundError('Product');

    const { data, error } = await db
      .from('supplier_products')
      .update({ ...input, updated_at: new Date().toISOString() })
      .eq('id', productId)
      .eq('company_id', ctx.companyId)
      .select()
      .single();

    assertNoDbError(error, 'Product update');
    return rowToCamel(data as Record<string, unknown>);
  },

  async deleteProduct(userId: string, productId: string) {
    const ctx = await requireSupplierContext(userId);
    const db = getAdminClient();

    const { data: existing } = await db
      .from('supplier_products')
      .select('id')
      .eq('id', productId)
      .eq('company_id', ctx.companyId)
      .maybeSingle();

    if (!existing) throw new NotFoundError('Product');

    const { error } = await db
      .from('supplier_products')
      .delete()
      .eq('id', productId)
      .eq('company_id', ctx.companyId);

    assertNoDbError(error, 'Product delete');
    return { deleted: true };
  },

  // ── Dashboard stats ────────────────────────────────────────────────────────

  async getDashboardStats(userId: string) {
    const ctx = await requireSupplierContext(userId);
    const db = getAdminClient();

    const { data: products, error } = await db
      .from('supplier_products')
      .select('id, category')
      .eq('company_id', ctx.companyId);

    assertNoDbError(error, 'Supplier stats');

    const productList = (products ?? []) as { id: string; category: string }[];
    const categories = [...new Set(productList.map((p) => p.category))];

    return {
      totalProducts: productList.length,
      categories:    categories.length,
      categoryList:  categories,
    };
  },
};
