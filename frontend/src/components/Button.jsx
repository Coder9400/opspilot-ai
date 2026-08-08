/**
 * Button — premium pill-shaped button component.
 *
 * Props:
 *   variant: 'primary' | 'outline' | 'ghost' | 'danger' | 'dark' (default: 'primary')
 *   size: 'sm' | 'md' | 'lg' | 'xl' (default: 'md')
 *   fullWidth: boolean
 *   loading: boolean — shows spinner
 *   disabled: boolean
 *   children, type, onClick, style, className, ...rest
 */
export default function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  disabled = false,
  children,
  type = 'button',
  onClick,
  style,
  className = '',
  ...rest
}) {
  const cls = [
    'btn',
    `btn-${variant}`,
    size !== 'md' ? `btn-${size}` : '',
    fullWidth ? 'btn-full' : '',
    className,
  ].filter(Boolean).join(' ')

  return (
    <button
      type={type}
      className={cls}
      disabled={disabled || loading}
      onClick={onClick}
      style={style}
      {...rest}
    >
      {loading && <span className="btn-spinner" aria-hidden="true" />}
      {children}
    </button>
  )
}
