import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import Loading from '../components/Loading'

// Static imports — both dashboards are always available once the user is authenticated
import CustomerDashboard from './CustomerDashboard'
import SupplierDashboard from './SupplierDashboard'

/**
 * Dashboard — smart router that dispatches to the correct dashboard
 * based on the authenticated user's company type.
 *
 * CUSTOMER → CustomerDashboard
 * SUPPLIER → SupplierDashboard
 * No company → helpful onboarding message
 */
export default function Dashboard() {
  const navigate = useNavigate()
  const { companyType, loading, isAuthenticated } = useAuth()

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/login', { replace: true })
    }
  }, [loading, isAuthenticated, navigate])

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loading text="Loading your workspace…" />
      </div>
    )
  }

  if (companyType === 'SUPPLIER') return <SupplierDashboard />
  if (companyType === 'CUSTOMER') return <CustomerDashboard />

  // No company type yet — onboarding incomplete state
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: 16, padding: 32, textAlign: 'center',
    }}>
      <div style={{ fontSize: 48 }}>🏢</div>
      <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>
        Setting up your workspace…
      </h2>
      <p style={{ color: 'var(--color-text-muted)', maxWidth: 420, lineHeight: 1.6 }}>
        Your account is ready but we couldn't load your company profile.
        Try refreshing the page. If the problem persists, please log out and back in.
      </p>
      <button
        onClick={() => window.location.reload()}
        style={{
          padding: '10px 24px', borderRadius: 8, background: 'var(--color-primary)',
          color: '#fff', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600,
        }}
      >
        Refresh
      </button>
    </div>
  )
}
