import { useState } from 'react'

/**
 * Input – reusable form input.
 *
 * Props:
 *  id, label, type, placeholder, value, onChange,
 *  error, hint, required,
 *  showPasswordToggle – show eye icon for password fields
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
  showPasswordToggle = false,
  ...rest
}) {
  const [visible, setVisible] = useState(false)
  const inputType = showPasswordToggle ? (visible ? 'text' : 'password') : type

  return (
    <div className="input-group">
      {label && (
        <label htmlFor={id} className="input-label">
          {label}
          {required && <span className="required">*</span>}
        </label>
      )}

      <div className={showPasswordToggle ? 'input-wrapper' : ''}>
        <input
          id={id}
          type={inputType}
          className={`input-field${error ? ' error' : ''}`}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
          aria-invalid={error ? 'true' : undefined}
          required={required}
          {...rest}
        />
        {showPasswordToggle && (
          <button
            type="button"
            className="input-icon-right"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? 'Hide password' : 'Show password'}
            tabIndex={-1}
          >
            {visible ? '🙈' : '👁'}
          </button>
        )}
      </div>

      {error && (
        <span id={`${id}-error`} className="input-error" role="alert">
          {error}
        </span>
      )}
      {!error && hint && (
        <span id={`${id}-hint`} className="input-hint">
          {hint}
        </span>
      )}
    </div>
  )
}
