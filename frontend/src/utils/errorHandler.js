/**
 * Parse a service layer error into a user-friendly string.
 * @param {Error} err
 * @returns {string}
 */
export function getErrorMessage(err) {
  if (!err) return 'An unexpected error occurred.'

  // Network error (server unreachable)
  if (err.isNetworkError || err.status === 0) {
    return 'Unable to reach the server. Please check that the backend is running.'
  }

  if (err.status === 401) return 'Your session has expired. Please log in again.'
  if (err.status === 403) return 'You do not have permission to perform this action.'
  if (err.status === 404) return 'The requested resource was not found.'
  if (err.status === 400) {
    return err.message || 'Invalid request. Please check your input.'
  }
  if (err.status === 409) return err.message || 'A conflict occurred (e.g. duplicate email).'
  if (err.status >= 500) return 'A server error occurred. Please try again later.'

  return err.message || 'Something went wrong. Please try again.'
}

export default { getErrorMessage }
