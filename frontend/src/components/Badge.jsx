/**
 * StatusBadge — compact status pill for enquiry / quotation / followup status.
 * PriorityBadge — High / Medium / Low pill.
 */

const STATUS_MAP = {
  new:              'badge-new',
  analyzing:        'badge-analyzing',
  review:           'badge-review',
  in_progress:      'badge-in_progress',
  pending_approval: 'badge-pending_approval',
  pending:          'badge-pending',
  approved:         'badge-approved',
  completed:        'badge-completed',
  rejected:         'badge-rejected',
  cancelled:        'badge-cancelled',
}

const STATUS_LABELS = {
  new:              'New',
  analyzing:        'Analyzing',
  review:           'Review',
  in_progress:      'In Progress',
  pending_approval: 'Pending Approval',
  pending:          'Pending',
  approved:         'Approved',
  completed:        'Completed',
  rejected:         'Rejected',
  cancelled:        'Cancelled',
}

const STATUS_DOTS = {
  new:              '○',
  analyzing:        '◌',
  review:           '◑',
  in_progress:      '◑',
  pending_approval: '◐',
  pending:          '◐',
  approved:         '●',
  completed:        '●',
  rejected:         '✕',
  cancelled:        '○',
}

export function StatusBadge({ status, style }) {
  const key = (status || '').toLowerCase().replace(/ /g, '_')
  const cls = STATUS_MAP[key] || 'badge-neutral'
  return (
    <span className={`badge ${cls}`} style={style}>
      <span aria-hidden="true">{STATUS_DOTS[key] || '○'}</span>
      {STATUS_LABELS[key] || status || '—'}
    </span>
  )
}

const PRIORITY_MAP = {
  high:   { cls: 'badge-high',   label: 'High',   dot: '▲' },
  medium: { cls: 'badge-medium', label: 'Medium', dot: '■' },
  low:    { cls: 'badge-low',    label: 'Low',    dot: '▼' },
}

export function PriorityBadge({ priority, style }) {
  const key = (priority || 'medium').toLowerCase()
  const cfg = PRIORITY_MAP[key] || PRIORITY_MAP.medium
  return (
    <span className={`badge ${cfg.cls}`} style={style}>
      <span aria-hidden="true">{cfg.dot}</span>
      {cfg.label}
    </span>
  )
}
