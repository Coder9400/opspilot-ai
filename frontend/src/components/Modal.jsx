import { useEffect } from 'react'
import Button from './Button'

/**
 * Modal – reusable confirmation/action modal.
 *
 * Props:
 *   open: bool
 *   onClose: () => void
 *   title: string
 *   children: node
 *   confirmLabel: string (default 'Confirm')
 *   confirmVariant: button variant (default 'primary')
 *   onConfirm: () => void
 *   loading: bool
 *   cancelLabel: string (default 'Cancel')
 */
export default function Modal({
  open,
  onClose,
  title,
  children,
  confirmLabel = 'Confirm',
  confirmVariant = 'primary',
  onConfirm,
  loading = false,
  cancelLabel = 'Cancel',
}) {
  // Close on Escape
  useEffect(() => {
    if (!open) return
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.5)',
        zIndex: 500,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
      }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className="card"
        style={{ width: '100%', maxWidth: 480, position: 'relative' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h2 id="modal-title" style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700 }}>
            {title}
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--color-text-muted)', lineHeight: 1 }}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div style={{ marginBottom: 24, fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', lineHeight: 1.7 }}>
          {children}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </Button>
          {onConfirm && (
            <Button variant={confirmVariant} onClick={onConfirm} loading={loading} disabled={loading}>
              {confirmLabel}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
