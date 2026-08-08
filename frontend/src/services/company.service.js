import { request } from './api'

export const companyService = {
  get: () => request('GET', '/api/company'),
  create: (data) => request('POST', '/api/company', data),
  update: (data) => request('PUT', '/api/company', data),
  getMembers: () => request('GET', '/api/company/members'),
}

export default companyService
