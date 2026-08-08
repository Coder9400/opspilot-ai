import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import AppShell from '../../components/AppShell'
import Button from '../../components/Button'
import { StatusBadge, PriorityBadge } from '../../components/Badge'
import Loading from '../../components/Loading'
import ErrorBanner from '../../components/ErrorBanner'
import EmptyState from '../../components/EmptyState'
import Modal from '../../components/Modal'
import { followupService } from '../../services/followup.service'
import { getErrorMessage } from '../../utils/errorHandler'

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'

export default function FollowUps() {
  const navigate = useNavigate()
  const [followups, setFollowups] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updating, setUpdating] = useState(null)
  const [confirmId, setConfirmId] = useState(null)

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const data = await followupService.list()
      setFollowups(Array.isArray(data) ? data : data.followups || data.followUps || data.data?.followUps || [])
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

  const initials = (name) => (name || '?').slice(0, 2).toUpperCase()

  return (
    <AppShell>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Follow-ups</h1>
          <p className="page-subtitle">Track and complete AI-generated follow-up tasks.</p>
        </div>
        <div className="page-header-right">
          <Button variant="outline" size="sm" onClick={load}>↻ Refresh</Button>
        </div>
      </div>

      <div className="dash-grid" style={{ marginBottom: 'var(--sp-6)' }}>
        <div className="metric-card">
          <div className="metric-card-label">Pending Tasks</div>
          <div className="metric-card-value" style={{ color: 'var(--indigo-600)' }}>{pending.length}</div>
        </div>
        <div className="metric-card">
          <div className="metric-card-label">Completed</div>
          <div className="metric-card-value">{completed.length}</div>
        </div>
      </div>

      {error && <ErrorBanner message={error} onRetry={load} style={{ marginBottom: 16 }} />}

      {loading ? (
        <Loading text="Loading tasks…" />
      ) : followups.length === 0 ? (
        <EmptyState
          icon="🔔"
          title="No follow-ups yet"
          description="Follow-ups are generated from enquiries by AI. Analyze an enquiry and generate follow-up tasks."
          actionLabel="View Enquiries"
          onAction={() => navigate('/enquiries')}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-6)' }}>
          {/* Pending */}
          {pending.length > 0 && (
            <div>
              <div style={{ fontSize: 'var(--fs-md)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 'var(--sp-3)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>⏳</span> Pending ({pending.length})
              </div>
              <div className="followup-list">
                {pending.map((fu) => (
                  <div key={fu.id} className="followup-item">
                    <div className="followup-item-left">
                      <div className="followup-title">{fu.task || fu.title || fu.description || 'Follow-up task'}</div>
                      <div className="followup-desc" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-body)' }}>{fu.customer || fu.enquiry?.customerName || fu.enquiry?.customer || 'Customer'}</span>
                        {fu.enquiryId && (
                          <span style={{ cursor: 'pointer', color: 'var(--indigo-500)', fontWeight: 600 }} onClick={() => navigate(`/enquiries/${fu.enquiryId}`)}>· View Enquiry</span>
                        )}
                      </div>
                      <div className="followup-meta">
                        <span className="followup-due">📅 Due: {fmtDate(fu.dueDate)}</span>
                        <PriorityBadge priority={fu.priority || 'medium'} />
                        <StatusBadge status="pending" />
                      </div>
                    </div>
                    <button
                      className="followup-done-btn"
                      onClick={() => setConfirmId(fu.id)}
                      disabled={updating === fu.id}
                    >
                      {updating === fu.id ? '…' : '✓ Complete'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Completed */}
          {completed.length > 0 && (
            <div>
              <div style={{ fontSize: 'var(--fs-md)', fontWeight: 700, color: 'var(--green-600)', marginBottom: 'var(--sp-3)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>✅</span> Completed ({completed.length})
              </div>
              <div className="followup-list">
                {completed.map((fu) => (
                  <div key={fu.id} className="followup-item done">
                    <div className="followup-item-left">
                      <div className="followup-title done">{fu.task || fu.title || fu.description || 'Follow-up task'}</div>
                      <div className="followup-desc">
                        {fu.customer || fu.enquiry?.customerName || fu.enquiry?.customer || 'Customer'}
                      </div>
                      <div className="followup-meta">
                        <span className="followup-due">Completed</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Confirmation modal */}
      <Modal
        open={!!confirmId}
        onClose={() => setConfirmId(null)}
        title="Mark Task Complete"
        confirmLabel="Mark Complete"
        confirmVariant="primary"
        onConfirm={() => markComplete(confirmId)}
        loading={updating === confirmId}
      >
        <p>Are you sure you want to mark this follow-up task as completed?</p>
        <p style={{ marginTop: 8, fontSize: 'var(--fs-sm)', color: 'var(--text-muted)' }}>This action will update the status in the backend.</p>
      </Modal>
    </AppShell>
  )
}
