import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import AppShell from '../../components/AppShell'
import Button from '../../components/Button'
import Loading from '../../components/Loading'
import ErrorBanner from '../../components/ErrorBanner'
import { useAuth } from '../../hooks/useAuth'
import { supplierService } from '../../services/supplier.service'
import { getErrorMessage } from '../../utils/errorHandler'

function StatCard({ icon, label, value, bg = 'rgba(16,185,129,0.08)' }) {
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

function ComingSoon({ icon, title, phase, desc }) {
  return (
    <div style={{
      background: 'var(--color-surface, #fff)', borderRadius: 14, padding: '28px 24px',
      border: '1px dashed var(--color-border)', textAlign: 'center',
    }}>
      <div style={{ fontSize: 32, marginBottom: 10 }}>{icon}</div>
      <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-text)', marginBottom: 4 }}>{title}</div>
      <div style={{ fontSize: 12, fontWeight: 600, color: '#10b981', background: 'rgba(16,185,129,0.1)', display: 'inline-block', padding: '2px 8px', borderRadius: 10, marginBottom: 8 }}>
        {phase}
      </div>
      <div style={{ fontSize: 13, color: 'var(--color-text-muted)', lineHeight: 1.5 }}>{desc}</div>
    </div>
  )
}

// Profile completion checker
function profileScore(profile) {
  if (!profile) return 0
  const fields = ['description', 'businessCategory', 'serviceAreas', 'capacity', 'deliveryInformation']
  const filled = fields.filter((f) => profile[f] && (Array.isArray(profile[f]) ? profile[f].length > 0 : String(profile[f]).trim()))
  return Math.round((filled.length / fields.length) * 100)
}

export default function SupplierDashboard() {
  const navigate = useNavigate()
  const { user, company } = useAuth()

  const [stats,   setStats]   = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [statsRes, profRes] = await Promise.all([
        supplierService.getStats(),
        supplierService.getProfile(),
      ])
      setStats(statsRes?.stats || statsRes)
      setProfile(profRes?.profile || profRes)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const firstName = (user?.fullName || user?.name || '').split(' ')[0] || 'there'
  const completion = profileScore(profile)

  return (
    <AppShell>
      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>
            Good day, {firstName} 👋
          </h1>
          <p style={{ color: 'var(--color-text-muted)', marginTop: 4, fontSize: 14 }}>
            {company?.name ? `Supplier workspace for ${company.name}` : 'Welcome to your supplier workspace'}
          </p>
        </div>
        <Button variant="primary" onClick={() => navigate('/supplier/products')}>
          Manage Products
        </Button>
      </div>

      {error && <ErrorBanner message={error} onRetry={load} style={{ marginBottom: 24 }} />}

      {/* ── Profile completion banner ── */}
      {!loading && completion < 80 && (
        <div style={{
          background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)',
          borderRadius: 12, padding: '16px 20px', marginBottom: 24,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 20 }}>⚠️</span>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--color-text)' }}>
                Profile {completion}% complete
              </div>
              <div style={{ fontSize: 13, color: 'var(--color-text-muted)', marginTop: 2 }}>
                A complete profile improves your visibility to buyers. Fill in your description, categories, and capacity.
              </div>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate('/supplier/profile')}>
            Complete Profile
          </Button>
        </div>
      )}

      {/* ── Stats ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16, marginBottom: 32 }}>
        {loading ? (
          <div style={{ gridColumn: '1/-1' }}><Loading text="Loading stats…" /></div>
        ) : (
          <>
            <StatCard icon="📦" label="Total Products"   value={stats?.totalProducts ?? 0} bg="rgba(16,185,129,0.08)" />
            <StatCard icon="🏷️" label="Categories"       value={stats?.categories ?? 0}    bg="rgba(99,102,241,0.08)" />
            <StatCard icon="👤" label="Profile Complete" value={`${completion}%`}           bg="rgba(245,158,11,0.08)" />
            <StatCard icon="🎯" label="Opportunities"    value="—"                          bg="rgba(107,114,128,0.08)" />
          </>
        )}
      </div>

      {/* ── Products quick list ── */}
      <div style={{ background: 'var(--color-surface, #fff)', borderRadius: 14, border: '1px solid var(--color-border)', overflow: 'hidden', marginBottom: 32 }}>
        <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-text)', margin: 0 }}>Product Catalog</h2>
          <button
            onClick={() => navigate('/supplier/products')}
            style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', fontSize: 13, fontWeight: 500 }}
          >
            Manage →
          </button>
        </div>
        {loading ? (
          <div style={{ padding: 32 }}><Loading text="Loading products…" /></div>
        ) : !stats?.totalProducts ? (
          <div style={{ padding: '48px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📦</div>
            <h3 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 8px' }}>No products yet</h3>
            <p style={{ color: 'var(--color-text-muted)', fontSize: 14, marginBottom: 20, lineHeight: 1.5 }}>
              Add products to your catalog. Buyers will see them when matching procurement requirements.
            </p>
            <Button variant="primary" onClick={() => navigate('/supplier/products')}>
              Add First Product
            </Button>
          </div>
        ) : (
          <div style={{ padding: '16px 24px', color: 'var(--color-text-muted)', fontSize: 14 }}>
            You have <strong style={{ color: 'var(--color-text)' }}>{stats.totalProducts}</strong> products across{' '}
            <strong style={{ color: 'var(--color-text)' }}>{stats.categories}</strong> categories.{' '}
            {stats.categoryList?.length > 0 && (
              <span>{stats.categoryList.slice(0, 4).join(', ')}{stats.categories > 4 ? ', and more.' : '.'}</span>
            )}
            <button
              onClick={() => navigate('/supplier/products')}
              style={{ marginLeft: 8, background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', fontSize: 14, fontWeight: 500, padding: 0 }}
            >
              View all →
            </button>
          </div>
        )}
      </div>

      {/* ── Coming Soon ── */}
      <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-text)', marginBottom: 16 }}>Coming Soon</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
        <ComingSoon icon="🎯" title="RFQ Opportunities" phase="Phase 3" desc="Receive matched procurement opportunities from verified buyers based on your products and service areas." />
        <ComingSoon icon="💬" title="Quotation Submission" phase="Phase 3" desc="Submit structured quotations or upload PDFs in response to buyer RFQs." />
        <ComingSoon icon="📊" title="Performance Analytics" phase="Phase 5" desc="Track win rate, response time, and buyer ratings to improve your procurement success." />
        <ComingSoon icon="🤝" title="Negotiation Tools" phase="Phase 5" desc="AI-assisted negotiation with buyers, counter-offer management, and deal tracking." />
      </div>
    </AppShell>
  )
}
