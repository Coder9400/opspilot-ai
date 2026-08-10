import Button from './Button'

/**
 * Modal — centered, premium overlay dialog.
 *
 * Props:
 *   open: boolean
 *   onClose: () => void
 *   title: string
 *   children: ReactNode — body content
 *   confirmLabel: string (default: 'Confirm')
 *   cancelLabel: string (default: 'Cancel')
 *   confirmVariant: button variant (default: 'primary')
 *   onConfirm: () => void
 *   loading: boolean
 *   hideFooter: boolean — hide default footer buttons
 */
export default function Modal({
  open,
  onClose,
  title,
  children,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  confirmVariant = 'primary',
  onConfirm,
  loading = false,
  hideFooter = false,
}) {
  if (!open) return null

  const handleBackdrop = (e) => {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <div className="modal-backdrop" onClick={handleBackdrop} role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title" id="modal-title">{title}</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close dialog">✕</button>
        </div>
        <div className="modal-body">{children}</div>
        {!hideFooter && (
          <div className="modal-footer">
            <Button variant="ghost" onClick={onClose} disabled={loading}>{cancelLabel}</Button>
            {onConfirm && (
              <Button variant={confirmVariant} onClick={onConfirm} loading={loading} disabled={loading}>
                {confirmLabel}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
