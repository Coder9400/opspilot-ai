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

  if (loading) return <div className="loading-state" style={{ padding: '4rem', textAlign: 'center' }}><div className="spinner" /></div>
  if (!q) return <div className="alert alert-error" style={{ margin: '2rem' }}>{message?.text || 'Quotation not found.'}</div>

  const exCfg = STATUS_CONFIG[q.extractionStatus] || STATUS_CONFIG.PROCESSING
  const items = q.items || []

  return (
    <div className="page-container" style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      {/* ── Back + Header ── */}
      <div style={{ marginBottom: '2rem' }}>
        <button className="btn btn-secondary" style={{ marginBottom: '1.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }} onClick={() => navigate('/received-quotations')}>
          ← Back to Inbox
        </button>
        <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 className="page-title" style={{ fontSize: '2rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              {q.quotationTitle || q.quotationNumber || 'Received Quotation'}
              <span className={`badge ${exCfg.class}`} style={{ fontSize: '0.9rem' }}>{exCfg.icon} {exCfg.label}</span>
            </h1>
            <p className="page-subtitle" style={{ fontSize: '1.1rem', color: 'var(--text-muted)' }}>From: <strong style={{ color: 'var(--text-main)' }}>{q.senderCompany || q.senderName || q.senderEmail || 'Unknown Supplier'}</strong></p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button className="btn btn-secondary" onClick={() => window.open(`/api/received-quotations/${id}/pdf`, '_blank')} disabled={!q.attachmentName}>
              📄 View PDF
            </button>
            {!editing && (
              <button className="btn btn-primary" onClick={() => setEditing(true)}>
                ✏ Edit & Review
              </button>
            )}
          </div>
        </div>
      </div>

      {message && (
        <div className={`alert alert-${message.type}`} style={{ marginBottom: '1.5rem' }}>
          {message.text}
        </div>
      )}

      {/* ── Discrepancy warning ── */}
      {q.hasDiscrepancy && (
        <div className="alert alert-warning" style={{ marginBottom: '2rem', borderLeft: '4px solid var(--accent-orange)' }}>
          <strong style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>⚠ Financial Discrepancy Detected</strong>
          <p style={{ margin: '0.5rem 0 0' }}>{q.discrepancyNotes}</p>
          <p style={{ margin: '0.5rem 0 0', fontSize: '0.9rem', opacity: 0.8 }}>Please review and correct the values manually by clicking "Edit & Review".</p>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
        <div className="left-column">
          {/* ── Edit Form / View ── */}
          {editing ? (
            <form onSubmit={handleSave} className="card" style={{ padding: '2rem', borderRadius: '12px' }}>
              <h3 style={{ marginTop: 0, borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>Edit Quotation Details</h3>
              
              <div className="form-grid-2" style={{ marginBottom: '2rem' }}>
                <div className="form-group">
                  <label className="form-label">Supplier Name</label>
                  <input className="form-input" value={form.senderName} onChange={e => setForm(f => ({ ...f, senderName: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Supplier Company</label>
                  <input className="form-input" value={form.senderCompany} onChange={e => setForm(f => ({ ...f, senderCompany: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Quotation Number</label>
                  <input className="form-input" value={form.quotationNumber} onChange={e => setForm(f => ({ ...f, quotationNumber: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Currency</label>
                  <select className="form-input" value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}>
                    {['INR', 'USD', 'GBP', 'EUR', 'AED'].map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Quotation Date</label>
                  <input type="date" className="form-input" value={form.quotationDate} onChange={e => setForm(f => ({ ...f, quotationDate: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Valid Until</label>
                  <input type="date" className="form-input" value={form.validUntil} onChange={e => setForm(f => ({ ...f, validUntil: e.target.value }))} />
                </div>
              </div>

              <h4 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Financial Totals</h4>
              <div className="form-grid-2" style={{ marginBottom: '2rem' }}>
                <div className="form-group">
                  <label className="form-label">Subtotal ({form.currency})</label>
                  <input type="number" step="0.01" className="form-input" value={form.subtotal} onChange={e => setForm(f => ({ ...f, subtotal: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Tax ({form.currency})</label>
                  <input type="number" step="0.01" className="form-input" value={form.tax} onChange={e => setForm(f => ({ ...f, tax: e.target.value }))} />
                </div>
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Grand Total ({form.currency})</label>
                  <input type="number" step="0.01" className="form-input" value={form.grandTotal} onChange={e => setForm(f => ({ ...f, grandTotal: e.target.value }))} />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '2rem' }}>
                <label className="form-label">Terms & Conditions</label>
                <textarea className="form-input" rows={4} value={form.terms} onChange={e => setForm(f => ({ ...f, terms: e.target.value }))} />
              </div>

              <div style={{ display: 'flex', gap: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : '✓ Save & Mark as Reviewed'}
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setEditing(false)}>Cancel</button>
              </div>
            </form>
          ) : (
            <>
              {/* ── Line Items ── */}
              <div className="card" style={{ marginBottom: '2rem', padding: '0', borderRadius: '12px', overflow: 'hidden' }}>
                <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
                  <h3 style={{ margin: 0 }}>Line Items</h3>
                </div>
                {items.length > 0 ? (
                  <table className="data-table" style={{ width: '100%' }}>
                    <thead>
                      <tr><th style={{ padding: '1rem' }}>Description</th><th style={{ padding: '1rem', textAlign: 'center' }}>Qty</th><th style={{ padding: '1rem', textAlign: 'right' }}>Unit Price</th><th style={{ padding: '1rem', textAlign: 'right' }}>Subtotal</th></tr>
                    </thead>
                    <tbody>
                      {items.map((item, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                          <td style={{ padding: '1rem' }}>{item.description}</td>
                          <td style={{ padding: '1rem', textAlign: 'center' }}>{item.quantity}</td>
                          <td style={{ padding: '1rem', textAlign: 'right' }}>{Number(item.unitPrice).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                          <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 500 }}>{Number(item.subtotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No line items were extracted from this PDF.
                  </div>
                )}
              </div>

              {/* ── Terms ── */}
              {q.terms && (
                <div className="card" style={{ padding: '2rem', borderRadius: '12px' }}>
                  <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>Terms & Conditions</h3>
                  <div style={{ whiteSpace: 'pre-wrap', color: 'var(--text-main)', fontSize: '0.95rem', lineHeight: 1.6, backgroundColor: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '8px' }}>
                    {q.terms}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="right-column" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* ── Financial Summary ── */}
          <div className="card" style={{ padding: '2rem', borderRadius: '12px', background: 'linear-gradient(to bottom, var(--bg-card), var(--bg-secondary))' }}>
            <h3 style={{ marginTop: 0, marginBottom: '1.5rem' }}>Financial Summary</h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px dashed var(--border-color)' }}>
              <span style={{ color: 'var(--text-muted)' }}>Subtotal</span>
              <span style={{ fontWeight: 500 }}>{q.currency} {Number(q.subtotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px dashed var(--border-color)' }}>
              <span style={{ color: 'var(--text-muted)' }}>Tax</span>
              <span style={{ fontWeight: 500 }}>{q.currency} {Number(q.tax || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem 0 0', fontWeight: 700, fontSize: '1.25rem' }}>
              <span>Grand Total</span>
              <span style={{ color: 'var(--accent-green)' }}>{q.currency} {Number(q.grandTotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>

          {/* ── Meta Details ── */}
          <div className="card" style={{ padding: '2rem', borderRadius: '12px' }}>
            <h3 style={{ marginTop: 0, marginBottom: '1.5rem' }}>Details</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Quotation Date</span>
                <div style={{ fontWeight: 500 }}>{q.quotationDate || '—'}</div>
              </div>
              <div>
                <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Valid Until</span>
                <div style={{ fontWeight: 500 }}>{q.validUntil || '—'}</div>
              </div>
              <div>
                <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Contact Name</span>
                <div style={{ fontWeight: 500 }}>{q.senderName || '—'}</div>
              </div>
              <div>
                <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Contact Email</span>
                <div style={{ fontWeight: 500 }}>{q.senderEmail || '—'}</div>
              </div>
            </div>
          </div>

          {/* ── AI Insights ── */}
          {q.aiInsights && q.aiInsights.length > 0 && (
            <div className="card" style={{ padding: '2rem', borderRadius: '12px', border: '1px solid var(--accent-blue)', backgroundColor: 'var(--bg-main)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <span style={{ fontSize: '1.5rem' }}>🤖</span>
                <h3 style={{ margin: 0 }}>AI Insights</h3>
                <span className="badge badge-info" style={{ marginLeft: 'auto', fontSize: '0.7rem' }}>AI Generated</span>
              </div>
              <ul style={{ margin: 0, padding: '0 0 0 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {q.aiInsights.map((insight, i) => (
                  <li key={i} style={{ fontSize: '0.95rem', color: 'var(--text-main)', lineHeight: 1.5 }}>{insight}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
