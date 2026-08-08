import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../../components/Sidebar'
import Button from '../../components/Button'
import { StatusBadge } from '../../components/Badge'
import Loading from '../../components/Loading'
import ErrorBanner from '../../components/ErrorBanner'
import EmptyState from '../../components/EmptyState'
import { quotationService } from '../../services/quotation.service'
import { getErrorMessage } from '../../utils/errorHandler'

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'

export default function Quotations() {
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [quotations, setQuotations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const data = await quotationService.list()
      setQuotations(Array.isArray(data) ? data : data.quotations || [])
    } catch (err) {
      setError(getErrorMessage(err))
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

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
              <div className="dashboard-header-title">Quotations</div>
              <div className="dashboard-header-sub">{quotations.length} total quotations</div>
            </div>
          </div>
          <div className="dashboard-header-right">
            <Button variant="ghost" size="sm" onClick={load}>↻ Refresh</Button>
          </div>
        </header>

        <div className="dashboard-content">
          {loading ? (
            <Loading text="Loading quotations…" />
          ) : error ? (
            <ErrorBanner message={error} onRetry={load} />
          ) : quotations.length === 0 ? (
            <EmptyState
              icon="📄"
              title="No quotations yet"
              message="Quotations are generated from enquiries. Create and analyze an enquiry first, then generate a quotation."
              action={{ label: '+ New Enquiry', onClick: () => navigate('/enquiries/new') }}
            />
          ) : (
            <div className="enquiries-table-wrapper">
              <table className="enq-table" aria-label="All quotations">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Content Preview</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {quotations.map((q) => (
                    <tr key={q.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/quotations/${q.id}`)}>
                      <td>
                        <div className="enq-company">{q.customer || q.enquiry?.customer || 'Customer'}</div>
                      </td>
                      <td>
                        <div className="enq-subject">
                          {(q.content || q.description || '').slice(0, 80)}
                          {(q.content || q.description || '').length > 80 ? '…' : ''}
                        </div>
                      </td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <StatusBadge status={(q.status || 'pending_approval').toLowerCase().replace(/ /g, '_')} />
                      </td>
                      <td>{fmtDate(q.createdAt)}</td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <button className="enq-action-btn" onClick={() => navigate(`/quotations/${q.id}`)}>View →</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
