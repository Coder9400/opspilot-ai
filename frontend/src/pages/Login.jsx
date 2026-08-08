import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import Input from '../components/Input'
import Button from '../components/Button'
import { useAuth } from '../hooks/useAuth'
import { getErrorMessage } from '../utils/errorHandler'
import AuthLayout from '../components/AuthLayout'
import AuthSocialButtons from '../components/AuthSocialButtons'

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
  const { login } = useAuth()
  const from = location.state?.from?.pathname || '/dashboard'

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
    setLoading(true); setFormError('')
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
    <AuthLayout 
      title="Welcome back" 
      subtitle="Sign in to continue to your OPSPILOT AI workspace."
      footerText="Don't have an account?"
      footerLinkText="Sign up"
      footerLinkTo="/register"
    >
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
          placeholder="Enter your email"
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
          <a href="#" className="auth-forgot" onClick={(e) => e.preventDefault()}>Forgot password?</a>
        </div>
        
        <Button type="submit" variant="primary" size="xl" fullWidth loading={loading} disabled={loading}>
          {loading ? 'Signing in...' : 'Sign In'}
        </Button>
      </form>

      <AuthSocialButtons setFormError={setFormError} />
    </AuthLayout>
  )
}
