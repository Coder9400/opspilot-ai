import { useState } from 'react'

/**
 * Input — premium form input component.
 *
 * Props:
 *   id, label, type, placeholder, value, onChange, error, hint
 *   required, disabled, autoComplete, autoFocus
 *   showPasswordToggle — adds show/hide button for password fields
 */
export default function Input({
  id,
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  error,
  hint,
  required = false,
  disabled = false,
  autoComplete,
  autoFocus = false,
  showPasswordToggle = false,
  ...rest
}) {
  const [showPwd, setShowPwd] = useState(false)
  const inputType = showPasswordToggle ? (showPwd ? 'text' : 'password') : type

  return (
    <div className="form-group">
      {label && (
        <label className="form-label" htmlFor={id}>
          {label}
          {required && <span className="required" aria-hidden="true"> *</span>}
        </label>
      )}
      <div className="form-input-wrap">
        <input
          id={id}
          type={inputType}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          disabled={disabled}
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          required={required}
          aria-required={required}
          aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
          aria-invalid={!!error}
          className={`form-input${error ? ' error' : ''}${showPasswordToggle ? ' has-icon-right' : ''}`}
          {...rest}
        />
        {showPasswordToggle && (
          <button
            type="button"
            className="form-input-icon-right"
            onClick={() => setShowPwd((v) => !v)}
            aria-label={showPwd ? 'Hide password' : 'Show password'}
            style={{ background: 'none', border: 'none', fontSize: 14 }}
          >
            {showPwd ? '🙈' : '👁'}
          </button>
        )}
      </div>
      {error && (
        <p id={`${id}-error`} className="form-error" role="alert">{error}</p>
      )}
      {hint && !error && (
        <p id={`${id}-hint`} className="form-hint">{hint}</p>
      )}
    </div>
  )
}
