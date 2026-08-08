import { Request } from 'express';

// ─── Authenticated User (from Supabase JWT) ───────────────────────────────────

export interface AuthenticatedUser {
  id: string;        // Supabase auth.users UUID
  email: string;
  name: string;      // from user_metadata.name
}

// ─── Extended Express Request ─────────────────────────────────────────────────

export interface AuthRequest extends Request {
  user?: AuthenticatedUser;
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
