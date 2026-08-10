import { Response, NextFunction } from 'express';
import { supabase, createAuthenticatedClient } from '../config/supabase';
import { AuthRequest, AuthenticatedUser } from '../types';
import { AuthError } from '../utils/errors';

/**
 * Verifies the Supabase JWT from the Authorization header.
 * On success:
 *   - populates req.user with { id, email, name }
 *   - populates req.dbClient with a per-request authenticated Supabase client
 *     (RLS policies using auth.uid() work correctly with this client)
 */
export async function authenticate(
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AuthError('No authentication token provided'));
  }

  const token = authHeader.slice(7);

  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    return next(new AuthError('Invalid or expired session. Please log in again.'));
  }

  const user = data.user;
  const authenticatedUser: AuthenticatedUser = {
    id: user.id,
    email: user.email ?? '',
    name: (user.user_metadata?.name as string) ?? '',
  };

  req.user = authenticatedUser;
  // Attach a per-request authenticated client — enables RLS to function with auth.uid()
  req.dbClient = createAuthenticatedClient(token);
  next();
}
