import { createClient } from '@supabase/supabase-js';
import { supabase, getAdminClient, rowToCamel } from '../config/supabase';
import { RegisterInput, LoginInput } from '../validators/auth.validator';
import { AuthError, ConflictError } from '../utils/errors';
import { CompanyService } from './company.service';
import { env } from '../config/env';

// ─── Auth Service (Supabase Auth) ─────────────────────────────────────────────

/** Extract display name from user_metadata — handles multiple field names */
function extractName(meta: Record<string, unknown>): string {
  return (
    (meta.fullName as string) ||
    (meta.full_name as string) ||
    (meta.name as string) ||
    ''
  );
}

export const AuthService = {
  // ── Register ───────────────────────────────────────────────────────────────

  async register(input: RegisterInput) {
    const { data, error } = await supabase.auth.signUp({
      email: input.email,
      password: input.password,
      options: {
        data: {
          name:         input.name,
          fullName:     input.name,
          full_name:    input.name,
          companyType:  input.companyType,
          companyName:  input.companyName,
          businessName: input.companyName,
        },
      },
    });

    if (error) {
      if (
        error.message.toLowerCase().includes('already registered') ||
        error.message.toLowerCase().includes('already exists') ||
        error.message.toLowerCase().includes('user already')
      ) {
        throw new ConflictError('An account with this email address already exists');
      }
      throw new AuthError(error.message);
    }

    if (!data.user) {
      throw new AuthError('Registration failed — no user returned');
    }

    // Email confirmation is disabled in this project.
    // If enabled, this branch handles it gracefully.
    if (!data.session) {
      return {
        user: {
          id:          data.user.id,
          email:       input.email,
          name:        input.name,
          companyType: input.companyType,
        },
        token: null,
        message: 'Registration successful. Please check your email to confirm your account.',
        requiresEmailConfirmation: true,
      };
    }

    const sessionToken = data.session.access_token;

    // ── Create company using the authenticated client (respects RLS) ──────────
    // We use the user's own session token so RLS policies allow the insert.
    let company: Record<string, unknown> | null = null;
    try {
      company = await CompanyService.createCompany(
        data.user.id,
        {
          name:             input.companyName || input.name + "'s Company",
          type:             input.companyType,
          email:            input.email,
          city:             input.city,
          state:            input.state,
          country:          input.country,
          website:          input.website,
          industry:         input.industry,
          businessCategory: input.businessCategory,
        },
        sessionToken
      );
    } catch (companyErr) {
      console.error('[Auth] Company creation failed:', (companyErr as Error).message);
      // Don't fail registration if company creation fails — user can retry
    }

    // ── Create supplier profile if applicable ──────────────────────────────────
    if (input.companyType === 'SUPPLIER' && company) {
      try {
        const adminClient = getAdminClient();
        const companyId = (company as any).id as string;

        await adminClient.from('supplier_profiles').insert({
          company_id:        companyId,
          description:       input.description,
          business_category: input.businessCategory,
          service_areas:     input.serviceAreas
            ? input.serviceAreas.split(',').map((s: string) => s.trim()).filter(Boolean)
            : [],
        });
      } catch (profileErr) {
        console.error('[Auth] Supplier profile creation failed:', (profileErr as Error).message);
      }
    }

    const meta = data.user.user_metadata ?? {};
    const fullName = extractName(meta) || input.name;

    return {
      user: {
        id:          data.user.id,
        email:       data.user.email ?? input.email,
        name:        fullName,
        fullName,
        companyType: input.companyType,
        companyName: input.companyName,
      },
      token: sessionToken,
      requiresEmailConfirmation: false,
    };
  },

  // ── Login ──────────────────────────────────────────────────────────────────

  async login(input: LoginInput) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email:    input.email,
      password: input.password,
    });

    if (error) {
      throw new AuthError('Invalid email or password');
    }

    if (!data.session) {
      throw new AuthError('Login failed — no session returned');
    }

    const meta = data.user.user_metadata ?? {};
    const emailPrefix = input.email.split('@')[0];
    const fullName = extractName(meta) || emailPrefix;

    return {
      user: {
        id:          data.user.id,
        email:       data.user.email ?? input.email,
        name:        fullName,
        fullName,
        companyType: (meta.companyType as string) ?? null,
        companyName: (meta.companyName as string) ?? (meta.businessName as string) ?? '',
      },
      token: data.session.access_token,
    };
  },

  // ── Get current user ───────────────────────────────────────────────────────

  async me(userId: string, token: string) {
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) throw new AuthError('User account not found or session expired');
    if (data.user.id !== userId) throw new AuthError('Session mismatch');

    const meta = data.user.user_metadata ?? {};
    const emailPrefix = (data.user.email ?? '').split('@')[0];
    const fullName = extractName(meta) || emailPrefix;

    // Load company + membership for this user
    let company: Record<string, unknown> | null = null;
    let companyType: string | null = null;
    let companyRole: string | null = null;

    try {
      const memberRecord = await CompanyService.getMemberRecord(userId);
      if (memberRecord) {
        company = await CompanyService.getCompanyById(memberRecord.companyId);
        companyType = (company?.type as string) ?? null;
        companyRole = memberRecord.role;
      }
    } catch (err) {
      console.warn('[Auth.me] Company lookup failed (non-fatal):', (err as Error).message);
    }

    return {
      id: data.user.id,
      email: data.user.email ?? '',
      name: fullName,
      fullName,
      companyType: companyType ?? (meta.companyType as string) ?? null,
      companyName: (company?.name as string) ?? (meta.companyName as string) ?? '',
      company,
      companyRole,
    };
  },
};
