import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Input from '../components/Input'
import Button from '../components/Button'
import { useAuth } from '../hooks/useAuth'
import { getErrorMessage } from '../utils/errorHandler'
import AuthLayout from '../components/AuthLayout'
import AuthSocialButtons from '../components/AuthSocialButtons'

function validate(fields) {
  const errs = {}
  if (!fields.name.trim()) errs.name = 'Full name is required.'
  if (!fields.email.trim()) {
    errs.email = 'Email address is required.'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)) {
    errs.email = 'Please enter a valid email address.'
  }
  if (!fields.password) {
    errs.password = 'Password is required.'
  } else if (fields.password.length < 6) {
    errs.password = 'Password must be at least 6 characters.'
  }
  if (fields.password !== fields.confirmPassword) {
    errs.confirmPassword = 'Passwords do not match.'
  }
  return errs
}

export default function Register() {
  const navigate = useNavigate()
  const { register } = useAuth()

  const [fields, setFields] = useState({ name: '', email: '', password: '', confirmPassword: '' })
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
    
    setLoading(true); setFormError('')
    try {
      await register({ name: fields.name, email: fields.email, password: fields.password })
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setFormError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout 
      title="Create your account" 
      subtitle="Start managing your customer workflows with OPSPILOT AI."
      footerText="Already have an account?"
      footerLinkText="Sign in"
      footerLinkTo="/login"
    >
      {formError && (
        <div className="form-error-banner" role="alert" style={{ marginBottom: 20 }}>
          ⚠️ {formError}
        </div>
      )}

      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <Input
          id="reg-name"
          label="Full Name"
          placeholder="Enter your full name"
          value={fields.name}
          onChange={set('name')}
          error={errors.name}
          required
          autoComplete="name"
        />
        <Input
          id="reg-email"
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
          id="reg-password"
          label="Password"
          showPasswordToggle
          placeholder="Create a password"
          value={fields.password}
          onChange={set('password')}
          error={errors.password}
          required
          autoComplete="new-password"
        />
        <Input
          id="reg-confirm"
          label="Confirm Password"
          showPasswordToggle
          placeholder="Confirm your password"
          value={fields.confirmPassword}
          onChange={set('confirmPassword')}
          error={errors.confirmPassword}
          required
          autoComplete="new-password"
        />
        
        <Button type="submit" variant="primary" size="xl" fullWidth loading={loading} disabled={loading} style={{ marginTop: 8 }}>
          {loading ? 'Creating account...' : 'Create Account'}
        </Button>
      </form>

      <AuthSocialButtons setFormError={setFormError} />
    </AuthLayout>
  )
}
