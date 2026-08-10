import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Input from '../components/Input'
import Button from '../components/Button'
import { useAuth } from '../hooks/useAuth'
import { getErrorMessage } from '../utils/errorHandler'

const AUTH_FEATURES = [
  { icon: '🚀', text: 'Set up in under 5 minutes' },
  { icon: '🔒', text: 'Your data is encrypted and private' },
  { icon: '🤝', text: 'No credit card required to start' },
  { icon: '✅', text: 'Human approval on every AI action' },
]

function validate(fields) {
  const errs = {}
  if (!fields.fullName.trim()) errs.fullName = 'Full name is required.'
  else if (fields.fullName.trim().length < 2) errs.fullName = 'Name must be at least 2 characters.'
  if (!fields.businessName.trim()) errs.businessName = 'Business name is required.'
  if (!fields.email.trim()) errs.email = 'Email address is required.'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)) errs.email = 'Please enter a valid email address.'
  if (!fields.password) errs.password = 'Password is required.'
  else if (fields.password.length < 8) errs.password = 'Password must be at least 8 characters.'
  if (!fields.confirmPassword) errs.confirmPassword = 'Please confirm your password.'
  else if (fields.password !== fields.confirmPassword) errs.confirmPassword = 'Passwords do not match.'
  return errs
}

export default function Register() {
  const navigate = useNavigate()
  const { register, isAuthenticated } = useAuth()

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true })
    }
  }, [isAuthenticated, navigate])

  const [fields, setFields] = useState({ fullName: '', businessName: '', email: '', password: '', confirmPassword: '' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [formError, setFormError] = useState('')

  const set = (key) => (e) => {
    setFields((prev) => ({ ...prev, [key]: e.target.value }))
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: '' }))
    setFormError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate(fields)
    if (Object.keys(errs).length) { setErrors(errs); return }

    setLoading(true)
    setFormError('')

    try {
      await register({
        fullName: fields.fullName,
        name: fields.fullName,
        businessName: fields.businessName,
        email: fields.email,
        password: fields.password,
      })
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setFormError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      {/* Left panel */}
      <div className="auth-left">
        <div className="auth-left-content">
          <div className="auth-left-logo">
            <div className="logo-icon">OP</div>
            <div className="logo-text">OPSPILOT AI</div>
          </div>
          <h2 className="auth-left-heading">Start automating your workflow today</h2>
          <p className="auth-left-sub">
            Join small businesses processing enquiries faster and closing more deals with OPSPILOT AI.
          </p>
          <div className="auth-feature-list">
            {AUTH_FEATURES.map((f) => (
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
          <h1 className="auth-form-heading">Create your account</h1>
          <p className="auth-form-sub">Get started with OPSPILOT AI — free, no credit card required.</p>

          {formError && (
            <div className="form-error-banner" role="alert" style={{ marginBottom: 20 }}>
              ⚠️ {formError}
            </div>
          )}

          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            <Input id="reg-fullname" label="Full name" type="text" placeholder="Jane Smith"
              value={fields.fullName} onChange={set('fullName')} error={errors.fullName} required autoComplete="name" />
            <Input id="reg-business" label="Business / Company name" type="text" placeholder="Your Business Ltd"
              value={fields.businessName} onChange={set('businessName')} error={errors.businessName} required autoComplete="organization" />
            <Input id="reg-email" label="Work email" type="email" placeholder="you@company.com"
              value={fields.email} onChange={set('email')} error={errors.email} required autoComplete="email" />
            <Input id="reg-password" label="Password" showPasswordToggle placeholder="Min. 8 characters"
              value={fields.password} onChange={set('password')} error={errors.password}
              hint={!errors.password ? 'At least 8 characters.' : undefined} required autoComplete="new-password" />
            <Input id="reg-confirm" label="Confirm password" showPasswordToggle placeholder="Repeat your password"
              value={fields.confirmPassword} onChange={set('confirmPassword')} error={errors.confirmPassword}
              required autoComplete="new-password" />

            <Button type="submit" variant="primary" size="lg" fullWidth loading={loading} disabled={loading}>
              {loading ? 'Creating account…' : 'Create Account'}
            </Button>

            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textAlign: 'center', lineHeight: 1.6 }}>
              By creating an account you agree to our{' '}
              <a href="#" style={{ color: 'var(--color-primary)' }}>Terms of Service</a> and{' '}
              <a href="#" style={{ color: 'var(--color-primary)' }}>Privacy Policy</a>.
            </p>
          </form>

          <div className="auth-form-footer">
            Already have an account? <Link to="/login">Sign in</Link>
          </div>
          <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--color-border)', textAlign: 'center' }}>
            <Link to="/" style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>← Back to homepage</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
