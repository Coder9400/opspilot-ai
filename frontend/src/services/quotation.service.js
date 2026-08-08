import { request } from './api'

export const quotationService = {
  /** GET /api/quotations */
  list: () => request('GET', '/api/quotations'),

  /** GET /api/quotations/:id */
  get: (id) => request('GET', `/api/quotations/${id}`),
}

export default quotationService
