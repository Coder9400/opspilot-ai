import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import AppShell from '../../components/AppShell'
import Button from '../../components/Button'
import Loading from '../../components/Loading'
import ErrorBanner from '../../components/ErrorBanner'
import { projectService } from '../../services/project.service'
import { getErrorMessage } from '../../utils/errorHandler'

const STATUS_COLORS = {
  DRAFT:     { bg: 'rgba(107,114,128,0.1)', color: '#6b7280' },
  ACTIVE:    { bg: 'rgba(16,185,129,0.1)',  color: '#10b981' },
  COMPLETED: { bg: 'rgba(99,102,241,0.1)',  color: '#6366f1' },
  ARCHIVED:  { bg: 'rgba(239,68,68,0.1)',   color: '#ef4444' },
}

function StatusBadge({ status }) {
  const c = STATUS_COLORS[status] || STATUS_COLORS.DRAFT
  return (
    <span style={{ ...c, padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
      {status}
    </span>
  )
}

const STATUS_FILTERS = ['ALL', 'DRAFT', 'ACTIVE', 'COMPLETED', 'ARCHIVED']

export default function ProjectsPage() {
  const navigate = useNavigate()

  const [projects, setProjects] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState('')
  const [filter,   setFilter]   = useState('ALL')
  const [search,   setSearch]   = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await projectService.list()
      const list = res?.projects || res?.data || []
      setProjects(Array.isArray(list) ? list : [])
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = projects.filter((p) => {
    const matchStatus = filter === 'ALL' || p.status === filter
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.description || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.location || '').toLowerCase().includes(search.toLowerCase())
    return matchStatus && matchSearch
  })

  return (
    <AppShell>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>Projects</h1>
          <p style={{ color: 'var(--color-text-muted)', marginTop: 4, fontSize: 14 }}>
            Manage your procurement projects and requirements.
          </p>
        </div>
        <Button variant="primary" onClick={() => navigate('/projects/new')}>
          + New Project
        </Button>
      </div>

      {error && <ErrorBanner message={error} onRetry={load} style={{ marginBottom: 20 }} />}

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1 1 220px' }}>
          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: 'var(--color-text-muted)' }}>🔍</span>
          <input
            type="text"
            placeholder="Search projects…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%', padding: '9px 12px 9px 36px', borderRadius: 8,
              border: '1px solid var(--color-border)', background: 'var(--color-surface, #fff)',
              fontSize: 14, color: 'var(--color-text)', outline: 'none', boxSizing: 'border-box',
            }}
          />
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              style={{
                padding: '7px 14px', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer',
                border: `1px solid ${filter === s ? 'var(--color-primary)' : 'var(--color-border)'}`,
                background: filter === s ? 'var(--color-primary)' : 'var(--color-surface, #fff)',
                color: filter === s ? '#fff' : 'var(--color-text)',
              }}
            >
              {s === 'ALL' ? 'All' : s.charAt(0) + s.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Project list */}
      {loading ? (
        <div style={{ padding: 40 }}><Loading text="Loading projects…" /></div>
      ) : filtered.length === 0 ? (
        <div style={{
          background: 'var(--color-surface, #fff)', borderRadius: 14, border: '1px solid var(--color-border)',
          padding: '64px 24px', textAlign: 'center',
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🏗️</div>
          <h3 style={{ fontSize: 18, fontWeight: 600, margin: '0 0 8px' }}>
            {projects.length === 0 ? 'No projects yet' : 'No matching projects'}
          </h3>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 14, marginBottom: 24, lineHeight: 1.6, maxWidth: 380, margin: '0 auto 24px' }}>
            {projects.length === 0
              ? 'Create your first project to start managing procurement requirements and finding suppliers.'
              : 'Try adjusting your search or filter.'}
          </p>
          {projects.length === 0 && (
            <Button variant="primary" onClick={() => navigate('/projects/new')}>
              Create First Project
            </Button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map((p) => (
            <div
              key={p.id}
              onClick={() => navigate(`/projects/${p.id}`)}
              style={{
                background: 'var(--color-surface, #fff)', borderRadius: 12, border: '1px solid var(--color-border)',
                padding: '18px 24px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 16,
                transition: 'border-color 0.15s, box-shadow 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--color-primary)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(99,102,241,0.1)' }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.boxShadow = 'none' }}
            >
              <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(99,102,241,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                🏗️
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--color-text)', marginBottom: 3 }}>{p.name}</div>
                {p.description && (
                  <div style={{ fontSize: 13, color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {p.description}
                  </div>
                )}
                <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 4, display: 'flex', gap: 12 }}>
                  {p.location && <span>📍 {p.location}</span>}
                  <span>📅 {new Date(p.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, flexShrink: 0 }}>
                <StatusBadge status={p.status} />
                <span style={{ fontSize: 13, color: 'var(--color-primary)' }}>View →</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </AppShell>
  )
}
