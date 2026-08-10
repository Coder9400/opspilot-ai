/**
 * ErrorBanner — inline error message with optional retry action.
 */
export default function ErrorBanner({ message, onRetry, style }) {
  if (!message) return null
  return (
    <div className="error-banner" role="alert" style={style}>
      <span className="error-banner-icon">⚠️</span>
      <span style={{ flex: 1 }}>{message}</span>
      {onRetry && (
        <button className="error-banner-retry" onClick={onRetry}>Retry</button>
      )}
    </div>
  )
}
