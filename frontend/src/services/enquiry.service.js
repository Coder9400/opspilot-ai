import { request } from './api'

export const enquiryService = {
  /** GET /api/enquiries → { data: { enquiries: [], pagination: {} } } */
  list: () => request('GET', '/api/enquiries'),

  /** GET /api/enquiries/:id → { data: { enquiry: { ...fields, quotations, follow_ups, approvals } } } */
  get: (id) => request('GET', `/api/enquiries/${id}`),

  /** POST /api/enquiries → { data: { enquiry: { id, ... } } */
  create: (payload) => request('POST', '/api/enquiries', payload),

  /** POST /api/enquiries/:id/analyze → { data: { enquiry, analysis } } */
  analyze: (id) => request('POST', `/api/enquiries/${id}/analyze`),

  /** POST /api/enquiries/:id/generate-response → { data: { response: string } } */
  generateResponse: (id) => request('POST', `/api/enquiries/${id}/generate-response`),

  /** POST /api/enquiries/:id/generate-quotation → { data: { quotation: { items, subtotal, tax, total, ... } } } */
  generateQuotation: (id) => request('POST', `/api/enquiries/${id}/generate-quotation`),

  /** POST /api/enquiries/:id/generate-followups → { data: { followUps: [] } } */
  generateFollowups: (id) => request('POST', `/api/enquiries/${id}/generate-followups`),

  /** GET /api/enquiries/:id/approval → { data: { approvals, pendingApprovals, latestQuotation } } */
  getApproval: (id) => request('GET', `/api/enquiries/${id}/approval`),

  /** POST /api/enquiries/:id/approve → requires body: { actionType, comments? } */
  approve: (id, payload) => request('POST', `/api/enquiries/${id}/approve`, payload),

  /** POST /api/enquiries/:id/reject → requires body: { actionType, comments? } */
  reject: (id, payload) => request('POST', `/api/enquiries/${id}/reject`, payload),

  /** PATCH /api/followups/:id → { data: { followUp: { status, ... } } } */
  updateFollowup: (followupId, payload) => request('PATCH', `/api/followups/${followupId}`, payload),
}

export default enquiryService
