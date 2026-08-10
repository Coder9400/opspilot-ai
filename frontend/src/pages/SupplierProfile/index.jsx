import { useState, useEffect, useCallback } from 'react'
import AppShell from '../../components/AppShell'
import Button from '../../components/Button'
import Input from '../../components/Input'
import Loading from '../../components/Loading'
import ErrorBanner from '../../components/ErrorBanner'
import { supplierService } from '../../services/supplier.service'
import { useAuth } from '../../hooks/useAuth'
import { getErrorMessage } from '../../utils/errorHandler'

const CATEGORIES = [
  'Steel & Metal', 'Cement & Concrete', 'Electrical', 'Plumbing & Sanitary',
  'Tiles & Flooring', 'Paints & Coatings', 'Timber & Woodwork', 'Glass & Glazing',
  'HVAC & Ventilation', 'Safety Equipment', 'Machinery & Equipment',
  'Chemicals & Solvents', 'Construction Equipment', 'IT & Electronics', 'Other',
]

function SuccessBanner({ message }) {
  return (
    <div style={{
      background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.3)',
      borderRadius: 10, padding: '12px 16px', marginBottom: 20, color: '#059669',
      display: 'flex', alignItems: 'center', gap: 8, fontSize: 14,
    }}>
      ✅ {message}
    </div>
  )
}

export default function SupplierProfile() {
  const { company, refreshCompany } = useAuth()

  const [profile,  setProfile]  = useState(null)
  const [loading,  setLoading]  = useState(true)
  const [saving,   setSaving]   = useState(false)
  const [error,    setError]    = useState('')
  const [success,  setSuccess]  = useState('')

  const [form, setForm] = useState({
    description: '', businessCategory: '',
    serviceAreas: '', capacity: '', deliveryInformation: '',
    certifications: '',
  })

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await supplierService.getProfile()
      const p = res?.profile || res
      setProfile(p)
      setForm({
        description:       p?.description || '',
        businessCategory:  p?.businessCategory || '',
        serviceAreas:      Array.isArray(p?.serviceAreas) ? p.serviceAreas.join(', ') : (p?.serviceAreas || ''),
        capacity:          p?.capacity || '',
        deliveryInformation: p?.deliveryInformation || '',
        certifications:    Array.isArray(p?.certifications) ? p.certifications.join(', ') : (p?.certifications || ''),
      })
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const set = (key) => (e) => {
    setForm((p) => ({ ...p, [key]: e.target.value }))
    setSuccess('')
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      await supplierService.updateProfile({
        description:         form.description || null,
        businessCategory:    form.businessCategory || null,
        serviceAreas:        form.serviceAreas || null,
        capacity:            form.capacity || null,
        deliveryInformation: form.deliveryInformation || null,
        certifications:      form.certifications || null,
      })
      setSuccess('Profile updated successfully.')
      await load()
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const completedFields = ['description', 'businessCategory', 'serviceAreas', 'capacity'].filter((k) => form[k]?.trim())
  const completion = Math.round((completedFields.length / 4) * 100)

  return (
    <AppShell>
      <div style={{ maxWidth: 680, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>Supplier Profile</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 14, marginTop: 4 }}>
            {company?.name && <strong>{company.name} · </strong>}
            Complete your profile to improve matching with buyers.
          </p>
        </div>

        {/* Completion bar */}
        <div style={{
          background: 'var(--color-surface, #fff)', borderRadius: 12, border: '1px solid var(--color-border)',
          padding: '16px 20px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 16,
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
              <span style={{ fontWeight: 500, color: 'var(--color-text)' }}>Profile completeness</span>
              <span style={{ color: completion >= 80 ? '#10b981' : 'var(--color-text-muted)', fontWeight: 600 }}>{completion}%</span>
            </div>
            <div style={{ height: 6, background: 'var(--color-border)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${completion}%`, background: completion >= 80 ? '#10b981' : 'var(--color-primary)', borderRadius: 3, transition: 'width 0.4s' }} />
            </div>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: 40 }}><Loading text="Loading profile…" /></div>
        ) : (
          <div style={{ background: 'var(--color-surface, #fff)', borderRadius: 16, border: '1px solid var(--color-border)', padding: '28px 32px' }}>
            {error   && <ErrorBanner message={error}   style={{ marginBottom: 20 }} />}
            {success && <SuccessBanner message={success} />}

            <form onSubmit={handleSubmit} noValidate>
              {/* Business category */}
              <div className="form-group">
                <label className="form-label" htmlFor="sp-category">Business category</label>
                <select id="sp-category" className="form-input" value={form.businessCategory} onChange={set('businessCategory')}>
                  <option value="">Select a category…</option>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {/* Description */}
              <div className="form-group">
                <label className="form-label" htmlFor="sp-desc">
                  Company description
                  <span style={{ fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 400, marginLeft: 6 }}>
                    Tell buyers what you supply and your strengths
                  </span>
                </label>
                <textarea
                  id="sp-desc"
                  className="form-input"
                  placeholder="Describe your company, what you supply, years of experience, key strengths…"
                  value={form.description}
                  onChange={set('description')}
                  rows={4}
                  style={{ resize: 'vertical', minHeight: 100 }}
                />
              </div>

              {/* Service areas */}
              <Input
                id="sp-areas"
                label="Service areas"
                placeholder="e.g. Mumbai, Pune, Nashik, Gujarat (comma-separated)"
                value={form.serviceAreas}
                onChange={set('serviceAreas')}
                hint="The regions / cities where you can supply or deliver."
              />

              {/* Certifications */}
              <Input
                id="sp-cert"
                label="Certifications (optional)"
                placeholder="e.g. ISO 9001, BIS, CE (comma-separated)"
                value={form.certifications}
                onChange={set('certifications')}
              />

              {/* Capacity */}
              <Input
                id="sp-capacity"
                label="Supply capacity"
                placeholder="e.g. Up to 500 MT/month"
                value={form.capacity}
                onChange={set('capacity')}
              />

              {/* Delivery */}
              <div className="form-group">
                <label className="form-label" htmlFor="sp-delivery">Delivery information</label>
                <textarea
                  id="sp-delivery"
                  className="form-input"
                  placeholder="Typical lead time, delivery method, minimum order quantity…"
                  value={form.deliveryInformation}
                  onChange={set('deliveryInformation')}
                  rows={2}
                  style={{ resize: 'vertical' }}
                />
              </div>

              <Button type="submit" variant="primary" loading={saving} disabled={saving}>
                {saving ? 'Saving…' : 'Save Profile'}
              </Button>
            </form>
          </div>
        )}
      </div>
    </AppShell>
  )
}
