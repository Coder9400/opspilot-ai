import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authService } from '../services/auth.service'

const AuthContext = createContext(null)

/**
 * AuthProvider – wraps the app and provides authentication state.
 *
 * State:
 *   user      – current user object (null if not logged in)
 *   token     – JWT string (null if not logged in)
 *   loading   – true while validating token on startup
 *
 * Methods:
 *   login(email, password)  → calls API, stores token, sets user
 *   logout()                → clears token + user
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(() => authService.getToken())
  const [loading, setLoading] = useState(true) // true until initial auth check completes

  /**
   * On mount: if a token exists, validate it by calling GET /api/auth/me.
   * If valid, restore the user. If invalid, clear the token.
   */
  useEffect(() => {
    const storedToken = authService.getToken()
    if (!storedToken) {
      setLoading(false)
      return
    }

    authService
      .me()
      .then((data) => {
        setUser(data.user || data)
        setToken(storedToken)
      })
      .catch(() => {
        // Token is invalid or expired
        authService.clearToken()
        setToken(null)
        setUser(null)
      })
      .finally(() => setLoading(false))
  }, [])

  const login = useCallback(async (email, password) => {
    const data = await authService.login(email, password)
    const { token: jwt, user: userData } = data
    authService.setToken(jwt)
    setToken(jwt)
    setUser(userData)
    return userData
  }, [])

  const logout = useCallback(() => {
    authService.clearToken()
    setToken(null)
    setUser(null)
  }, [])

  const value = { user, token, loading, login, logout, isAuthenticated: !!user }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuthContext() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuthContext must be used within an <AuthProvider>')
  return ctx
}

export default AuthContext
