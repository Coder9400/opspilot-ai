import { supabase, assertNoDbError, rowToCamel } from '../config/supabase';
import { AuthError } from '../utils/errors';

// ─── Company Service ───────────────────────────────────────────────────────────
// IMPORTANT: DB constraint on company_members.role accepts LOWERCASE: 'owner', 'admin', 'member'
// The constraint was verified via live test — uppercase values are REJECTED.
// Always use lowercase role values when inserting.

export const CompanyService = {

  /** Create a new company and add the user as OWNER */
  async createCompany(userId: string, name: string, email?: string) {
    // First check if user already has a company membership to avoid duplicate violation
    const existingCompanyId = await CompanyService.getCompanyId(userId);
    if (existingCompanyId) {
      // User already has a company, return it
      const { data: company } = await supabase
        .from('companies')
        .select('*')
        .eq('id', existingCompanyId)
        .single();
      if (company) return rowToCamel(company as Record<string, unknown>);
    }

    // Create company record
    const { data: company, error: cErr } = await supabase
      .from('companies')
      .insert({ name, owner_id: userId, email: email ?? null })
      .select()
      .single();

    assertNoDbError(cErr, 'Company create');

    const companyId = (company as Record<string, unknown>).id as string;

    // Add user as owner member — DB CHECK constraint requires LOWERCASE 'owner'
    const { error: mErr } = await supabase
      .from('company_members')
      .insert({ company_id: companyId, user_id: userId, role: 'owner' });

    if (mErr) {
      console.error('[CompanyService] company_members insert error:', mErr.code, mErr.message);
      // If duplicate — the membership may already exist (race condition), still return company
      if (mErr.code === '23505') {
        return rowToCamel(company as Record<string, unknown>);
      }
      assertNoDbError(mErr, 'Company member create');
    }

    return rowToCamel(company as Record<string, unknown>);
  },

  /** Get the company that a user belongs to */
  async getMyCompany(userId: string) {
    // Find via company_members
    const { data: member, error: mErr } = await supabase
      .from('company_members')
      .select('company_id')
      .eq('user_id', userId)
      .maybeSingle();

    assertNoDbError(mErr, 'Company member lookup');
    if (!member) return null;

    const companyId = (member as Record<string, unknown>).company_id as string;

    const { data: company, error: cErr } = await supabase
      .from('companies')
      .select('*')
      .eq('id', companyId)
      .single();

    assertNoDbError(cErr, 'Company fetch');
    return rowToCamel(company as Record<string, unknown>);
  },

  /** Get company_id for a user (fast helper used by other services) */
  async getCompanyId(userId: string): Promise<string | null> {
    const { data, error } = await supabase
      .from('company_members')
      .select('company_id')
      .eq('user_id', userId)
      .maybeSingle();

    assertNoDbError(error, 'Company ID lookup');
    return data ? ((data as Record<string, unknown>).company_id as string) : null;
  },

  /** Update company profile */
  async updateCompany(userId: string, updates: Record<string, unknown>) {
    const companyId = await CompanyService.getCompanyId(userId);
    if (!companyId) throw new AuthError('No company found for this user');

    // Only the owner or admin can update
    const { data: member } = await supabase
      .from('company_members')
      .select('role')
      .eq('company_id', companyId)
      .eq('user_id', userId)
      .single();

    // role is stored as lowercase in DB — normalize for comparison
    const role = ((member as Record<string, unknown>)?.role as string)?.toLowerCase();
    if (role !== 'owner' && role !== 'admin') {
      throw new AuthError('Only company owners can update company details');
    }

    const allowed = ['name', 'email', 'phone', 'address', 'website'];
    const safe: Record<string, unknown> = {};
    for (const key of allowed) {
      if (key in updates) safe[key] = updates[key];
    }
    safe['updated_at'] = new Date().toISOString();

    const { data, error } = await supabase
      .from('companies')
      .update(safe)
      .eq('id', companyId)
      .select()
      .single();

    assertNoDbError(error, 'Company update');
    return rowToCamel(data as Record<string, unknown>);
  },

  /**
   * Ensure company exists for user.
   * This is idempotent — safe to call multiple times.
   * Only creates a company if the user has no membership.
   */
  async ensureCompany(userId: string, email: string, businessName?: string) {
    const existing = await CompanyService.getMyCompany(userId);
    if (existing) return existing;

    // Auto-create company from businessName or email prefix
    const name = businessName?.trim() || email.split('@')[0] + ' Company';
    return CompanyService.createCompany(userId, name, email);
  },
};
