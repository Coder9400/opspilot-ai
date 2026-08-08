/**
 * Loading – spinner and skeleton states.
 *
 * Usage:
 *   <Loading />                   – centered full-page spinner
 *   <Loading inline />            – small inline spinner
 *   <Loading text="Analyzing..." /> – spinner with custom message
 */
export default function Loading({ inline = false, text = 'Loading…' }) {
  if (inline) {
    return (
      <span
        style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' }}
      >
        <span className="spinner spinner-dark" />
        {text}
      </span>
    )
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px 20px',
        gap: 16,
      }}
    >
      <div className="spinner spinner-dark" style={{ width: 36, height: 36, borderWidth: 3 }} />
      <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' }}>{text}</p>
    </div>
  )
}
