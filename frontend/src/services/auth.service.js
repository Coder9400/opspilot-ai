import { request } from './api'

const TOKEN_KEY = 'opspilot_token'

export const authService = {
  /**
   * Register a new user with company details.
   * POST /api/auth/register
   * Accepts 3-step registration payload with companyType + company details.
   */
  register: (payload) => {
    const body = {
      fullName:         payload.fullName || payload.name || '',
      name:             payload.name || payload.fullName || '',
      email:            payload.email,
      password:         payload.password,
      companyType:      payload.companyType || 'CUSTOMER',
      companyName:      payload.companyName || payload.businessName || '',
      businessName:     payload.companyName || payload.businessName || '',
      industry:         payload.industry || '',
      businessCategory: payload.businessCategory || '',
      serviceAreas:     payload.serviceAreas || '',
      description:      payload.description || '',
      city:             payload.city || '',
      state:            payload.state || '',
      country:          payload.country || 'India',
      website:          payload.website || '',
    }
    return request('POST', '/api/auth/register', body, false)
  },

  /**
   * Log in with email and password.
   * POST /api/auth/login
   */
  login: (email, password) =>
    request('POST', '/api/auth/login', { email, password }, false),

  /**
   * Fetch the current authenticated user + company.
   * GET /api/auth/me
   */
  me: () => request('GET', '/api/auth/me'),

  /** Store JWT token in localStorage. */
  setToken: (token) => localStorage.setItem(TOKEN_KEY, token),

  /** Get JWT token. */
  getToken: () => localStorage.getItem(TOKEN_KEY),

  /** Clear JWT token. */
  clearToken: () => localStorage.removeItem(TOKEN_KEY),

  // Aliases
  signup(payload)         { return this.register(payload) },
  signin(email, password) { return this.login(email, password) },
  getCurrentUser()        { return this.me() },
  logout()                { this.clearToken() },
}

export default authService
