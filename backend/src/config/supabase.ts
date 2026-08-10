import { createClient, SupabaseClient } from '@supabase/supabase-js';
import ws from 'ws';
import { env } from './env';

// ─── Default Supabase Client (anon key) ───────────────────────────────────────
// Used for auth verification (supabase.auth.getUser) and non-RLS-sensitive reads.
// Backend business logic enforces authorization — RLS acts as secondary safety net.

export const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
  realtime: {
    transport: ws as any,
  },
});

// ─── Admin Client (service role key) ─────────────────────────────────────────
// Bypasses RLS. Use ONLY for trusted server-side operations where the backend
// has already verified authorization (e.g., company creation during registration).
// Falls back to anon client if service role key is not configured.

let _adminClient: SupabaseClient | null = null;

export function getAdminClient(): SupabaseClient {
  if (_adminClient) return _adminClient;
  if (env.SUPABASE_SERVICE_ROLE_KEY) {
    _adminClient = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
      realtime: { transport: ws as any },
    });
    console.log('[Supabase] Admin client initialized with service role key');
  } else {
    console.warn(
      '[Supabase] SUPABASE_SERVICE_ROLE_KEY not set — using anon key for admin operations.\n' +
      '           Add it to .env to enable proper RLS bypass for server operations.'
    );
    _adminClient = supabase;
  }
  return _adminClient;
}

// ─── Per-Request Authenticated Client ────────────────────────────────────────
// Creates a Supabase client authenticated with the user's JWT.
// RLS policies (auth.uid()) work correctly with this client.
// Use this for user-specific database operations when direct DB access is needed.

export function createAuthenticatedClient(token: string): SupabaseClient {
  return createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });
}

// ─── DB Error Utilities ───────────────────────────────────────────────────────

import { NotFoundError, AppError } from '../utils/errors';

export function assertNoDbError(
  error: { message: string; code?: string } | null,
  context = 'Database'
): void {
  if (!error) return;
  console.error(`[DB] ${context}: ${error.code} — ${error.message}`);
  if (error.code === '42P01') throw new NotFoundError(context); // table not found
  if (error.code === '22P02') throw new AppError('INVALID_ID', `Invalid ID format provided`, 400);
  if (error.code === 'PGRST116') throw new NotFoundError(context); // PostgREST not found
  if (error.code === '23503') throw new AppError('REFERENCE_ERROR', `${context}: Referenced record does not exist`, 400);
  if (error.code === '23505') throw new AppError('CONFLICT', `${context}: A record with this data already exists`, 409);
  throw new AppError('DB_ERROR', `${context}: ${error.message}`, 500);
}

// ─── snake_case ↔ camelCase Utilities ─────────────────────────────────────────

function snakeToCamel(key: string): string {
  return key.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
}

export function rowToCamel<T = Record<string, unknown>>(
  row: Record<string, unknown>
): T {
  const result: Record<string, unknown> = {};
  for (const key of Object.keys(row)) {
    const camelKey = snakeToCamel(key);
    const value = row[key];
    if (Array.isArray(value)) {
      result[camelKey] = value.map((v) =>
        v && typeof v === 'object' ? rowToCamel(v as Record<string, unknown>) : v
      );
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      result[camelKey] = rowToCamel(value as Record<string, unknown>);
    } else {
      result[camelKey] = value;
    }
  }
  return result as T;
}

export function rowsToCamel<T = Record<string, unknown>>(
  rows: Record<string, unknown>[]
): T[] {
  return rows.map((r) => rowToCamel<T>(r));
}
