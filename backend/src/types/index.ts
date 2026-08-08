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

export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiErrorPayload {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}
