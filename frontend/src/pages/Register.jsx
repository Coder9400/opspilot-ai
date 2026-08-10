import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Input from '../components/Input'
import Button from '../components/Button'
import { useAuth } from '../hooks/useAuth'
import { getErrorMessage } from '../utils/errorHandler'

// ─── Step Indicators ──────────────────────────────────────────────────────────

function StepIndicator({ current, total }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 28 }}>
      {Array.from({ length: total }, (_, i) => {
        const step = i + 1
        const done = step < current
        const active = step === current
        return (
          <div key={step} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%', display: 'flex',
              alignItems: 'center', justifyContent: 'center', fontSize: 12,
              fontWeight: 600, transition: 'all 0.2s',
              background: done ? 'var(--color-primary)' : active ? 'var(--color-primary)' : 'var(--color-border)',
              color: done || active ? '#fff' : 'var(--color-text-muted)',
            }}>
              {done ? '✓' : step}
            </div>
            {step < total && (
              <div style={{
                width: 32, height: 2,
                background: done ? 'var(--color-primary)' : 'var(--color-border)',
                transition: 'background 0.3s',
              }} />
            )}
          </div>
        )
      })}
      <span style={{ marginLeft: 8, fontSize: 12, color: 'var(--color-text-muted)' }}>
        Step {current} of {total}
      </span>
    </div>
  )
}

// ─── Account Type Card ────────────────────────────────────────────────────────

function TypeCard({ type, icon, title, desc, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={() => onClick(type)}
      style={{
        width: '100%', padding: '20px 24px', borderRadius: 12,
        border: `2px solid ${selected ? 'var(--color-primary)' : 'var(--color-border)'}`,
        background: selected ? 'var(--color-primary-light, rgba(99,102,241,0.08))' : 'var(--color-surface, #fff)',
        cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s',
        display: 'flex', alignItems: 'flex-start', gap: 16,
        boxShadow: selected ? '0 0 0 3px rgba(99,102,241,0.15)' : 'none',
      }}
    >
      <div style={{
        width: 44, height: 44, borderRadius: 10, display: 'flex',
        alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0,
        background: selected ? 'var(--color-primary)' : 'var(--color-bg-alt, #f5f5f5)',
      }}>
        {icon}
      </div>
      <div>
        <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4, color: selected ? 'var(--color-primary)' : 'var(--color-text)' }}>
          {title}
        </div>
        <div style={{ fontSize: 13, color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
          {desc}
        </div>
      </div>
    </button>
  )
}

// ─── Validate helpers ─────────────────────────────────────────────────────────

function validateStep1(f) {
  const e = {}
  if (!f.fullName.trim()) e.fullName = 'Full name is required.'
  else if (f.fullName.trim().length < 2) e.fullName = 'Name must be at least 2 characters.'
  if (!f.email.trim()) e.email = 'Email address is required.'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) e.email = 'Please enter a valid email.'
  if (!f.password) e.password = 'Password is required.'
  else if (f.password.length < 8) e.password = 'Password must be at least 8 characters.'
  if (!f.confirmPassword) e.confirmPassword = 'Please confirm your password.'
  else if (f.password !== f.confirmPassword) e.confirmPassword = 'Passwords do not match.'
  return e
}

function validateStep3(f, type) {
  const e = {}
  if (!f.companyName.trim()) e.companyName = 'Company name is required.'
  if (type === 'SUPPLIER' && !f.businessCategory.trim()) e.businessCategory = 'Business category is required.'
  return e
}

// ─── Main Register Component ──────────────────────────────────────────────────

export default function Register() {
  const navigate = useNavigate()
  const { register, isAuthenticated } = useAuth()

  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard', { replace: true })
  }, [isAuthenticated, navigate])

  const [step, setStep] = useState(1) // 1 = personal, 2 = type, 3 = company
  const [companyType, setCompanyType] = useState('')

  const [step1, setStep1] = useState({ fullName: '', email: '', password: '', confirmPassword: '' })
  const [step3, setStep3] = useState({
    companyName: '', industry: '', businessCategory: '',
    serviceAreas: '', description: '', city: '', website: '',
  })

  const [errors, setErrors]     = useState({})
  const [formError, setFormError] = useState('')
  const [loading, setLoading]   = useState(false)

  const set1 = (key) => (e) => {
    setStep1((p) => ({ ...p, [key]: e.target.value }))
    if (errors[key]) setErrors((p) => ({ ...p, [key]: '' }))
    setFormError('')
  }

  const set3 = (key) => (e) => {
    setStep3((p) => ({ ...p, [key]: e.target.value }))
    if (errors[key]) setErrors((p) => ({ ...p, [key]: '' }))
    setFormError('')
  }

  // ── Step navigation ──────────────────────────────────────────────────────

  const handleStep1 = (e) => {
    e.preventDefault()
    const errs = validateStep1(step1)
    if (Object.keys(errs).length) { setErrors(errs); return }
    setErrors({})
    setStep(2)
  }

  const handleStep2 = (type) => {
    setCompanyType(type)
    setStep(3)
  }

  const handleBack = () => setStep((s) => s - 1)

  // ── Final submit ─────────────────────────────────────────────────────────

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validateStep3(step3, companyType)
    if (Object.keys(errs).length) { setErrors(errs); return }

    setLoading(true)
    setFormError('')

    try {
      await register({
        fullName:         step1.fullName,
        name:             step1.fullName,
        email:            step1.email,
        password:         step1.password,
        companyType,
        companyName:      step3.companyName,
        industry:         step3.industry,
        businessCategory: step3.businessCategory,
        serviceAreas:     step3.serviceAreas,
        description:      step3.description,
        city:             step3.city,
        website:          step3.website,
        country:          'India',
      })
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setFormError(getErrorMessage(err))
      setLoading(false)
    }
  }

  // ── Left panel copy by step ──────────────────────────────────────────────

  const leftContent = {
    1: {
      heading: 'Start your procurement journey',
      sub: 'Join the intelligent platform that connects buyers and suppliers seamlessly.',
      points: [
        { icon: '🤖', text: 'AI-powered requirement builder' },
        { icon: '🏭', text: 'Connect with verified suppliers' },
        { icon: '📊', text: 'Compare quotations intelligently' },
        { icon: '🔒', text: 'Secure, private, and reliable' },
      ],
    },
    2: {
      heading: 'Choose your role',
      sub: 'OPSPILOT serves both sides of the procurement equation.',
      points: [
        { icon: '🏗️', text: 'Customers: find and compare suppliers' },
        { icon: '🏭', text: 'Suppliers: receive relevant RFQs' },
        { icon: '📈', text: 'Both sides win with AI intelligence' },
        { icon: '🤝', text: 'Built for B2B procurement' },
      ],
    },
    3: {
      heading: companyType === 'SUPPLIER' ? 'Set up your supplier profile' : 'Tell us about your company',
      sub: companyType === 'SUPPLIER'
        ? 'Your profile helps us match you with the right procurement opportunities.'
        : 'Your company details help us find the right suppliers for your projects.',
      points: [
        { icon: '✅', text: 'One-time setup, permanent value' },
        { icon: '🎯', text: 'Better matching with complete info' },
        { icon: '📋', text: 'You can update this anytime' },
      ],
    },
  }

  const left = leftContent[step]

  return (
    <div className="auth-page">
      {/* Left panel */}
      <div className="auth-left">
        <div className="auth-left-content">
          <div className="auth-left-logo">
            <div className="logo-icon">OP</div>
            <div className="logo-text">OPSPILOT AI</div>
          </div>
          <h2 className="auth-left-heading">{left.heading}</h2>
          <p className="auth-left-sub">{left.sub}</p>
          <div className="auth-feature-list">
            {left.points.map((f) => (
              <div key={f.text} className="auth-feature-item">
                <div className="auth-feature-icon">{f.icon}</div>
                <span>{f.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="auth-right">
        <div className="auth-form-box">
          <StepIndicator current={step} total={3} />

          {formError && (
            <div className="form-error-banner" role="alert" style={{ marginBottom: 20 }}>
              ⚠️ {formError}
            </div>
          )}

          {/* ── Step 1: Personal Details ── */}
          {step === 1 && (
            <>
              <h1 className="auth-form-heading">Create your account</h1>
              <p className="auth-form-sub">Free to start. No credit card required.</p>
              <form className="auth-form" onSubmit={handleStep1} noValidate>
                <Input id="reg-fullname" label="Full name" placeholder="Jane Smith"
                  value={step1.fullName} onChange={set1('fullName')} error={errors.fullName} required autoComplete="name" />
                <Input id="reg-email" label="Work email" type="email" placeholder="you@company.com"
                  value={step1.email} onChange={set1('email')} error={errors.email} required autoComplete="email" />
                <Input id="reg-password" label="Password" showPasswordToggle placeholder="Min. 8 characters"
                  value={step1.password} onChange={set1('password')} error={errors.password}
                  hint={!errors.password ? 'At least 8 characters.' : undefined} required autoComplete="new-password" />
                <Input id="reg-confirm" label="Confirm password" showPasswordToggle placeholder="Repeat your password"
                  value={step1.confirmPassword} onChange={set1('confirmPassword')} error={errors.confirmPassword}
                  required autoComplete="new-password" />
                <Button type="submit" variant="primary" size="lg" fullWidth>
                  Continue →
                </Button>
              </form>
              <div className="auth-form-footer">
                Already have an account? <Link to="/login">Sign in</Link>
              </div>
            </>
          )}

          {/* ── Step 2: Account Type ── */}
          {step === 2 && (
            <>
              <h1 className="auth-form-heading">What best describes you?</h1>
              <p className="auth-form-sub">Choose your account type — you can only select one.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 8 }}>
                <TypeCard
                  type="CUSTOMER"
                  icon="🏗️"
                  title="I am a Buyer / Customer"
                  desc="I need to source materials, products, or services from suppliers. I want to create procurement requests and compare quotations."
                  selected={companyType === 'CUSTOMER'}
                  onClick={handleStep2}
                />
                <TypeCard
                  type="SUPPLIER"
                  icon="🏭"
                  title="I am a Supplier / Seller"
                  desc="I supply products or services to businesses. I want to receive procurement enquiries and submit quotations."
                  selected={companyType === 'SUPPLIER'}
                  onClick={handleStep2}
                />
              </div>
              <button
                type="button"
                onClick={handleBack}
                style={{ marginTop: 20, background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', fontSize: 14 }}
              >
                ← Back
              </button>
            </>
          )}

          {/* ── Step 3: Company Details ── */}
          {step === 3 && (
            <>
              <h1 className="auth-form-heading">
                {companyType === 'SUPPLIER' ? 'Your supplier details' : 'Your company details'}
              </h1>
              <p className="auth-form-sub">
                This helps us match you with the right {companyType === 'SUPPLIER' ? 'procurement opportunities' : 'suppliers'}.
              </p>
              <form className="auth-form" onSubmit={handleSubmit} noValidate>
                <Input id="reg-company" label="Company name" placeholder="Acme Construction Ltd"
                  value={step3.companyName} onChange={set3('companyName')} error={errors.companyName} required />

                {companyType === 'CUSTOMER' && (
                  <Input id="reg-industry" label="Industry" placeholder="e.g. Construction, Manufacturing, Real Estate"
                    value={step3.industry} onChange={set3('industry')} />
                )}

                {companyType === 'SUPPLIER' && (
                  <>
                    <Input id="reg-category" label="Business category" placeholder="e.g. Steel, Cement, Electrical"
                      value={step3.businessCategory} onChange={set3('businessCategory')} error={errors.businessCategory} required />
                    <Input id="reg-areas" label="Service areas" placeholder="e.g. Mumbai, Pune, Gujarat (comma-separated)"
                      value={step3.serviceAreas} onChange={set3('serviceAreas')} />
                    <div className="form-group">
                      <label className="form-label" htmlFor="reg-desc">Brief description</label>
                      <textarea
                        id="reg-desc"
                        className="form-input"
                        placeholder="What products or services do you offer?"
                        value={step3.description}
                        onChange={set3('description')}
                        rows={3}
                        style={{ resize: 'vertical', minHeight: 80 }}
                      />
                    </div>
                  </>
                )}

                <Input id="reg-city" label="City / Location" placeholder="e.g. Mumbai"
                  value={step3.city} onChange={set3('city')} />

                <Input id="reg-website" label="Website (optional)" type="url" placeholder="https://yourcompany.com"
                  value={step3.website} onChange={set3('website')} />

                <Button type="submit" variant="primary" size="lg" fullWidth loading={loading} disabled={loading}>
                  {loading ? 'Creating account…' : 'Create Account'}
                </Button>

                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textAlign: 'center', lineHeight: 1.6, marginTop: 8 }}>
                  By creating an account you agree to our{' '}
                  <a href="#" style={{ color: 'var(--color-primary)' }}>Terms of Service</a> and{' '}
                  <a href="#" style={{ color: 'var(--color-primary)' }}>Privacy Policy</a>.
                </p>
              </form>
              <button
                type="button"
                onClick={handleBack}
                style={{ marginTop: 12, background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', fontSize: 14 }}
              >
                ← Back
              </button>
            </>
          )}

          {step === 1 && (
            <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--color-border)', textAlign: 'center' }}>
              <Link to="/" style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>← Back to homepage</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
