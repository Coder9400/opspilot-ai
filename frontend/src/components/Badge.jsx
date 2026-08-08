/**
 * Badge – status / priority indicator.
 *
 * Props:
 *  variant: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral'
 *  label: string
 */

const PRIORITY_MAP = {
  high:   'danger',
  HIGH:   'danger',
  medium: 'warning',
  MEDIUM: 'warning',
  low:    'success',
  LOW:    'success',
}

// Maps backend status values (various casings) to badge variant and label
const STATUS_CONFIG = {
  new:              { variant: 'primary',   label: 'New' },
  NEW:              { variant: 'primary',   label: 'New' },
  analyzing:        { variant: 'analyzing', label: 'Analyzing' },
  ANALYZING:        { variant: 'analyzing', label: 'Analyzing' },
  review:           { variant: 'review',    label: 'Review' },
  REVIEW:           { variant: 'review',    label: 'Review' },
  in_progress:      { variant: 'info',      label: 'In Progress' },
  IN_PROGRESS:      { variant: 'info',      label: 'In Progress' },
  pending_approval: { variant: 'warning',   label: 'Pending Approval' },
  PENDING_APPROVAL: { variant: 'warning',   label: 'Pending Approval' },
  PENDING:          { variant: 'warning',   label: 'Pending' },
  pending:          { variant: 'warning',   label: 'Pending' },
  awaiting_info:    { variant: 'warning',   label: 'Awaiting Info' },
  approved:         { variant: 'success',   label: 'Approved' },
  APPROVED:         { variant: 'success',   label: 'Approved' },
  completed:        { variant: 'completed', label: 'Completed' },
  COMPLETED:        { variant: 'completed', label: 'Completed' },
  rejected:         { variant: 'danger',    label: 'Rejected' },
  REJECTED:         { variant: 'danger',    label: 'Rejected' },
  cancelled:        { variant: 'cancelled', label: 'Cancelled' },
  CANCELLED:        { variant: 'cancelled', label: 'Cancelled' },
}

/** Generic Badge */
export function Badge({ variant = 'neutral', label, className = '' }) {
  return (
    <span className={`badge badge-${variant} ${className}`}>
      {label}
    </span>
  )
}

/** PriorityBadge – maps 'HIGH' | 'MEDIUM' | 'LOW' (or lowercase) */
export function PriorityBadge({ priority }) {
  const variant = PRIORITY_MAP[priority] ?? PRIORITY_MAP[(priority || '').toLowerCase()] ?? 'neutral'
  const label = priority ? priority.charAt(0).toUpperCase() + priority.slice(1).toLowerCase() : '—'
  return <Badge variant={variant} label={label} />
}

/** StatusBadge – maps status string to variant + human-readable label */
export function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG[(status || '').toLowerCase()] ?? null
  if (config) return <Badge variant={config.variant} label={config.label} />
  // Fallback: format unknown status nicely
  const label = (status || 'Unknown').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
  return <Badge variant="neutral" label={label} />
}

export default Badge
