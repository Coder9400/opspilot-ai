import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppShell from '../../components/AppShell'
import Input from '../../components/Input'
import Button from '../../components/Button'
import ErrorBanner from '../../components/ErrorBanner'
import { projectService } from '../../services/project.service'
import { getErrorMessage } from '../../utils/errorHandler'

export default function CreateProject() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: '', description: '', location: '',
    status: 'DRAFT', startDate: '', expectedEndDate: '',
  })
  const [errors,    setErrors]    = useState({})
  const [formError, setFormError] = useState('')
  const [loading,   setLoading]   = useState(false)

  const set = (key) => (e) => {
    setForm((p) => ({ ...p, [key]: e.target.value }))
    if (errors[key]) setErrors((p) => ({ ...p, [key]: '' }))
    setFormError('')
  }

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Project name is required.'
    else if (form.name.trim().length < 2) e.name = 'Name must be at least 2 characters.'
    return e
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }

    setLoading(true)
    setFormError('')
    try {
      const res = await projectService.create({
        name:            form.name.trim(),
        description:     form.description.trim() || null,
        location:        form.location.trim() || null,
        status:          form.status,
        startDate:       form.startDate || null,
        expectedEndDate: form.expectedEndDate || null,
      })
      const created = res?.project || res?.data || res
      navigate(`/projects/${created.id}`, { replace: true })
    } catch (err) {
      setFormError(getErrorMessage(err))
      setLoading(false)
    }
  }

  return (
    <AppShell>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <button
            onClick={() => navigate('/projects')}
            style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', gap: 4, padding: 0, marginBottom: 12 }}
          >
            ← Back to Projects
          </button>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>
            Create Project
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 14, marginTop: 4 }}>
            Define a procurement project. You'll add specific requirements and invite suppliers later.
          </p>
        </div>

        {/* Form */}
        <div style={{ background: 'var(--color-surface, #fff)', borderRadius: 16, border: '1px solid var(--color-border)', padding: '28px 32px' }}>
          {formError && <ErrorBanner message={formError} style={{ marginBottom: 20 }} />}

          <form onSubmit={handleSubmit} noValidate>
            <Input
              id="proj-name"
              label="Project name"
              placeholder="e.g. Residential Block A — Steel & Cement"
              value={form.name}
              onChange={set('name')}
              error={errors.name}
              required
              autoFocus
            />

            <div className="form-group">
              <label className="form-label" htmlFor="proj-desc">Description (optional)</label>
              <textarea
                id="proj-desc"
                className="form-input"
                placeholder="Brief overview of this project and what you need to procure…"
                value={form.description}
                onChange={set('description')}
                rows={3}
                style={{ resize: 'vertical', minHeight: 80 }}
              />
            </div>

            <Input
              id="proj-location"
              label="Project location (optional)"
              placeholder="e.g. Mumbai, Maharashtra"
              value={form.location}
              onChange={set('location')}
            />

            <div className="form-group">
              <label className="form-label" htmlFor="proj-status">Status</label>
              <select
                id="proj-status"
                className="form-input"
                value={form.status}
                onChange={set('status')}
              >
                <option value="DRAFT">Draft — still planning</option>
                <option value="ACTIVE">Active — ready to source</option>
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <Input
                id="proj-start"
                label="Start date (optional)"
                type="date"
                value={form.startDate}
                onChange={set('startDate')}
              />
              <Input
                id="proj-end"
                label="Expected end date (optional)"
                type="date"
                value={form.expectedEndDate}
                onChange={set('expectedEndDate')}
              />
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
              <Button type="button" variant="outline" onClick={() => navigate('/projects')}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" loading={loading} disabled={loading}>
                {loading ? 'Creating…' : 'Create Project'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </AppShell>
  )
}
