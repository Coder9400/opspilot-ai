import { request } from './api'

export const enquiryService = {
  /** GET /api/enquiries */
  list: () => request('GET', '/api/enquiries'),

  /** GET /api/enquiries/:id */
  get: (id) => request('GET', `/api/enquiries/${id}`),

  /** POST /api/enquiries */
  create: (payload) => request('POST', '/api/enquiries', payload),

  /** POST /api/enquiries/:id/analyze */
  analyze: (id) => request('POST', `/api/enquiries/${id}/analyze`),

  /** POST /api/enquiries/:id/generate-response */
  generateResponse: (id) => request('POST', `/api/enquiries/${id}/generate-response`),

  /** POST /api/enquiries/:id/generate-quotation */
  generateQuotation: (id) => request('POST', `/api/enquiries/${id}/generate-quotation`),

  /** POST /api/enquiries/:id/generate-followups */
  generateFollowups: (id) => request('POST', `/api/enquiries/${id}/generate-followups`),

  /** GET /api/enquiries/:id/approval */
  getApproval: (id) => request('GET', `/api/enquiries/${id}/approval`),

  /** POST /api/enquiries/:id/approve */
  approve: (id, payload) => request('POST', `/api/enquiries/${id}/approve`, payload),

  /** POST /api/enquiries/:id/reject */
  reject: (id, payload) => request('POST', `/api/enquiries/${id}/reject`, payload),
}

export default enquiryService
