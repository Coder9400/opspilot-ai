/**
 * Loading — premium centered loading state.
 */
export default function Loading({ text = 'Loading…', size = 'md', inline = false }) {
  if (inline) {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
        <span
          className={`loading-spinner${size === 'sm' ? ' loading-spinner-sm' : ''}`}
          aria-hidden="true"
        />
        {text && <span className="loading-text">{text}</span>}
      </span>
    )
  }

  return (
    <div className="loading-state" role="status" aria-label={text}>
      <div
        className={`loading-spinner${size === 'sm' ? ' loading-spinner-sm' : ''}`}
        aria-hidden="true"
      />
      {text && <p className="loading-text">{text}</p>}
    </div>
  )
}
