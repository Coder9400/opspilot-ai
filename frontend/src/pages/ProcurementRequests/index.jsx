import { useState, useEffect, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import AppShell from "../../components/AppShell"
import Button from "../../components/Button"
import Loading from "../../components/Loading"
import ErrorBanner from "../../components/ErrorBanner"
import { procurementService } from "../../services/procurement.service"
import { getErrorMessage } from "../../utils/errorHandler"

const STATUS_META = {
  DRAFT:               { label: "Draft",              bg: "rgba(107,114,128,0.1)", color: "#6b7280" },
  ANALYZING:           { label: "Analyzing...",       bg: "rgba(245,158,11,0.1)",  color: "#f59e0b" },
  NEEDS_CLARIFICATION: { label: "Needs Clarification",bg: "rgba(239,68,68,0.1)",  color: "#ef4444" },
  READY_FOR_RFQ:       { label: "Ready for RFQ",     bg: "rgba(16,185,129,0.1)",  color: "#10b981" },
  RFQ_GENERATED:       { label: "RFQ Generated",     bg: "rgba(99,102,241,0.1)",  color: "#6366f1" },
  APPROVED:            { label: "Approved",           bg: "rgba(16,185,129,0.15)", color: "#059669" },
  CANCELLED:           { label: "Cancelled",          bg: "rgba(107,114,128,0.08)","color": "#9ca3af" },
}

function StatusBadge({ status }) {
  const m = STATUS_META[status] || STATUS_META.DRAFT
  return (
    <span style={{
      background: m.bg, color: m.color, padding: "3px 10px", borderRadius: 20,
      fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em",
      whiteSpace: "nowrap",
    }}>{m.label}</span>
  )
}

function getActionLabel(status) {
  switch (status) {
    case "DRAFT":               return "Analyze"
    case "ANALYZING":           return "Processing..."
    case "NEEDS_CLARIFICATION": return "Answer Questions"
    case "READY_FOR_RFQ":       return "Generate RFQ"
    case "RFQ_GENERATED":       return "View RFQ"
    case "APPROVED":            return "View RFQ"
    default:                    return "View"
  }
}

export default function ProcurementRequestsPage() {
  const navigate = useNavigate()
  const [requests, setRequests] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState("")

  const load = useCallback(async () => {
    setLoading(true); setError("")
    try {
      const res = await procurementService.list()
      setRequests(Array.isArray(res?.requests) ? res.requests : [])
    } catch (e) {
      setError(getErrorMessage(e))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const empty = requests.length === 0

  return (
    <AppShell>
      {/* Header */}
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:24, flexWrap:"wrap", gap:12 }}>
        <div>
          <h1 style={{ fontSize:24, fontWeight:700, color:"var(--color-text)", margin:0 }}>Procurement Requests</h1>
          <p style={{ color:"var(--color-text-muted)", marginTop:4, fontSize:14 }}>
            Describe what you need in plain language — AI handles the rest.
          </p>
        </div>
        <Button variant="primary" onClick={() => navigate("/procurement-requests/new")}>
          + New Request
        </Button>
      </div>

      {error && <ErrorBanner message={error} onRetry={load} style={{ marginBottom:20 }} />}

      {loading ? (
        <div style={{ padding:40 }}><Loading text="Loading procurement requests…" /></div>
      ) : empty ? (
        <div style={{
          background:"var(--color-surface,#fff)", borderRadius:16,
          border:"1px solid var(--color-border)", padding:"64px 24px", textAlign:"center",
        }}>
          <div style={{ fontSize:52, marginBottom:16 }}>📋</div>
          <h3 style={{ fontSize:20, fontWeight:700, margin:"0 0 8px" }}>No procurement requests yet</h3>
          <p style={{ color:"var(--color-text-muted)", fontSize:14, maxWidth:420, margin:"0 auto 28px", lineHeight:1.6 }}>
            Describe what materials or services you need in plain language. Our AI will extract structured requirements and generate a professional RFQ.
          </p>
          <Button variant="primary" size="lg" onClick={() => navigate("/procurement-requests/new")}>
            Create First Request
          </Button>
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {requests.map((r) => (
            <div
              key={r.id}
              style={{
                background:"var(--color-surface,#fff)", borderRadius:12,
                border:"1px solid var(--color-border)", padding:"18px 24px",
                display:"flex", alignItems:"center", gap:16, transition:"border-color 0.15s, box-shadow 0.15s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor="var(--color-primary)"; e.currentTarget.style.boxShadow="0 2px 8px rgba(99,102,241,0.1)" }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor="var(--color-border)"; e.currentTarget.style.boxShadow="none" }}
            >
              {/* Icon */}
              <div style={{ width:44, height:44, borderRadius:10, background:"rgba(99,102,241,0.08)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, flexShrink:0 }}>
                📝
              </div>

              {/* Info */}
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontWeight:600, fontSize:15, color:"var(--color-text)", marginBottom:3 }}>{r.title}</div>
                {r.aiSummary && (
                  <div style={{ fontSize:13, color:"var(--color-text-muted)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth:480 }}>
                    {r.aiSummary}
                  </div>
                )}
                <div style={{ fontSize:12, color:"var(--color-text-muted)", marginTop:4, display:"flex", gap:14, flexWrap:"wrap" }}>
                  {r.customerProjects?.name && <span>🏗️ {r.customerProjects.name}</span>}
                  <span>📅 {new Date(r.createdAt).toLocaleDateString("en-IN", { day:"numeric", month:"short", year:"numeric" })}</span>
                  {r.updatedAt !== r.createdAt && (
                    <span>✏️ Updated {new Date(r.updatedAt).toLocaleDateString("en-IN", { day:"numeric", month:"short" })}</span>
                  )}
                </div>
              </div>

              {/* Status + Action */}
              <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:10, flexShrink:0 }}>
                <StatusBadge status={r.status} />
                <button
                  onClick={() => navigate(`/procurement-requests/${r.id}`)}
                  style={{
                    fontSize:13, color:"var(--color-primary)", background:"none", border:"none",
                    cursor:"pointer", padding:0, fontWeight:500,
                  }}
                >
                  {getActionLabel(r.status)} →
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </AppShell>
  )
}
