import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import AppShell from '../../components/AppShell'
import Button from '../../components/Button'
import { PriorityBadge } from '../../components/Badge'
import Loading from '../../components/Loading'
import ErrorBanner from '../../components/ErrorBanner'
import EmptyState from '../../components/EmptyState'
import { enquiryService } from '../../services/enquiry.service'
import { getErrorMessage } from '../../utils/errorHandler'

const fmtCurrency = (v, cur = 'USD') => {
  if (v == null) return '—'
  try { return new Intl.NumberFormat('en-US', { style: 'currency', currency: cur, maximumFractionDigits: 0 }).format(v) } catch { return `${cur} ${v}` }
}

export default function AIAnalysis() {
  const navigate = useNavigate()
  const [enquiries, setEnquiries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const data = await enquiryService.list()
      setEnquiries(Array.isArray(data) ? data : data.enquiries || [])
    } catch (err) {
      setError(getErrorMessage(err))
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  // Filter for analyzed enquiries
  const analyzed = enquiries.filter(e => e.aiSummary || e.requirements)

  // Compute metrics
  const totalAnalyzed = analyzed.length
  
  const priorityCount = analyzed.reduce((acc, e) => {
    const p = (e.priority || 'MEDIUM').toUpperCase()
    acc[p] = (acc[p] || 0) + 1
    return acc
  }, { HIGH: 0, MEDIUM: 0, LOW: 0 })

  const budgetStats = analyzed.reduce((acc, e) => {
    if (e.budget && typeof e.budget === 'number') {
      acc.total += e.budget
      acc.count += 1
    }
    return acc
  }, { total: 0, count: 0 })

  const averageBudget = budgetStats.count > 0 ? budgetStats.total / budgetStats.count : 0

  return (
    <AppShell>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">AI Analysis</h1>
          <p className="page-subtitle">Aggregate intelligence from customer enquiries.</p>
        </div>
        <div className="page-header-right">
          <Button variant="outline" size="sm" onClick={load}>↻ Refresh</Button>
        </div>
      </div>

      {loading ? (
        <Loading text="Analyzing data…" />
      ) : error ? (
        <ErrorBanner message={error} onRetry={load} />
      ) : totalAnalyzed === 0 ? (
        <EmptyState
          icon="🧠"
          title="No analyzed enquiries"
          description="You haven't run AI analysis on any enquiries yet. Go to an enquiry and click 'Analyze Requirement'."
          actionLabel="View Enquiries"
          onAction={() => navigate('/enquiries')}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-8)' }}>
          {/* Global Metrics */}
          <div className="dash-grid">
            <div className="metric-card">
              <div className="metric-card-label">Total Analyzed</div>
              <div className="metric-card-value">{totalAnalyzed}</div>
            </div>
            <div className="metric-card">
              <div className="metric-card-label">High Priority</div>
              <div className="metric-card-value" style={{ color: 'var(--red-600)' }}>{priorityCount.HIGH}</div>
            </div>
            <div className="metric-card">
              <div className="metric-card-label">Avg. Identified Budget</div>
              <div className="metric-card-value">{fmtCurrency(averageBudget)}</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--sp-6)' }}>
            {/* Priority Distribution */}
            <div className="card" style={{ padding: 'var(--sp-6)' }}>
              <h3 style={{ margin: '0 0 var(--sp-4)', fontSize: 'var(--fs-md)', color: 'var(--text-primary)' }}>Priority Distribution</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <PriorityBadge priority="high" /> <span>{priorityCount.HIGH}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <PriorityBadge priority="medium" /> <span>{priorityCount.MEDIUM}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <PriorityBadge priority="low" /> <span>{priorityCount.LOW}</span>
                </div>
              </div>
            </div>

            {/* Budget Analytics */}
            <div className="card" style={{ padding: 'var(--sp-6)' }}>
              <h3 style={{ margin: '0 0 var(--sp-4)', fontSize: 'var(--fs-md)', color: 'var(--text-primary)' }}>Budget Insights</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: 'var(--fs-sm)' }}>Total Pipeline Budget</span> 
                  <span style={{ fontWeight: 600 }}>{fmtCurrency(budgetStats.total)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: 'var(--fs-sm)' }}>Enquiries with Budget</span> 
                  <span style={{ fontWeight: 600 }}>{budgetStats.count} / {totalAnalyzed}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Analyzed List */}
          <div>
            <h2 style={{ fontSize: 'var(--fs-lg)', marginBottom: 'var(--sp-4)' }}>Recent AI Extractions</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
              {analyzed.map(e => (
                <div key={e.id} className="card" style={{ padding: 'var(--sp-6)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div>
                      <h4 style={{ margin: '0 0 4px', fontSize: 'var(--fs-md)' }}>{e.customerName || e.customer}</h4>
                      <p style={{ margin: 0, fontSize: 'var(--fs-sm)', color: 'var(--text-muted)' }}>{e.subject}</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => navigate(`/enquiries/${e.id}`)}>View Detail</Button>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--sp-4)', background: 'var(--bg-body)', padding: 'var(--sp-4)', borderRadius: 'var(--r-md)' }}>
                    <div>
                      <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 4, letterSpacing: '0.05em', fontWeight: 600 }}>Requirements Extracted</div>
                      <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-primary)' }}>
                        {e.requirements?.length > 0 ? e.requirements.length + ' points' : 'None'}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 4, letterSpacing: '0.05em', fontWeight: 600 }}>Budget</div>
                      <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-primary)' }}>
                        {e.budget ? fmtCurrency(e.budget, e.currency) : 'Not provided'}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 4, letterSpacing: '0.05em', fontWeight: 600 }}>Missing Info</div>
                      <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--amber-600)' }}>
                        {e.missingQuestions?.length > 0 ? e.missingQuestions.length + ' questions' : 'None'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </AppShell>
  )
}
