import { useAuthContext } from '../context/AuthContext'

/**
 * Convenience hook for accessing authentication state.
 *
 * Returns: { user, token, loading, login, logout, isAuthenticated }
 */
export function useAuth() {
  return useAuthContext()
}

export default useAuth
