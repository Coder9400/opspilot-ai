import { request } from './api'

export const followupService = {
  /** GET /api/followups */
  list: () => request('GET', '/api/followups'),

  /**
   * PATCH /api/followups/:id
   * @param {string} id
   * @param {object} payload  e.g. { status: 'COMPLETED' }
   */
  update: (id, payload) => request('PATCH', `/api/followups/${id}`, payload),
}

export default followupService
