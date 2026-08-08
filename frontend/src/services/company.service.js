import { request } from './api'

export const companyService = {
  get: () => request('GET', '/api/company'),
  update: (data) => request('PUT', '/api/company', data),
  getMembers: () => request('GET', '/api/company/members'),
}

export default companyService
