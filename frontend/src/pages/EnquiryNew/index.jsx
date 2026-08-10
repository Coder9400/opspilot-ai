import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppShell from '../../components/AppShell'
import Button from '../../components/Button'
import ErrorBanner from '../../components/ErrorBanner'
import { enquiryService } from '../../services/enquiry.service'
import { getErrorMessage } from '../../utils/errorHandler'

/* ── Document drop zone ──────────────────────────────────── */
function DocumentMode() {
  const [dragging, setDragging] = useState(false)
  const [file, setFile] = useState(null)

  return (
    <div>
      <div className="doc-gap-notice">
        <span className="doc-gap-notice-icon">🔧</span>
        <div>
          <div className="doc-gap-title">Backend Support Required</div>
          <p className="doc-gap-body">
            Document file parsing (PDF, DOCX) is not yet implemented in the backend API.
            The backend only accepts text content in <code>POST /api/enquiries</code>.
            <br /><br />
            <strong>Workaround:</strong> Copy your document content and use the <strong>Text</strong> or <strong>Email</strong> tab instead.
          </p>
        </div>
      </div>

      <div
        className={`doc-dropzone${dragging ? ' drag-over' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault(); setDragging(false)
          const dropped = e.dataTransfer.files[0]
          if (dropped) setFile(dropped)
        }}
        onClick={() => document.getElementById('doc-file-input').click()}
        role="button"
        tabIndex={0}
        aria-label="Document upload zone"
      >
        <input id="doc-file-input" type="file" accept=".pdf,.doc,.docx,.txt" style={{ display: 'none' }}
          onChange={(e) => setFile(e.target.files[0])} />

        {file ? (
          <>
            <div className="doc-dropzone-icon">📄</div>
            <div className="doc-dropzone-title">{file.name}</div>
            <div className="doc-dropzone-sub">{(file.size / 1024).toFixed(1)} KB — ready (but submission requires backend support)</div>
            <Button variant="ghost" size="sm" style={{ marginTop: 12 }} onClick={(e) => { e.stopPropagation(); setFile(null) }}>Remove</Button>
          </>
        ) : (
          <>
            <div className="doc-dropzone-icon">📁</div>
            <div className="doc-dropzone-title">Drop your customer document here</div>
            <div className="doc-dropzone-sub">or <span style={{ color: 'var(--indigo-500)', fontWeight: 600 }}>Browse files</span></div>
            <div style={{ marginTop: 8, fontSize: 'var(--fs-xs)', color: 'var(--text-subtle)' }}>Supported: PDF, DOC, DOCX, TXT</div>
          </>
        )}
      </div>
    </div>
  )
}

export default function EnquiryNew() {
  const navigate = useNavigate()
  const [mode, setMode] = useState('TEXT')

  // TEXT
  const [textContent, setTextContent] = useState('')

  // EMAIL
  const [emailFrom, setEmailFrom] = useState('')
  const [emailSubject, setEmailSubject] = useState('')
  const [emailBody, setEmailBody] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const buildContent = () => {
    if (mode === 'TEXT') return textContent.trim()
    if (mode === 'EMAIL') {
      const parts = []
      if (emailFrom.trim()) parts.push(`From: ${emailFrom.trim()}`)
      if (emailSubject.trim()) parts.push(`Subject: ${emailSubject.trim()}`)
      if (emailBody.trim()) parts.push(`\n${emailBody.trim()}`)
      return parts.join('\n')
    }
    return ''
  }

  const isSubmittable = () => {
    if (mode === 'TEXT') return textContent.trim().length >= 10
    if (mode === 'EMAIL') return emailBody.trim().length >= 10
    return false
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!isSubmittable()) return
    setLoading(true); setError('')
    try {
      const data = await enquiryService.create({ sourceType: mode, content: buildContent() })
      const id = data?.enquiry?.id || data?.id
      navigate(`/enquiries/${id}`)
    } catch (err) { setError(getErrorMessage(err)) }
    finally { setLoading(false) }
  }

  const TABS = [
    { id: 'TEXT',     label: '📝 Text',     desc: 'Paste or type a customer enquiry' },
    { id: 'EMAIL',    label: '📧 Email',    desc: 'Enter an email-style enquiry with From / Subject / Body' },
    { id: 'DOCUMENT', label: '📎 Document', desc: 'Upload a customer document (UI ready — backend support required)' },
  ]

  return (
    <AppShell maxWidth="800px">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Create New Enquiry</h1>
          <p className="page-subtitle">Give OPSPILOT AI a customer enquiry and let AI structure the workflow.</p>
        </div>
        <div className="page-header-right">
          <Button variant="ghost" onClick={() => navigate('/enquiries')}>← Back</Button>
        </div>
      </div>

      {/* AI info banner */}
      <div style={{
        background: 'linear-gradient(135deg, var(--indigo-50), var(--violet-50))',
        border: '1px solid var(--indigo-100)',
        borderRadius: 'var(--r-xl)',
        padding: 'var(--sp-4) var(--sp-5)',
        marginBottom: 'var(--sp-6)',
        display: 'flex', gap: 'var(--sp-3)', alignItems: 'flex-start',
      }}>
        <span style={{ fontSize: '1.5rem', flexShrink: 0 }}>🤖</span>
        <div>
          <strong style={{ color: 'var(--indigo-600)', display: 'block', marginBottom: 3 }}>AI Workflow Autopilot</strong>
          <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--indigo-600)', lineHeight: 1.6 }}>
            After submission, AI will extract the customer profile, requirements, budget, timeline & priority — then generate a suggested response, quotation, and follow-up tasks. <strong>Nothing is sent externally without your approval.</strong>
          </p>
        </div>
      </div>

      <div className="card card-lg">
        {/* Input mode tabs */}
        <div style={{ marginBottom: 'var(--sp-5)' }}>
          <div style={{ fontWeight: 700, marginBottom: 10, color: 'var(--text-primary)' }}>Input Method</div>
          <div className="input-tabs" role="tablist" aria-label="Input method">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                role="tab"
                aria-selected={mode === tab.id}
                aria-controls={`tab-panel-${tab.id}`}
                className={`input-tab${mode === tab.id ? ' active' : ''}`}
                onClick={() => { setMode(tab.id); setError('') }}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)', marginTop: 8 }}>
            {TABS.find((t) => t.id === mode)?.desc}
          </p>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid var(--border-card)', marginBottom: 'var(--sp-5)' }} />

        {error && <ErrorBanner message={error} style={{ marginBottom: 16 }} />}

        {/* ── TEXT mode ── */}
        {mode === 'TEXT' && (
          <form id="tab-panel-TEXT" role="tabpanel" onSubmit={handleSubmit}>
            <div className="form-group" style={{ marginBottom: 'var(--sp-5)' }}>
              <label className="form-label" htmlFor="enq-text-content">
                Customer Enquiry <span className="required">*</span>
              </label>
              <textarea
                id="enq-text-content"
                className="form-input"
                rows={11}
                placeholder={"Paste customer enquiry here...\n\nExample:\n\"Hi, we're looking for a custom e-commerce website for our retail chain. We need inventory management, POS integration, and analytics. Budget is around ₦3M. We'd like to go live in 4 months.\""}
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                required
              />
              <p className="form-hint">{textContent.length} / 50,000 characters · Minimum 10 characters</p>
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <Button variant="ghost" onClick={() => navigate('/enquiries')} disabled={loading}>Cancel</Button>
              <Button type="submit" variant="primary" size="lg" loading={loading} disabled={loading || !isSubmittable()}>
                {loading ? 'Creating enquiry…' : 'Analyze with AI →'}
              </Button>
            </div>
          </form>
        )}

        {/* ── EMAIL mode ── */}
        {mode === 'EMAIL' && (
          <form id="tab-panel-EMAIL" role="tabpanel" onSubmit={handleSubmit}>
            <div className="form-group" style={{ marginBottom: 'var(--sp-5)' }}>
              <label className="form-label">Email Enquiry <span className="required">*</span></label>
              <div className="email-composer">
                <div className="email-composer-header">
                  <div className="email-field">
                    <span className="email-field-label">From:</span>
                    <input id="email-from" type="text" placeholder="customer@example.com"
                      value={emailFrom} onChange={(e) => setEmailFrom(e.target.value)} />
                  </div>
                  <div className="email-field">
                    <span className="email-field-label">Subject:</span>
                    <input id="email-subject" type="text" placeholder="Enquiry about your services"
                      value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} />
                  </div>
                </div>
                <div className="email-body">
                  <textarea
                    id="email-body"
                    placeholder={"Dear Team,\n\nI'm writing to enquire about your services...\n\nWe are looking for...\n\nOur budget is approximately...\n\nWe'd like to complete this by...\n\nKind regards,\n[Customer Name]"}
                    value={emailBody}
                    onChange={(e) => setEmailBody(e.target.value)}
                    required
                  />
                </div>
              </div>
              <p className="form-hint">{emailBody.length} characters — The full email context helps AI extract requirements accurately</p>
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <Button variant="ghost" onClick={() => navigate('/enquiries')} disabled={loading}>Cancel</Button>
              <Button type="submit" variant="primary" size="lg" loading={loading} disabled={loading || !isSubmittable()}>
                {loading ? 'Creating enquiry…' : 'Analyze with AI →'}
              </Button>
            </div>
          </form>
        )}

        {/* ── DOCUMENT mode ── */}
        {mode === 'DOCUMENT' && (
          <div id="tab-panel-DOCUMENT" role="tabpanel">
            <DocumentMode />
          </div>
        )}
      </div>
    </AppShell>
  )
}
