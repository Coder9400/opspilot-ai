import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

const NAV_ITEMS = [
  { id: 'dashboard',           label: 'Dashboard',           icon: '⬛', href: '/dashboard' },
  { id: 'enquiries',           label: 'Enquiries',           icon: '📋', href: '/enquiries' },
  { id: 'ai-analysis',         label: 'AI Analysis',         icon: '🧠', href: '/ai-analysis' },
  { id: 'quotations',          label: 'My Quotations',       icon: '📄', href: '/quotations' },
  { id: 'received-quotations', label: 'Received Quotations', icon: '📥', href: '/received-quotations' },
  { id: 'followups',           label: 'Follow-ups',          icon: '🔔', href: '/followups' },
  { id: 'settings',            label: 'Settings',            icon: '⚙️', href: '/settings' },
]

function getInitials(name = '') {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

/**
 * Sidebar navigation for the dashboard layout.
 * Uses real navigation links and real auth context.
 *
 * Props:
 *   onClose: () => void  (called after nav click on mobile)
 */
export default function Sidebar({ onClose }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()

  const handleNav = (href) => {
    navigate(href)
    onClose && onClose()
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  // Determine active item from current path
  const activePath = location.pathname
  const getActiveId = () => {
    if (activePath.startsWith('/enquiries')) return 'enquiries'
    if (activePath.startsWith('/ai-analysis')) return 'ai-analysis'
    if (activePath.startsWith('/quotations')) return 'quotations'
    if (activePath.startsWith('/received-quotations')) return 'received-quotations'
    if (activePath.startsWith('/followups')) return 'followups'
    if (activePath.startsWith('/settings')) return 'settings'
    return 'dashboard'
  }
  const activeItem = getActiveId()

  const displayName = user?.fullName || user?.name || user?.email || 'User'
  const displayCompany = user?.businessName || user?.company || ''
  const initials = getInitials(displayName)

  return (
    <aside className="sidebar" id="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="logo-icon">OP</div>
        <div className="logo-text">
          OPSPILOT AI
          <small>Workflow Autopilot</small>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav" aria-label="Main navigation">
        <div className="sidebar-section-label">Navigation</div>
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            className={`sidebar-link${activeItem === item.id ? ' active' : ''}`}
            onClick={() => handleNav(item.href)}
            aria-current={activeItem === item.id ? 'page' : undefined}
          >
            <span className="sidebar-icon">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}

        <div className="sidebar-section-label" style={{ marginTop: '16px' }}>Account</div>
        <button className="sidebar-link" onClick={handleLogout}>
          <span className="sidebar-icon">🚪</span>
          <span>Logout</span>
        </button>
      </nav>

      {/* User profile */}
      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-avatar">{initials}</div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{displayName}</div>
            {displayCompany && (
              <div className="sidebar-user-email">{displayCompany}</div>
            )}
          </div>
        </div>
      </div>
    </aside>
  )
}
