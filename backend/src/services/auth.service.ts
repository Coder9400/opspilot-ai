import { supabase } from '../config/supabase';
import { RegisterInput, LoginInput } from '../validators/auth.validator';
import { AuthError, ConflictError } from '../utils/errors';

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
          name: input.name,
          fullName: input.name,
          full_name: input.name,
          businessName: (input as Record<string, unknown>).businessName ?? '',
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

    if (!data.user || !data.session) {
      return {
        user: {
          id: data.user?.id ?? '',
          email: input.email,
          name: input.name,
          fullName: input.name,
          businessName: (input as Record<string, unknown>).businessName ?? '',
        },
        token: null,
        message: 'Registration successful. Please check your email to confirm your account.',
        requiresEmailConfirmation: true,
      };
    }

    const meta = data.user.user_metadata ?? {};
    const fullName = extractName(meta) || input.name;
    const businessName = (meta.businessName as string) ?? (input as Record<string, unknown>).businessName ?? '';

    return {
      user: {
        id: data.user.id,
        email: data.user.email ?? input.email,
        name: fullName,
        fullName,
        businessName,
      },
      token: data.session.access_token,
      requiresEmailConfirmation: false,
    };
  },

  // ── Login ──────────────────────────────────────────────────────────────────

  async login(input: LoginInput) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: input.email,
      password: input.password,
    });

    if (error) {
      throw new AuthError('Invalid email or password');
    }

    if (!data.session) {
      throw new AuthError('Login failed — no session returned');
    }

    const meta = data.user.user_metadata ?? {};
    // Derive name from email prefix as fallback for users with no metadata
    const emailPrefix = input.email.split('@')[0];
    const fullName = extractName(meta) || emailPrefix;
    const businessName = (meta.businessName as string) ?? '';

    return {
      user: {
        id: data.user.id,
        email: data.user.email ?? input.email,
        name: fullName,
        fullName,
        businessName,
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

    return {
      id: data.user.id,
      email: data.user.email ?? '',
      name: fullName,
      fullName,
      businessName: (meta.businessName as string) ?? '',
    };
  },
};
