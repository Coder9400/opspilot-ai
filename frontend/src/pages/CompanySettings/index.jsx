import { useState, useEffect, useCallback } from 'react'
import AppShell from '../../components/AppShell'
import Button from '../../components/Button'
import Input from '../../components/Input'
import Loading from '../../components/Loading'
import ErrorBanner from '../../components/ErrorBanner'
import { useAuth } from '../../hooks/useAuth'
import { companyService } from '../../services/company.service'
import { getErrorMessage } from '../../utils/errorHandler'

function SuccessBanner({ message }) {
  return (
    <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 10, padding: '12px 16px', marginBottom: 20, color: '#059669', display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
      ✅ {message}
    </div>
  )
}

export default function CompanySettings() {
  const { user, company, companyType, companyRole, refreshCompany } = useAuth()

  const [form,    setForm]    = useState({
    name: '', email: '', phone: '', address: '',
    city: '', state: '', country: '', website: '', industry: '',
  })
  const [loading,  setLoading]  = useState(true)
  const [saving,   setSaving]   = useState(false)
  const [error,    setError]    = useState('')
  const [success,  setSuccess]  = useState('')

  // Populate form from company when loaded
  useEffect(() => {
    if (company) {
      setForm({
        name:     company.name || '',
        email:    company.email || '',
        phone:    company.phone || '',
        address:  company.address || '',
        city:     company.city || '',
        state:    company.state || '',
        country:  company.country || 'India',
        website:  company.website || '',
        industry: company.industry || '',
      })
      setLoading(false)
    }
  }, [company])

  const set = (key) => (e) => {
    setForm((p) => ({ ...p, [key]: e.target.value }))
    setSuccess('')
    setError('')
  }

  const isOwnerOrAdmin = companyRole === 'owner' || companyRole === 'admin'

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) { setError('Company name is required.'); return }
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      await companyService.update({
        name:     form.name.trim(),
        email:    form.email || null,
        phone:    form.phone || null,
        address:  form.address || null,
        city:     form.city || null,
        state:    form.state || null,
        country:  form.country || null,
        website:  form.website || null,
        industry: form.industry || null,
      })
      await refreshCompany()
      setSuccess('Company profile updated successfully.')
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <AppShell>
      <div style={{ maxWidth: 680, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>Company Settings</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 14, marginTop: 4 }}>
            Manage your company profile and details.
          </p>
        </div>

        {/* Company Type & Role info */}
        <div style={{
          background: 'var(--color-surface, #fff)', borderRadius: 12, border: '1px solid var(--color-border)',
          padding: '16px 20px', marginBottom: 24, display: 'flex', gap: 24, flexWrap: 'wrap',
        }}>
          {[
            { label: 'Account type', value: companyType === 'CUSTOMER' ? '🏗️ Customer / Buyer' : companyType === 'SUPPLIER' ? '🏭 Supplier / Seller' : '—' },
            { label: 'Your role',    value: companyRole ? companyRole.charAt(0).toUpperCase() + companyRole.slice(1) : '—' },
            { label: 'Your email',   value: user?.email || '—' },
          ].map(({ label, value }) => (
            <div key={label}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{label}</div>
              <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text)' }}>{value}</div>
            </div>
          ))}
        </div>

        {/* Edit form */}
        <div style={{ background: 'var(--color-surface, #fff)', borderRadius: 16, border: '1px solid var(--color-border)', padding: '28px 32px' }}>
          <h2 style={{ fontSize: 17, fontWeight: 600, color: 'var(--color-text)', marginTop: 0, marginBottom: 20 }}>Company Profile</h2>

          {loading ? (
            <Loading text="Loading company details…" />
          ) : (
            <>
              {error   && <ErrorBanner message={error}   style={{ marginBottom: 20 }} />}
              {success && <SuccessBanner message={success} />}
              {!isOwnerOrAdmin && (
                <div style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 8, padding: '10px 14px', marginBottom: 20, fontSize: 13, color: '#92400e' }}>
                  ℹ️ Only company owners and admins can edit company details.
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate>
                <Input id="cs-name" label="Company name" value={form.name} onChange={set('name')} required disabled={!isOwnerOrAdmin} />
                <Input id="cs-email" label="Company email" type="email" placeholder="info@company.com" value={form.email} onChange={set('email')} disabled={!isOwnerOrAdmin} />

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <Input id="cs-phone" label="Phone" placeholder="+91 98765 43210" value={form.phone} onChange={set('phone')} disabled={!isOwnerOrAdmin} />
                  <Input id="cs-website" label="Website" type="url" placeholder="https://…" value={form.website} onChange={set('website')} disabled={!isOwnerOrAdmin} />
                </div>

                <Input id="cs-industry" label="Industry / Sector" placeholder="e.g. Construction, Real Estate, Manufacturing" value={form.industry} onChange={set('industry')} disabled={!isOwnerOrAdmin} />
                <Input id="cs-address" label="Address" placeholder="Street address" value={form.address} onChange={set('address')} disabled={!isOwnerOrAdmin} />

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                  <Input id="cs-city"    label="City"    placeholder="Mumbai"     value={form.city}    onChange={set('city')}    disabled={!isOwnerOrAdmin} />
                  <Input id="cs-state"   label="State"   placeholder="Maharashtra" value={form.state}   onChange={set('state')}   disabled={!isOwnerOrAdmin} />
                  <Input id="cs-country" label="Country" placeholder="India"       value={form.country} onChange={set('country')} disabled={!isOwnerOrAdmin} />
                </div>

                {isOwnerOrAdmin && (
                  <Button type="submit" variant="primary" loading={saving} disabled={saving} style={{ marginTop: 8 }}>
                    {saving ? 'Saving…' : 'Save Changes'}
                  </Button>
                )}
              </form>
            </>
          )}
        </div>
      </div>
    </AppShell>
  )
}
