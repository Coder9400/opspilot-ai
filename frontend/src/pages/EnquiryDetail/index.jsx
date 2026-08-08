import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Sidebar from '../../components/Sidebar'
import Button from '../../components/Button'
import { PriorityBadge, StatusBadge } from '../../components/Badge'
import Loading from '../../components/Loading'
import ErrorBanner from '../../components/ErrorBanner'
import Modal from '../../components/Modal'
import { enquiryService } from '../../services/enquiry.service'
import { getErrorMessage } from '../../utils/errorHandler'

const fmtDate = (d) => d ? new Date(d).toLocaleString('en-GB') : '—'

/* ── Workflow status steps ──────────────────────────────────── */
const STATUS_STEPS = ['NEW', 'ANALYZING', 'REVIEW', 'PENDING_APPROVAL', 'APPROVED', 'COMPLETED']

function WorkflowStatus({ status }) {
  const normalized = (status || 'NEW').toUpperCase().replace(/ /g, '_')
  const currentIdx = STATUS_STEPS.indexOf(normalized)
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, overflowX: 'auto', paddingBottom: 4 }}>
      {STATUS_STEPS.map((step, i) => {
        const isDone = i < currentIdx
        const isCurrent = i === currentIdx
        return (
          <div key={step} style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: isDone ? 'var(--color-success)' : isCurrent ? 'var(--color-primary)' : 'var(--color-border)',
                color: isDone || isCurrent ? '#fff' : 'var(--color-text-muted)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: 12,
              }}>
                {isDone ? '✓' : i + 1}
              </div>
              <span style={{
                fontSize: 10, fontWeight: isCurrent ? 700 : 500,
                color: isCurrent ? 'var(--color-primary)' : isDone ? 'var(--color-success)' : 'var(--color-text-muted)',
                whiteSpace: 'nowrap',
              }}>
                {step.replace(/_/g, ' ')}
              </span>
            </div>
            {i < STATUS_STEPS.length - 1 && (
              <div style={{
                height: 2, width: 40, flexShrink: 0,
                background: i < currentIdx ? 'var(--color-success)' : 'var(--color-border)',
                margin: '0 4px', marginBottom: 20,
              }} />
            )}
          </div>
        )
      })}
    </div>
  )
}

/* ── AI Analysis card ───────────────────────────────────────── */
function AnalysisCard({ analysis }) {
  if (!analysis) return null
  const {
    requirements, budget, timeline, priority, missingQuestions,
    intent, recommendation, summary,
  } = analysis

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      {summary && (
        <div className="card" style={{ background: 'var(--color-primary-soft)', border: '1px solid var(--color-primary-light)' }}>
          <div style={{ fontWeight: 700, color: 'var(--color-primary-dark)', marginBottom: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
            <span>🤖</span> AI Summary
          </div>
          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-primary-dark)', lineHeight: 1.7 }}>{summary}</p>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
        {priority && (
          <div className="card">
            <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-text-muted)', marginBottom: 8 }}>Priority</div>
            <PriorityBadge priority={priority.toLowerCase()} />
          </div>
        )}
        {budget && (
          <div className="card">
            <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-text-muted)', marginBottom: 8 }}>Budget</div>
            <div style={{ fontWeight: 600 }}>{budget}</div>
          </div>
        )}
        {timeline && (
          <div className="card">
            <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-text-muted)', marginBottom: 8 }}>Timeline</div>
            <div style={{ fontWeight: 600 }}>{timeline}</div>
          </div>
        )}
        {intent && (
          <div className="card">
            <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-text-muted)', marginBottom: 8 }}>Intent</div>
            <div style={{ fontWeight: 600 }}>{intent}</div>
          </div>
        )}
      </div>

      {requirements && requirements.length > 0 && (
        <div className="card">
          <div style={{ fontWeight: 700, marginBottom: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
            <span>📋</span> Extracted Requirements
          </div>
          <ul style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {(Array.isArray(requirements) ? requirements : Object.entries(requirements)).map((req, i) => (
              <li key={i} style={{
                display: 'flex', gap: 10, alignItems: 'flex-start',
                fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)',
              }}>
                <span style={{
                  width: 20, height: 20, borderRadius: '50%', background: 'var(--color-primary-light)',
                  color: 'var(--color-primary)', fontWeight: 700, fontSize: 11,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1,
                }}>{i + 1}</span>
                {typeof req === 'string' ? req : `${req[0]}: ${req[1]}`}
              </li>
            ))}
          </ul>
        </div>
      )}

      {missingQuestions && missingQuestions.length > 0 && (
        <div className="card" style={{ border: '1px solid var(--color-warning-light)' }}>
          <div style={{ fontWeight: 700, marginBottom: 12, display: 'flex', gap: 8, alignItems: 'center', color: '#92400e' }}>
            <span>⚠️</span> Missing Information
          </div>
          <ul style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {missingQuestions.map((q, i) => (
              <li key={i} style={{
                display: 'flex', gap: 10, alignItems: 'flex-start',
                fontSize: 'var(--font-size-sm)', color: '#92400e',
              }}>
                <span>?</span>{q}
              </li>
            ))}
          </ul>
        </div>
      )}

      {recommendation && (
        <div className="card">
          <div style={{ fontWeight: 700, marginBottom: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
            <span>💡</span> AI Recommendation
          </div>
          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', lineHeight: 1.7 }}>{recommendation}</p>
        </div>
      )}
    </div>
  )
}

/* ── Draft text card (response/quotation) ───────────────────── */
function DraftCard({ title, icon, content, onRegenerate, loading }) {
  const [editing, setEditing] = useState(false)
  const [localVal, setLocalVal] = useState(content || '')

  useEffect(() => { setLocalVal(content || '') }, [content])

  if (!content && !loading) return null

  return (
    <div className="card" style={{ border: '1px solid var(--color-primary-light)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ fontWeight: 700, display: 'flex', gap: 8, alignItems: 'center' }}>
          <span>{icon}</span> {title}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span className="badge badge-warning" style={{ fontSize: 10 }}>AI DRAFT</span>
          <button className="enq-action-btn" onClick={() => setEditing((v) => !v)}>
            {editing ? 'Done' : 'Edit'}
          </button>
          <button className="enq-action-btn" onClick={onRegenerate} disabled={loading}>
            {loading ? '…' : '↻ Regenerate'}
          </button>
        </div>
      </div>
      {loading ? <Loading text="Generating…" /> : editing ? (
        <textarea
          className="input-field"
          rows={8}
          value={localVal}
          onChange={(e) => setLocalVal(e.target.value)}
          style={{ resize: 'vertical', lineHeight: 1.7, fontFamily: 'inherit' }}
        />
      ) : (
        <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
          {localVal}
        </div>
      )}
      <div style={{
        marginTop: 12, padding: '8px 12px',
        background: '#fef3c7', borderRadius: 'var(--radius-sm)',
        fontSize: 'var(--font-size-xs)', color: '#92400e',
      }}>
        ⚠️ This is an <strong>AI-generated draft</strong>. Nothing will be sent externally without your explicit approval.
      </div>
    </div>
  )
}

/* ── Approval Section ───────────────────────────────────────── */
function ApprovalSection({ enquiryId, approval, onApproved }) {
  const [comments, setComments] = useState('')
  const [approveModal, setApproveModal] = useState(false)
  const [rejectModal, setRejectModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleApprove = async () => {
    setLoading(true); setError('')
    try {
      await enquiryService.approve(enquiryId, {
        actionType: 'SEND_QUOTATION',
        comments: comments || 'Approved',
      })
      setApproveModal(false)
      onApproved && onApproved()
    } catch (err) {
      setError(getErrorMessage(err))
    } finally { setLoading(false) }
  }

  const handleReject = async () => {
    setLoading(true); setError('')
    try {
      await enquiryService.reject(enquiryId, { comments: comments || 'Rejected' })
      setRejectModal(false)
      onApproved && onApproved()
    } catch (err) {
      setError(getErrorMessage(err))
    } finally { setLoading(false) }
  }

  const approvalStatus = approval?.status?.toUpperCase() || 'PENDING'

  return (
    <div>
      {/* HUMAN APPROVAL BANNER */}
      <div style={{
        background: approvalStatus === 'APPROVED' ? 'var(--color-success-light)' :
          approvalStatus === 'REJECTED' ? 'var(--color-danger-light)' : '#fef3c7',
        border: `1px solid ${approvalStatus === 'APPROVED' ? '#6ee7b7' :
          approvalStatus === 'REJECTED' ? '#fca5a5' : '#fcd34d'}`,
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--space-5)',
        marginBottom: 'var(--space-4)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <span style={{ fontSize: '1.5rem' }}>
            {approvalStatus === 'APPROVED' ? '✅' : approvalStatus === 'REJECTED' ? '❌' : '⏳'}
          </span>
          <div>
            <div style={{ fontWeight: 800, fontSize: 'var(--font-size-lg)', color:
              approvalStatus === 'APPROVED' ? '#065f46' :
              approvalStatus === 'REJECTED' ? '#991b1b' : '#92400e',
            }}>
              {approvalStatus === 'APPROVED' ? 'Approved' :
               approvalStatus === 'REJECTED' ? 'Rejected' : 'Human Approval Required'}
            </div>
            <div style={{ fontSize: 'var(--font-size-sm)', color: '#92400e', marginTop: 2 }}>
              {approvalStatus === 'PENDING'
                ? 'AI has prepared recommendations. Review and approve or reject before any external action is taken.'
                : approval?.comments || ''}
            </div>
          </div>
        </div>
      </div>

      {error && <ErrorBanner message={error} style={{ marginBottom: 12 }} />}

      {approvalStatus === 'PENDING' && (
        <div className="card">
          <div style={{ fontWeight: 700, marginBottom: 12 }}>Your Decision</div>
          <div className="input-group" style={{ marginBottom: 16 }}>
            <label className="input-label" htmlFor="approval-comments">Comments (optional)</label>
            <textarea
              id="approval-comments"
              className="input-field"
              rows={3}
              placeholder="Add any notes or context for this approval decision..."
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              style={{ resize: 'vertical' }}
            />
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <Button variant="primary" onClick={() => setApproveModal(true)}>✓ Approve</Button>
            <Button variant="danger" onClick={() => setRejectModal(true)}>✕ Reject</Button>
          </div>
        </div>
      )}

      {/* Approve confirmation modal */}
      <Modal
        open={approveModal}
        onClose={() => setApproveModal(false)}
        title="Confirm Approval"
        confirmLabel="Yes, Approve"
        confirmVariant="primary"
        onConfirm={handleApprove}
        loading={loading}
      >
        <p>Are you sure you want to <strong>approve</strong> this AI-generated recommendation?</p>
        <p style={{ marginTop: 8, color: 'var(--color-text-muted)' }}>
          This will mark the action as approved. No external messages will be sent automatically — your team will coordinate next steps.
        </p>
        {comments && <p style={{ marginTop: 8, fontStyle: 'italic', fontSize: 'var(--font-size-sm)' }}>Comments: "{comments}"</p>}
      </Modal>

      {/* Reject confirmation modal */}
      <Modal
        open={rejectModal}
        onClose={() => setRejectModal(false)}
        title="Confirm Rejection"
        confirmLabel="Yes, Reject"
        confirmVariant="danger"
        onConfirm={handleReject}
        loading={loading}
      >
        <p>Are you sure you want to <strong>reject</strong> this AI-generated recommendation?</p>
        <p style={{ marginTop: 8, color: 'var(--color-text-muted)' }}>
          You can regenerate the AI response or quotation after rejecting.
        </p>
        {comments && <p style={{ marginTop: 8, fontStyle: 'italic', fontSize: 'var(--font-size-sm)' }}>Comments: "{comments}"</p>}
      </Modal>
    </div>
  )
}

/* ── Main EnquiryDetail page ─────────────────────────────────── */
export default function EnquiryDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const [enquiry, setEnquiry] = useState(null)
  const [approval, setApproval] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // AI action loading states
  const [analyzing, setAnalyzing] = useState(false)
  const [genResponse, setGenResponse] = useState(false)
  const [genQuotation, setGenQuotation] = useState(false)
  const [genFollowups, setGenFollowups] = useState(false)
  const [actionError, setActionError] = useState('')

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const [enqData, approvalData] = await Promise.allSettled([
        enquiryService.get(id),
        enquiryService.getApproval(id),
      ])
      if (enqData.status === 'fulfilled') setEnquiry(enqData.value?.enquiry || enqData.value)
      if (approvalData.status === 'fulfilled') setApproval(approvalData.value?.approval || approvalData.value)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally { setLoading(false) }
  }, [id])

  useEffect(() => { load() }, [load])

  const runAction = async (label, setter, fn) => {
    setter(true); setActionError('')
    try {
      await fn()
      await load() // Refresh enquiry after action
    } catch (err) {
      setActionError(`${label} failed: ${getErrorMessage(err)}`)
    } finally { setter(false) }
  }

  if (loading) return (
    <div className="dashboard-layout">
      <div className={sidebarOpen ? 'sidebar open' : 'sidebar'}><Sidebar onClose={() => setSidebarOpen(false)} /></div>
      <main className="dashboard-main">
        <header className="dashboard-header">
          <div className="dashboard-header-left">
            <button className="mobile-menu-btn" onClick={() => setSidebarOpen((v) => !v)}>☰</button>
            <div className="dashboard-header-title">Enquiry Details</div>
          </div>
        </header>
        <div className="dashboard-content"><Loading text="Loading enquiry…" /></div>
      </main>
    </div>
  )

  if (error) return (
    <div className="dashboard-layout">
      <div className={sidebarOpen ? 'sidebar open' : 'sidebar'}><Sidebar onClose={() => setSidebarOpen(false)} /></div>
      <main className="dashboard-main">
        <header className="dashboard-header">
          <div className="dashboard-header-left">
            <button className="mobile-menu-btn" onClick={() => setSidebarOpen((v) => !v)}>☰</button>
            <div className="dashboard-header-title">Enquiry Details</div>
          </div>
        </header>
        <div className="dashboard-content"><ErrorBanner message={error} onRetry={load} /></div>
      </main>
    </div>
  )

  const status = (enquiry?.status || 'NEW').toUpperCase()
  const analysis = enquiry?.analysis || enquiry?.aiAnalysis
  const generatedResponse = enquiry?.generatedResponse || enquiry?.aiResponse
  const generatedQuotation = enquiry?.generatedQuotation || enquiry?.quotation?.content || enquiry?.quotation?.description

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
              <div className="dashboard-header-title">Enquiry #{id.slice(0, 8)}</div>
              <div className="dashboard-header-sub">{enquiry?.customer || 'Customer Enquiry'}</div>
            </div>
          </div>
          <div className="dashboard-header-right">
            <Button variant="ghost" size="sm" onClick={() => navigate('/enquiries')}>← Back</Button>
            <Button variant="ghost" size="sm" onClick={load}>↻ Refresh</Button>
          </div>
        </header>

        <div className="dashboard-content" style={{ maxWidth: 900, margin: '0 auto' }}>
          {/* Workflow Progress */}
          <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
            <div style={{ fontWeight: 700, marginBottom: 16 }}>Workflow Progress</div>
            <WorkflowStatus status={status} />
          </div>

          {/* Action error */}
          {actionError && <ErrorBanner message={actionError} style={{ marginBottom: 16 }} />}

          {/* Enquiry content */}
          <div className="card" style={{ marginBottom: 'var(--space-4)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ fontWeight: 700, fontSize: 'var(--font-size-lg)' }}>Customer Enquiry</div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <PriorityBadge priority={(enquiry?.priority || 'MEDIUM').toLowerCase()} />
                <StatusBadge status={status.toLowerCase().replace(/ /g, '_')} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)', marginBottom: 16, fontSize: 'var(--font-size-sm)' }}>
              <div><span style={{ color: 'var(--color-text-muted)' }}>Customer:</span> <strong>{enquiry?.customer || '—'}</strong></div>
              <div><span style={{ color: 'var(--color-text-muted)' }}>Created:</span> {fmtDate(enquiry?.createdAt)}</div>
              <div><span style={{ color: 'var(--color-text-muted)' }}>Source:</span> {enquiry?.sourceType || 'TEXT'}</div>
              <div><span style={{ color: 'var(--color-text-muted)' }}>Updated:</span> {fmtDate(enquiry?.updatedAt)}</div>
            </div>
            <div style={{
              background: 'var(--color-bg)', border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)', padding: 'var(--space-4)',
              fontSize: 'var(--font-size-sm)', lineHeight: 1.8, whiteSpace: 'pre-wrap',
              color: 'var(--color-text)',
            }}>
              {enquiry?.content || 'No content available.'}
            </div>

            {/* Analyze button */}
            {(status === 'NEW' || status === 'REVIEW') && (
              <div style={{ marginTop: 16 }}>
                <Button
                  variant="primary"
                  loading={analyzing}
                  disabled={analyzing}
                  onClick={() => runAction('Analysis', setAnalyzing, () => enquiryService.analyze(id))}
                >
                  {analyzing ? 'AI is analyzing…' : '🔍 Analyze with AI'}
                </Button>
                {status === 'REVIEW' && <span style={{ marginLeft: 12, fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>Re-analyze to refresh results</span>}
              </div>
            )}
          </div>

          {/* AI Analysis Results */}
          {analyzing && (
            <div className="card" style={{ marginBottom: 'var(--space-4)', textAlign: 'center' }}>
              <Loading text="AI is analyzing this enquiry…" />
              <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', marginTop: 8 }}>
                Extracting requirements, detecting missing information, and classifying priority…
              </p>
            </div>
          )}

          {analysis && !analyzing && (
            <div style={{ marginBottom: 'var(--space-4)' }}>
              <div style={{ fontWeight: 700, marginBottom: 12, fontSize: 'var(--font-size-base)' }}>🤖 AI Analysis Results</div>
              <AnalysisCard analysis={analysis} />
            </div>
          )}

          {/* AI Response Generation */}
          {(analysis || status !== 'NEW') && (
            <div style={{ marginBottom: 'var(--space-4)' }}>
              {!generatedResponse && !genResponse && (
                <Button
                  variant="outline"
                  loading={genResponse}
                  disabled={genResponse}
                  onClick={() => runAction('Response generation', setGenResponse, () => enquiryService.generateResponse(id))}
                  style={{ marginBottom: 12 }}
                >
                  ✍️ Generate AI Response
                </Button>
              )}
              <DraftCard
                title="AI-Generated Response"
                icon="✍️"
                content={generatedResponse}
                loading={genResponse}
                onRegenerate={() => runAction('Response regeneration', setGenResponse, () => enquiryService.generateResponse(id))}
              />
            </div>
          )}

          {/* AI Quotation Generation */}
          {(analysis || status !== 'NEW') && (
            <div style={{ marginBottom: 'var(--space-4)' }}>
              {!generatedQuotation && !genQuotation && (
                <Button
                  variant="outline"
                  loading={genQuotation}
                  disabled={genQuotation}
                  onClick={() => runAction('Quotation generation', setGenQuotation, () => enquiryService.generateQuotation(id))}
                  style={{ marginBottom: 12 }}
                >
                  📄 Generate Quotation
                </Button>
              )}
              <DraftCard
                title="AI-Generated Quotation"
                icon="📄"
                content={generatedQuotation}
                loading={genQuotation}
                onRegenerate={() => runAction('Quotation regeneration', setGenQuotation, () => enquiryService.generateQuotation(id))}
              />
            </div>
          )}

          {/* Follow-ups generation */}
          {(generatedResponse || generatedQuotation) && (
            <div style={{ marginBottom: 'var(--space-4)' }}>
              <Button
                variant="ghost"
                size="sm"
                loading={genFollowups}
                disabled={genFollowups}
                onClick={() => runAction('Follow-up generation', setGenFollowups, () => enquiryService.generateFollowups(id))}
              >
                🔔 {genFollowups ? 'Generating follow-ups…' : 'Generate Follow-up Tasks'}
              </Button>
            </div>
          )}

          {/* HUMAN APPROVAL SECTION */}
          {(generatedResponse || generatedQuotation || status === 'PENDING_APPROVAL') && (
            <div style={{ marginBottom: 'var(--space-4)' }}>
              <div style={{ fontWeight: 700, marginBottom: 12, fontSize: 'var(--font-size-base)' }}>
                ✅ Human Approval
              </div>
              <ApprovalSection enquiryId={id} approval={approval} onApproved={load} />
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
