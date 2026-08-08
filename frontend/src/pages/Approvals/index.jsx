import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import AppShell from '../../components/AppShell'
import Button from '../../components/Button'
import Loading from '../../components/Loading'
import ErrorBanner from '../../components/ErrorBanner'
import EmptyState from '../../components/EmptyState'
import Modal from '../../components/Modal'
import { enquiryService } from '../../services/enquiry.service'
import { getErrorMessage } from '../../utils/errorHandler'

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'
const fmtCurrency = (v, cur = 'USD') => {
  if (v == null) return '—'
  try { return new Intl.NumberFormat('en-US', { style: 'currency', currency: cur, maximumFractionDigits: 0 }).format(v) } catch { return `${cur} ${v}` }
}

export default function Approvals() {
  const navigate = useNavigate()
  const [enquiries, setEnquiries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(null)
  
  const [confirmModal, setConfirmModal] = useState({ open: false, id: null, action: null })

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const data = await enquiryService.list()
      const all = data?.enquiries || data?.data?.enquiries || []
      setEnquiries(all.filter(e => e.status === 'PENDING_APPROVAL'))
    } catch (err) {
      setError(getErrorMessage(err))
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const handleAction = async () => {
    const { id, action } = confirmModal
    setBusy(id)
    try {
      if (action === 'approve') await enquiryService.approve(id)
      else if (action === 'reject') await enquiryService.reject(id)
      await load()
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setBusy(null)
      setConfirmModal({ open: false, id: null, action: null })
    }
  }

  return (
    <AppShell>
      <div className="page-header" style={{ marginBottom: 'var(--sp-5)' }}>
        <div className="page-header-left">
          <h1 className="page-title">Approval Center</h1>
          <p className="page-subtitle">Review AI-generated actions before they reach customers.</p>
        </div>
        <div className="page-header-right">
          <Button variant="outline" size="sm" onClick={load}>↻ Refresh</Button>
        </div>
      </div>

      {error && <ErrorBanner message={error} onRetry={load} style={{ marginBottom: 16 }} />}

      {loading ? (
        <Loading text="Loading pending approvals…" />
      ) : enquiries.length === 0 ? (
        <EmptyState
          icon="✅"
          title="All caught up"
          description="There are no AI workflows currently waiting for your approval."
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 'var(--sp-5)' }}>
          {enquiries.map(enq => {
            const hasResponse = !!enq.suggestedResponse
            const hasQuotation = !!enq.quotation
            
            return (
              <div key={enq.id} className="approval-center-card">
                <div className="approval-center-header">
                  <div>
                    <div className="approval-center-customer">{enq.customerName || 'Unknown Customer'}</div>
                    <div className="approval-center-action">Workflow prepared</div>
                  </div>
                  <div style={{ fontSize: 24 }}>✋</div>
                </div>
                
                <div className="approval-center-summary">
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>AI Generated:</div>
                  <ul style={{ paddingLeft: 20, listStyle: 'disc', color: 'var(--text-body)', display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {hasResponse && <li>Customer response drafted</li>}
                    {hasQuotation && <li>Quotation: {fmtCurrency(enq.quotation?.totalAmount, enq.currency)}</li>}
                    {enq.followUps?.length > 0 && <li>{enq.followUps.length} follow-up task(s)</li>}
                    {!hasResponse && !hasQuotation && !(enq.followUps?.length > 0) && <li>Basic workflow routing</li>}
                  </ul>
                </div>
                
                <div className="approval-center-footer">
                  <div className="approval-center-time">{fmtDate(enq.updatedAt || enq.createdAt)}</div>
                  <div className="approval-center-actions">
                    <Button variant="ghost" size="sm" onClick={() => navigate(`/enquiries/${enq.id}`)}>Review</Button>
                    <Button 
                      variant="primary" 
                      size="sm" 
                      onClick={() => setConfirmModal({ open: true, id: enq.id, action: 'approve' })}
                      disabled={busy === enq.id}
                    >
                      {busy === enq.id ? '…' : 'Approve'}
                    </Button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Confirmation Modal */}
      <Modal
        open={confirmModal.open}
        onClose={() => setConfirmModal({ open: false, id: null, action: null })}
        title={confirmModal.action === 'approve' ? 'Approve Workflow' : 'Reject Workflow'}
        confirmLabel={confirmModal.action === 'approve' ? 'Approve' : 'Reject'}
        confirmVariant={confirmModal.action === 'approve' ? 'primary' : 'danger'}
        onConfirm={handleAction}
        loading={!!busy}
      >
        <p>
          Are you sure you want to <strong>{confirmModal.action}</strong> the workflow for this enquiry? 
          {confirmModal.action === 'approve' && ' This will mark the workflow as approved.'}
        </p>
      </Modal>

    </AppShell>
  )
}
