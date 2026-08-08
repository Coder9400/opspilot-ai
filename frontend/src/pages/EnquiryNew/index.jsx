import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../../components/Sidebar'
import Button from '../../components/Button'
import ErrorBanner from '../../components/ErrorBanner'
import { enquiryService } from '../../services/enquiry.service'
import { getErrorMessage } from '../../utils/errorHandler'

export default function EnquiryNew() {
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [content, setContent] = useState('')
  const [customer, setCustomer] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!content.trim()) return

    setLoading(true); setError('')
    try {
      const enquiry = await enquiryService.create({
        sourceType: 'TEXT',
        content: content.trim(),
        customer: customer.trim() || undefined,
      })
      navigate(`/enquiries/${enquiry.id || enquiry.enquiry?.id}`)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally { setLoading(false) }
  }

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
              <div className="dashboard-header-title">New Enquiry</div>
              <div className="dashboard-header-sub">Submit a customer enquiry for AI analysis</div>
            </div>
          </div>
          <div className="dashboard-header-right">
            <Button variant="ghost" size="sm" onClick={() => navigate('/enquiries')}>← Back</Button>
          </div>
        </header>

        <div className="dashboard-content" style={{ maxWidth: 720, margin: '0 auto' }}>
          {/* Info banner */}
          <div style={{
            background: 'var(--color-primary-soft)',
            border: '1px solid var(--color-primary-light)',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--space-5)',
            marginBottom: 'var(--space-6)',
            display: 'flex', alignItems: 'flex-start', gap: 12,
          }}>
            <span style={{ fontSize: '1.4rem' }}>🤖</span>
            <div>
              <div style={{ fontWeight: 700, color: 'var(--color-primary-dark)', marginBottom: 4 }}>
                AI-Powered Analysis
              </div>
              <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-primary-dark)', lineHeight: 1.6 }}>
                After submission, use <strong>Analyze with AI</strong> to extract requirements,
                detect missing information, classify priority, and generate a response and quotation.
                <strong> Nothing is sent externally without your approval.</strong>
              </p>
            </div>
          </div>

          <div className="card">
            <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700, marginBottom: 4 }}>
              Customer Enquiry
            </h2>
            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-5)' }}>
              Paste or type the full customer enquiry. Include as much context as possible for better AI analysis.
            </p>

            {error && <ErrorBanner message={error} style={{ marginBottom: 16 }} />}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div className="input-group">
                <label className="input-label" htmlFor="enq-customer">Customer / Company name</label>
                <input
                  id="enq-customer"
                  className="input-field"
                  type="text"
                  placeholder="e.g. Acme Corp or John Smith"
                  value={customer}
                  onChange={(e) => setCustomer(e.target.value)}
                />
              </div>

              <div className="input-group">
                <label className="input-label" htmlFor="enq-content">
                  Enquiry text <span className="required">*</span>
                </label>
                <textarea
                  id="enq-content"
                  className="input-field"
                  rows={10}
                  placeholder="Paste or type the customer's enquiry here...&#10;&#10;Example: We are looking for a custom ERP system for our retail chain of 12 stores. We need inventory management, POS integration, and a reporting dashboard. Budget is flexible. Timeline is 6 months ideally."
                  style={{ resize: 'vertical', lineHeight: 1.7 }}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  required
                  aria-describedby="enq-content-hint"
                />
                <span id="enq-content-hint" className="input-hint">
                  {content.length} characters · The more detail, the better the AI analysis.
                </span>
              </div>

              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <Button variant="ghost" onClick={() => navigate('/enquiries')} disabled={loading}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" loading={loading} disabled={loading || !content.trim()}>
                  {loading ? 'Creating enquiry…' : 'Submit Enquiry'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  )
}
