/**
 * EmptyState – friendly empty state with icon, message, and optional CTA.
 *
 * Props:
 *   icon: emoji or element
 *   title: string
 *   message: string
 *   action: { label, onClick }
 */
export default function EmptyState({ icon = '📭', title, message, action }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px 20px',
        textAlign: 'center',
        gap: 12,
      }}
    >
      <div style={{ fontSize: '3rem', lineHeight: 1 }}>{icon}</div>
      {title && (
        <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700, color: 'var(--color-text)' }}>
          {title}
        </h3>
      )}
      {message && (
        <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)', maxWidth: 380 }}>
          {message}
        </p>
      )}
      {action && (
        <button
          className="btn btn-primary btn-sm"
          onClick={action.onClick}
          style={{ marginTop: 8 }}
        >
          {action.label}
        </button>
      )}
    </div>
  )
}
