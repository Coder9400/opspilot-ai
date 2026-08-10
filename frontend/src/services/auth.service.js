import { request } from './api'

const TOKEN_KEY = 'opspilot_token'

export const authService = {
  /**
   * Register a new user.
   * POST /api/auth/register
   */
  register: (payload) => {
    const body = {
      fullName: payload.fullName || payload.name || '',
      name: payload.name || payload.fullName || '',
      businessName: payload.businessName || '',
      email: payload.email,
      password: payload.password,
    }
    return request('POST', '/api/auth/register', body, false)
  },

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

  /** Aliases for alternative calling conventions */
  signup(payload) { return this.register(payload) },
  signin(email, password) { return this.login(email, password) },
  getCurrentUser() { return this.me() },
  logout() { this.clearToken() },
}

export default authService
