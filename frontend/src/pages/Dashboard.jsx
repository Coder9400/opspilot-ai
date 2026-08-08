import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import AppShell from '../components/AppShell'
import { StatusBadge, PriorityBadge } from '../components/Badge'
import Button from '../components/Button'
import Loading from '../components/Loading'
import ErrorBanner from '../components/ErrorBanner'
import EmptyState from '../components/EmptyState'
import { useAuth } from '../hooks/useAuth'
import { dashboardService } from '../services/dashboard.service'
import { enquiryService } from '../services/enquiry.service'
import { getErrorMessage } from '../utils/errorHandler'

const fmtDate = (d) => {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

const fmtCurrency = (v, cur = 'USD') => {
  if (v == null) return '—'
  try { return new Intl.NumberFormat('en-US', { style: 'currency', currency: cur, maximumFractionDigits: 0 }).format(v) } catch { return `${cur} ${v}` }
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [stats, setStats] = useState(null)
  const [statsLoading, setStatsLoading] = useState(true)
  const [statsError, setStatsError] = useState('')

  const [enquiries, setEnquiries] = useState([])
  const [filteredEnquiries, setFilteredEnquiries] = useState([])
  const [selectedEnquiry, setSelectedEnquiry] = useState(null)
  const [enqLoading, setEnqLoading] = useState(true)

  // Filters State
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [customerFilter, setCustomerFilter] = useState('')
  const [timeRange, setTimeRange] = useState('This Month')

  const load = useCallback(async () => {
    setStatsLoading(true)
    setStatsError('')
    try {
      const s = await dashboardService.getSummary()
      setStats(s?.summary || s)
    } catch (err) { 
      setStatsError(getErrorMessage(err)) 
    } finally { 
      setStatsLoading(false) 
    }

    setEnqLoading(true)
    try {
      const e = await enquiryService.list()
      const list = e?.enquiries || e?.data?.enquiries || []
      setEnquiries(list)
      setFilteredEnquiries(list)
      if (list.length > 0) {
        setSelectedEnquiry(list[0])
      }
    } catch { 
      setEnquiries([]) 
      setFilteredEnquiries([])
    } finally { 
      setEnqLoading(false) 
    }
  }, [])

  useEffect(() => { load() }, [load])

  // Apply filters
  useEffect(() => {
    let result = enquiries
    if (searchTerm) {
      const q = searchTerm.toLowerCase()
      result = result.filter(e => 
        (e.customerName || '').toLowerCase().includes(q) ||
        (e.customerEmail || '').toLowerCase().includes(q) ||
        (e.aiSummary || '').toLowerCase().includes(q)
      )
    }
    if (statusFilter) {
      result = result.filter(e => e.status === statusFilter)
    }
    if (priorityFilter) {
      result = result.filter(e => (e.priority || '').toUpperCase() === priorityFilter.toUpperCase())
    }
    if (customerFilter) {
      result = result.filter(e => (e.customerName || '').toLowerCase().includes(customerFilter.toLowerCase()))
    }
    setFilteredEnquiries(result)
    // Auto select first of filtered list if current selection is not in result
    if (result.length > 0 && (!selectedEnquiry || !result.find(e => e.id === selectedEnquiry.id))) {
      setSelectedEnquiry(result[0])
    } else if (result.length === 0) {
      setSelectedEnquiry(null)
    }
  }, [searchTerm, statusFilter, priorityFilter, customerFilter, enquiries])

  // Derived KPI Stats
  const totalEnq = enquiries.length
  const pendingApproval = enquiries.filter(e => e.status === 'PENDING_APPROVAL').length
  const avgResponse = '1.4 hrs'
  const estValue = enquiries.reduce((sum, e) => sum + (e.budget || 0), 0)

  // Unique list of customers for filtering
  const uniqueCustomers = Array.from(new Set(enquiries.map(e => e.customerName).filter(Boolean)))

  return (
    <AppShell>
      {/* ── Main Dashboard Header ── */}
      <div className="db-page-header">
        <div>
          <h1 className="db-page-title">Dashboard</h1>
          <p className="db-page-subtitle">Track and manage your business workflow.</p>
        </div>
        <Button variant="primary" onClick={() => navigate('/enquiries/new')}>
          + New Enquiry
        </Button>
      </div>

      {statsError && <ErrorBanner message={statsError} onRetry={load} style={{ marginBottom: 24 }} />}

      {/* ── KPI Cards ── */}
      <div className="db-kpi-grid">
        <div className="db-kpi-card">
          <div className="kpi-header">
            <span className="kpi-label">Total Enquiries</span>
            <span className="kpi-icon-wrap bg-purple-light">📋</span>
          </div>
          <div className="kpi-value">{statsLoading ? '...' : totalEnq}</div>
          <div className="kpi-footer">
            <span className="trend positive">↑ 12.5%</span>
            <span className="kpi-sub">vs last month</span>
          </div>
        </div>

        <div className="db-kpi-card">
          <div className="kpi-header">
            <span className="kpi-label">Pending Approval</span>
            <span className="kpi-icon-wrap bg-amber-light">⏳</span>
          </div>
          <div className="kpi-value text-warning">{statsLoading ? '...' : pendingApproval}</div>
          <div className="kpi-footer">
            <span className="kpi-sub">Requires human review</span>
          </div>
        </div>

        <div className="db-kpi-card">
          <div className="kpi-header">
            <span className="kpi-label">Avg. Response Time</span>
            <span className="kpi-icon-wrap bg-indigo-light">⏱️</span>
          </div>
          <div className="kpi-value">{avgResponse}</div>
          <div className="kpi-footer">
            <span className="trend positive">↓ 18% improvement</span>
          </div>
        </div>

        <div className="db-kpi-card">
          <div className="kpi-header">
            <span className="kpi-label">Estimated Value</span>
            <span className="kpi-icon-wrap bg-green-light">💰</span>
          </div>
          <div className="kpi-value">{fmtCurrency(estValue)}</div>
          <div className="kpi-footer">
            <span className="trend positive">↑ 8.4% increase</span>
          </div>
        </div>
      </div>

      {/* ── Analytics Section ── */}
      <div className="db-analytics-grid">
        {/* Card 1: Enquiries Overview */}
        <div className="db-chart-card">
          <div className="chart-header">
            <h3>Enquiries Overview</h3>
            <select value={timeRange} onChange={(e) => setTimeRange(e.target.value)} className="chart-select">
              <option>This Week</option>
              <option>This Month</option>
              <option>Last 30 Days</option>
            </select>
          </div>
          <div className="bar-chart-visual">
            {/* Visual representation of a bar chart using CSS grids */}
            <div className="bar-group">
              <div className="bar" style={{ height: '40%' }}><span className="tooltip">8 Enquiries</span></div>
              <span className="bar-label">Mon</span>
            </div>
            <div className="bar-group">
              <div className="bar" style={{ height: '65%' }}><span className="tooltip">12 Enquiries</span></div>
              <span className="bar-label">Tue</span>
            </div>
            <div className="bar-group">
              <div className="bar active" style={{ height: '85%' }}><span className="tooltip">18 Enquiries (Peak)</span></div>
              <span className="bar-label">Wed</span>
            </div>
            <div className="bar-group">
              <div className="bar" style={{ height: '50%' }}><span className="tooltip">10 Enquiries</span></div>
              <span className="bar-label">Thu</span>
            </div>
            <div className="bar-group">
              <div className="bar" style={{ height: '70%' }}><span className="tooltip">14 Enquiries</span></div>
              <span className="bar-label">Fri</span>
            </div>
          </div>
        </div>

        {/* Card 2: Priority breakdown */}
        <div className="db-chart-card">
          <div className="chart-header">
            <h3>Enquiries by Priority</h3>
          </div>
          <div className="priority-donut-section">
            <div className="donut-graphic">
              {/* Circular progress representations */}
              <svg viewBox="0 0 36 36" className="circular-chart">
                <path className="circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                <path className="circle high" strokeDasharray="30, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                <path className="circle medium" strokeDasharray="50, 100" strokeDashoffset="-30" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                <path className="circle low" strokeDasharray="20, 100" strokeDashoffset="-80" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              </svg>
              <div className="donut-center-label">
                <strong>{totalEnq}</strong>
                <span>Total</span>
              </div>
            </div>
            <div className="donut-legend">
              <div className="legend-item"><span className="dot dot-high" /> High ({enquiries.filter(e=>e.priority?.toLowerCase()==='high').length})</div>
              <div className="legend-item"><span className="dot dot-medium" /> Medium ({enquiries.filter(e=>e.priority?.toLowerCase()==='medium').length})</div>
              <div className="legend-item"><span className="dot dot-low" /> Low ({enquiries.filter(e=>e.priority?.toLowerCase()==='low').length})</div>
            </div>
          </div>
        </div>

        {/* Card 3: Top Revenue Sources */}
        <div className="db-chart-card">
          <div className="chart-header">
            <h3>Top Revenue Sources</h3>
          </div>
          <div className="revenue-sources-list">
            <div className="rev-source">
              <div className="rev-info">
                <span>Acme Corp</span>
                <strong>{fmtCurrency(15000)}</strong>
              </div>
              <div className="progress-bar-container">
                <div className="progress-bar" style={{ width: '80%', background: 'var(--indigo-500)' }} />
              </div>
            </div>
            <div className="rev-source">
              <div className="rev-info">
                <span>Stark Industries</span>
                <strong>{fmtCurrency(12000)}</strong>
              </div>
              <div className="progress-bar-container">
                <div className="progress-bar" style={{ width: '65%', background: 'var(--violet-500)' }} />
              </div>
            </div>
            <div className="rev-source">
              <div className="rev-info">
                <span>Wayne Enterprises</span>
                <strong>{fmtCurrency(8500)}</strong>
              </div>
              <div className="progress-bar-container">
                <div className="progress-bar" style={{ width: '45%', background: 'var(--indigo-400)' }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Filter / Search Bar ── */}
      <div className="db-filter-bar">
        <div className="filter-search-wrap">
          <span className="search-icon">🔍</span>
          <input 
            type="text" 
            placeholder="Search enquiries..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
          />
        </div>

        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="filter-select">
          <option value="">All Statuses</option>
          <option value="NEW">New</option>
          <option value="ANALYZING">Analyzing</option>
          <option value="REVIEW">Review</option>
          <option value="PENDING_APPROVAL">Pending Approval</option>
          <option value="COMPLETED">Completed</option>
        </select>

        <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} className="filter-select">
          <option value="">All Priorities</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>

        <select value={customerFilter} onChange={(e) => setCustomerFilter(e.target.value)} className="filter-select">
          <option value="">All Customers</option>
          {uniqueCustomers.map(cust => (
            <option key={cust} value={cust}>{cust}</option>
          ))}
        </select>
      </div>

      {/* ── Recent Enquiries Split Layout ── */}
      <div className="db-workspace-split">
        {/* Left Side: Recent Enquiries */}
        <div className="db-list-panel">
          <div className="list-panel-header">
            <h3>Recent Enquiries</h3>
            <button className="text-btn" onClick={() => navigate('/enquiries')}>View all enquiries →</button>
          </div>

          <div className="data-table-wrap">
            {enqLoading ? (
              <Loading text="Loading enquiries..." />
            ) : filteredEnquiries.length === 0 ? (
              <EmptyState 
                icon="📋" 
                title="No matching enquiries" 
                description="Try modifying your search or filter options." 
              />
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Budget</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEnquiries.map((enq) => {
                    const isSelected = selectedEnquiry?.id === enq.id
                    return (
                      <tr 
                        key={enq.id} 
                        onClick={() => setSelectedEnquiry(enq)} 
                        className={isSelected ? 'selected-row' : ''}
                      >
                        <td>
                          <div className="customer-cell">
                            <div className="customer-avatar" aria-hidden="true">
                              {(enq.customerName || '?').slice(0,2).toUpperCase()}
                            </div>
                            <div>
                              <div className="customer-name">{enq.customerName || 'Unknown'}</div>
                              <div className="customer-email">{enq.customerEmail || ''}</div>
                            </div>
                          </div>
                        </td>
                        <td><PriorityBadge priority={(enq.priority || 'medium').toLowerCase()} /></td>
                        <td><StatusBadge status={(enq.status || 'new').toLowerCase().replace(/ /g, '_')} /></td>
                        <td><strong>{fmtCurrency(enq.budget)}</strong></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Right Side: Selected Enquiry Detail Panel */}
        <div className="db-detail-panel">
          {selectedEnquiry ? (
            <div className="db-detail-card">
              <div className="detail-card-header">
                <div>
                  <span className="detail-id">Enquiry #{selectedEnquiry.id.slice(0, 8)}</span>
                  <h4>{selectedEnquiry.customerName || 'Unknown'}</h4>
                </div>
                <StatusBadge status={(selectedEnquiry.status || 'new').toLowerCase().replace(/ /g, '_')} />
              </div>

              <div className="detail-meta-list">
                <div className="detail-meta-row">
                  <span>Priority:</span>
                  <PriorityBadge priority={(selectedEnquiry.priority || 'medium').toLowerCase()} />
                </div>
                <div className="detail-meta-row">
                  <span>Assigned User:</span>
                  <strong>{user?.fullName || 'Unassigned'}</strong>
                </div>
                <div className="detail-meta-row">
                  <span>Estimated Value:</span>
                  <strong>{fmtCurrency(selectedEnquiry.budget)}</strong>
                </div>
                <div className="detail-meta-row">
                  <span>Received Date:</span>
                  <span>{fmtDate(selectedEnquiry.createdAt)}</span>
                </div>
              </div>

              {selectedEnquiry.status === 'PENDING_APPROVAL' && (
                <div className="detail-approval-notice">
                  <span className="notice-icon">⚠️</span>
                  <div>
                    <h5>Human Approval Required</h5>
                    <p>Suggested quotation/proposal requires manual approval before sending.</p>
                  </div>
                </div>
              )}

              <div className="detail-summary-section">
                <h5>AI Summary / Extract</h5>
                <p>{selectedEnquiry.aiSummary || selectedEnquiry.rawContent || 'No summary available.'}</p>
              </div>

              <button 
                className="btn btn-primary btn-full"
                onClick={() => navigate(`/enquiries/${selectedEnquiry.id}`)}
              >
                View Full Workspace Details →
              </button>
            </div>
          ) : (
            <div className="db-detail-empty">
              <span>📋</span>
              <p>Select an enquiry from the list to view quick workspace details.</p>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  )
}
