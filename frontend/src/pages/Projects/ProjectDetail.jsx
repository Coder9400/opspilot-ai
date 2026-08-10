import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import AppShell from '../../components/AppShell'
import Button from '../../components/Button'
import Input from '../../components/Input'
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
    <span style={{ ...c, padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
      {status}
    </span>
  )
}

export default function ProjectDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [project,   setProject]   = useState(null)
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState('')
  const [editing,   setEditing]   = useState(false)
  const [saving,    setSaving]    = useState(false)
  const [saveError, setSaveError] = useState('')
  const [deleting,  setDeleting]  = useState(false)
  const [confirmDel, setConfirmDel] = useState(false)

  const [form, setForm] = useState({})

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await projectService.get(id)
      const p = res?.project || res?.data || res
      setProject(p)
      setForm({
        name:            p.name,
        description:     p.description || '',
        location:        p.location || '',
        status:          p.status,
        startDate:       p.startDate ? p.startDate.slice(0, 10) : '',
        expectedEndDate: p.expectedEndDate ? p.expectedEndDate.slice(0, 10) : '',
      })
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { load() }, [load])

  const set = (key) => (e) => setForm((p) => ({ ...p, [key]: e.target.value }))

  const handleSave = async (e) => {
    e.preventDefault()
    if (!form.name?.trim()) return
    setSaving(true)
    setSaveError('')
    try {
      const res = await projectService.update(id, {
        name:            form.name.trim(),
        description:     form.description || null,
        location:        form.location || null,
        status:          form.status,
        startDate:       form.startDate || null,
        expectedEndDate: form.expectedEndDate || null,
      })
      const updated = res?.project || res?.data || res
      setProject(updated)
      setEditing(false)
    } catch (err) {
      setSaveError(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await projectService.delete(id)
      navigate('/projects', { replace: true })
    } catch (err) {
      setError(getErrorMessage(err))
      setDeleting(false)
      setConfirmDel(false)
    }
  }

  if (loading) return (
    <AppShell>
      <div style={{ minHeight: '50vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loading text="Loading project…" />
      </div>
    </AppShell>
  )

  if (error && !project) return (
    <AppShell>
      <ErrorBanner message={error} onRetry={load} />
    </AppShell>
  )

  return (
    <AppShell>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        {/* Back */}
        <button
          onClick={() => navigate('/projects')}
          style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', fontSize: 13, padding: 0, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 4 }}
        >
          ← Back to Projects
        </button>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, gap: 12, flexWrap: 'wrap' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>{project?.name}</h1>
              <StatusBadge status={project?.status} />
            </div>
            {project?.location && (
              <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>📍 {project.location}</div>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {!editing ? (
              <>
                <Button variant="outline" size="sm" onClick={() => setEditing(true)}>✏️ Edit</Button>
                <Button variant="danger" size="sm" onClick={() => setConfirmDel(true)} loading={deleting}>🗑️ Delete</Button>
              </>
            ) : (
              <>
                <Button variant="outline" size="sm" onClick={() => { setEditing(false); setSaveError('') }}>Cancel</Button>
                <Button variant="primary" size="sm" form="edit-form" type="submit" loading={saving}>Save Changes</Button>
              </>
            )}
          </div>
        </div>

        {error && <ErrorBanner message={error} style={{ marginBottom: 20 }} />}

        {/* Delete confirm */}
        {confirmDel && (
          <div style={{
            background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 12, padding: '16px 20px', marginBottom: 20,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap',
          }}>
            <div>
              <div style={{ fontWeight: 600, color: '#ef4444', fontSize: 14 }}>Delete this project?</div>
              <div style={{ fontSize: 13, color: 'var(--color-text-muted)', marginTop: 2 }}>This action cannot be undone.</div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Button variant="outline" size="sm" onClick={() => setConfirmDel(false)}>Cancel</Button>
              <Button variant="danger" size="sm" onClick={handleDelete} loading={deleting}>Yes, Delete</Button>
            </div>
          </div>
        )}

        {/* View / Edit Card */}
        <div style={{ background: 'var(--color-surface, #fff)', borderRadius: 16, border: '1px solid var(--color-border)', padding: '24px 28px', marginBottom: 24 }}>
          {!editing ? (
            // ── View Mode ──
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {[
                { label: 'Description',   value: project?.description },
                { label: 'Location',      value: project?.location },
                { label: 'Status',        value: <StatusBadge status={project?.status} /> },
                { label: 'Start Date',    value: project?.startDate ? new Date(project.startDate).toLocaleDateString('en-IN', { dateStyle: 'medium' }) : null },
                { label: 'Expected End',  value: project?.expectedEndDate ? new Date(project.expectedEndDate).toLocaleDateString('en-IN', { dateStyle: 'medium' }) : null },
                { label: 'Created',       value: project?.createdAt ? new Date(project.createdAt).toLocaleDateString('en-IN', { dateStyle: 'long' }) : null },
                { label: 'Last Updated',  value: project?.updatedAt ? new Date(project.updatedAt).toLocaleDateString('en-IN', { dateStyle: 'long' }) : null },
              ].map(({ label, value }) => (
                value ? (
                  <div key={label} style={{ display: 'flex', gap: 12 }}>
                    <div style={{ width: 130, flexShrink: 0, fontSize: 13, color: 'var(--color-text-muted)', fontWeight: 500, paddingTop: 2 }}>{label}</div>
                    <div style={{ fontSize: 14, color: 'var(--color-text)', flex: 1 }}>{value}</div>
                  </div>
                ) : null
              ))}
            </div>
          ) : (
            // ── Edit Mode ──
            <>
              {saveError && <ErrorBanner message={saveError} style={{ marginBottom: 16 }} />}
              <form id="edit-form" onSubmit={handleSave} noValidate>
                <Input id="ep-name" label="Project name" value={form.name} onChange={set('name')} required />
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea className="form-input" value={form.description} onChange={set('description')} rows={3} style={{ resize: 'vertical', minHeight: 80 }} />
                </div>
                <Input id="ep-loc" label="Location" value={form.location} onChange={set('location')} />
                <div className="form-group">
                  <label className="form-label" htmlFor="ep-status">Status</label>
                  <select id="ep-status" className="form-input" value={form.status} onChange={set('status')}>
                    <option value="DRAFT">Draft</option>
                    <option value="ACTIVE">Active</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="ARCHIVED">Archived</option>
                  </select>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <Input id="ep-start" label="Start date" type="date" value={form.startDate} onChange={set('startDate')} />
                  <Input id="ep-end" label="Expected end" type="date" value={form.expectedEndDate} onChange={set('expectedEndDate')} />
                </div>
              </form>
            </>
          )}
        </div>

        {/* Phase 2 placeholder */}
        <div style={{
          background: 'var(--color-surface, #fff)', borderRadius: 14,
          border: '1px dashed var(--color-border)', padding: '28px 24px', textAlign: 'center',
        }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>🤖</div>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-text)', marginBottom: 4 }}>AI Requirement Builder</div>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-primary)', background: 'rgba(99,102,241,0.08)', display: 'inline-block', padding: '2px 8px', borderRadius: 10, marginBottom: 8 }}>Phase 2</div>
          <div style={{ fontSize: 13, color: 'var(--color-text-muted)', lineHeight: 1.5, maxWidth: 380, margin: '0 auto' }}>
            Describe what you need in plain language and AI will structure it into a formal RFQ that gets sent to matched suppliers.
          </div>
        </div>
      </div>
    </AppShell>
  )
}
