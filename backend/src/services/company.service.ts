import { createClient } from '@supabase/supabase-js';
import { supabase, getAdminClient, assertNoDbError, rowToCamel } from '../config/supabase';
import { env } from '../config/env';
import { AuthError, ForbiddenError, NotFoundError } from '../utils/errors';

// ─── Company Service ───────────────────────────────────────────────────────────
// IMPORTANT: DB constraint on company_members.role accepts LOWERCASE: 'owner', 'admin', 'member'

export const CompanyService = {

  // ── Create company + add user as OWNER ────────────────────────────────────

  async createCompany(
    userId: string,
    data: {
      name:             string;
      type?:            string;
      email?:           string;
      phone?:           string;
      address?:         string;
      city?:            string;
      state?:           string;
      country?:         string;
      website?:         string;
      industry?:        string;
      businessCategory?: string;
    },
    /** Optional JWT token — if provided, uses authenticated client for RLS compliance */
    token?: string
  ) {
    // Guard: don't create duplicate if user already has company
    const existing = await CompanyService.getMemberRecord(userId);
    if (existing) {
      return CompanyService.getCompanyById(existing.companyId);
    }

    // Use the admin client (service role) or a user-authenticated client.
    // Service role bypasses RLS; authenticated client uses auth.uid() for RLS.
    let db = getAdminClient();
    if (token && !env.SUPABASE_SERVICE_ROLE_KEY) {
      // No service role — use authenticated client (RLS policies must allow insert)
      db = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
        auth: { autoRefreshToken: false, persistSession: false },
        global: { headers: { Authorization: `Bearer ${token}` } },
      });
    }

    const insertData: Record<string, unknown> = {
      name:       data.name,
      type:       data.type ?? 'CUSTOMER',
      email:      data.email ?? null,
      phone:      data.phone ?? null,
      address:    data.address ?? null,
      city:       data.city ?? null,
      state:      data.state ?? null,
      country:    data.country ?? 'India',
      website:    data.website ?? null,
      industry:   data.industry ?? null,
    };
    // Remove empty strings to avoid constraint issues
    for (const key of Object.keys(insertData)) {
      if (insertData[key] === '') insertData[key] = null;
    }

    const { data: company, error: cErr } = await db
      .from('companies')
      .insert(insertData)
      .select()
      .single();

    assertNoDbError(cErr, 'Company create');

    const companyId = (company as Record<string, unknown>).id as string;

    // Add user as owner — role stored LOWERCASE per DB constraint
    const { error: mErr } = await db
      .from('company_members')
      .insert({ company_id: companyId, user_id: userId, role: 'owner' });

    if (mErr) {
      console.error('[CompanyService] company_members insert error:', mErr.code, mErr.message);
      if (mErr.code !== '23505') {
        assertNoDbError(mErr, 'Company member create');
      }
    }

    return rowToCamel(company as Record<string, unknown>);
  },

  // ── Get the company a user belongs to ──────────────────────────────────────

  async getMyCompany(userId: string) {
    const member = await CompanyService.getMemberRecord(userId);
    if (!member) return null;
    return CompanyService.getCompanyById(member.companyId);
  },

  // ── Get member record (fast) ───────────────────────────────────────────────

  async getMemberRecord(userId: string): Promise<{ companyId: string; role: string } | null> {
    const { data, error } = await supabase
      .from('company_members')
      .select('company_id, role')
      .eq('user_id', userId)
      .maybeSingle();

    assertNoDbError(error, 'Company member lookup');
    if (!data) return null;
    const row = data as Record<string, unknown>;
    return {
      companyId: row.company_id as string,
      role:      row.role as string,
    };
  },

  // ── Get company by ID ──────────────────────────────────────────────────────

  async getCompanyById(companyId: string) {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('id', companyId)
      .single();

    assertNoDbError(error, 'Company fetch');
    return rowToCamel(data as Record<string, unknown>);
  },

  // ── Get company_id for a user (fast helper) ────────────────────────────────

  async getCompanyId(userId: string): Promise<string | null> {
    const member = await CompanyService.getMemberRecord(userId);
    return member?.companyId ?? null;
  },

  // ── Get company + type + role for a user ──────────────────────────────────

  async getCompanyContext(userId: string): Promise<{
    companyId: string;
    companyType: string;
    role: string;
    company: Record<string, unknown>;
  } | null> {
    const member = await CompanyService.getMemberRecord(userId);
    if (!member) return null;

    const company = await CompanyService.getCompanyById(member.companyId);
    if (!company) return null;

    return {
      companyId:   member.companyId,
      companyType: (company as any).type as string,
      role:        member.role,
      company:     company as Record<string, unknown>,
    };
  },

  // ── Update company profile ─────────────────────────────────────────────────

  async updateCompany(userId: string, updates: Record<string, unknown>) {
    const member = await CompanyService.getMemberRecord(userId);
    if (!member) throw new AuthError('No company found for this user');

    const role = member.role.toLowerCase();
    if (role !== 'owner' && role !== 'admin') {
      throw new ForbiddenError('Only company owners or admins can update company details');
    }

    const allowed = [
      'name', 'email', 'phone', 'address', 'city', 'state',
      'country', 'website', 'industry',
    ];
    const safe: Record<string, unknown> = {};
    for (const key of allowed) {
      if (key in updates) safe[key] = updates[key] || null;
    }
    safe['updated_at'] = new Date().toISOString();

    const adminClient = getAdminClient();
    const { data, error } = await adminClient
      .from('companies')
      .update(safe)
      .eq('id', member.companyId)
      .select()
      .single();

    assertNoDbError(error, 'Company update');
    return rowToCamel(data as Record<string, unknown>);
  },
};
