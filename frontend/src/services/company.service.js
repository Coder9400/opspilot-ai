import { request } from './api'

export const companyService = {
  /** GET /api/companies/me — returns { company, role } */
  get: () => request('GET', '/api/companies/me'),

  /** POST /api/companies — create a company */
  create: (data) => request('POST', '/api/companies', data),

  /** PUT /api/companies/me — update company profile */
  update: (data) => request('PUT', '/api/companies/me', data),

  /** GET /api/companies/me/members */
  getMembers: () => request('GET', '/api/companies/me/members'),
}

export default companyService
