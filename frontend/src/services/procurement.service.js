import { request } from './api'

export const procurementService = {
  // Procurement Requests
  list:   ()             => request('GET',  '/api/procurement-requests'),
  get:    (id)           => request('GET',  `/api/procurement-requests/${id}`),
  create: (data)         => request('POST', '/api/procurement-requests', data),
  update: (id, data)     => request('PUT',  `/api/procurement-requests/${id}`, data),

  // AI Analysis
  analyze:    (id)       => request('POST', `/api/procurement-requests/${id}/analyze`),
  reanalyze:  (id)       => request('POST', `/api/procurement-requests/${id}/reanalyze`),

  // Questions & Requirements
  getQuestions:    (id)  => request('GET',  `/api/procurement-requests/${id}/questions`),
  getRequirements: (id)  => request('GET',  `/api/procurement-requests/${id}/requirements`),
  answerQuestion:  (id, questionId, data) =>
    request('POST', `/api/procurement-requests/${id}/questions/${questionId}/answer`, data),

  // RFQ generation
  generateRFQ: (id)      => request('POST', `/api/procurement-requests/${id}/generate-rfq`),

  // RFQs
  listRFQs:    ()        => request('GET',  '/api/rfqs'),
  getRFQ:      (id)      => request('GET',  `/api/rfqs/${id}`),
  updateRFQ:   (id, data)=> request('PUT',  `/api/rfqs/${id}`, data),
  approveRFQ:  (id)      => request('POST', `/api/rfqs/${id}/approve`),
}

export default procurementService
