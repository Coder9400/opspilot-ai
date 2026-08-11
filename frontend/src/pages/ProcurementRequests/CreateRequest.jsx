import { useState, useEffect, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import AppShell from "../../components/AppShell"
import Button from "../../components/Button"
import Loading from "../../components/Loading"
import ErrorBanner from "../../components/ErrorBanner"
import { procurementService } from "../../services/procurement.service"
import { projectService } from "../../services/project.service"
import { getErrorMessage } from "../../utils/errorHandler"

const EXAMPLE_PLACEHOLDER = `Describe what you need in plain language. For example:

"I am constructing a 5-floor commercial building in Ahmedabad. I need approximately 200 tons of Fe500 steel, 1500 bags of OPC 53 grade cement, and basic electrical materials including cables and switchgear. Delivery required within 3 months at the site."`

export default function CreateProcurementRequest() {
  const navigate = useNavigate()
  const [title,       setTitle]       = useState("")
  const [requirement, setRequirement] = useState("")
  const [projectId,   setProjectId]   = useState("")
  const [projects,    setProjects]    = useState([])
  const [loading,     setLoading]     = useState(false)
  const [analyzing,   setAnalyzing]   = useState(false)
  const [error,       setError]       = useState("")
  const [charCount,   setCharCount]   = useState(0)

  // Load projects for optional linking
  const loadProjects = useCallback(async () => {
    try {
      const res = await projectService.list()
      const list = res?.projects || res?.data || []
      setProjects(Array.isArray(list) ? list.filter(p => p.status !== "ARCHIVED") : [])
    } catch {}
  }, [])

  useEffect(() => { loadProjects() }, [loadProjects])

  const handleRequirementChange = (e) => {
    setRequirement(e.target.value)
    setCharCount(e.target.value.length)
  }

  const handleSubmitAndAnalyze = async (e) => {
    e.preventDefault()
    if (!title.trim()) { setError("Please provide a title for this request."); return }
    if (requirement.trim().length < 20) { setError("Please describe your requirement in more detail (at least 20 characters)."); return }

    setError("")
    setLoading(true)
    try {
      // 1. Create the request
      const createRes = await procurementService.create({
        title: title.trim(),
        raw_requirement: requirement.trim(),
        project_id: projectId || null,
      })
      const requestId = createRes?.request?.id
      if (!requestId) throw new Error("Failed to create procurement request")

      // 2. Immediately analyze
      setAnalyzing(true)
      await procurementService.analyze(requestId)

      // 3. Navigate to detail page
      navigate(`/procurement-requests/${requestId}`)
    } catch (err) {
      setError(getErrorMessage(err))
      setLoading(false)
      setAnalyzing(false)
    }
  }

  const handleSaveDraft = async (e) => {
    e.preventDefault()
    if (!title.trim()) { setError("Please provide a title for this request."); return }
    if (requirement.trim().length < 20) { setError("Please describe your requirement in more detail."); return }

    setError("")
    setLoading(true)
    try {
      const createRes = await procurementService.create({
        title: title.trim(),
        raw_requirement: requirement.trim(),
        project_id: projectId || null,
      })
      navigate(`/procurement-requests/${createRes?.request?.id}`)
    } catch (err) {
      setError(getErrorMessage(err))
      setLoading(false)
    }
  }

  const isProcessing = loading || analyzing

  return (
    <AppShell>
      {/* Header */}
      <div style={{ marginBottom:28 }}>
        <button
          onClick={() => navigate("/procurement-requests")}
          style={{ background:"none", border:"none", cursor:"pointer", color:"var(--color-text-muted)", fontSize:14, padding:0, marginBottom:12, display:"flex", alignItems:"center", gap:6 }}
        >
          ← Back to Requests
        </button>
        <h1 style={{ fontSize:24, fontWeight:700, color:"var(--color-text)", margin:0 }}>New Procurement Request</h1>
        <p style={{ color:"var(--color-text-muted)", marginTop:6, fontSize:14, lineHeight:1.5 }}>
          Describe what you need in plain language. AI will extract structured requirements and identify missing information.
        </p>
      </div>

      {error && <ErrorBanner message={error} style={{ marginBottom:20 }} />}

      <form onSubmit={handleSubmitAndAnalyze}>
        <div style={{ display:"grid", gap:20, maxWidth:720 }}>
          {/* Title */}
          <div>
            <label style={{ display:"block", fontSize:13, fontWeight:600, color:"var(--color-text)", marginBottom:6 }}>
              Request Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder='e.g. "Commercial Building — Steel & Cement Supply"'
              disabled={isProcessing}
              style={{
                width:"100%", padding:"11px 14px", borderRadius:9, fontSize:14, boxSizing:"border-box",
                border: "1px solid var(--color-border)", background:"var(--color-surface,#fff)",
                color:"var(--color-text)", outline:"none",
              }}
              onFocus={(e) => e.target.style.borderColor="var(--color-primary)"}
              onBlur={(e) => e.target.style.borderColor="var(--color-border)"}
            />
          </div>

          {/* Project (optional) */}
          {projects.length > 0 && (
            <div>
              <label style={{ display:"block", fontSize:13, fontWeight:600, color:"var(--color-text)", marginBottom:6 }}>
                Link to Project <span style={{ fontWeight:400, color:"var(--color-text-muted)" }}>(optional)</span>
              </label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                disabled={isProcessing}
                style={{
                  width:"100%", padding:"11px 14px", borderRadius:9, fontSize:14, boxSizing:"border-box",
                  border:"1px solid var(--color-border)", background:"var(--color-surface,#fff)",
                  color:"var(--color-text)", outline:"none", cursor:"pointer",
                }}
              >
                <option value="">— No project —</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Requirement textarea */}
          <div>
            <label style={{ display:"block", fontSize:13, fontWeight:600, color:"var(--color-text)", marginBottom:6 }}>
              Describe Your Requirement *
            </label>
            <p style={{ fontSize:12, color:"var(--color-text-muted)", marginBottom:8, lineHeight:1.5 }}>
              Include: what you need, quantities, specifications, delivery location, and timeline. The more detail you provide, the better the AI analysis.
            </p>
            <textarea
              value={requirement}
              onChange={handleRequirementChange}
              placeholder={EXAMPLE_PLACEHOLDER}
              disabled={isProcessing}
              rows={10}
              style={{
                width:"100%", padding:"12px 14px", borderRadius:9, fontSize:14, boxSizing:"border-box",
                border:"1px solid var(--color-border)", background:"var(--color-surface,#fff)",
                color:"var(--color-text)", outline:"none", resize:"vertical", lineHeight:1.7,
                fontFamily:"inherit",
              }}
              onFocus={(e) => e.target.style.borderColor="var(--color-primary)"}
              onBlur={(e) => e.target.style.borderColor="var(--color-border)"}
            />
            <div style={{ display:"flex", justifyContent:"space-between", marginTop:6 }}>
              <span style={{ fontSize:12, color:"var(--color-text-muted)" }}>
                {charCount < 50 ? "⚠️ Add more detail for better AI analysis" : charCount < 150 ? "✅ Good — more detail improves accuracy" : "✅ Excellent detail"}
              </span>
              <span style={{ fontSize:12, color:"var(--color-text-muted)" }}>{charCount} chars</span>
            </div>
          </div>

          {/* AI processing indicator */}
          {analyzing && (
            <div style={{
              background:"rgba(99,102,241,0.06)", border:"1px solid rgba(99,102,241,0.2)",
              borderRadius:10, padding:"16px 20px", display:"flex", alignItems:"center", gap:12,
            }}>
              <div style={{ width:20, height:20, borderRadius:"50%", border:"3px solid rgba(99,102,241,0.2)", borderTopColor:"var(--color-primary)", animation:"spin 0.8s linear infinite" }} />
              <div>
                <div style={{ fontWeight:600, fontSize:14, color:"var(--color-primary)" }}>AI is analyzing your requirement…</div>
                <div style={{ fontSize:13, color:"var(--color-text-muted)", marginTop:2 }}>Extracting structured requirements and identifying missing information.</div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div style={{ display:"flex", gap:12, flexWrap:"wrap", paddingTop:4 }}>
            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={isProcessing}
              disabled={isProcessing}
            >
              {analyzing ? "Analyzing…" : "🤖 Analyze Requirement"}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="lg"
              disabled={isProcessing}
              onClick={handleSaveDraft}
            >
              Save as Draft
            </Button>
            <Button
              type="button"
              variant="ghost"
              disabled={isProcessing}
              onClick={() => navigate("/procurement-requests")}
            >
              Cancel
            </Button>
          </div>
        </div>
      </form>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </AppShell>
  )
}
