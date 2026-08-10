import { useState, useEffect, useCallback } from 'react'
import AppShell from '../../components/AppShell'
import Button from '../../components/Button'
import Input from '../../components/Input'
import Loading from '../../components/Loading'
import ErrorBanner from '../../components/ErrorBanner'
import { supplierService } from '../../services/supplier.service'
import { getErrorMessage } from '../../utils/errorHandler'

const UNITS = ['MT', 'KG', 'Ton', 'Litre', 'Piece', 'Box', 'Bag', 'Roll', 'Sheet', 'Set', 'Pair', 'Meter', 'SqFt', 'SqMt', 'Other']

const CATEGORIES = [
  'Steel & Metal', 'Cement & Concrete', 'Electrical', 'Plumbing & Sanitary',
  'Tiles & Flooring', 'Paints & Coatings', 'Timber & Woodwork', 'Glass & Glazing',
  'HVAC & Ventilation', 'Safety Equipment', 'Machinery & Equipment',
  'Chemicals & Solvents', 'Construction Equipment', 'IT & Electronics', 'Other',
]

const EMPTY_FORM = { name: '', category: '', description: '', unit: 'MT', minimumQuantity: 1 }

function ProductModal({ product, onClose, onSave }) {
  const [form,    setForm]    = useState(product ? {
    name: product.name, category: product.category,
    description: product.description || '',
    unit: product.unit, minimumQuantity: product.minimumQuantity ?? 1,
  } : { ...EMPTY_FORM })
  const [errors,  setErrors]  = useState({})
  const [saving,  setSaving]  = useState(false)
  const [saveErr, setSaveErr] = useState('')

  const set = (key) => (e) => {
    const val = e.target.type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value
    setForm((p) => ({ ...p, [key]: val }))
    if (errors[key]) setErrors((p) => ({ ...p, [key]: '' }))
    setSaveErr('')
  }

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Product name is required.'
    if (!form.category)    e.category = 'Category is required.'
    if (!form.unit)        e.unit = 'Unit is required.'
    return e
  }

  const handleSubmit = async (ev) => {
    ev.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setSaving(true)
    setSaveErr('')
    try {
      await onSave({
        name:            form.name.trim(),
        category:        form.category,
        description:     form.description.trim() || null,
        unit:            form.unit,
        minimumQuantity: Number(form.minimumQuantity) || 1,
      })
      onClose()
    } catch (err) {
      setSaveErr(getErrorMessage(err))
      setSaving(false)
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 999,
      background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }}>
      <div style={{
        background: 'var(--color-surface, #fff)', borderRadius: 16,
        border: '1px solid var(--color-border)', padding: '28px 32px',
        width: '100%', maxWidth: 520, boxShadow: '0 24px 64px rgba(0,0,0,0.18)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>
            {product ? 'Edit Product' : 'Add Product'}
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--color-text-muted)', lineHeight: 1 }}>×</button>
        </div>

        {saveErr && <ErrorBanner message={saveErr} style={{ marginBottom: 16 }} />}

        <form onSubmit={handleSubmit} noValidate>
          <Input id="pd-name" label="Product name" placeholder="e.g. TMT Steel Bars Fe500" required
            value={form.name} onChange={set('name')} error={errors.name} />

          <div className="form-group">
            <label className="form-label" htmlFor="pd-cat">Category <span className="required">*</span></label>
            <select id="pd-cat" className={`form-input${errors.category ? ' error' : ''}`} value={form.category} onChange={set('category')}>
              <option value="">Select category…</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            {errors.category && <p className="form-error">{errors.category}</p>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="pd-desc">Description (optional)</label>
            <textarea id="pd-desc" className="form-input" placeholder="Grade, specification, standard, brand, etc."
              value={form.description} onChange={set('description')} rows={2} style={{ resize: 'vertical' }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="form-group">
              <label className="form-label" htmlFor="pd-unit">Unit <span className="required">*</span></label>
              <select id="pd-unit" className={`form-input${errors.unit ? ' error' : ''}`} value={form.unit} onChange={set('unit')}>
                {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
              {errors.unit && <p className="form-error">{errors.unit}</p>}
            </div>
            <Input id="pd-moq" label="Minimum Qty" type="number" min="0" step="0.01"
              value={form.minimumQuantity} onChange={set('minimumQuantity')} />
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="primary" loading={saving} disabled={saving}>
              {saving ? 'Saving…' : product ? 'Save Changes' : 'Add Product'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function SupplierProducts() {
  const [products,  setProducts]  = useState([])
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState('')
  const [modal,     setModal]     = useState(null) // null | 'add' | { product }
  const [deleting,  setDeleting]  = useState(null) // productId being deleted
  const [search,    setSearch]    = useState('')
  const [catFilter, setCatFilter] = useState('ALL')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await supplierService.listProducts()
      const list = res?.products || res?.data || []
      setProducts(Array.isArray(list) ? list : [])
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const handleSave = async (data) => {
    if (modal === 'add') {
      await supplierService.createProduct(data)
    } else {
      await supplierService.updateProduct(modal.product.id, data)
    }
    await load()
  }

  const handleDelete = async (id) => {
    setDeleting(id)
    try {
      await supplierService.deleteProduct(id)
      setProducts((p) => p.filter((x) => x.id !== id))
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setDeleting(null)
    }
  }

  const categories = ['ALL', ...new Set(products.map((p) => p.category).filter(Boolean))]

  const filtered = products.filter((p) => {
    const matchCat = catFilter === 'ALL' || p.category === catFilter
    const q = search.toLowerCase()
    const matchSearch = !q || p.name.toLowerCase().includes(q) ||
      (p.category || '').toLowerCase().includes(q) ||
      (p.description || '').toLowerCase().includes(q)
    return matchCat && matchSearch
  })

  return (
    <AppShell>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>Product Catalog</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 14, marginTop: 4 }}>
            {products.length > 0 ? `${products.length} product${products.length !== 1 ? 's' : ''} in your catalog` : 'Manage your products and services'}
          </p>
        </div>
        <Button variant="primary" onClick={() => setModal('add')}>+ Add Product</Button>
      </div>

      {error && <ErrorBanner message={error} onRetry={load} style={{ marginBottom: 20 }} />}

      {/* Filters */}
      {products.length > 0 && (
        <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: '1 1 200px' }}>
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: 'var(--color-text-muted)' }}>🔍</span>
            <input type="text" placeholder="Search products…" value={search} onChange={(e) => setSearch(e.target.value)}
              style={{ width: '100%', padding: '9px 12px 9px 36px', borderRadius: 8, border: '1px solid var(--color-border)', background: 'var(--color-surface, #fff)', fontSize: 14, color: 'var(--color-text)', outline: 'none', boxSizing: 'border-box' }} />
          </div>
          {categories.length > 2 && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {categories.map((c) => (
                <button key={c} onClick={() => setCatFilter(c)} style={{ padding: '6px 12px', borderRadius: 8, fontSize: 12, cursor: 'pointer', border: `1px solid ${catFilter === c ? 'var(--color-primary)' : 'var(--color-border)'}`, background: catFilter === c ? 'var(--color-primary)' : 'var(--color-surface, #fff)', color: catFilter === c ? '#fff' : 'var(--color-text)', fontWeight: 500 }}>
                  {c === 'ALL' ? 'All' : c}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Product list */}
      {loading ? (
        <div style={{ padding: 40 }}><Loading text="Loading products…" /></div>
      ) : filtered.length === 0 && products.length === 0 ? (
        <div style={{ background: 'var(--color-surface, #fff)', borderRadius: 14, border: '1px solid var(--color-border)', padding: '64px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📦</div>
          <h3 style={{ fontSize: 18, fontWeight: 600, margin: '0 0 8px' }}>No products yet</h3>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 14, marginBottom: 24, lineHeight: 1.5, maxWidth: 380, margin: '0 auto 24px' }}>
            Add your first product to the catalog. Buyers will see your products when searching for suppliers.
          </p>
          <Button variant="primary" onClick={() => setModal('add')}>Add First Product</Button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
          {filtered.map((p) => (
            <div key={p.id} style={{ background: 'var(--color-surface, #fff)', borderRadius: 12, border: '1px solid var(--color-border)', padding: '18px 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--color-text)', marginBottom: 4, wordBreak: 'break-word' }}>{p.name}</div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 11, fontWeight: 600, background: 'rgba(16,185,129,0.1)', color: '#10b981', padding: '2px 8px', borderRadius: 10 }}>{p.category}</span>
                    <span style={{ fontSize: 11, fontWeight: 600, background: 'rgba(99,102,241,0.1)', color: 'var(--color-primary)', padding: '2px 8px', borderRadius: 10 }}>{p.unit}</span>
                  </div>
                </div>
              </div>
              {p.description && (
                <p style={{ fontSize: 13, color: 'var(--color-text-muted)', lineHeight: 1.5, margin: '0 0 10px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                  {p.description}
                </p>
              )}
              <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 14 }}>
                Min. Qty: <strong style={{ color: 'var(--color-text)' }}>{p.minimumQuantity} {p.unit}</strong>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <Button variant="outline" size="sm" onClick={() => setModal({ product: p })}>Edit</Button>
                <Button variant="danger" size="sm" loading={deleting === p.id}
                  onClick={() => { if (window.confirm(`Delete "${p.name}"?`)) handleDelete(p.id) }}>
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit modal */}
      {modal && (
        <ProductModal
          product={modal === 'add' ? null : modal.product}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}
    </AppShell>
  )
}
