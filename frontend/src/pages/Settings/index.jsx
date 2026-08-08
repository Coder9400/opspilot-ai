import { useState, useEffect } from 'react'
import { companyService } from '../../services/company.service'

export default function Settings() {
  const [tab, setTab] = useState('company')
  const [company, setCompany] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '', website: '' })

  useEffect(() => {
    const load = async () => {
      try {
        const data = await companyService.get()
        const c = data.company
        setCompany(c)
        setForm({
          name: c.name || '',
          email: c.email || '',
          phone: c.phone || '',
          address: c.address || '',
          website: c.website || '',
        })
      } catch (err) {
        setMessage({ type: 'error', text: err.message })
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setMessage(null)
    try {
      const result = await companyService.update(form)
      setCompany(result.company)
      setMessage({ type: 'success', text: '✓ Company profile updated successfully.' })
    } catch (err) {
      setMessage({ type: 'error', text: err.message })
    } finally {
      setSaving(false)
    }
  }

  const tabs = [
    { key: 'company', label: '🏢 Company Profile' },
    { key: 'integrations', label: '🔌 Integrations' },
  ]

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Manage your company profile and integrations</p>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div style={{ display: 'flex', gap: '0', borderBottom: '2px solid var(--border-color)', marginBottom: '2rem' }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{
              padding: '0.75rem 1.5rem', background: 'none', border: 'none', cursor: 'pointer',
              borderBottom: tab === t.key ? '2px solid var(--accent-blue)' : '2px solid transparent',
              color: tab === t.key ? 'var(--accent-blue)' : 'var(--text-muted)',
              fontWeight: tab === t.key ? 600 : 400, fontSize: '0.95rem', marginBottom: '-2px',
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Company Profile Tab ── */}
      {tab === 'company' && (
        <>
          {loading ? (
            <div className="loading-state"><div className="spinner" /></div>
          ) : (
            <div className="card" style={{ maxWidth: '600px' }}>
              <h3 style={{ marginTop: 0 }}>Company Profile</h3>
              {message && <div className={`alert alert-${message.type}`} style={{ marginBottom: '1rem' }}>{message.text}</div>}
              <form onSubmit={handleSave}>
                <div className="form-group">
                  <label className="form-label">Company Name <span style={{ color: 'var(--accent-red)' }}>*</span></label>
                  <input className="form-input" required value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="TechSolutions Ltd" />
                </div>
                <div className="form-group">
                  <label className="form-label">Business Email</label>
                  <input type="email" className="form-input" value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="hello@company.com" />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input className="form-input" value={form.phone}
                    onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+91 98765 43210" />
                </div>
                <div className="form-group">
                  <label className="form-label">Address</label>
                  <textarea className="form-input" rows={2} value={form.address}
                    onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="123 Business Park, Mumbai, MH 400001" />
                </div>
                <div className="form-group">
                  <label className="form-label">Website</label>
                  <input className="form-input" value={form.website}
                    onChange={e => setForm(f => ({ ...f, website: e.target.value }))} placeholder="https://www.company.com" />
                </div>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </form>
            </div>
          )}
        </>
      )}

      {/* ── Integrations Tab ── */}
      {tab === 'integrations' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '700px' }}>
          {/* Gmail card */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '2rem' }}>📧</span>
                <div>
                  <h3 style={{ margin: 0 }}>Gmail Integration</h3>
                  <p style={{ margin: '0.25rem 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    Connect your Gmail to automatically detect and import quotation PDFs from your inbox.
                  </p>
                </div>
              </div>
              <span className="badge badge-pending">Not Connected</span>
            </div>

            <div style={{ marginTop: '1.25rem', padding: '1rem', background: 'var(--bg-tertiary)', borderRadius: '8px', fontSize: '0.875rem' }}>
              <p style={{ margin: '0 0 0.75rem', fontWeight: 600 }}>📋 To connect Gmail:</p>
              <ol style={{ margin: 0, padding: '0 0 0 1.25rem', lineHeight: 1.7 }}>
                <li>Go to <a href="https://console.cloud.google.com" target="_blank" rel="noreferrer" style={{ color: 'var(--accent-blue)' }}>console.cloud.google.com</a></li>
                <li>Create a project → Enable Gmail API</li>
                <li>Create OAuth 2.0 credentials (Web application)</li>
                <li>Set redirect URI: <code style={{ background: 'var(--bg-primary)', padding: '2px 6px', borderRadius: '4px' }}>http://localhost:5000/api/integrations/gmail/callback</code></li>
                <li>Add <code style={{ background: 'var(--bg-primary)', padding: '2px 6px', borderRadius: '4px' }}>GOOGLE_CLIENT_ID</code> and <code style={{ background: 'var(--bg-primary)', padding: '2px 6px', borderRadius: '4px' }}>GOOGLE_CLIENT_SECRET</code> to your <code>.env</code></li>
              </ol>
              <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: 'var(--bg-primary)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                <strong>💡 Alternative (works now):</strong> Use "Upload PDF Quotation" in the Received Quotations page to import quotation PDFs directly — no Gmail needed!
              </div>
            </div>

            <div style={{ marginTop: '1rem' }}>
              <button className="btn btn-secondary" disabled style={{ opacity: 0.5, cursor: 'not-allowed' }}>
                Connect Gmail (requires Google OAuth credentials)
              </button>
            </div>
          </div>

          {/* PDF Upload card */}
          <div className="card" style={{ borderLeft: '4px solid var(--accent-green)' }}>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '2rem' }}>📄</span>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <h3 style={{ margin: 0 }}>Manual PDF Upload</h3>
                  <span className="badge badge-success">Active</span>
                </div>
                <p style={{ margin: '0.25rem 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  Upload PDF quotations directly. Mistral AI extracts all supplier details, line items, pricing, and totals automatically.
                </p>
              </div>
            </div>
            <div style={{ marginTop: '1rem' }}>
              <a href="/received-quotations" className="btn btn-primary">
                → Go to Received Quotations
              </a>
            </div>
          </div>

          {/* Mistral AI status card */}
          <div className="card">
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '2rem' }}>🤖</span>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <h3 style={{ margin: 0 }}>Mistral AI</h3>
                  <span className="badge badge-success">Connected</span>
                </div>
                <p style={{ margin: '0.25rem 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  Powering enquiry analysis, quotation generation, follow-up tasks, and PDF quotation extraction.
                  Model: <code>mistral-small-latest</code>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
