import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import AppShell from '../../components/AppShell'
import { StatusBadge, PriorityBadge } from '../../components/Badge'
import Button from '../../components/Button'
import Loading from '../../components/Loading'
import ErrorBanner from '../../components/ErrorBanner'
import EmptyState from '../../components/EmptyState'
import { enquiryService } from '../../services/enquiry.service'
import { followupService } from '../../services/followup.service'
import { getErrorMessage } from '../../utils/errorHandler'

/* ── Workflow Bar ────────────────────────────────────────── */
const WF_STEPS = [
  { id: 'new', label: 'Received' },
  { id: 'analyzing', label: 'Analyzed' },
  { id: 'review', label: 'Drafted' },
  { id: 'pending_approval', label: 'Approval' },
  { id: 'approved', label: 'Approved' },
]

function WorkflowBar({ currentStatus }) {
  const s = (currentStatus || 'new').toLowerCase()
  const idx = WF_STEPS.findIndex((step) => step.id === s) || 0
  const activeIdx = s === 'completed' ? WF_STEPS.length : (idx === -1 ? 0 : idx)

  return (
    <div className="workflow-bar">
      {WF_STEPS.map((step, i) => {
        const isDone = i < activeIdx || s === 'completed'
        const isActive = i === activeIdx && s !== 'completed'
        return (
          <div key={step.id} style={{ display: 'flex', alignItems: 'center', flex: i < WF_STEPS.length - 1 ? '1 1 auto' : '0 0 auto' }}>
            <div className={`wf-step ${isDone ? 'done' : ''} ${isActive ? 'active' : ''}`}>
              <div className="wf-step-circle" aria-hidden="true">{isDone ? '✓' : i + 1}</div>
              <div className="wf-step-label">{step.label}</div>
            </div>
            {i < WF_STEPS.length - 1 && (
              <div className={`wf-connector ${isDone ? 'done' : ''}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

/* ── Formatter ───────────────────────────────────────────── */
const fmtCurrency = (v, cur = 'USD') => {
  if (v == null) return '—'
  try { return new Intl.NumberFormat('en-US', { style: 'currency', currency: cur, maximumFractionDigits: 0 }).format(v) } catch { return `${cur} ${v}` }
}

export default function EnquiryDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [enq, setEnq] = useState(null)
  const [followups, setFollowups] = useState([])
  const [quotation, setQuotation] = useState(null)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionBusy, setActionBusy] = useState(false)
  const [editingResponse, setEditingResponse] = useState(false)
  const [draftResponse, setDraftResponse] = useState('')

  // 1. Fetch data
  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const response = await enquiryService.get(id)
      const e = response.enquiry || response
      setEnq(e)
      setFollowups(e.followUps || [])
      setQuotation(e.quotations?.[0] || null)
      if (e.generatedResponse && !draftResponse) setDraftResponse(e.generatedResponse)
    } catch (err) { setError(getErrorMessage(err)) }
    finally { setLoading(false) }
  }, [id])

  useEffect(() => { load() }, [load])

  // 2. AI Actions
  const runAI = async (actionFn, loadingMsg) => {
    setActionBusy(loadingMsg); setError('')
    try { await actionFn(id); await load() }
    catch (err) { setError(getErrorMessage(err)) }
    finally { setActionBusy(false) }
  }

  const handleAnalyze   = () => runAI(enquiryService.analyze, 'Analyzing requirement…')
  const handleResponse  = () => runAI(enquiryService.generateResponse, 'Drafting response…')

  const handleQuotation = async () => {
    if (quotation) {
      navigate(`/quotations/${quotation.id}`)
      return
    }
    setActionBusy('Preparing quotation…'); setError('')
    try { 
      const res = await enquiryService.generateQuotation(id)
      if (res?.quotation?.id) navigate(`/quotations/${res.quotation.id}`)
      else if (res?.id) navigate(`/quotations/${res.id}`)
      else await load()
    } catch (err) { setError(getErrorMessage(err)) }
    finally { setActionBusy(false) }
  }

  const handleFollowups = async () => {
    setActionBusy('Scheduling tasks…'); setError('')
    try { 
      await enquiryService.generateFollowups(id)
      navigate('/followups')
    } catch (err) { setError(getErrorMessage(err)) }
    finally { setActionBusy(false) }
  }

  const handleApprove = () => runAI(enquiryService.approve, 'Approving workflow…')
  const handleReject  = () => runAI(enquiryService.reject, 'Rejecting…')

  const toggleFollowup = async (fuId, currentStatus) => {
    const next = currentStatus === 'PENDING' ? 'COMPLETED' : 'PENDING'
    try {
      setFollowups(prev => prev.map(f => f.id === fuId ? { ...f, status: next } : f))
      await followupService.update(fuId, { status: next })
    } catch (err) { setError('Failed to update follow-up task.'); await load() }
  }

  if (loading) {
    return (
      <AppShell>
        <div style={{ marginTop: '20vh' }}><Loading text="Loading enquiry workspace…" /></div>
      </AppShell>
    )
  }
  if (!enq) {
    return (
      <AppShell>
        <ErrorBanner message={error || 'Enquiry not found.'} />
        <Button variant="ghost" onClick={() => navigate('/enquiries')}>← Back</Button>
      </AppShell>
    )
  }

  const hasAnalysis = !!enq.aiSummary
  const hasResponse = !!enq.generatedResponse
  const hasQuotation = !!quotation
  const hasTasks = followups.length > 0
  const needsApproval = enq.status === 'PENDING_APPROVAL'

  return (
    <AppShell>
      {/* ── Header & Pipeline ── */}
      <div className="page-header" style={{ marginBottom: 'var(--sp-5)' }}>
        <div className="page-header-left">
          <Button variant="ghost" size="sm" onClick={() => navigate('/enquiries')} style={{ marginBottom: 8, marginLeft: -8 }}>← Back to Enquiries</Button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <h1 className="page-title" style={{ margin: 0 }}>{enq.customerName || 'New Enquiry'}</h1>
            <StatusBadge status={enq.status} />
          </div>
          <p className="page-subtitle">{enq.customerEmail || 'No email provided'}</p>
        </div>
        <div className="page-header-right" style={{ minWidth: 300 }}>
          <WorkflowBar currentStatus={enq.status} />
        </div>
      </div>

      {error && <ErrorBanner message={error} onRetry={load} style={{ marginBottom: 20 }} />}
      {actionBusy && (
        <div className="card" style={{ marginBottom: 20, textAlign: 'center', background: 'var(--indigo-50)', borderColor: 'var(--indigo-100)' }}>
          <Loading inline size="sm" text={actionBusy} />
        </div>
      )}

      {/* ── Two-Column Workspace ── */}
      <div className="workspace">
        
        {/* LEFT: Raw Enquiry */}
        <div className="workspace-left">
          <div className="card">
            <div className="card-section-title">Original Input</div>
            <div style={{
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border-card)',
              borderRadius: 'var(--r-md)',
              padding: 'var(--sp-4)',
              fontSize: 'var(--fs-sm)',
              color: 'var(--text-body)',
              whiteSpace: 'pre-wrap',
              maxHeight: '600px',
              overflowY: 'auto'
            }}>
              {enq.rawContent || 'No content provided.'}
            </div>
          </div>
        </div>

        {/* RIGHT: AI Analysis & Generation */}
        <div className="workspace-right">

          {/* 1. Extraction (Analysis) */}
          <div className="ai-section">
            <div className="ai-section-header">
              <div className="ai-section-title">
                <div className="ai-section-icon">🧠</div> AI Extraction
              </div>
              {!hasAnalysis && (
                <Button variant="primary" size="sm" onClick={handleAnalyze} disabled={!!actionBusy}>
                  Analyze Requirement
                </Button>
              )}
            </div>
            {hasAnalysis ? (
              <div className="ai-section-body">
                <div className="extraction-grid" style={{ marginBottom: 'var(--sp-4)' }}>
                  <div className="extraction-item">
                    <div className="extraction-label">Customer Profile</div>
                    <div className="extraction-value large">{enq.customerName || <span className="extraction-value muted">Unknown</span>}</div>
                    <div className="extraction-value muted" style={{ fontSize: 'var(--fs-xs)', marginTop: 2 }}>{enq.customerEmail}</div>
                  </div>
                  <div className="extraction-item">
                    <div className="extraction-label">Budget & Timeline</div>
                    <div className="extraction-value large" style={{ color: 'var(--green-600)' }}>
                      {fmtCurrency(enq.budget, enq.currency)}
                    </div>
                    <div className="extraction-value muted" style={{ fontSize: 'var(--fs-xs)', marginTop: 2 }}>
                      {enq.timeline || 'No timeline specified'}
                    </div>
                  </div>
                </div>

                <div className="extraction-grid">
                  <div className="extraction-item">
                    <div className="extraction-label">Priority Classification</div>
                    <PriorityBadge priority={enq.priority} style={{ marginTop: 4 }} />
                  </div>
                  <div className="extraction-item" style={{ gridColumn: '1 / -1' }}>
                    <div className="extraction-label">Extracted Requirements</div>
                    {enq.requirements?.length > 0 ? (
                      <div className="req-list">
                        {enq.requirements.map((req, i) => (
                          <div key={i} className="req-item">
                            <div className="req-num">{i + 1}</div>
                            <span>{req}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="extraction-value muted">No specific requirements detected.</div>
                    )}
                  </div>
                </div>

                {enq.missingInformation?.length > 0 && (
                  <div className="extraction-item" style={{ marginTop: 'var(--sp-3)', background: 'var(--amber-50)', borderColor: 'var(--amber-100)' }}>
                    <div className="extraction-label" style={{ color: 'var(--amber-600)' }}>Missing Information</div>
                    <div className="missing-list">
                      {enq.missingInformation.map((q, i) => (
                        <div key={i} className="missing-item">
                          <span style={{ flexShrink: 0, marginTop: 1 }}>•</span>
                          <span>{q}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="ai-section-body">
                <EmptyState icon="⚙️" title="Awaiting Analysis" description="Click Analyze to let AI extract requirements, budget, and priority from the raw input." />
              </div>
            )}
          </div>

          {/* 2. Suggested Response */}
          {hasAnalysis && (
            <div className="ai-section">
              <div className="ai-section-header">
                <div className="ai-section-title">
                  <div className="ai-section-icon">💬</div> Suggested Customer Response
                </div>
                {!hasResponse && (
                  <Button variant="outline" size="sm" onClick={handleResponse} disabled={!!actionBusy}>
                    Draft Response
                  </Button>
                )}
              </div>
              {hasResponse ? (
                <div className="ai-section-body" style={{ padding: 0 }}>
                  <div className="ai-response-card" style={{ border: 'none', borderRadius: 0, boxShadow: 'none' }}>
                    <div className="ai-response-header">
                      <div className="ai-response-title">
                        <span className="badge badge-ai-draft">AI DRAFT</span>
                        <span style={{ fontSize: 'var(--fs-sm)' }}>Ready for review</span>
                      </div>
                      <div className="ai-response-actions">
                        <button className="ai-response-action-btn" onClick={() => {
                          if (editingResponse) {
                            setEditingResponse(false)
                          } else {
                            setEditingResponse(true)
                          }
                        }}>{editingResponse ? 'Save Local Edit' : 'Edit'}</button>
                        <button className="ai-response-action-btn" onClick={() => navigator.clipboard.writeText(draftResponse || enq.generatedResponse)}>Copy</button>
                        <button className="ai-response-action-btn" onClick={handleResponse}>Regenerate</button>
                      </div>
                    </div>
                    <div className="ai-response-body">
                      {editingResponse ? (
                        <textarea
                          style={{ width: '100%', minHeight: 200, padding: 12, border: '1px solid var(--border-input)', borderRadius: 'var(--r-md)', fontSize: 'var(--fs-sm)', fontFamily: 'inherit' }}
                          value={draftResponse || enq.generatedResponse}
                          onChange={(e) => setDraftResponse(e.target.value)}
                        />
                      ) : (
                        <div style={{ whiteSpace: 'pre-wrap' }}>{draftResponse || enq.generatedResponse}</div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="ai-section-body">
                  <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-muted)' }}>Generate a professional response asking for missing requirements and outlining next steps.</p>
                </div>
              )}
            </div>
          )}

          {/* 3. Quotation */}
          {hasAnalysis && (
            <div className="ai-section">
              <div className="ai-section-header">
                <div className="ai-section-title">
                  <div className="ai-section-icon">📄</div> Quotation / Proposal
                </div>
                {!hasQuotation && (
                  <Button variant="outline" size="sm" onClick={handleQuotation} disabled={!!actionBusy}>
                    Create Quotation
                  </Button>
                )}
              </div>
              {hasQuotation ? (
                <div className="ai-section-body">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Proposal Summary</div>
                    <StatusBadge status={quotation.status || 'draft'} />
                  </div>
                  <table className="quotation-table">
                    <thead><tr><th>Item / Service</th><th>Amount</th></tr></thead>
                    <tbody>
                      {(quotation.items || []).map((item, i) => (
                        <tr key={i}>
                          <td>
                            <div style={{ fontWeight: 600 }}>{item.description}</div>
                            {item.quantity > 1 && <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>Qty: {item.quantity}</div>}
                          </td>
                          <td>{fmtCurrency(item.total, enq.currency)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="quotation-totals">
                    <div className="quotation-grand-row">
                      <span className="quotation-grand-label">Total Estimate</span>
                      <span className="quotation-grand-value">{fmtCurrency(quotation.totalAmount, enq.currency)}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="ai-section-body">
                  <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-muted)' }}>Automatically build a preliminary quotation based on the extracted budget and requirements.</p>
                </div>
              )}
            </div>
          )}

          {/* 4. Follow-up Tasks */}
          {hasAnalysis && (
            <div className="ai-section">
              <div className="ai-section-header">
                <div className="ai-section-title">
                  <div className="ai-section-icon">🔔</div> Follow-up Tasks
                </div>
                {!hasTasks && (
                  <Button variant="outline" size="sm" onClick={handleFollowups} disabled={!!actionBusy}>
                    Schedule Tasks
                  </Button>
                )}
              </div>
              {hasTasks ? (
                <div className="ai-section-body">
                  <div className="followup-list">
                    {followups.map(fu => {
                      const done = fu.status === 'COMPLETED'
                      return (
                        <div key={fu.id} className={`followup-item ${done ? 'done' : ''}`}>
                          <div className="followup-item-left">
                            <div className={`followup-title ${done ? 'done' : ''}`}>{fu.title || fu.task}</div>
                            <div className="followup-meta">
                              <span className="followup-due">📅 {fu.dueDate ? new Date(fu.dueDate).toLocaleDateString() : 'No date'}</span>
                              <PriorityBadge priority={fu.priority} style={{ padding: '0 6px', fontSize: 9 }} />
                            </div>
                          </div>
                          <button className="followup-done-btn" onClick={() => toggleFollowup(fu.id, fu.status)}>
                            {done ? 'Undo' : 'Complete'}
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ) : (
                <div className="ai-section-body">
                  <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-muted)' }}>Generate action items to ensure this enquiry progresses.</p>
                </div>
              )}
            </div>
          )}

          {/* 5. HUMAN APPROVAL GATE */}
          {needsApproval && (
            <div className="approval-card" style={{ marginTop: 'var(--sp-4)' }}>
              <div className="approval-card-header">
                <div className="approval-card-icon pending">✋</div>
                <div>
                  <div className="approval-card-title">Human Approval Required</div>
                  <div className="approval-card-subtitle">Review the AI-generated workflow before taking action.</div>
                </div>
              </div>
              <div className="approval-card-body">
                <div className="approval-pending-items">
                  {hasResponse && <div className="approval-pending-item"><span>📧</span> <strong>Response:</strong> Ready to send to customer</div>}
                  {hasQuotation && <div className="approval-pending-item"><span>📄</span> <strong>Quotation:</strong> {fmtCurrency(quotation?.totalAmount, enq.currency)} proposal generated</div>}
                  {hasTasks && <div className="approval-pending-item"><span>🔔</span> <strong>Tasks:</strong> {followups.length} follow-ups scheduled</div>}
                </div>
                <div className="approval-actions">
                  <button className="approval-action-reject" onClick={handleReject} disabled={!!actionBusy}>
                    Reject & Rework
                  </button>
                  <button className="approval-action-approve" onClick={handleApprove} disabled={!!actionBusy}>
                    Approve Workflow
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </AppShell>
  )
}
