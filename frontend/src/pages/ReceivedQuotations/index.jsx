import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { receivedQuotationsService } from '../../services/receivedQuotations.service'

const STATUS_CONFIG = {
  READY: { label: 'Extracted', class: 'badge-success' },
  REVIEW_REQUIRED: { label: 'Needs Review', class: 'badge-warning' },
  PROCESSING: { label: 'Processing', class: 'badge-info' },
  FAILED: { label: 'Failed', class: 'badge-error' },
}

const REVIEW_CONFIG = {
  PENDING: { label: 'Pending Review', class: 'badge-pending' },
  REVIEWED: { label: 'Reviewed', class: 'badge-info' },
  APPROVED: { label: 'Approved', class: 'badge-success' },
}

export default function ReceivedQuotations() {
  const [quotations, setQuotations] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadMsg, setUploadMsg] = useState(null)
  const [error, setError] = useState(null)
  const [showUpload, setShowUpload] = useState(false)
  const [metadata, setMetadata] = useState({ senderName: '', senderEmail: '', senderCompany: '', emailSubject: '' })
  const fileRef = useRef(null)

  const fetchAll = async () => {
    try {
      const data = await receivedQuotationsService.list()
      setQuotations(data.receivedQuotations || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAll() }, [])

  const handleUpload = async (e) => {
    e.preventDefault()
    const file = fileRef.current?.files?.[0]
    if (!file) return setUploadMsg({ type: 'error', text: 'Please select a PDF file.' })

    setUploading(true)
    setUploadMsg({ type: 'info', text: '📄 Reading PDF... extracting with AI...' })

    try {
      const result = await receivedQuotationsService.uploadPDF(file, metadata)
      setUploadMsg({ type: result.extractionStatus === 'READY' ? 'success' : 'warning', text: result.message })
      setShowUpload(false)
      setMetadata({ senderName: '', senderEmail: '', senderCompany: '', emailSubject: '' })
      if (fileRef.current) fileRef.current.value = ''
      fetchAll()
    } catch (err) {
      setUploadMsg({ type: 'error', text: err.message })
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="page-container">
      {/* ── Header ── */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Received Quotations</h1>
          <p className="page-subtitle">Quotations received from suppliers — AI-extracted from PDFs</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowUpload(!showUpload)}>
          <span>+</span> Upload PDF Quotation
        </button>
      </div>

      {/* ── Upload panel ── */}
      {showUpload && (
        <div className="card upload-panel" style={{ marginBottom: '1.5rem', border: '2px dashed var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
            <span style={{ fontSize: '1.5rem' }}>📄</span>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>Upload PDF Quotation</h3>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Upload a PDF quotation received from a supplier. Mistral AI will extract all details automatically.
              </p>
            </div>
          </div>

          <form onSubmit={handleUpload}>
            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Sender Name</label>
                <input className="form-input" placeholder="e.g. Rahul Sharma" value={metadata.senderName}
                  onChange={e => setMetadata(m => ({ ...m, senderName: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Sender Email</label>
                <input className="form-input" type="email" placeholder="supplier@company.com" value={metadata.senderEmail}
                  onChange={e => setMetadata(m => ({ ...m, senderEmail: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Sender Company</label>
                <input className="form-input" placeholder="TechSolutions Ltd" value={metadata.senderCompany}
                  onChange={e => setMetadata(m => ({ ...m, senderCompany: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Email Subject (optional)</label>
                <input className="form-input" placeholder="Quotation for your request..." value={metadata.emailSubject}
                  onChange={e => setMetadata(m => ({ ...m, emailSubject: e.target.value }))} />
              </div>
            </div>

            <div className="form-group" style={{ marginTop: '1rem' }}>
              <label className="form-label">PDF File <span style={{ color: 'var(--accent-red)' }}>*</span></label>
              <input ref={fileRef} type="file" accept=".pdf,application/pdf" className="form-input" style={{ padding: '0.6rem' }} />
            </div>

            {uploadMsg && (
              <div className={`alert alert-${uploadMsg.type}`} style={{ marginTop: '1rem' }}>
                {uploadMsg.text}
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
              <button type="submit" className="btn btn-primary" disabled={uploading}>
                {uploading ? '🤖 Extracting with AI...' : '🚀 Upload & Extract'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => setShowUpload(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* ── Success/error message ── */}
      {!showUpload && uploadMsg && (
        <div className={`alert alert-${uploadMsg.type}`} style={{ marginBottom: '1rem' }}>
          {uploadMsg.text}
          <button onClick={() => setUploadMsg(null)} style={{ marginLeft: '1rem', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
        </div>
      )}

      {/* ── Content ── */}
      {loading ? (
        <div className="loading-state">
          <div className="spinner" />
          <p>Loading received quotations...</p>
        </div>
      ) : error ? (
        <div className="alert alert-error">{error}</div>
      ) : quotations.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📥</div>
          <h3>No quotations received yet</h3>
          <p>Upload a PDF quotation received from a supplier. Mistral AI will automatically extract the supplier, items, pricing, and totals.</p>
          <button className="btn btn-primary" onClick={() => setShowUpload(true)}>
            + Upload PDF Quotation
          </button>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Supplier</th>
                <th>Quotation</th>
                <th>Date</th>
                <th>Grand Total</th>
                <th>Extraction</th>
                <th>Review</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {quotations.map((q) => {
                const exCfg = STATUS_CONFIG[q.extractionStatus] || STATUS_CONFIG.PROCESSING
                const rvCfg = REVIEW_CONFIG[q.reviewStatus] || REVIEW_CONFIG.PENDING
                return (
                  <tr key={q.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{q.senderCompany || q.senderName || '—'}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{q.senderEmail || ''}</div>
                    </td>
                    <td>
                      <div>{q.quotationTitle || q.quotationNumber || q.attachmentName || 'Untitled'}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{q.quotationNumber || ''}</div>
                    </td>
                    <td style={{ fontSize: '0.875rem' }}>
                      {q.quotationDate ? new Date(q.quotationDate).toLocaleDateString('en-IN') : new Date(q.createdAt).toLocaleDateString('en-IN')}
                    </td>
                    <td style={{ fontWeight: 600, color: 'var(--accent-green)' }}>
                      {q.grandTotal != null
                        ? `${q.currency || 'INR'} ${Number(q.grandTotal).toLocaleString('en-IN')}`
                        : '—'}
                    </td>
                    <td>
                      <span className={`badge ${exCfg.class}`}>{exCfg.label}</span>
                      {q.hasDiscrepancy && <span className="badge badge-error" style={{ marginLeft: '4px' }}>⚠ Discrepancy</span>}
                    </td>
                    <td>
                      <span className={`badge ${rvCfg.class}`}>{rvCfg.label}</span>
                    </td>
                    <td>
                      <Link to={`/received-quotations/${q.id}`} className="btn btn-sm btn-secondary">
                        Review →
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
