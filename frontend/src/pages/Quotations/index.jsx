import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import AppShell from '../../components/AppShell'
import Button from '../../components/Button'
import { StatusBadge } from '../../components/Badge'
import Loading from '../../components/Loading'
import ErrorBanner from '../../components/ErrorBanner'
import EmptyState from '../../components/EmptyState'
import { quotationService } from '../../services/quotation.service'
import { getErrorMessage } from '../../utils/errorHandler'

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'
const fmtCurrency = (v, cur = 'USD') => {
  if (v == null) return '—'
  try { return new Intl.NumberFormat('en-US', { style: 'currency', currency: cur, maximumFractionDigits: 0 }).format(v) } catch { return `${cur} ${v}` }
}

export default function Quotations() {
  const navigate = useNavigate()
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

  const initials = (name) => (name || '?').slice(0, 2).toUpperCase()

  return (
    <AppShell>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Quotations</h1>
          <p className="page-subtitle">Manage AI-generated proposals and quotations.</p>
        </div>
        <div className="page-header-right">
          <Button variant="outline" size="sm" onClick={load}>↻ Refresh</Button>
        </div>
      </div>

      <div className="dash-grid" style={{ marginBottom: 'var(--sp-6)' }}>
        <div className="metric-card">
          <div className="metric-card-label">Total Quotations</div>
          <div className="metric-card-value">{quotations.length}</div>
        </div>
        <div className="metric-card">
          <div className="metric-card-label">Pending Approval</div>
          <div className="metric-card-value" style={{ color: 'var(--amber-600)' }}>
            {quotations.filter(q => (q.status||'').toUpperCase() === 'PENDING_APPROVAL').length}
          </div>
        </div>
      </div>

      {loading ? (
        <Loading text="Loading quotations…" />
      ) : error ? (
        <ErrorBanner message={error} onRetry={load} />
      ) : quotations.length === 0 ? (
        <EmptyState
          icon="📄"
          title="No quotations yet"
          description="Quotations are generated from enquiries. Create and analyze an enquiry first, then generate a quotation."
          actionLabel="View Enquiries"
          onAction={() => navigate('/enquiries')}
        />
      ) : (
        <div className="data-table-wrap">
          <table className="data-table" aria-label="Quotations list">
            <thead>
              <tr>
                <th>Quotation</th>
                <th>Customer</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Created</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {quotations.map((q) => (
                <tr key={q.id} onClick={() => navigate(`/quotations/${q.id}`)}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{q.id.split('-')[0].toUpperCase()}</div>
                  </td>
                  <td>
                    <div className="customer-cell">
                      <div className="customer-avatar" style={{ width: 28, height: 28, fontSize: 10 }}>
                        {initials(q.customer || q.enquiry?.customerName || q.enquiry?.customer)}
                      </div>
                      <div className="customer-name">{q.customer || q.enquiry?.customerName || q.enquiry?.customer || 'Unknown Customer'}</div>
                    </div>
                  </td>
                  <td style={{ fontWeight: 600 }}>{fmtCurrency(q.totalAmount || q.amount)}</td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <StatusBadge status={(q.status || 'pending_approval').toLowerCase().replace(/ /g, '_')} />
                  </td>
                  <td>{fmtDate(q.createdAt)}</td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <button className="table-action-btn" onClick={() => navigate(`/quotations/${q.id}`)}>View →</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AppShell>
  )
}
