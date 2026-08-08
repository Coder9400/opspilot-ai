import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import DashboardCard from '../components/DashboardCard'
import { PriorityBadge, StatusBadge } from '../components/Badge'
import Button from '../components/Button'
import Loading from '../components/Loading'
import ErrorBanner from '../components/ErrorBanner'
import EmptyState from '../components/EmptyState'
import { useAuth } from '../hooks/useAuth'
import { dashboardService } from '../services/dashboard.service'
import { enquiryService } from '../services/enquiry.service'
import { followupService } from '../services/followup.service'
import { getErrorMessage } from '../utils/errorHandler'

const KPI_CONFIG = [
  { label: 'Total Enquiries',  key: 'totalEnquiries',  icon: '📋', iconBg: '#e0e7ff', iconColor: '#4f46e5' },
  { label: 'High Priority',    key: 'highPriority',    icon: '🚨', iconBg: '#fee2e2', iconColor: '#dc2626' },
  { label: 'Pending Approval', key: 'pendingApprovals',icon: '⏳', iconBg: '#fef3c7', iconColor: '#d97706' },
  { label: 'Follow-ups Due',   key: 'followupsDue',    icon: '🔔', iconBg: '#dcfce7', iconColor: '#16a34a' },
]

const fmtDate = (d) => {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function getTimeOfDay() {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const [stats, setStats] = useState(null)
  const [statsLoading, setStatsLoading] = useState(true)
  const [statsError, setStatsError] = useState('')

  const [enquiries, setEnquiries] = useState([])
  const [enqLoading, setEnqLoading] = useState(true)
  const [enqError, setEnqError] = useState('')
  const [search, setSearch] = useState('')

  const [followups, setFollowups] = useState([])
  const [fuLoading, setFuLoading] = useState(true)

  const loadStats = useCallback(async () => {
    setStatsLoading(true); setStatsError('')
    try {
      const data = await dashboardService.getSummary()
      setStats(data)
    } catch (err) {
      setStatsError(getErrorMessage(err))
    } finally { setStatsLoading(false) }
  }, [])

  const loadEnquiries = useCallback(async () => {
    setEnqLoading(true); setEnqError('')
    try {
      const data = await enquiryService.list()
      setEnquiries(Array.isArray(data) ? data : data.enquiries || [])
    } catch (err) {
      setEnqError(getErrorMessage(err))
    } finally { setEnqLoading(false) }
  }, [])

  const loadFollowups = useCallback(async () => {
    setFuLoading(true)
    try {
      const data = await followupService.list()
      setFollowups(Array.isArray(data) ? data : data.followups || [])
    } catch { /* non-critical */ } finally { setFuLoading(false) }
  }, [])

  useEffect(() => {
    loadStats(); loadEnquiries(); loadFollowups()
  }, [loadStats, loadEnquiries, loadFollowups])

  const firstName = (user?.fullName || user?.name || 'there').split(' ')[0]
  const company = user?.businessName || user?.company || ''

  const filteredEnquiries = enquiries.filter((e) =>
    !search ||
    (e.customer || '').toLowerCase().includes(search.toLowerCase()) ||
    (e.content || '').toLowerCase().includes(search.toLowerCase()) ||
    (e.status || '').toLowerCase().includes(search.toLowerCase())
  )

  // Enquiries pending approval
  const pendingApprovals = enquiries.filter((e) =>
    (e.status || '').toLowerCase() === 'pending_approval' ||
    (e.approvalStatus || '').toLowerCase() === 'pending'
  )

  return (
    <div className="dashboard-layout">
      <div className={`sidebar-overlay${sidebarOpen ? ' open' : ''}`} onClick={() => setSidebarOpen(false)} aria-hidden="true" />
      <div className={sidebarOpen ? 'sidebar open' : 'sidebar'}>
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      <main className="dashboard-main">
        {/* Header */}
        <header className="dashboard-header">
          <div className="dashboard-header-left">
            <button className="mobile-menu-btn" aria-label="Open navigation" onClick={() => setSidebarOpen((v) => !v)}>☰</button>
            <div>
              <div className="dashboard-header-title">Dashboard</div>
              <div className="dashboard-header-sub">
                {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
            </div>
          </div>
          <div className="dashboard-header-right">
            <Button variant="primary" size="sm" onClick={() => navigate('/enquiries/new')} id="btn-new-enquiry">
              + New Enquiry
            </Button>
            <div className="header-avatar" title={user?.fullName || 'User'} aria-label="User profile">
              {(user?.fullName || 'U').split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)}
            </div>
          </div>
        </header>

        <div className="dashboard-content">
          {/* Welcome */}
          <div className="dashboard-welcome">
            <h1>Good {getTimeOfDay()}, {firstName} 👋</h1>
            <p>Here's what needs your attention today{company ? ` at ${company}` : ''}.</p>
          </div>

          {/* KPI Cards */}
          {statsError && <ErrorBanner message={statsError} onRetry={loadStats} />}
          <div className="kpi-grid">
            {KPI_CONFIG.map((kpi) => (
              <DashboardCard
                key={kpi.label}
                label={kpi.label}
                value={statsLoading ? '…' : (stats?.[kpi.key] ?? '—')}
                icon={kpi.icon}
                iconBg={kpi.iconBg}
                iconColor={kpi.iconColor}
              />
            ))}
          </div>

          <div className="dashboard-grid">
            {/* Recent Enquiries */}
            <div>
              <div className="section-header">
                <h2>Recent Enquiries</h2>
                <button onClick={() => navigate('/enquiries')}>View all →</button>
              </div>
              <div className="enquiries-table-wrapper">
                <div className="table-toolbar">
                  <div className="table-search">
                    <span>🔍</span>
                    <input
                      type="search"
                      placeholder="Search enquiries…"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      aria-label="Search enquiries"
                      id="enquiry-search"
                    />
                  </div>
                  <Button variant="outline" size="sm" onClick={() => navigate('/enquiries/new')}>+ New</Button>
                </div>
                {enqLoading ? (
                  <Loading text="Loading enquiries…" />
                ) : enqError ? (
                  <ErrorBanner message={enqError} onRetry={loadEnquiries} />
                ) : filteredEnquiries.length === 0 ? (
                  <EmptyState
                    icon="📋"
                    title="No enquiries yet"
                    message="Create your first enquiry to get started."
                    action={{ label: '+ New Enquiry', onClick: () => navigate('/enquiries/new') }}
                  />
                ) : (
                  <table className="enq-table" aria-label="Recent enquiries">
                    <thead>
                      <tr>
                        <th>Customer / Content</th>
                        <th>Priority</th>
                        <th>Status</th>
                        <th>Created</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredEnquiries.slice(0, 8).map((enq) => (
                        <tr key={enq.id}>
                          <td>
                            <div className="enq-company">{enq.customer || 'Customer'}</div>
                            <div className="enq-subject">{(enq.content || '').slice(0, 60)}{(enq.content || '').length > 60 ? '…' : ''}</div>
                          </td>
                          <td><PriorityBadge priority={(enq.priority || 'MEDIUM').toLowerCase()} /></td>
                          <td><StatusBadge status={(enq.status || 'new').toLowerCase().replace(/ /g, '_')} /></td>
                          <td>{fmtDate(enq.createdAt)}</td>
                          <td>
                            <button className="enq-action-btn" onClick={() => navigate(`/enquiries/${enq.id}`)}>
                              Review →
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {/* Right column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
              {/* Pending Approvals */}
              <div>
                <div className="section-header">
                  <h2>Pending Approvals</h2>
                  {pendingApprovals.length > 0 && (
                    <span className="badge badge-warning" style={{ fontWeight: 700 }}>
                      {pendingApprovals.length}
                    </span>
                  )}
                </div>
                {enqLoading ? <Loading text="Loading…" /> : pendingApprovals.length === 0 ? (
                  <EmptyState icon="✅" title="No pending approvals" message="All caught up!" />
                ) : (
                  <div className="approvals-list">
                    {pendingApprovals.slice(0, 3).map((enq) => (
                      <div key={enq.id} className="approval-item">
                        <div className="approval-item-header">
                          <div>
                            <div className="approval-company">{enq.customer || 'Customer'}</div>
                            <div className="approval-type">Enquiry · {(enq.status || '').replace(/_/g, ' ')}</div>
                          </div>
                          <PriorityBadge priority={(enq.priority || 'MEDIUM').toLowerCase()} />
                        </div>
                        <p className="approval-desc">{(enq.content || '').slice(0, 100)}{(enq.content || '').length > 100 ? '…' : ''}</p>
                        <div className="approval-actions">
                          <Button variant="primary" size="sm" onClick={() => navigate(`/enquiries/${enq.id}`)}>
                            Review →
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Upcoming Follow-ups */}
              <div>
                <div className="section-header">
                  <h2>Upcoming Follow-ups</h2>
                  <button onClick={() => navigate('/followups')}>View all →</button>
                </div>
                {fuLoading ? <Loading text="Loading…" /> : followups.length === 0 ? (
                  <EmptyState icon="🔔" title="No follow-ups" message="No upcoming follow-ups." />
                ) : (
                  <div className="followups-list">
                    {followups.slice(0, 4).map((fu) => (
                      <div key={fu.id} className="followup-item">
                        <div className="followup-left">
                          <div className="followup-company">{fu.customer || fu.enquiry?.customer || 'Customer'}</div>
                          <div className="followup-subject">{fu.task || fu.description || ''}</div>
                          <div className={`followup-due ${fu.status === 'COMPLETED' ? 'upcoming' : 'today'}`}>
                            📅 {fmtDate(fu.dueDate)} · <span style={{ textTransform: 'capitalize' }}>{(fu.status || '').toLowerCase()}</span>
                          </div>
                        </div>
                        <button
                          className="enq-action-btn"
                          style={{ marginLeft: 8, flexShrink: 0 }}
                          onClick={() => navigate('/followups')}
                        >
                          View
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
