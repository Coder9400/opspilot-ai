import { request } from './api'

export const supplierService = {
  // ── Profile ───────────────────────────────────────────────────────────────

  /** GET /api/suppliers/profile */
  getProfile: () => request('GET', '/api/suppliers/profile'),

  /** PUT /api/suppliers/profile */
  updateProfile: (data) => request('PUT', '/api/suppliers/profile', data),

  /** GET /api/suppliers/stats */
  getStats: () => request('GET', '/api/suppliers/stats'),

  // ── Products ──────────────────────────────────────────────────────────────

  /** GET /api/suppliers/products */
  listProducts: () => request('GET', '/api/suppliers/products'),

  /** GET /api/suppliers/products/:id */
  getProduct: (id) => request('GET', `/api/suppliers/products/${id}`),

  /** POST /api/suppliers/products */
  createProduct: (data) => request('POST', '/api/suppliers/products', data),

  /** PUT /api/suppliers/products/:id */
  updateProduct: (id, data) => request('PUT', `/api/suppliers/products/${id}`, data),

  /** DELETE /api/suppliers/products/:id */
  deleteProduct: (id) => request('DELETE', `/api/suppliers/products/${id}`),
}

export default supplierService
