import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authService } from '../services/auth.service'
import { companyService } from '../services/company.service'

const AuthContext = createContext(null)

/**
 * AuthProvider – wraps the app and provides full authentication + company state.
 *
 * State:
 *   user        – current user object (null if not logged in)
 *   token       – JWT string (null if not logged in)
 *   company     – company record from DB (null if not loaded)
 *   companyType – 'CUSTOMER' | 'SUPPLIER' | null
 *   companyRole – 'owner' | 'admin' | 'member' | null
 *   loading     – true while validating token on startup
 *
 * Methods:
 *   login(email, password)
 *   register(payload)
 *   logout()
 *   refreshCompany() – reload company from API
 */
export function AuthProvider({ children }) {
  const [user,        setUser]        = useState(null)
  const [token,       setToken]       = useState(() => authService.getToken())
  const [company,     setCompany]     = useState(null)
  const [companyType, setCompanyType] = useState(null)
  const [companyRole, setCompanyRole] = useState(null)
  const [loading,     setLoading]     = useState(true)

  // ── Load company from API ─────────────────────────────────────────────────
  const loadCompany = useCallback(async () => {
    try {
      const res = await companyService.get()
      const co = res?.company || res
      if (co) {
        setCompany(co)
        setCompanyType(co.type || null)
        setCompanyRole(res?.role || null)
      }
    } catch {
      // No company yet — not an error (new user may not have completed onboarding)
      setCompany(null)
      setCompanyType(null)
      setCompanyRole(null)
    }
  }, [])

  // ── Initialise on mount: validate existing token ──────────────────────────
  useEffect(() => {
    const storedToken = authService.getToken()
    if (!storedToken) {
      setLoading(false)
      return
    }

    authService
      .me()
      .then(async (data) => {
        const userData = data.user || data
        setUser(userData)
        setToken(storedToken)

        // Use company data returned by /me if available (saves a round-trip)
        if (userData.company) {
          setCompany(userData.company)
          setCompanyType(userData.company.type || userData.companyType || null)
          setCompanyRole(userData.companyRole || null)
        } else {
          await loadCompany()
        }
      })
      .catch(() => {
        authService.clearToken()
        setToken(null)
        setUser(null)
        setCompany(null)
        setCompanyType(null)
        setCompanyRole(null)
      })
      .finally(() => setLoading(false))
  }, [loadCompany])

  // ── Login ─────────────────────────────────────────────────────────────────
  const login = useCallback(async (email, password) => {
    const data = await authService.login(email, password)
    const { token: jwt, user: userData } = data
    authService.setToken(jwt)
    setToken(jwt)
    setUser(userData)
    // Load company after login
    await loadCompany()
    return userData
  }, [loadCompany])

  // ── Register ──────────────────────────────────────────────────────────────
  const register = useCallback(async (payload) => {
    const data = await authService.register(payload)
    const { token: jwt, user: userData } = data
    if (jwt) {
      authService.setToken(jwt)
      setToken(jwt)
      setUser(userData)
      // Company is created during registration — load it
      if (userData.companyType) {
        setCompanyType(userData.companyType)
      }
      await loadCompany()
    }
    return data
  }, [loadCompany])

  // ── Logout ────────────────────────────────────────────────────────────────
  const logout = useCallback(() => {
    authService.clearToken()
    setToken(null)
    setUser(null)
    setCompany(null)
    setCompanyType(null)
    setCompanyRole(null)
  }, [])

  // ── Refresh company (call after updating company profile) ─────────────────
  const refreshCompany = useCallback(() => loadCompany(), [loadCompany])

  const value = {
    user,
    token,
    company,
    companyType,     // 'CUSTOMER' | 'SUPPLIER' | null
    companyRole,     // 'owner' | 'admin' | 'member' | null
    loading,
    login,
    register,
    signin:   login,
    signup:   register,
    logout,
    refreshCompany,
    isAuthenticated: !!user,
    isCustomer:      companyType === 'CUSTOMER',
    isSupplier:      companyType === 'SUPPLIER',
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuthContext() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuthContext must be used within an <AuthProvider>')
  return ctx
}

export default AuthContext
