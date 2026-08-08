/**
 * ErrorBanner – inline API error display.
 *
 * Props:
 *   message: string
 *   onRetry: () => void  (optional)
 */
export default function ErrorBanner({ message, onRetry }) {
  if (!message) return null
  return (
    <div
      className="form-error-banner"
      role="alert"
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}
    >
      <span>⚠️ {message}</span>
      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            background: 'none',
            border: '1px solid #fca5a5',
            borderRadius: 6,
            padding: '2px 10px',
            fontSize: 'var(--font-size-xs)',
            cursor: 'pointer',
            color: '#991b1b',
            flexShrink: 0,
          }}
        >
          Retry
        </button>
      )}
    </div>
  )
}
