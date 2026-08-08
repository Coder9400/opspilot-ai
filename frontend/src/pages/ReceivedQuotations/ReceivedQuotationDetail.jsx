import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { receivedQuotationsService } from '../../services/receivedQuotations.service'

const STATUS_CONFIG = {
  READY: { label: 'AI Extracted', class: 'badge-success', icon: '✓' },
  REVIEW_REQUIRED: { label: 'Needs Review', class: 'badge-warning', icon: '⚠' },
  PROCESSING: { label: 'Processing', class: 'badge-info', icon: '⏳' },
  FAILED: { label: 'Extraction Failed', class: 'badge-error', icon: '✕' },
}

export default function ReceivedQuotationDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [q, setQ] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({})

  useEffect(() => {
    const load = async () => {
      try {
        const data = await receivedQuotationsService.getById(id)
        const rq = data.receivedQuotation
        setQ(rq)
        setForm({
          senderName: rq.senderName || '',
          senderEmail: rq.senderEmail || '',
          senderCompany: rq.senderCompany || '',
          quotationNumber: rq.quotationNumber || '',
          quotationTitle: rq.quotationTitle || '',
          currency: rq.currency || 'INR',
          subtotal: rq.subtotal ?? '',
          tax: rq.tax ?? '',
          grandTotal: rq.grandTotal ?? '',
          quotationDate: rq.quotationDate || '',
          validUntil: rq.validUntil || '',
          terms: rq.terms || '',
        })
      } catch (err) {
        setMessage({ type: 'error', text: err.message })
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const result = await receivedQuotationsService.update(id, form)
      setQ(result.receivedQuotation)
      setEditing(false)
      setMessage({ type: 'success', text: '✓ Quotation updated and marked as reviewed.' })
    } catch (err) {
      setMessage({ type: 'error', text: err.message })
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="loading-state"><div className="spinner" /></div>
  if (!q) return <div className="alert alert-error">{message?.text || 'Quotation not found.'}</div>

  const exCfg = STATUS_CONFIG[q.extractionStatus] || STATUS_CONFIG.PROCESSING
  const items = q.items || []

  return (
    <div className="page-container">
      {/* ── Back + Header ── */}
      <div style={{ marginBottom: '1.5rem' }}>
        <button className="btn btn-secondary" style={{ marginBottom: '1rem' }} onClick={() => navigate('/received-quotations')}>
          ← Back to Received Quotations
        </button>
        <div className="page-header">
          <div>
            <h1 className="page-title">{q.quotationTitle || q.quotationNumber || 'Received Quotation'}</h1>
            <p className="page-subtitle">From: {q.senderCompany || q.senderName || q.senderEmail || 'Unknown Supplier'}</p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <span className={`badge ${exCfg.class}`}>{exCfg.icon} {exCfg.label}</span>
            {!editing && (
              <button className="btn btn-secondary" onClick={() => setEditing(true)}>
                ✏ Edit / Correct
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Alert ── */}
      {message && (
        <div className={`alert alert-${message.type}`} style={{ marginBottom: '1rem' }}>
          {message.text}
        </div>
      )}

      {/* ── Discrepancy warning ── */}
      {q.hasDiscrepancy && (
        <div className="alert alert-warning" style={{ marginBottom: '1.25rem' }}>
          <strong>⚠ Financial Discrepancy Detected</strong>
          <p style={{ margin: '0.25rem 0 0' }}>{q.discrepancyNotes}</p>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem' }}>Please review and correct the values below.</p>
        </div>
      )}

      {/* ── AI Insights ── */}
      {q.aiInsights && q.aiInsights.length > 0 && (
        <div className="card" style={{ marginBottom: '1.5rem', borderLeft: '4px solid var(--accent-blue)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <span>🤖</span>
            <strong>AI Insights</strong>
            <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>AI Generated</span>
          </div>
          <ul style={{ margin: 0, padding: '0 0 0 1.25rem' }}>
            {q.aiInsights.map((insight, i) => (
              <li key={i} style={{ marginBottom: '0.3rem', fontSize: '0.9rem' }}>{insight}</li>
            ))}
          </ul>
        </div>
      )}

      {/* ── Edit Form / View ── */}
      {editing ? (
        <form onSubmit={handleSave}>
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ marginTop: 0 }}>Supplier Information</h3>
            <div className="form-grid-2">
              {[['senderName', 'Supplier Name'], ['senderEmail', 'Supplier Email'], ['senderCompany', 'Supplier Company']].map(([key, label]) => (
                <div className="form-group" key={key}>
                  <label className="form-label">{label}</label>
                  <input className="form-input" value={form[key]}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} />
                </div>
              ))}
            </div>
          </div>

          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ marginTop: 0 }}>Quotation Details</h3>
            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Quotation Number</label>
                <input className="form-input" value={form.quotationNumber}
                  onChange={e => setForm(f => ({ ...f, quotationNumber: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Currency</label>
                <select className="form-input" value={form.currency}
                  onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}>
                  {['INR', 'USD', 'GBP', 'EUR', 'AED'].map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Quotation Date</label>
                <input type="date" className="form-input" value={form.quotationDate}
                  onChange={e => setForm(f => ({ ...f, quotationDate: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Valid Until</label>
                <input type="date" className="form-input" value={form.validUntil}
                  onChange={e => setForm(f => ({ ...f, validUntil: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Subtotal ({form.currency})</label>
                <input type="number" className="form-input" value={form.subtotal}
                  onChange={e => setForm(f => ({ ...f, subtotal: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Tax ({form.currency})</label>
                <input type="number" className="form-input" value={form.tax}
                  onChange={e => setForm(f => ({ ...f, tax: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Grand Total ({form.currency})</label>
                <input type="number" className="form-input" value={form.grandTotal}
                  onChange={e => setForm(f => ({ ...f, grandTotal: e.target.value }))} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Terms & Conditions</label>
              <textarea className="form-input" rows={3} value={form.terms}
                onChange={e => setForm(f => ({ ...f, terms: e.target.value }))} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : '✓ Save & Mark as Reviewed'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => setEditing(false)}>Cancel</button>
          </div>
        </form>
      ) : (
        <>
          {/* ── Supplier Card ── */}
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ marginTop: 0 }}>Supplier</h3>
            <div className="form-grid-2">
              <div><span className="form-label">Company</span><p>{q.senderCompany || '—'}</p></div>
              <div><span className="form-label">Contact</span><p>{q.senderName || '—'}</p></div>
              <div><span className="form-label">Email</span><p>{q.senderEmail || '—'}</p></div>
              <div><span className="form-label">Quotation #</span><p>{q.quotationNumber || '—'}</p></div>
              <div><span className="form-label">Date</span><p>{q.quotationDate || '—'}</p></div>
              <div><span className="form-label">Valid Until</span><p>{q.validUntil || '—'}</p></div>
            </div>
          </div>

          {/* ── Line Items ── */}
          {items.length > 0 && (
            <div className="card" style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ marginTop: 0 }}>Line Items</h3>
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
                      <td>{Number(item.subtotal).toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ── Totals ── */}
          <div className="card" style={{ marginBottom: '1.5rem', maxWidth: '400px', marginLeft: 'auto' }}>
            <h3 style={{ marginTop: 0 }}>Financial Summary</h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--border-color)' }}>
              <span>Subtotal</span>
              <span>{q.currency} {Number(q.subtotal || 0).toLocaleString('en-IN')}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--border-color)' }}>
              <span>Tax</span>
              <span>{q.currency} {Number(q.tax || 0).toLocaleString('en-IN')}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', fontWeight: 700, fontSize: '1.1rem' }}>
              <span>Grand Total</span>
              <span style={{ color: 'var(--accent-green)' }}>{q.currency} {Number(q.grandTotal || 0).toLocaleString('en-IN')}</span>
            </div>
          </div>

          {/* ── Terms ── */}
          {q.terms && (
            <div className="card">
              <h3 style={{ marginTop: 0 }}>Terms & Conditions</h3>
              <p style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{q.terms}</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
