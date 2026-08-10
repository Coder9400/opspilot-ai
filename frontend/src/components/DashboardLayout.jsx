import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

// ─── Navigation definitions per company type ──────────────────────────────────

const CUSTOMER_NAV = [
  { id: 'dashboard', label: 'Dashboard',    icon: '📊', href: '/dashboard' },
  { id: 'projects',  label: 'Projects',     icon: '🏗️', href: '/projects' },
  { id: 'rfqs',      label: 'My RFQs',      icon: '📋', href: '/rfqs',      soon: true },
  { id: 'quotations',label: 'Quotations',   icon: '📄', href: '/quotations', soon: true },
  { id: 'suppliers', label: 'Suppliers',    icon: '🏭', href: '/suppliers',  soon: true },
  { id: 'settings',  label: 'Settings',     icon: '⚙️', href: '/company/settings' },
]

const SUPPLIER_NAV = [
  { id: 'dashboard',  label: 'Dashboard',        icon: '📊', href: '/dashboard' },
  { id: 'opportunities', label: 'Opportunities', icon: '🎯', href: '/opportunities', soon: true },
  { id: 'products',   label: 'My Products',      icon: '📦', href: '/supplier/products' },
  { id: 'quotations', label: 'My Quotations',    icon: '📄', href: '/supplier/quotations', soon: true },
  { id: 'profile',    label: 'Company Profile',  icon: '🏭', href: '/supplier/profile' },
  { id: 'settings',   label: 'Settings',         icon: '⚙️', href: '/company/settings' },
]

function getActiveId(pathname, nav) {
  for (const item of [...nav].reverse()) {
    if (item.href !== '/dashboard' && pathname.startsWith(item.href)) {
      return item.id
    }
  }
  if (pathname === '/dashboard') return 'dashboard'
  return ''
}

function getInitials(name = '') {
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2) || '??'
}

export default function DashboardLayout({ children }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, company, companyType, isCustomer, isSupplier, logout } = useAuth()
  const [mobileOpen,   setMobileOpen]   = useState(false)
  const [profileOpen,  setProfileOpen]  = useState(false)

  const nav     = isSupplier ? SUPPLIER_NAV : CUSTOMER_NAV
  const activeId = getActiveId(location.pathname, nav)

  const displayName    = user?.fullName || user?.name || user?.email || 'User'
  const displayCompany = company?.name || ''
  const displayType    = isCustomer ? 'Customer' : isSupplier ? 'Supplier' : ''
  const initials       = getInitials(displayName)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handleNav = (item) => {
    if (item.soon) return
    navigate(item.href)
    setMobileOpen(false)
  }

  return (
    <div className="db-layout">
      {/* ── Sidebar ── */}
      <aside className={`db-sidebar ${mobileOpen ? 'open' : ''}`}>
        {/* Logo */}
        <div className="db-sidebar-header">
          <div className="auth-logo-icon" style={{ width: 32, height: 32, fontSize: 13 }}>OP</div>
          <span className="db-logo-text">OPSPILOT AI</span>
          <button className="db-close-btn" onClick={() => setMobileOpen(false)}>×</button>
        </div>

        {/* Company badge */}
        {displayCompany && (
          <div style={{
            margin: '0 12px 8px', padding: '8px 12px', borderRadius: 8,
            background: isSupplier ? 'rgba(16,185,129,0.1)' : 'rgba(99,102,241,0.1)',
            border: `1px solid ${isSupplier ? 'rgba(16,185,129,0.2)' : 'rgba(99,102,241,0.2)'}`,
          }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: isSupplier ? '#10b981' : 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {displayType}
            </div>
            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {displayCompany}
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="db-nav">
          <div className="db-nav-section">
            {nav.map((item) => (
              <button
                key={item.id}
                className={`db-nav-link ${activeId === item.id ? 'active' : ''} ${item.soon ? 'disabled' : ''}`}
                onClick={() => handleNav(item)}
                style={{ opacity: item.soon ? 0.5 : 1, cursor: item.soon ? 'default' : 'pointer' }}
                title={item.soon ? 'Coming in a future phase' : undefined}
              >
                <span className="db-nav-icon">{item.icon}</span>
                {item.label}
                {item.soon && (
                  <span style={{ marginLeft: 'auto', fontSize: 9, fontWeight: 600, background: 'var(--color-border)', color: 'var(--color-text-muted)', padding: '2px 5px', borderRadius: 4, textTransform: 'uppercase' }}>
                    Soon
                  </span>
                )}
              </button>
            ))}
          </div>
        </nav>

        {/* Sidebar footer */}
        <div className="db-sidebar-footer">
          <button className="db-logout-btn" onClick={handleLogout}>
            <span className="db-nav-icon">🚪</span> Logout
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && <div className="db-overlay" onClick={() => setMobileOpen(false)} />}

      {/* ── Main Panel ── */}
      <div className="db-main">
        {/* Top header */}
        <header className="db-header">
          <button className="db-menu-toggle" onClick={() => setMobileOpen(true)} aria-label="Open menu">
            ☰
          </button>

          <div className="db-header-search" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 13, color: 'var(--color-text-muted)', fontWeight: 500 }}>
              OPSPILOT AI
            </span>
          </div>

          <div className="db-header-actions">
            {/* Profile dropdown */}
            <div className="db-profile-menu">
              <button className="db-profile-trigger" onClick={() => setProfileOpen((v) => !v)}>
                <div className="db-avatar">{initials}</div>
                <div className="db-user-details">
                  <span className="db-user-name">{displayName}</span>
                  <span className="db-user-role">{displayType || 'User'}</span>
                </div>
                <span className="chevron">▼</span>
              </button>

              {profileOpen && (
                <div className="db-profile-dropdown" onClick={() => setProfileOpen(false)}>
                  <div className="dropdown-user-header">
                    <strong>{displayName}</strong>
                    <span>{user?.email}</span>
                    {displayCompany && <span style={{ fontSize: 11, color: 'var(--color-primary)', marginTop: 2 }}>{displayCompany}</span>}
                  </div>
                  <hr />
                  <button onClick={() => navigate('/company/settings')} className="dropdown-item">
                    Company Settings
                  </button>
                  <button onClick={handleLogout} className="dropdown-item danger">
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content area */}
        <main className="db-content">
          {children}
        </main>
      </div>
    </div>
  )
}
