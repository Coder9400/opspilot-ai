import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { request } from '../services/api'

export default function SharedQuotation() {
  const { token } = useParams()
  const [quotation, setQuotation] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const load = async () => {
      try {
        const data = await request('GET', `/api/quotations/shared/${token}`, null, false)
        setQuotation(data.quotation)
      } catch (err) {
        setError(err.message || 'This quotation link is invalid or has expired.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [token])

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>
      <div className="spinner" />
    </div>
  )

  if (error) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)', padding: '2rem' }}>
      <div className="card" style={{ maxWidth: '480px', textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔒</div>
        <h2>Quotation Not Found</h2>
        <p style={{ color: 'var(--text-muted)' }}>{error}</p>
        <a href="/" className="btn btn-primary" style={{ marginTop: '1rem' }}>Go to OPSPILOT</a>
      </div>
    </div>
  )

  const q = quotation
  const items = q?.items || []

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', padding: '2rem 1rem' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        {/* ── Header ── */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📋</div>
          <h1 style={{ margin: 0, fontSize: '1.75rem' }}>{q.title}</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>
            Quotation shared via <strong>OPSPILOT AI</strong>
          </p>
          <div style={{ display: 'inline-flex', gap: '0.5rem', padding: '0.5rem 1rem', background: 'var(--bg-secondary)', borderRadius: '8px', marginTop: '0.5rem', fontSize: '0.85rem' }}>
            <span>This quotation was shared with you by the service provider.</span>
          </div>
        </div>

        {/* ── Details Card ── */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="form-grid-2">
            <div>
              <div className="form-label">Customer</div>
              <div style={{ fontWeight: 600 }}>{q.enquiries?.customerName || '—'}</div>
            </div>
            <div>
              <div className="form-label">Currency</div>
              <div>{q.currency || 'INR'}</div>
            </div>
            <div>
              <div className="form-label">Valid For</div>
              <div>{q.validityDays} days</div>
            </div>
            <div>
              <div className="form-label">Status</div>
              <span className="badge badge-success">APPROVED</span>
            </div>
          </div>
        </div>

        {/* ── Line Items ── */}
        {items.length > 0 && (
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ marginTop: 0 }}>Items</h3>
            <table className="data-table">
              <thead>
                <tr><th>Description</th><th>Qty</th><th>Unit Price</th><th>Subtotal</th></tr>
              </thead>
              <tbody>
                {items.map((item, i) => (
                  <tr key={i}>
                    <td>{item.description}</td>
                    <td>{item.quantity}</td>
                    <td>{Number(item.unitPrice).toLocaleString('en-IN')}</td>
                    <td>{Number(item.subtotal || item.unitPrice * item.quantity).toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Totals ── */}
        <div className="card" style={{ marginBottom: '1.5rem', maxWidth: '380px', marginLeft: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--border-color)' }}>
            <span>Subtotal</span>
            <span>{q.currency} {Number(q.subtotal || 0).toLocaleString('en-IN')}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--border-color)' }}>
            <span>Tax</span>
            <span>{q.currency} {Number(q.tax || 0).toLocaleString('en-IN')}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', fontWeight: 700, fontSize: '1.2rem' }}>
            <span>Total</span>
            <span style={{ color: 'var(--accent-green)' }}>{q.currency} {Number(q.total || 0).toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* ── Notes ── */}
        {q.notes && (
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ marginTop: 0 }}>Notes & Terms</h3>
            <p style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{q.notes}</p>
          </div>
        )}

        {/* ── Footer ── */}
        <div style={{ textAlign: 'center', marginTop: '2rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          <p>Powered by <strong>OPSPILOT AI</strong> — AI-powered business quotation platform</p>
        </div>
      </div>
    </div>
  )
}
