/**
 * Button – reusable button component.
 *
 * Props:
 *  variant: 'primary' | 'outline' | 'ghost' | 'danger'  (default: 'primary')
 *  size: 'sm' | 'md' | 'lg'  (default: 'md')
 *  loading: bool
 *  disabled: bool
 *  fullWidth: bool
 *  onClick, type, className, children, ...rest
 */
export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  className = '',
  children,
  ...rest
}) {
  const sizeClass = size === 'sm' ? 'btn-sm' : size === 'lg' ? 'btn-lg' : ''
  const cls = [
    'btn',
    `btn-${variant}`,
    sizeClass,
    fullWidth ? 'w-full' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <button className={cls} disabled={disabled || loading} {...rest}>
      {loading && <span className="spinner" />}
      {children}
    </button>
  )
}
