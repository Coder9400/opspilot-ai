import { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

const NAV_MAIN = [
  { id: 'dashboard',  label: 'Dashboard',   icon: '📊', href: '/dashboard' },
  { id: 'enquiries',  label: 'Enquiries',   icon: '📩', href: '/enquiries' },
  { id: 'analysis',   label: 'AI Analysis', icon: '🔍', href: '/enquiries' },
  { id: 'quotations', label: 'Quotations',  icon: '📄', href: '/quotations' },
  { id: 'approvals',  label: 'Approvals',   icon: '✅', href: '/approvals' },
  { id: 'followups',  label: 'Follow-ups',  icon: '🔔', href: '/followups' },
]

const NAV_MGMT = [
  { id: 'customers',  label: 'Customers',   icon: '👥', href: '/dashboard' },
  { id: 'templates',  label: 'Templates',   icon: '📋', href: '/dashboard' },
  { id: 'users',      label: 'Users',       icon: '👤', href: '/dashboard' },
  { id: 'settings',   label: 'Settings',    icon: '⚙️', href: '/dashboard' },
]

export default function DashboardLayout({ children }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const getActiveId = () => {
    const path = location.pathname
    if (path.startsWith('/enquiries')) return 'enquiries'
    if (path.startsWith('/quotations')) return 'quotations'
    if (path.startsWith('/approvals')) return 'approvals'
    if (path.startsWith('/followups')) return 'followups'
    return 'dashboard'
  }

  const activeId = getActiveId()
  const displayName = user?.fullName || user?.name || user?.email || 'Demo User'
  const displayRole = user?.role || 'Administrator'
  const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  return (
    <div className="db-layout">
      {/* ── Desktop Sidebar ── */}
      <aside className={`db-sidebar ${mobileOpen ? 'open' : ''}`}>
        <div className="db-sidebar-header">
          <div className="auth-logo-icon" style={{ width: 32, height: 32, fontSize: 13 }}>OP</div>
          <span className="db-logo-text">OPSPILOT AI</span>
          <button className="db-close-btn" onClick={() => setMobileOpen(false)}>×</button>
        </div>

        <nav className="db-nav">
          <div className="db-nav-section">
            <span className="db-section-label">MAIN</span>
            {NAV_MAIN.map(item => (
              <button
                key={item.id}
                className={`db-nav-link ${activeId === item.id ? 'active' : ''}`}
                onClick={() => { navigate(item.href); setMobileOpen(false) }}
              >
                <span className="db-nav-icon">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </div>

          <div className="db-nav-section" style={{ marginTop: 24 }}>
            <span className="db-section-label">MANAGEMENT</span>
            {NAV_MGMT.map(item => (
              <button
                key={item.id}
                className={`db-nav-link ${activeId === item.id ? 'active' : ''}`}
                onClick={() => { navigate(item.href); setMobileOpen(false) }}
              >
                <span className="db-nav-icon">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </div>
        </nav>

        <div className="db-sidebar-footer">
          <button className="db-logout-btn" onClick={handleLogout}>
            <span className="db-nav-icon">🚪</span> Logout
          </button>
        </div>
      </aside>

      {/* Overlay for mobile drawer */}
      {mobileOpen && <div className="db-overlay" onClick={() => setMobileOpen(false)} />}

      {/* ── Main Panel ── */}
      <div className="db-main">
        {/* Top Header */}
        <header className="db-header">
          <button className="db-menu-toggle" onClick={() => setMobileOpen(true)}>
            ☰
          </button>

          <div className="db-header-search">
            <span className="search-icon">🔍</span>
            <input type="text" placeholder="Search enquiries, documents..." />
          </div>

          <div className="db-header-actions">
            <button className="db-header-icon-btn" aria-label="Notifications">
              🔔
              <span className="noti-badge" />
            </button>

            <div className="db-profile-menu">
              <button className="db-profile-trigger" onClick={() => setProfileOpen(!profileOpen)}>
                <div className="db-avatar">{initials}</div>
                <div className="db-user-details">
                  <span className="db-user-name">{displayName}</span>
                  <span className="db-user-role">{displayRole}</span>
                </div>
                <span className="chevron">▼</span>
              </button>

              {profileOpen && (
                <div className="db-profile-dropdown">
                  <div className="dropdown-user-header">
                    <strong>{displayName}</strong>
                    <span>{user?.email}</span>
                  </div>
                  <hr />
                  <button onClick={handleLogout} className="dropdown-item danger">
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="db-content">
          {children}
        </main>
      </div>
    </div>
  )
}
