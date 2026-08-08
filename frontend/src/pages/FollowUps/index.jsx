import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../../components/Sidebar'
import Button from '../../components/Button'
import Loading from '../../components/Loading'
import ErrorBanner from '../../components/ErrorBanner'
import EmptyState from '../../components/EmptyState'
import Modal from '../../components/Modal'
import { followupService } from '../../services/followup.service'
import { getErrorMessage } from '../../utils/errorHandler'

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'

function statusColor(status) {
  if (!status) return 'var(--color-text-muted)'
  const s = status.toUpperCase()
  if (s === 'COMPLETED') return 'var(--color-success)'
  if (s === 'CANCELLED') return 'var(--color-danger)'
  return 'var(--color-warning)'
}

export default function FollowUps() {
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [followups, setFollowups] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updating, setUpdating] = useState(null)
  const [confirmId, setConfirmId] = useState(null)

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const data = await followupService.list()
      setFollowups(Array.isArray(data) ? data : data.followups || [])
    } catch (err) {
      setError(getErrorMessage(err))
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const markComplete = async (id) => {
    setUpdating(id)
    try {
      await followupService.update(id, { status: 'COMPLETED' })
      setFollowups((prev) => prev.map((f) => f.id === id ? { ...f, status: 'COMPLETED' } : f))
    } catch (err) {
      setError(getErrorMessage(err))
    } finally { setUpdating(null); setConfirmId(null) }
  }

  const pending = followups.filter((f) => (f.status || '').toUpperCase() !== 'COMPLETED')
  const completed = followups.filter((f) => (f.status || '').toUpperCase() === 'COMPLETED')

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
              <div className="dashboard-header-title">Follow-ups</div>
              <div className="dashboard-header-sub">{pending.length} pending · {completed.length} completed</div>
            </div>
          </div>
          <div className="dashboard-header-right">
            <Button variant="ghost" size="sm" onClick={load}>↻ Refresh</Button>
          </div>
        </header>

        <div className="dashboard-content">
          {error && <ErrorBanner message={error} onRetry={load} style={{ marginBottom: 16 }} />}

          {loading ? (
            <Loading text="Loading follow-ups…" />
          ) : followups.length === 0 ? (
            <EmptyState
              icon="🔔"
              title="No follow-ups yet"
              message="Follow-ups are generated from enquiries by AI. Analyze an enquiry and generate follow-up tasks."
              action={{ label: '+ New Enquiry', onClick: () => navigate('/enquiries/new') }}
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
              {/* Pending */}
              {pending.length > 0 && (
                <div>
                  <div style={{ fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span>⏳</span> Pending ({pending.length})
                  </div>
                  <div className="followups-list">
                    {pending.map((fu) => (
                      <div key={fu.id} className="followup-item">
                        <div className="followup-left">
                          <div className="followup-company">{fu.customer || fu.enquiry?.customer || 'Customer'}</div>
                          <div className="followup-subject">{fu.task || fu.description || 'Follow-up task'}</div>
                          <div className="followup-due today">
                            📅 Due: {fmtDate(fu.dueDate)}
                            <span style={{ marginLeft: 8, color: statusColor(fu.status), fontWeight: 600 }}>
                              · {fu.status || 'PENDING'}
                            </span>
                          </div>
                          {fu.enquiryId && (
                            <button
                              onClick={() => navigate(`/enquiries/${fu.enquiryId}`)}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 'var(--font-size-xs)', color: 'var(--color-primary)', padding: '4px 0', marginTop: 4 }}
                            >
                              View enquiry →
                            </button>
                          )}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginLeft: 8, flexShrink: 0 }}>
                          <button
                            className="enq-action-btn"
                            onClick={() => setConfirmId(fu.id)}
                            disabled={updating === fu.id}
                          >
                            {updating === fu.id ? '…' : '✓ Complete'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Completed */}
              {completed.length > 0 && (
                <div>
                  <div style={{ fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--color-success)' }}>
                    <span>✅</span> Completed ({completed.length})
                  </div>
                  <div className="followups-list">
                    {completed.map((fu) => (
                      <div key={fu.id} className="followup-item" style={{ opacity: 0.65 }}>
                        <div className="followup-left">
                          <div className="followup-company">{fu.customer || fu.enquiry?.customer || 'Customer'}</div>
                          <div className="followup-subject" style={{ textDecoration: 'line-through' }}>
                            {fu.task || fu.description || 'Follow-up task'}
                          </div>
                          <div className="followup-due upcoming">
                            ✅ Completed · Due was {fmtDate(fu.dueDate)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Mark complete confirmation modal */}
      <Modal
        open={!!confirmId}
        onClose={() => setConfirmId(null)}
        title="Mark as Complete"
        confirmLabel="Mark Complete"
        confirmVariant="primary"
        onConfirm={() => markComplete(confirmId)}
        loading={updating === confirmId}
      >
        <p>Are you sure you want to mark this follow-up as <strong>completed</strong>?</p>
        <p style={{ marginTop: 8, color: 'var(--color-text-muted)' }}>This action will update the status in the backend.</p>
      </Modal>
    </div>
  )
}
