import { Request } from 'express';
import { SupabaseClient } from '@supabase/supabase-js';

// ─── Authenticated User (from Supabase JWT) ───────────────────────────────────

export interface AuthenticatedUser {
  id: string;        // Supabase auth.users UUID
  email: string;
  name: string;      // from user_metadata.name
}

// ─── Extended Express Request ─────────────────────────────────────────────────

export interface AuthRequest extends Request {
  user?: AuthenticatedUser;
  /**
   * Per-request Supabase client authenticated with the user's JWT.
   * RLS policies (auth.uid()) work correctly with this client.
   * Populated by the authenticate() middleware.
   */
  dbClient?: SupabaseClient;
}

// ─── Company types ────────────────────────────────────────────────────────────

export type CompanyType = 'CUSTOMER' | 'SUPPLIER';
export type MemberRole = 'owner' | 'admin' | 'member';

export interface Company {
  id: string;
  name: string;
  type: CompanyType;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  website?: string;
  industry?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── API Response types ────────────────────────────────────────────────────────

/**
 * @deprecated The backend now returns data directly (no wrapper).
 * Kept for backward-compat type references only.
 */
export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiErrorPayload {
  success: false;
  message: string;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}
