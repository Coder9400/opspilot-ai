import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../../components/Sidebar'
import Button from '../../components/Button'
import { PriorityBadge, StatusBadge } from '../../components/Badge'
import Loading from '../../components/Loading'
import ErrorBanner from '../../components/ErrorBanner'
import EmptyState from '../../components/EmptyState'
import { enquiryService } from '../../services/enquiry.service'
import { getErrorMessage } from '../../utils/errorHandler'

const fmtDate = (d) => {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function Enquiries() {
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [enquiries, setEnquiries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const data = await enquiryService.list()
      setEnquiries(Array.isArray(data) ? data : data.enquiries || [])
    } catch (err) {
      setError(getErrorMessage(err))
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = enquiries.filter((e) =>
    !search ||
    (e.customer || '').toLowerCase().includes(search.toLowerCase()) ||
    (e.content || '').toLowerCase().includes(search.toLowerCase()) ||
    (e.status || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="dashboard-layout">
      <div className={`sidebar-overlay${sidebarOpen ? ' open' : ''}`} onClick={() => setSidebarOpen(false)} aria-hidden="true" />
      <div className={sidebarOpen ? 'sidebar open' : 'sidebar'}>
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>
      <main className="dashboard-main">
        <header className="dashboard-header">
          <div className="dashboard-header-left">
            <button className="mobile-menu-btn" aria-label="Open navigation" onClick={() => setSidebarOpen((v) => !v)}>☰</button>
            <div>
              <div className="dashboard-header-title">Enquiries</div>
              <div className="dashboard-header-sub">{enquiries.length} total enquiries</div>
            </div>
          </div>
          <div className="dashboard-header-right">
            <Button variant="primary" size="sm" onClick={() => navigate('/enquiries/new')}>+ New Enquiry</Button>
          </div>
        </header>

        <div className="dashboard-content">
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
                />
              </div>
              <Button variant="ghost" size="sm" onClick={load}>↻ Refresh</Button>
            </div>

            {loading ? (
              <Loading text="Loading enquiries…" />
            ) : error ? (
              <ErrorBanner message={error} onRetry={load} />
            ) : filtered.length === 0 ? (
              <EmptyState
                icon="📋"
                title={search ? 'No matching enquiries' : 'No enquiries yet'}
                message={search ? 'Try a different search term.' : 'Submit your first customer enquiry to get started.'}
                action={!search ? { label: '+ New Enquiry', onClick: () => navigate('/enquiries/new') } : undefined}
              />
            ) : (
              <table className="enq-table" aria-label="All enquiries">
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
                  {filtered.map((enq) => (
                    <tr key={enq.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/enquiries/${enq.id}`)}>
                      <td>
                        <div className="enq-company">{enq.customer || 'Customer'}</div>
                        <div className="enq-subject">
                          {(enq.content || '').slice(0, 80)}{(enq.content || '').length > 80 ? '…' : ''}
                        </div>
                      </td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <PriorityBadge priority={(enq.priority || 'MEDIUM').toLowerCase()} />
                      </td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <StatusBadge status={(enq.status || 'new').toLowerCase().replace(/ /g, '_')} />
                      </td>
                      <td>{fmtDate(enq.createdAt)}</td>
                      <td onClick={(e) => e.stopPropagation()}>
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
      </main>
    </div>
  )
}
