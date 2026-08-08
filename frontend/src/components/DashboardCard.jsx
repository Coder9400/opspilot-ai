/**
 * DashboardCard – KPI metric card for the dashboard.
 *
 * Props:
 *  label: string
 *  value: string | number
 *  change: string  (e.g. '+12% this week')
 *  changeType: 'up' | 'neutral'
 *  icon: string (emoji or SVG)
 *  iconBg: CSS color string
 *  iconColor: CSS color string
 */
export default function DashboardCard({
  label,
  value,
  change,
  changeType = 'neutral',
  icon,
  iconBg,
  iconColor,
}) {
  return (
    <div className="kpi-card">
      <div className="kpi-card-left">
        <div className="kpi-card-label">{label}</div>
        <div className="kpi-card-value">{value}</div>
        {change && (
          <div className={`kpi-card-change ${changeType}`}>{change}</div>
        )}
      </div>
      {icon && (
        <div
          className="kpi-card-icon"
          style={{ background: iconBg || 'var(--color-primary-light)', color: iconColor || 'var(--color-primary)' }}
        >
          {icon}
        </div>
      )}
    </div>
  )
}
