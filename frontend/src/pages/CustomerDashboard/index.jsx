import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import AppShell from '../../components/AppShell'
import Button from '../../components/Button'
import Loading from '../../components/Loading'
import ErrorBanner from '../../components/ErrorBanner'
import { useAuth } from '../../hooks/useAuth'
import { projectService } from '../../services/project.service'
import { getErrorMessage } from '../../utils/errorHandler'

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ icon, label, value, color = 'var(--color-primary)', bg = 'rgba(99,102,241,0.08)' }) {
  return (
    <div style={{
      background: 'var(--color-surface, #fff)', borderRadius: 14, padding: '20px 24px',
      border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: 16,
    }}>
      <div style={{ width: 48, height: 48, borderRadius: 12, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--color-text)', lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: 13, color: 'var(--color-text-muted)', marginTop: 4 }}>{label}</div>
      </div>
    </div>
  )
}

// ─── Status badge ─────────────────────────────────────────────────────────────

const STATUS_COLORS = {
  DRAFT:     { bg: 'rgba(107,114,128,0.1)', color: '#6b7280' },
  ACTIVE:    { bg: 'rgba(16,185,129,0.1)',  color: '#10b981' },
  COMPLETED: { bg: 'rgba(99,102,241,0.1)',  color: '#6366f1' },
  ARCHIVED:  { bg: 'rgba(239,68,68,0.1)',   color: '#ef4444' },
}

function StatusPill({ status }) {
  const c = STATUS_COLORS[status] || STATUS_COLORS.DRAFT
  return (
    <span style={{ ...c, padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
      {status}
    </span>
  )
}

// ─── Coming Soon card ─────────────────────────────────────────────────────────

function ComingSoon({ icon, title, phase, desc }) {
  return (
    <div style={{
      background: 'var(--color-surface, #fff)', borderRadius: 14, padding: '28px 24px',
      border: '1px dashed var(--color-border)', textAlign: 'center',
    }}>
      <div style={{ fontSize: 32, marginBottom: 10 }}>{icon}</div>
      <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-text)', marginBottom: 4 }}>{title}</div>
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-primary)', background: 'rgba(99,102,241,0.08)', display: 'inline-block', padding: '2px 8px', borderRadius: 10, marginBottom: 8 }}>
        {phase}
      </div>
      <div style={{ fontSize: 13, color: 'var(--color-text-muted)', lineHeight: 1.5 }}>{desc}</div>
    </div>
  )
}

// ─── Main Customer Dashboard ──────────────────────────────────────────────────

export default function CustomerDashboard() {
  const navigate  = useNavigate()
  const { user, company } = useAuth()

  const [stats,        setStats]        = useState(null)
  const [projects,     setProjects]     = useState([])
  const [statsLoading, setStatsLoading] = useState(true)
  const [projLoading,  setProjLoading]  = useState(true)
  const [error,        setError]        = useState('')

  const load = useCallback(async () => {
    setError('')
    setStatsLoading(true)
    setProjLoading(true)
    try {
      const [statsRes, projRes] = await Promise.all([
        projectService.stats(),
        projectService.list(),
      ])
      setStats(statsRes?.stats || statsRes)
      const list = projRes?.projects || projRes?.data || []
      setProjects(Array.isArray(list) ? list.slice(0, 5) : []) // show 5 most recent
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setStatsLoading(false)
      setProjLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const firstName = (user?.fullName || user?.name || '').split(' ')[0] || 'there'

  return (
    <AppShell>
      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>
            Good day, {firstName} 👋
          </h1>
          <p style={{ color: 'var(--color-text-muted)', marginTop: 4, fontSize: 14 }}>
            {company?.name ? `Managing procurement for ${company.name}` : 'Welcome to your procurement workspace'}
          </p>
        </div>
        <Button variant="primary" onClick={() => navigate('/projects/new')}>
          + New Project
        </Button>
      </div>

      {error && <ErrorBanner message={error} onRetry={load} style={{ marginBottom: 24 }} />}

      {/* ── Stats ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16, marginBottom: 32 }}>
        {statsLoading ? (
          <div style={{ gridColumn: '1/-1' }}><Loading text="Loading stats…" /></div>
        ) : (
          <>
            <StatCard icon="📋" label="Total Projects" value={stats?.total ?? 0} color="#6366f1" bg="rgba(99,102,241,0.08)" />
            <StatCard icon="✏️" label="Draft"          value={stats?.draft ?? 0}     color="#6b7280" bg="rgba(107,114,128,0.08)" />
            <StatCard icon="🚀" label="Active"         value={stats?.active ?? 0}    color="#10b981" bg="rgba(16,185,129,0.08)" />
            <StatCard icon="✅" label="Completed"      value={stats?.completed ?? 0} color="#6366f1" bg="rgba(99,102,241,0.08)" />
          </>
        )}
      </div>

      {/* ── Recent Projects ── */}
      <div style={{ background: 'var(--color-surface, #fff)', borderRadius: 14, border: '1px solid var(--color-border)', overflow: 'hidden', marginBottom: 32 }}>
        <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-text)', margin: 0 }}>Recent Projects</h2>
          <button
            onClick={() => navigate('/projects')}
            style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', fontSize: 13, fontWeight: 500 }}
          >
            View all →
          </button>
        </div>

        {projLoading ? (
          <div style={{ padding: 32 }}><Loading text="Loading projects…" /></div>
        ) : projects.length === 0 ? (
          <div style={{ padding: '48px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🏗️</div>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-text)', margin: '0 0 8px' }}>No projects yet</h3>
            <p style={{ color: 'var(--color-text-muted)', fontSize: 14, marginBottom: 20, lineHeight: 1.5 }}>
              Create your first project to start managing procurement requirements.
            </p>
            <Button variant="primary" onClick={() => navigate('/projects/new')}>
              Create First Project
            </Button>
          </div>
        ) : (
          <table className="data-table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>Project Name</th>
                <th>Location</th>
                <th>Status</th>
                <th>Created</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {projects.map((p) => (
                <tr key={p.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/projects/${p.id}`)}>
                  <td>
                    <div style={{ fontWeight: 500, color: 'var(--color-text)' }}>{p.name}</div>
                    {p.description && (
                      <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2 }}>
                        {p.description.slice(0, 60)}{p.description.length > 60 ? '…' : ''}
                      </div>
                    )}
                  </td>
                  <td style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>{p.location || '—'}</td>
                  <td><StatusPill status={p.status} /></td>
                  <td style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>
                    {new Date(p.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td><span style={{ color: 'var(--color-primary)', fontSize: 13 }}>View →</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Coming Soon — Phase 2-5 ── */}
      <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-text)', marginBottom: 16 }}>Coming Soon</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
        <ComingSoon icon="🤖" title="AI Requirement Builder" phase="Phase 2" desc="Describe your need in plain language — AI structures it into a formal RFQ." />
        <ComingSoon icon="🏭" title="Supplier Matching" phase="Phase 3" desc="Auto-match your requirement to the best suppliers based on category, location, and capacity." />
        <ComingSoon icon="📊" title="Quotation Intelligence" phase="Phase 4" desc="Upload PDFs or submit structured forms — AI extracts, normalizes, and compares all quotations." />
        <ComingSoon icon="🧠" title="Procurement Copilot" phase="Phase 5" desc="AI-powered negotiation assistance, recommendations, and performance analytics." />
      </div>
    </AppShell>
  )
}
