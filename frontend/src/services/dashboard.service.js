import { request } from './api'

export const dashboardService = {
  /** GET /api/dashboard/summary */
  getSummary: () => request('GET', '/api/dashboard/summary'),
}

export default dashboardService
