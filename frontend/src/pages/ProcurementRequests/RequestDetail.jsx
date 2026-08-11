import { useState, useEffect, useCallback } from "react"
import { useNavigate, useParams } from "react-router-dom"
import AppShell from "../../components/AppShell"
import Button from "../../components/Button"
import Loading from "../../components/Loading"
import ErrorBanner from "../../components/ErrorBanner"
import { procurementService } from "../../services/procurement.service"
import { getErrorMessage } from "../../utils/errorHandler"

// ─── Status badge ─────────────────────────────────────────────────────────────

const STATUS_META = {
  DRAFT:               { label:"Draft",               color:"#6b7280", bg:"rgba(107,114,128,0.08)" },
  ANALYZING:           { label:"Analyzing…",          color:"#f59e0b", bg:"rgba(245,158,11,0.08)"  },
  NEEDS_CLARIFICATION: { label:"Needs Clarification", color:"#ef4444", bg:"rgba(239,68,68,0.08)"  },
  READY_FOR_RFQ:       { label:"Ready for RFQ",      color:"#10b981", bg:"rgba(16,185,129,0.08)"  },
  RFQ_GENERATED:       { label:"RFQ Generated",      color:"#6366f1", bg:"rgba(99,102,241,0.08)"  },
  APPROVED:            { label:"Approved ✓",          color:"#059669", bg:"rgba(16,185,129,0.12)"  },
  CANCELLED:           { label:"Cancelled",           color:"#9ca3af", bg:"rgba(107,114,128,0.06)" },
}

function StatusBadge({ status }) {
  const m = STATUS_META[status] || STATUS_META.DRAFT
  return (
    <span style={{
      background:m.bg, color:m.color, padding:"4px 12px", borderRadius:20,
      fontSize:12, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.04em",
    }}>{m.label}</span>
  )
}

// ─── Requirement item card ────────────────────────────────────────────────────

function RequirementCard({ req }) {
  const specs = Array.isArray(req.specifications) ? req.specifications :
    (typeof req.specifications === "string" ? JSON.parse(req.specifications || "[]") : [])
  return (
    <div style={{
      background:"var(--color-surface,#fff)", border:"1px solid var(--color-border)",
      borderRadius:10, padding:"16px 20px",
    }}>
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
        <span style={{
          fontSize:11, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.06em",
          color:"var(--color-primary)", background:"rgba(99,102,241,0.08)", padding:"2px 8px", borderRadius:4,
        }}>{req.category}</span>
        <span style={{ fontWeight:600, fontSize:15, color:"var(--color-text)" }}>{req.productName || req.product_name}</span>
      </div>
      {req.description && <p style={{ fontSize:13, color:"var(--color-text-muted)", marginBottom:10, lineHeight:1.5 }}>{req.description}</p>}
      <div style={{ display:"flex", gap:20, flexWrap:"wrap", fontSize:13 }}>
        {(req.quantity || req.unit) && (
          <span><strong>Qty:</strong> {req.quantity ?? "TBD"} {req.unit}</span>
        )}
        {req.deliveryLocation && <span><strong>Delivery:</strong> {req.deliveryLocation}</span>}
        {req.requiredBy && <span><strong>Required by:</strong> {req.requiredBy}</span>}
      </div>
      {specs.length > 0 && (
        <div style={{ marginTop:10, display:"flex", flexWrap:"wrap", gap:6 }}>
          {specs.map((s, i) => (
            <span key={i} style={{ fontSize:12, background:"rgba(99,102,241,0.06)", color:"var(--color-text-muted)", padding:"2px 8px", borderRadius:4 }}>
              {s}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function RequestDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [request,      setRequest]      = useState(null)
  const [requirements, setRequirements] = useState([])
  const [questions,    setQuestions]    = useState([])
  const [answers,      setAnswers]      = useState({})   // questionId -> answer string
  const [saving,       setSaving]       = useState({})   // questionId -> bool
  const [loading,      setLoading]      = useState(true)
  const [actionLoading,setActionLoading]= useState(false)
  const [error,        setError]        = useState("")
  const [successMsg,   setSuccessMsg]   = useState("")

  const load = useCallback(async () => {
    if (!id) return
    setLoading(true); setError("")
    try {
      const [reqRes, reqs, qs] = await Promise.all([
        procurementService.get(id),
        procurementService.getRequirements(id).catch(() => ({ requirements: [] })),
        procurementService.getQuestions(id).catch(() => ({ questions: [] })),
      ])
      setRequest(reqRes?.request || reqRes)
      setRequirements(reqs?.requirements || [])
      const qList = qs?.questions || []
      setQuestions(qList)
      // Pre-fill existing answers
      const existing = {}
      qList.forEach(q => { if (q.answer) existing[q.id] = q.answer })
      setAnswers(existing)
    } catch (e) {
      setError(getErrorMessage(e))
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { load() }, [load])

  // ── Analyze ────────────────────────────────────────────────────────────────

  const handleAnalyze = async () => {
    setActionLoading(true); setError("")
    try {
      await procurementService.analyze(id)
      setSuccessMsg("Analysis complete!")
      setTimeout(() => setSuccessMsg(""), 3000)
      await load()
    } catch (e) {
      setError(getErrorMessage(e))
    } finally {
      setActionLoading(false)
    }
  }

  // ── Save single answer ─────────────────────────────────────────────────────

  const handleSaveAnswer = async (questionId) => {
    const answer = answers[questionId] || ""
    if (!answer.trim()) return
    setSaving(prev => ({ ...prev, [questionId]: true }))
    try {
      await procurementService.answerQuestion(id, questionId, { answer: answer.trim(), status: "ANSWERED" })
      setQuestions(prev => prev.map(q => q.id === questionId ? { ...q, answer: answer.trim(), status: "ANSWERED" } : q))
    } catch (e) {
      setError(getErrorMessage(e))
    } finally {
      setSaving(prev => ({ ...prev, [questionId]: false }))
    }
  }

  const handleSkipQuestion = async (questionId) => {
    setSaving(prev => ({ ...prev, [questionId]: true }))
    try {
      await procurementService.answerQuestion(id, questionId, { answer: "N/A", status: "SKIPPED" })
      setQuestions(prev => prev.map(q => q.id === questionId ? { ...q, status: "SKIPPED" } : q))
    } catch (e) {
      setError(getErrorMessage(e))
    } finally {
      setSaving(prev => ({ ...prev, [questionId]: false }))
    }
  }

  // ── Re-analyze ────────────────────────────────────────────────────────────

  const handleReanalyze = async () => {
    setActionLoading(true); setError("")
    try {
      await procurementService.reanalyze(id)
      setSuccessMsg("Re-analysis complete!")
      setTimeout(() => setSuccessMsg(""), 3000)
      await load()
    } catch (e) {
      setError(getErrorMessage(e))
    } finally {
      setActionLoading(false)
    }
  }

  // ── Generate RFQ ─────────────────────────────────────────────────────────

  const handleGenerateRFQ = async () => {
    setActionLoading(true); setError("")
    try {
      const res = await procurementService.generateRFQ(id)
      navigate(`/rfqs/${res?.rfqId}`)
    } catch (e) {
      setError(getErrorMessage(e))
      setActionLoading(false)
    }
  }

  // ─────────────────────────────────────────────────────────────────────────

  if (loading) return <AppShell><div style={{ padding:40 }}><Loading text="Loading request…" /></div></AppShell>
  if (!request && !loading) return (
    <AppShell>
      <ErrorBanner message="Procurement request not found." />
      <Button variant="outline" style={{ marginTop:16 }} onClick={() => navigate("/procurement-requests")}>Back to list</Button>
    </AppShell>
  )

  const status = request?.status || "DRAFT"
  const openQuestions   = questions.filter(q => q.status === "OPEN")
  const answeredQs      = questions.filter(q => q.status === "ANSWERED")
  const allAnswered     = questions.length > 0 && openQuestions.length === 0

  return (
    <AppShell>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Header */}
      <div style={{ display:"flex", alignItems:"flex-start", gap:12, flexWrap:"wrap", marginBottom:24 }}>
        <div style={{ flex:1, minWidth:0 }}>
          <button
            onClick={() => navigate("/procurement-requests")}
            style={{ background:"none", border:"none", cursor:"pointer", color:"var(--color-text-muted)", fontSize:13, padding:0, marginBottom:10, display:"flex", alignItems:"center", gap:4 }}
          >
            ← Procurement Requests
          </button>
          <div style={{ display:"flex", alignItems:"center", gap:12, flexWrap:"wrap" }}>
            <h1 style={{ fontSize:22, fontWeight:700, color:"var(--color-text)", margin:0 }}>{request?.title}</h1>
            <StatusBadge status={status} />
          </div>
          <p style={{ color:"var(--color-text-muted)", marginTop:6, fontSize:13 }}>
            Created {new Date(request?.createdAt).toLocaleDateString("en-IN", { day:"numeric", month:"long", year:"numeric" })}
          </p>
        </div>
      </div>

      {error && <ErrorBanner message={error} style={{ marginBottom:16 }} />}
      {successMsg && (
        <div style={{ background:"rgba(16,185,129,0.08)", border:"1px solid rgba(16,185,129,0.2)", borderRadius:8, padding:"12px 16px", marginBottom:16, color:"#059669", fontWeight:500, fontSize:14 }}>
          ✅ {successMsg}
        </div>
      )}

      <div style={{ display:"grid", gap:20 }}>

        {/* Raw Requirement */}
        <div style={{ background:"var(--color-surface,#fff)", border:"1px solid var(--color-border)", borderRadius:12, padding:"20px 24px" }}>
          <h3 style={{ fontSize:15, fontWeight:600, margin:"0 0 12px", color:"var(--color-text)" }}>📝 Your Requirement</h3>
          <p style={{ fontSize:14, color:"var(--color-text)", lineHeight:1.7, whiteSpace:"pre-wrap", margin:0 }}>{request?.rawRequirement}</p>
        </div>

        {/* AI Summary */}
        {request?.aiSummary && (
          <div style={{ background:"rgba(99,102,241,0.04)", border:"1px solid rgba(99,102,241,0.15)", borderRadius:12, padding:"20px 24px" }}>
            <h3 style={{ fontSize:15, fontWeight:600, margin:"0 0 10px", color:"var(--color-primary)" }}>🤖 AI Summary</h3>
            <p style={{ fontSize:14, color:"var(--color-text)", lineHeight:1.7, margin:0 }}>{request.aiSummary}</p>
          </div>
        )}

        {/* DRAFT → Analyze */}
        {status === "DRAFT" && (
          <div style={{ background:"var(--color-surface,#fff)", border:"1px dashed var(--color-primary)", borderRadius:12, padding:"24px", textAlign:"center" }}>
            <div style={{ fontSize:36, marginBottom:12 }}>🤖</div>
            <h3 style={{ fontWeight:700, fontSize:17, margin:"0 0 8px" }}>Ready to Analyze</h3>
            <p style={{ color:"var(--color-text-muted)", fontSize:14, marginBottom:20, maxWidth:400, margin:"0 auto 20px" }}>
              AI will extract structured requirements and identify missing information.
            </p>
            <Button variant="primary" size="lg" loading={actionLoading} onClick={handleAnalyze}>
              🤖 Analyze Requirement
            </Button>
          </div>
        )}

        {/* ANALYZING → spinner */}
        {status === "ANALYZING" && (
          <div style={{ background:"var(--color-surface,#fff)", border:"1px solid var(--color-border)", borderRadius:12, padding:"40px", textAlign:"center" }}>
            <div style={{ width:40, height:40, borderRadius:"50%", border:"4px solid rgba(99,102,241,0.15)", borderTopColor:"var(--color-primary)", animation:"spin 0.9s linear infinite", margin:"0 auto 16px" }} />
            <div style={{ fontWeight:600, fontSize:16, color:"var(--color-text)" }}>AI is analyzing your requirement…</div>
            <div style={{ color:"var(--color-text-muted)", fontSize:13, marginTop:8 }}>This usually takes 10–20 seconds.</div>
            <Button variant="outline" style={{ marginTop:20 }} onClick={load}>Refresh</Button>
          </div>
        )}

        {/* Extracted Requirements */}
        {requirements.length > 0 && (
          <div>
            <h3 style={{ fontSize:16, fontWeight:700, margin:"0 0 12px", color:"var(--color-text)" }}>
              📦 Extracted Requirements ({requirements.length} item{requirements.length !== 1 ? "s" : ""})
            </h3>
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {requirements.map((r) => <RequirementCard key={r.id} req={r} />)}
            </div>
          </div>
        )}

        {/* Clarification Questions */}
        {questions.length > 0 && (
          <div style={{ background:"var(--color-surface,#fff)", border:"1px solid var(--color-border)", borderRadius:12, padding:"20px 24px" }}>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
              <h3 style={{ fontSize:16, fontWeight:700, margin:0, color:"var(--color-text)" }}>
                ❓ Clarification Questions
              </h3>
              <span style={{
                fontSize:11, fontWeight:600, background: openQuestions.length > 0 ? "rgba(239,68,68,0.08)" : "rgba(16,185,129,0.08)",
                color: openQuestions.length > 0 ? "#ef4444" : "#10b981",
                padding:"2px 8px", borderRadius:10, letterSpacing:"0.04em",
              }}>
                {openQuestions.length} open · {answeredQs.length} answered
              </span>
            </div>

            <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
              {questions.map((q) => (
                <div key={q.id} style={{
                  borderRadius:9, padding:"14px 16px",
                  background: q.status === "ANSWERED" ? "rgba(16,185,129,0.04)" : q.status === "SKIPPED" ? "rgba(107,114,128,0.04)" : "rgba(245,158,11,0.04)",
                  border: `1px solid ${q.status === "ANSWERED" ? "rgba(16,185,129,0.15)" : q.status === "SKIPPED" ? "rgba(107,114,128,0.1)" : "rgba(245,158,11,0.15)"}`,
                }}>
                  <div style={{ fontSize:14, fontWeight:600, color:"var(--color-text)", marginBottom:4 }}>
                    {q.question}
                  </div>
                  {q.reason && (
                    <div style={{ fontSize:12, color:"var(--color-text-muted)", marginBottom:10, fontStyle:"italic" }}>
                      Why we need this: {q.reason}
                    </div>
                  )}

                  {q.status === "ANSWERED" ? (
                    <div style={{ fontSize:13, color:"#059669", fontWeight:500 }}>
                      ✅ {q.answer}
                    </div>
                  ) : q.status === "SKIPPED" ? (
                    <div style={{ fontSize:13, color:"#9ca3af" }}>⏭️ Skipped</div>
                  ) : (
                    <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginTop:8 }}>
                      <input
                        type="text"
                        value={answers[q.id] || ""}
                        onChange={(e) => setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                        onKeyDown={(e) => e.key === "Enter" && handleSaveAnswer(q.id)}
                        placeholder="Type your answer…"
                        style={{
                          flex:1, minWidth:180, padding:"8px 12px", borderRadius:7, fontSize:13, boxSizing:"border-box",
                          border:"1px solid var(--color-border)", background:"var(--color-surface,#fff)",
                          color:"var(--color-text)", outline:"none",
                        }}
                        onFocus={(e) => e.target.style.borderColor="var(--color-primary)"}
                        onBlur={(e) => e.target.style.borderColor="var(--color-border)"}
                      />
                      <Button
                        size="sm"
                        variant="primary"
                        loading={saving[q.id]}
                        disabled={!answers[q.id]?.trim() || saving[q.id]}
                        onClick={() => handleSaveAnswer(q.id)}
                      >Save</Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={saving[q.id]}
                        onClick={() => handleSkipQuestion(q.id)}
                      >Skip</Button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Re-analyze button */}
            {(allAnswered || answeredQs.length > 0) && status === "NEEDS_CLARIFICATION" && (
              <div style={{ marginTop:20, paddingTop:16, borderTop:"1px solid var(--color-border)" }}>
                <Button variant="primary" loading={actionLoading} onClick={handleReanalyze}>
                  🔄 Re-analyze with Answers
                </Button>
                <p style={{ fontSize:12, color:"var(--color-text-muted)", marginTop:8 }}>
                  AI will update the structured requirements using your answers.
                </p>
              </div>
            )}
          </div>
        )}

        {/* READY_FOR_RFQ → Generate RFQ */}
        {(status === "READY_FOR_RFQ" || (status === "NEEDS_CLARIFICATION" && requirements.length > 0)) && (
          <div style={{
            background:"rgba(16,185,129,0.04)", border:"1px solid rgba(16,185,129,0.2)",
            borderRadius:12, padding:"20px 24px",
          }}>
            <h3 style={{ fontSize:15, fontWeight:700, margin:"0 0 6px", color:"#059669" }}>
              ✅ {status === "READY_FOR_RFQ" ? "Requirement is ready" : "Proceed anyway"}
            </h3>
            <p style={{ fontSize:14, color:"var(--color-text-muted)", margin:"0 0 16px" }}>
              {status === "READY_FOR_RFQ"
                ? "AI has extracted all requirements. Generate a professional RFQ to send to suppliers."
                : "Requirements have been extracted. You can generate the RFQ now even with unanswered questions."}
            </p>
            <Button variant="primary" size="lg" loading={actionLoading} onClick={handleGenerateRFQ}>
              📄 Generate RFQ
            </Button>
          </div>
        )}

        {/* RFQ Generated / Approved */}
        {(status === "RFQ_GENERATED" || status === "APPROVED") && (
          <div style={{
            background: status === "APPROVED" ? "rgba(16,185,129,0.06)" : "rgba(99,102,241,0.04)",
            border: `1px solid ${status === "APPROVED" ? "rgba(16,185,129,0.2)" : "rgba(99,102,241,0.15)"}`,
            borderRadius:12, padding:"20px 24px",
          }}>
            <h3 style={{ fontSize:15, fontWeight:700, margin:"0 0 6px", color: status === "APPROVED" ? "#059669" : "var(--color-primary)" }}>
              {status === "APPROVED" ? "🎉 RFQ Approved" : "📄 RFQ Generated"}
            </h3>
            <p style={{ fontSize:14, color:"var(--color-text-muted)", margin:"0 0 16px" }}>
              {status === "APPROVED"
                ? "Your RFQ has been approved and is ready for supplier matching."
                : "Your RFQ has been generated. Review and approve it before it goes to suppliers."}
            </p>
            <div style={{ display:"flex", gap:10 }}>
              <Button variant="primary" onClick={() => navigate(`/procurement-requests/${id}/rfq`)}>
                View RFQ →
              </Button>
              {status !== "APPROVED" && (
                <Button variant="outline" loading={actionLoading} onClick={handleGenerateRFQ}>
                  Regenerate RFQ
                </Button>
              )}
            </div>
          </div>
        )}

      </div>
    </AppShell>
  )
}
