import { request } from './api'

const TOKEN_KEY = 'opspilot_token'

export const authService = {
  /**
   * Register a new user.
   * POST /api/auth/register
   */
  register: ({ fullName, businessName, email, password }) =>
    request('POST', '/api/auth/register', { fullName, businessName, email, password }, false),

  /**
   * Log in with email and password.
   * POST /api/auth/login
   * Returns { token, user }
   */
  login: (email, password) =>
    request('POST', '/api/auth/login', { email, password }, false),

  /**
   * Fetch the current authenticated user.
   * GET /api/auth/me
   */
  me: () => request('GET', '/api/auth/me'),

  /** Store JWT token in localStorage. */
  setToken: (token) => localStorage.setItem(TOKEN_KEY, token),

  /** Get JWT token. */
  getToken: () => localStorage.getItem(TOKEN_KEY),

  /** Clear JWT token. */
  clearToken: () => localStorage.removeItem(TOKEN_KEY),
}

export default authService
