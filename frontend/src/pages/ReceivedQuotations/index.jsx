import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { receivedQuotationsService } from '../../services/receivedQuotations.service'

const STATUS_CONFIG = {
  READY: { label: 'Extracted', class: 'badge-success', icon: '✓' },
  REVIEW_REQUIRED: { label: 'Needs Review', class: 'badge-warning', icon: '⚠' },
  PROCESSING: { label: 'Processing', class: 'badge-info', icon: '⏳' },
  FAILED: { label: 'Failed', class: 'badge-error', icon: '✕' },
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
  
  // Modal states
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [uploadStep, setUploadStep] = useState(0)
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

  // KPI Calculations
  const totalReceived = quotations.length
  const needsReviewCount = quotations.filter(q => q.reviewStatus === 'PENDING').length
  const processedCount = quotations.filter(q => q.reviewStatus !== 'PENDING').length
  const totalValue = quotations.reduce((acc, q) => acc + (Number(q.grandTotal) || 0), 0)
  const displayValue = totalValue >= 100000 ? `₹${(totalValue / 100000).toFixed(2)}L` : `₹${totalValue.toLocaleString('en-IN')}`

  const handleUpload = async (e) => {
    e.preventDefault()
    const file = fileRef.current?.files?.[0]
    if (!file) return setUploadMsg({ type: 'error', text: 'Please select a PDF file.' })

    setUploading(true)
    setUploadStep(1) // Uploading PDF

    try {
      // Simulate steps for UI purposes
      setTimeout(() => setUploadStep(2), 500) // Reading quotation
      setTimeout(() => setUploadStep(3), 1500) // AI extraction
      
      const result = await receivedQuotationsService.uploadPDF(file, metadata)
      
      setUploadStep(4) // Saving
      
      setTimeout(() => {
        setUploadStep(5) // Complete
        setUploadMsg({ type: result.extractionStatus === 'READY' ? 'success' : 'warning', text: result.message })
        setTimeout(() => {
          setShowUploadModal(false)
          setMetadata({ senderName: '', senderEmail: '', senderCompany: '', emailSubject: '' })
          if (fileRef.current) fileRef.current.value = ''
          setUploadStep(0)
          fetchAll()
        }, 2000)
      }, 500)
    } catch (err) {
      setUploadStep(0)
      // Provide actionable error messages
      const msg = err.message || 'Unable to upload quotation'
      if (msg.includes('No company') || msg.includes('NO_COMPANY') || msg.includes('company workspace')) {
        setUploadMsg({ 
          type: 'error', 
          text: '⚠ No company workspace found. Please go to Settings → Company Profile to set up your workspace first, then try again.'
        })
      } else {
        setUploadMsg({ type: 'error', text: msg })
      }
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="page-container" style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      {/* ── Header ── */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 className="page-title" style={{ fontSize: '1.8rem', marginBottom: '0.25rem' }}>Received Quotations</h1>
          <p className="page-subtitle" style={{ color: 'var(--text-muted)' }}>AI-powered quotation inbox. Upload supplier quotations or import them from Gmail.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowUploadModal(true)}>
          + Add Quotation
        </button>
      </div>

      {/* ── Summary Cards ── */}
      <div className="grid-cards" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="card" style={{ padding: '1.5rem', borderRadius: '12px' }}>
          <h4 style={{ color: 'var(--text-muted)', margin: '0 0 0.5rem 0', fontWeight: 500 }}>Total Received</h4>
          <div style={{ fontSize: '2rem', fontWeight: 700 }}>{totalReceived}</div>
        </div>
        <div className="card" style={{ padding: '1.5rem', borderRadius: '12px' }}>
          <h4 style={{ color: 'var(--text-muted)', margin: '0 0 0.5rem 0', fontWeight: 500 }}>Needs Review</h4>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--accent-orange)' }}>{needsReviewCount}</div>
        </div>
        <div className="card" style={{ padding: '1.5rem', borderRadius: '12px' }}>
          <h4 style={{ color: 'var(--text-muted)', margin: '0 0 0.5rem 0', fontWeight: 500 }}>Processed</h4>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--accent-green)' }}>{processedCount}</div>
        </div>
        <div className="card" style={{ padding: '1.5rem', borderRadius: '12px' }}>
          <h4 style={{ color: 'var(--text-muted)', margin: '0 0 0.5rem 0', fontWeight: 500 }}>Total Value</h4>
          <div style={{ fontSize: '2rem', fontWeight: 700 }}>{displayValue}</div>
        </div>
      </div>

      {/* ── Success/error message ── */}
      {uploadMsg && !showUploadModal && (
        <div className={`alert alert-${uploadMsg.type}`} style={{ marginBottom: '1.5rem' }}>
          {uploadMsg.text}
          <button onClick={() => setUploadMsg(null)} style={{ marginLeft: '1rem', background: 'none', border: 'none', cursor: 'pointer', float: 'right' }}>✕</button>
        </div>
      )}

      {/* ── Content ── */}
      {loading ? (
        <div className="loading-state" style={{ padding: '4rem', textAlign: 'center' }}>
          <div className="spinner" />
          <p>Loading received quotations...</p>
        </div>
      ) : error ? (
        <div className="alert alert-error">{error}</div>
      ) : quotations.length === 0 ? (
        <div className="empty-state card" style={{ padding: '4rem 2rem', textAlign: 'center', borderRadius: '12px' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📥</div>
          <h3 style={{ marginBottom: '0.5rem' }}>No quotations yet</h3>
          <p style={{ color: 'var(--text-muted)', maxWidth: '400px', margin: '0 auto 1.5rem' }}>
            Upload a supplier quotation PDF or connect Gmail to automatically detect quotation emails.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button className="btn btn-primary" onClick={() => setShowUploadModal(true)}>Upload PDF</button>
            <button className="btn btn-secondary">Connect Gmail</button>
          </div>
        </div>
      ) : (
        <div className="table-container card" style={{ padding: '0', borderRadius: '12px', overflow: 'hidden' }}>
          <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ backgroundColor: 'var(--bg-secondary)' }}>
              <tr>
                <th style={{ padding: '1rem', textAlign: 'left' }}>Supplier</th>
                <th style={{ padding: '1rem', textAlign: 'left' }}>Quotation Number</th>
                <th style={{ padding: '1rem', textAlign: 'left' }}>Received</th>
                <th style={{ padding: '1rem', textAlign: 'left' }}>Amount</th>
                <th style={{ padding: '1rem', textAlign: 'left' }}>Currency</th>
                <th style={{ padding: '1rem', textAlign: 'left' }}>AI Status</th>
                <th style={{ padding: '1rem', textAlign: 'left' }}>Review Status</th>
                <th style={{ padding: '1rem', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {quotations.map((q) => {
                const exCfg = STATUS_CONFIG[q.extractionStatus] || STATUS_CONFIG.PROCESSING
                const rvCfg = REVIEW_CONFIG[q.reviewStatus] || REVIEW_CONFIG.PENDING
                return (
                  <tr key={q.id} style={{ borderTop: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ fontWeight: 600 }}>{q.senderCompany || q.senderName || '—'}</div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div>{q.quotationNumber || '—'}</div>
                    </td>
                    <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>
                      {new Date(q.createdAt).toLocaleDateString('en-IN')}
                    </td>
                    <td style={{ padding: '1rem', fontWeight: 600 }}>
                      {q.grandTotal != null ? Number(q.grandTotal).toLocaleString('en-IN') : '—'}
                    </td>
                    <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{q.currency || 'INR'}</td>
                    <td style={{ padding: '1rem' }}>
                      <span className={`badge ${exCfg.class}`}>{exCfg.label}</span>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span className={`badge ${rvCfg.class}`}>{rvCfg.label}</span>
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                      <Link to={`/received-quotations/${q.id}`} className="btn btn-sm btn-secondary">
                        View
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Upload Modal ── */}
      {showUploadModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '600px', margin: '2rem', maxHeight: '90vh', overflowY: 'auto', borderRadius: '12px', padding: '2rem' }}>
            <h2 style={{ marginTop: 0, marginBottom: '0.25rem' }}>Upload Supplier Quotation</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Upload a PDF and OPSPILOT will extract the quotation details using AI.</p>

            {uploadStep > 0 ? (
              <div style={{ padding: '2rem 0' }}>
                <h3 style={{ textAlign: 'center', marginBottom: '2rem' }}>Extraction Progress</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '300px', margin: '0 auto' }}>
                  <Step active={uploadStep >= 1} done={uploadStep > 1} label="Uploading PDF" />
                  <Step active={uploadStep >= 2} done={uploadStep > 2} label="Reading quotation" />
                  <Step active={uploadStep >= 3} done={uploadStep > 3} label="AI extraction" />
                  <Step active={uploadStep >= 4} done={uploadStep > 4} label="Validating totals" />
                  <Step active={uploadStep >= 5} done={uploadStep > 5} label="Saving quotation" />
                </div>
                
                {uploadStep === 5 && uploadMsg && (
                  <div className={`alert alert-${uploadMsg.type}`} style={{ marginTop: '2rem' }}>
                    {uploadMsg.text}
                  </div>
                )}
                
                {uploadMsg?.type === 'error' && (
                  <div className="alert alert-error" style={{ marginTop: '2rem' }}>
                    <strong>Unable to upload quotation</strong>
                    <p style={{ margin: '0.25rem 0 0' }}>{uploadMsg.text}</p>
                    <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                      <button className="btn btn-secondary" onClick={() => setUploadStep(0)}>Try Again</button>
                      <button className="btn btn-secondary" onClick={() => setShowUploadModal(false)}>Close</button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <form onSubmit={handleUpload}>
                <div className="form-grid-2" style={{ marginBottom: '1.5rem' }}>
                  <div className="form-group">
                    <label className="form-label">Sender Name</label>
                    <input className="form-input" value={metadata.senderName} onChange={e => setMetadata(m => ({ ...m, senderName: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Sender Email</label>
                    <input className="form-input" type="email" value={metadata.senderEmail} onChange={e => setMetadata(m => ({ ...m, senderEmail: e.target.value }))} />
                  </div>
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label className="form-label">Supplier Company</label>
                    <input className="form-input" value={metadata.senderCompany} onChange={e => setMetadata(m => ({ ...m, senderCompany: e.target.value }))} />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: '2rem' }}>
                  <label className="form-label">PDF File</label>
                  <div style={{ border: '2px dashed var(--border-color)', borderRadius: '8px', padding: '2rem', textAlign: 'center', backgroundColor: 'var(--bg-secondary)' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📄</div>
                    <input ref={fileRef} type="file" accept=".pdf,application/pdf" style={{ margin: '0 auto', display: 'block' }} required />
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '1rem' }}>PDF up to 20 MB</p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowUploadModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Extract Quotation</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function Step({ active, done, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', opacity: active ? 1 : 0.4 }}>
      <div style={{ 
        width: '24px', height: '24px', borderRadius: '50%', 
        backgroundColor: done ? 'var(--accent-green)' : active ? 'var(--accent-blue)' : 'var(--border-color)',
        color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem'
      }}>
        {done ? '✓' : active ? '●' : '○'}
      </div>
      <span style={{ fontWeight: active ? 600 : 400 }}>{label}</span>
    </div>
  )
}
