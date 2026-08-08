/**
 * OPSPILOT AI – Centralized API Client
 *
 * Base URL comes from VITE_API_BASE_URL environment variable.
 * Automatically attaches JWT token from localStorage when present.
 * Handles 401 by clearing the token (callers redirect to /login).
 */

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000'

function getToken() {
  return localStorage.getItem('opspilot_token')
}

/**
 * Parse an API response and throw a structured error on failure.
 */
async function parseResponse(res) {
  let body = null
  const contentType = res.headers.get('content-type') || ''
  if (contentType.includes('application/json')) {
    body = await res.json()
  } else {
    body = await res.text()
  }

  if (!res.ok) {
    const message =
      (body && (body.message || body.error)) ||
      `Request failed with status ${res.status}`
    const err = new Error(message)
    err.status = res.status
    err.body = body
    throw err
  }

  return body
}

/**
 * Core request function.
 * @param {string} method  HTTP method
 * @param {string} endpoint  Path relative to BASE_URL (e.g. '/api/auth/login')
 * @param {object|null} data  Request body (JSON)
 * @param {boolean} auth  Whether to attach Authorization header
 */
export async function request(method, endpoint, data = null, auth = true) {
  const headers = { 'Content-Type': 'application/json' }

  if (auth) {
    const token = getToken()
    if (token) headers['Authorization'] = `Bearer ${token}`
  }

  const config = { method, headers }
  if (data !== null && method !== 'GET') {
    config.body = JSON.stringify(data)
  }

  let res
  try {
    res = await fetch(`${BASE_URL}${endpoint}`, config)
  } catch (err) {
    // Network failure (server not reachable)
    const networkErr = new Error('Unable to reach the server. Please check your connection.')
    networkErr.status = 0
    networkErr.isNetworkError = true
    throw networkErr
  }

  // Handle 401 globally — callers should redirect to /login
  if (res.status === 401) {
    localStorage.removeItem('opspilot_token')
    const err = new Error('Your session has expired. Please log in again.')
    err.status = 401
    throw err
  }

  return parseResponse(res)
}

export default { request }
