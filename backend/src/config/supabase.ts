import { createClient } from '@supabase/supabase-js';
import ws from 'ws';
import { env } from './env';

// ─── Supabase Client ──────────────────────────────────────────────────────────
// Single instance with anon key. Backend routes verify Supabase JWTs and
// pass user identity through req.user. For production, swap to service_role key.

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

// ─── DB Error Utilities ───────────────────────────────────────────────────────

import { NotFoundError, AppError } from '../utils/errors';

export function assertNoDbError(
  error: { message: string; code?: string } | null,
  context = 'Database'
): void {
  if (!error) return;
  console.error(`[DB] ${context}: ${error.code} — ${error.message}`);
  if (error.code === '42P01') throw new NotFoundError(context); // table not found
  if (error.code === '22P02') throw new AppError('INVALID_ID', `Invalid ID format provided`, 400); // invalid UUID
  if (error.code === 'PGRST116') throw new NotFoundError(context); // PostgREST not found (single row, no result)
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
    // Recursively convert nested arrays/objects (for relations)
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
