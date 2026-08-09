import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import Input from '../components/Input'
import Button from '../components/Button'
import { useAuth } from '../hooks/useAuth'
import { getErrorMessage } from '../utils/errorHandler'

const AUTH_FEATURES = [
  { icon: '🔍', text: 'AI-powered requirement extraction' },
  { icon: '📊', text: 'Automatic priority classification' },
  { icon: '✍️', text: 'Instant response & quotation generation' },
  { icon: '✅', text: 'Human approval before every action' },
]

function validate(fields) {
  const errs = {}
  if (!fields.email.trim()) {
    errs.email = 'Email address is required.'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)) {
    errs.email = 'Please enter a valid email address.'
  }
  if (!fields.password) {
    errs.password = 'Password is required.'
  }
  return errs
}

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, isAuthenticated } = useAuth()

  const from = location.state?.from?.pathname || '/dashboard'

  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true })
    }
  }, [isAuthenticated, navigate, from])

  const [fields, setFields] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [rememberMe, setRememberMe] = useState(false)
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
      await login(fields.email, fields.password)
      navigate(from, { replace: true })
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
          <h2 className="auth-left-heading">Your AI Workflow Autopilot for Small Business</h2>
          <p className="auth-left-sub">
            Process enquiries, generate quotations, and never miss a follow-up — with human
            oversight at every step.
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
          <h1 className="auth-form-heading">Welcome back</h1>
          <p className="auth-form-sub">Sign in to your OPSPILOT AI account to continue.</p>

          {formError && (
            <div className="form-error-banner" role="alert" style={{ marginBottom: 20 }}>
              ⚠️ {formError}
            </div>
          )}

          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            <Input
              id="login-email"
              label="Email address"
              type="email"
              placeholder="you@company.com"
              value={fields.email}
              onChange={set('email')}
              error={errors.email}
              required
              autoComplete="email"
            />
            <Input
              id="login-password"
              label="Password"
              showPasswordToggle
              placeholder="Enter your password"
              value={fields.password}
              onChange={set('password')}
              error={errors.password}
              required
              autoComplete="current-password"
            />
            <div className="auth-options">
              <label className="auth-remember">
                <input
                  type="checkbox"
                  id="remember-me"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                Remember me
              </label>
              <a href="#" className="auth-forgot" onClick={(e) => e.preventDefault()}>
                Forgot password?
              </a>
            </div>
            <Button type="submit" variant="primary" size="lg" fullWidth loading={loading} disabled={loading}>
              {loading ? 'Signing in…' : 'Sign In'}
            </Button>
          </form>

          <div className="auth-form-footer">
            Don't have an account? <Link to="/register">Create one free</Link>
          </div>
          <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--color-border)', textAlign: 'center' }}>
            <Link to="/" style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>← Back to homepage</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
