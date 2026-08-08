import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import AppShell from '../../components/AppShell'
import Button from '../../components/Button'
import { StatusBadge } from '../../components/Badge'
import Loading from '../../components/Loading'
import ErrorBanner from '../../components/ErrorBanner'
import { quotationService } from '../../services/quotation.service'
import { getErrorMessage } from '../../utils/errorHandler'

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'
const fmtCurrency = (v, cur = 'USD') => {
  if (v == null) return '—'
  try { return new Intl.NumberFormat('en-US', { style: 'currency', currency: cur, maximumFractionDigits: 0 }).format(v) } catch { return `${cur} ${v}` }
}

export default function QuotationDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [quotation, setQuotation] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const data = await quotationService.getById(id)
      setQuotation(data?.quotation || data)
    } catch (err) { setError(getErrorMessage(err)) }
    finally { setLoading(false) }
  }, [id])

  useEffect(() => { load() }, [load])

  if (loading) return <AppShell><div style={{ marginTop: '20vh' }}><Loading text="Loading quotation…" /></div></AppShell>
  if (!quotation) return <AppShell><ErrorBanner message={error || 'Quotation not found.'} /><Button variant="ghost" onClick={() => navigate('/quotations')}>← Back</Button></AppShell>

  const isPending = quotation.status === 'PENDING_APPROVAL'

  return (
    <AppShell maxWidth="900px">
      <div className="page-header" style={{ marginBottom: 'var(--sp-5)' }}>
        <div className="page-header-left">
          <Button variant="ghost" size="sm" onClick={() => navigate('/quotations')} style={{ marginBottom: 8, marginLeft: -8 }}>← Back to Quotations</Button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <h1 className="page-title" style={{ margin: 0 }}>Quotation {quotation.id.split('-')[0].toUpperCase()}</h1>
            <StatusBadge status={quotation.status} />
          </div>
          <p className="page-subtitle">Generated for {quotation.enquiry?.customerName || quotation.customer || 'Unknown Customer'} on {fmtDate(quotation.createdAt)}</p>
        </div>
        <div className="page-header-right">
          <Button variant="outline" onClick={() => navigate(`/enquiries/${quotation.enquiryId}`)}>View Enquiry</Button>
        </div>
      </div>

      {error && <ErrorBanner message={error} onRetry={load} style={{ marginBottom: 20 }} />}

      <div className="card card-lg" style={{ padding: 'var(--sp-10) var(--sp-12)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--sp-10)' }}>
          <div>
            <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--indigo-600)', letterSpacing: '-0.02em', marginBottom: 4 }}>OPSPILOT AI</div>
            <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>Automated Business Solutions</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 'var(--fs-2xl)', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4 }}>PROPOSAL</div>
            <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-muted)' }}>Date: {fmtDate(quotation.createdAt)}</div>
            <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-muted)' }}>Valid until: {fmtDate(new Date(new Date(quotation.createdAt).getTime() + 30 * 24 * 60 * 60 * 1000))}</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 'var(--sp-16)', marginBottom: 'var(--sp-10)' }}>
          <div>
            <div style={{ fontSize: 'var(--fs-xs)', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Prepared For</div>
            <div style={{ fontSize: 'var(--fs-md)', fontWeight: 700, color: 'var(--text-primary)' }}>{quotation.enquiry?.customerName || quotation.customer || 'Customer'}</div>
            {quotation.enquiry?.customerEmail && <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-body)' }}>{quotation.enquiry.customerEmail}</div>}
          </div>
        </div>

        <table className="quotation-table" style={{ marginBottom: 'var(--sp-8)' }}>
          <thead>
            <tr>
              <th>Description</th>
              <th style={{ width: 100, textAlign: 'center' }}>Qty</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {(quotation.items || []).map((item, i) => (
              <tr key={i}>
                <td>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.description}</div>
                </td>
                <td style={{ textAlign: 'center' }}>{item.quantity || 1}</td>
                <td>{fmtCurrency(item.total, quotation.currency || quotation.enquiry?.currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="quotation-totals">
          <div className="quotation-grand-row">
            <span className="quotation-grand-label">Grand Total</span>
            <span className="quotation-grand-value">{fmtCurrency(quotation.totalAmount || quotation.amount, quotation.currency || quotation.enquiry?.currency)}</span>
          </div>
        </div>

        {isPending && (
          <div style={{ marginTop: 'var(--sp-12)', padding: 'var(--sp-5)', background: 'var(--amber-50)', border: '1px solid var(--amber-100)', borderRadius: 'var(--r-lg)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 20 }}>⚠️</span>
              <div>
                <div style={{ fontWeight: 700, color: 'var(--amber-600)', fontSize: 'var(--fs-sm)' }}>Pending Approval</div>
                <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--amber-600)' }}>This quotation is waiting for human approval.</div>
              </div>
            </div>
            <Button variant="primary" onClick={() => navigate(`/enquiries/${quotation.enquiryId}`)}>Review in Workspace →</Button>
          </div>
        )}
      </div>
    </AppShell>
  )
}
