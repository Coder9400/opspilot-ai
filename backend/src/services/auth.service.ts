import { supabase } from '../config/supabase';
import { RegisterInput, LoginInput } from '../validators/auth.validator';
import { AuthError, ConflictError } from '../utils/errors';

// ─── Auth Service (Supabase Auth) ─────────────────────────────────────────────

export const AuthService = {
  // ── Register ───────────────────────────────────────────────────────────────

  async register(input: RegisterInput) {
    const { data, error } = await supabase.auth.signUp({
      email: input.email,
      password: input.password,
      options: {
        data: {
          name: input.name,
        },
      },
    });

    if (error) {
      // Supabase returns "User already registered" if email exists
      if (
        error.message.toLowerCase().includes('already registered') ||
        error.message.toLowerCase().includes('already exists')
      ) {
        throw new ConflictError('An account with this email address already exists');
      }
      throw new AuthError(error.message);
    }

    if (!data.user || !data.session) {
      // Supabase email confirmation is enabled — user needs to verify email
      return {
        user: {
          id: data.user?.id ?? '',
          email: input.email,
          name: input.name,
        },
        token: null,
        message: 'Registration successful. Please check your email to confirm your account.',
        requiresEmailConfirmation: true,
      };
    }

    return {
      user: {
        id: data.user.id,
        email: data.user.email ?? input.email,
        name: (data.user.user_metadata?.name as string) ?? input.name,
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
      // Always return generic message to prevent user enumeration
      throw new AuthError('Invalid email or password');
    }

    if (!data.session) {
      throw new AuthError('Login failed — no session returned');
    }

    return {
      user: {
        id: data.user.id,
        email: data.user.email ?? input.email,
        name: (data.user.user_metadata?.name as string) ?? '',
      },
      token: data.session.access_token,
    };
  },

  // ── Get current user ───────────────────────────────────────────────────────

  async me(userId: string, token: string) {
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) throw new AuthError('User account not found or session expired');
    if (data.user.id !== userId) throw new AuthError('Session mismatch');

    return {
      id: data.user.id,
      email: data.user.email ?? '',
      name: (data.user.user_metadata?.name as string) ?? '',
    };
  },
};
