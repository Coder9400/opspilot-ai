import { request } from './api'

export const receivedQuotationsService = {
  list: () => request('GET', '/api/received-quotations'),
  
  getById: (id) => request('GET', `/api/received-quotations/${id}`),

  update: (id, data) => request('PUT', `/api/received-quotations/${id}`, data),

  reprocess: (id) => request('POST', `/api/received-quotations/${id}/reprocess`),

  /**
   * Upload a PDF quotation for AI extraction.
   * Uses FormData (not JSON) to send the file.
   */
  async uploadPDF(file, metadata = {}) {
    const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'
    const token = localStorage.getItem('opspilot_token')

    const formData = new FormData()
    formData.append('pdf', file)
    if (metadata.senderName) formData.append('senderName', metadata.senderName)
    if (metadata.senderEmail) formData.append('senderEmail', metadata.senderEmail)
    if (metadata.senderCompany) formData.append('senderCompany', metadata.senderCompany)
    if (metadata.emailSubject) formData.append('emailSubject', metadata.emailSubject)

    const res = await fetch(`${BASE_URL}/api/received-quotations/upload`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    })

    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      const err = new Error(body.message || `Upload failed (${res.status})`)
      err.status = res.status
      throw err
    }

    return res.json()
  },
}

export default receivedQuotationsService
