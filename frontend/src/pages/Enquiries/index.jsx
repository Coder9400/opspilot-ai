import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import AppShell from '../../components/AppShell'
import { StatusBadge, PriorityBadge } from '../../components/Badge'
import Button from '../../components/Button'
import Loading from '../../components/Loading'
import ErrorBanner from '../../components/ErrorBanner'
import EmptyState from '../../components/EmptyState'
import { enquiryService } from '../../services/enquiry.service'
import { getErrorMessage } from '../../utils/errorHandler'

const fmtDate = (d) => {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}
const fmtCurrency = (v, cur = 'USD') => {
  if (v == null) return '—'
  try { return new Intl.NumberFormat('en-US', { style: 'currency', currency: cur, maximumFractionDigits: 0 }).format(v) } catch { return `${cur} ${v}` }
}

export default function Enquiries() {
  const navigate = useNavigate()
  const [enquiries, setEnquiries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Filters
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const data = await enquiryService.list()
      setEnquiries(data?.enquiries || data?.data?.enquiries || [])
    } catch (err) { setError(getErrorMessage(err)) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  // Filter logic
  const filtered = enquiries.filter((e) => {
    const s = search.toLowerCase()
    const matchSearch = !s || (e.customerName || '').toLowerCase().includes(s) || (e.rawContent || '').toLowerCase().includes(s) || (e.aiSummary || '').toLowerCase().includes(s)
    const matchStatus = !statusFilter || (e.status || '').toLowerCase() === statusFilter
    const matchPriority = !priorityFilter || (e.priority || '').toLowerCase() === priorityFilter
    return matchSearch && matchStatus && matchPriority
  })

  const initials = (name) => (name || '?').slice(0, 2).toUpperCase()

  return (
    <AppShell>
      {/* Page header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Enquiries</h1>
          <p className="page-subtitle">Manage and process customer enquiries with AI.</p>
        </div>
        <div className="page-header-right">
          <Button variant="outline" size="sm" onClick={load}>↻ Refresh</Button>
          <Button variant="primary" onClick={() => navigate('/enquiries/new')}>+ New Enquiry</Button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="filter-bar">
        <div className="filter-search">
          <span className="filter-search-icon" aria-hidden="true">🔍</span>
          <input
            type="search"
            placeholder="Search by customer name or content…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search enquiries"
          />
        </div>
        <select
          className="filter-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          aria-label="Filter by status"
        >
          <option value="">All Statuses</option>
          <option value="new">New</option>
          <option value="analyzing">Analyzing</option>
          <option value="review">Review</option>
          <option value="pending_approval">Pending Approval</option>
          <option value="approved">Approved</option>
          <option value="completed">Completed</option>
        </select>
        <select
          className="filter-select"
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          aria-label="Filter by priority"
        >
          <option value="">All Priorities</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        {(search || statusFilter || priorityFilter) && (
          <Button variant="ghost" size="sm" onClick={() => { setSearch(''); setStatusFilter(''); setPriorityFilter('') }}>
            ✕ Clear
          </Button>
        )}
      </div>

      {/* Error */}
      {error && <ErrorBanner message={error} onRetry={load} style={{ marginBottom: 16 }} />}

      {/* Table */}
      {loading ? (
        <Loading text="Loading enquiries…" />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="📋"
          title={enquiries.length === 0 ? 'No enquiries yet' : 'No results found'}
          description={enquiries.length === 0 ? 'Submit your first customer enquiry to get started with AI analysis.' : 'Try adjusting your search or filters.'}
          actionLabel={enquiries.length === 0 ? '+ New Enquiry' : undefined}
          onAction={enquiries.length === 0 ? () => navigate('/enquiries/new') : undefined}
        />
      ) : (
        <>
          <div style={{ marginBottom: 10, fontSize: 'var(--fs-xs)', color: 'var(--text-muted)', fontWeight: 600 }}>
            Showing {filtered.length} of {enquiries.length} enquiries
          </div>
          <div className="data-table-wrap">
            <table className="data-table" aria-label="Enquiries list">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Requirement</th>
                  <th>Priority</th>
                  <th>Budget</th>
                  <th>Timeline</th>
                  <th>Status</th>
                  <th>Updated</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((enq) => (
                  <tr key={enq.id} onClick={() => navigate(`/enquiries/${enq.id}`)}>
                    <td>
                      <div className="customer-cell">
                        <div className="customer-avatar" aria-hidden="true">{initials(enq.customerName)}</div>
                        <div>
                          <div className="customer-name">{enq.customerName || 'Unknown'}</div>
                          {enq.customerEmail && <div className="customer-email">{enq.customerEmail}</div>}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="req-preview">{(enq.aiSummary || enq.rawContent || '—').slice(0, 70)}</div>
                    </td>
                    <td><PriorityBadge priority={(enq.priority || 'medium').toLowerCase()} /></td>
                    <td style={{ fontWeight: 600, fontSize: 'var(--fs-sm)' }}>{fmtCurrency(enq.budget, enq.currency)}</td>
                    <td style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>{enq.timeline || '—'}</td>
                    <td><StatusBadge status={(enq.status || 'new').toLowerCase().replace(/ /g, '_')} /></td>
                    <td style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>{fmtDate(enq.updatedAt || enq.createdAt)}</td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <button className="table-action-btn" onClick={() => navigate(`/enquiries/${enq.id}`)}>
                        View →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </AppShell>
  )
}
