import { request } from './api'

export const projectService = {
  /**
   * GET /api/projects — list all projects for the authenticated customer
   */
  list: () => request('GET', '/api/projects'),

  /**
   * GET /api/projects/stats — project status counts
   */
  stats: () => request('GET', '/api/projects/stats'),

  /**
   * GET /api/projects/:id — get a single project
   */
  get: (id) => request('GET', `/api/projects/${id}`),

  /**
   * POST /api/projects — create a project
   */
  create: (data) => request('POST', '/api/projects', data),

  /**
   * PUT /api/projects/:id — update a project
   */
  update: (id, data) => request('PUT', `/api/projects/${id}`, data),

  /**
   * DELETE /api/projects/:id — delete a project
   */
  delete: (id) => request('DELETE', `/api/projects/${id}`),
}

export default projectService
