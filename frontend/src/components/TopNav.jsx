import { useState, useRef, useEffect } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

const NAV_LINKS = [
  { to: '/dashboard',  label: 'Overview',   icon: '⊞' },
  { to: '/enquiries',  label: 'Enquiries',  icon: '📋' },
  { to: '/quotations', label: 'Quotations', icon: '📄' },
  { to: '/followups',  label: 'Follow-ups', icon: '🔔' },
  { to: '/approvals',  label: 'Approvals',  icon: '✅' },
]

function UserMenu({ user, logout }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const navigate = useNavigate()

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const initials = (user?.fullName || user?.email || 'U').slice(0, 2).toUpperCase()
  const displayName = user?.fullName || user?.email?.split('@')[0] || 'User'

  return (
    <div className="topnav-user" onClick={() => setOpen((v) => !v)} ref={ref} role="button" aria-expanded={open} aria-haspopup="true">
      <div className="topnav-avatar" aria-hidden="true">{initials}</div>
      <span className="topnav-username">{displayName}</span>
      <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginLeft: 2 }}>▾</span>

      {open && (
        <div className="topnav-dropdown" role="menu">
          <div style={{ padding: '10px 12px 8px', borderBottom: '1px solid var(--border-card)' }}>
            <div style={{ fontWeight: 700, fontSize: 'var(--fs-sm)', color: 'var(--text-primary)' }}>{displayName}</div>
            <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)', marginTop: 1 }}>{user?.email}</div>
          </div>
          <div style={{ padding: 'var(--sp-2)' }}>
            <button className="topnav-dropdown-item" role="menuitem" onClick={() => { setOpen(false); navigate('/dashboard') }}>
              ⊞ Dashboard
            </button>
            <button className="topnav-dropdown-item" role="menuitem" onClick={() => { setOpen(false); navigate('/approvals') }}>
              ✅ Approvals
            </button>
            <div className="topnav-dropdown-divider" />
            <button
              className="topnav-dropdown-item danger"
              role="menuitem"
              onClick={() => { logout(); navigate('/login') }}
            >
              ⎋ Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function TopNav() {
  const { user, logout } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)

  // Close mobile menu on route change
  const handleMobileLink = () => setMobileOpen(false)

  return (
    <>
      <nav className="topnav" role="navigation" aria-label="Main navigation">
        {/* Logo */}
        <NavLink to="/dashboard" className="topnav-logo" aria-label="OPSPILOT AI — Dashboard">
          <div className="topnav-logo-icon" aria-hidden="true">OP</div>
          <span className="topnav-logo-text">OPSPILOT AI</span>
        </NavLink>

        {/* Desktop nav links */}
        <div className="topnav-links" role="list">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              role="listitem"
              className={({ isActive }) => `topnav-link${isActive ? ' active' : ''}`}
            >
              <span className="topnav-link-icon" aria-hidden="true">{link.icon}</span>
              {link.label}
            </NavLink>
          ))}
        </div>

        {/* Right side */}
        <div className="topnav-right">
          <button className="topnav-icon-btn" aria-label="Notifications" title="Notifications">🔔</button>
          <button className="topnav-icon-btn" aria-label="Settings" title="Settings">⚙️</button>
          {user && <UserMenu user={user} logout={logout} />}
          {/* Mobile toggle */}
          <button
            className="topnav-mobile-toggle"
            aria-label={mobileOpen ? 'Close navigation' : 'Open navigation'}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? '✕' : '☰'}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      <div className={`topnav-mobile-menu${mobileOpen ? ' open' : ''}`} role="navigation" aria-label="Mobile navigation">
        {NAV_LINKS.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) => `topnav-link${isActive ? ' active' : ''}`}
            onClick={handleMobileLink}
          >
            <span aria-hidden="true">{link.icon}</span>
            {link.label}
          </NavLink>
        ))}
        <div style={{ height: 1, background: 'rgba(255,255,255,0.07)', margin: '8px 0' }} />
        <button
          className="topnav-link"
          style={{ color: '#fca5a5' }}
          onClick={() => { logout(); setMobileOpen(false) }}
        >
          ⎋ Sign out
        </button>
      </div>
    </>
  )
}
