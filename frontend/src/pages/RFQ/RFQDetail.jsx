import { useState, useEffect, useCallback } from "react"
import { useNavigate, useParams } from "react-router-dom"
import AppShell from "../../components/AppShell"
import Button from "../../components/Button"
import Loading from "../../components/Loading"
import ErrorBanner from "../../components/ErrorBanner"
import { procurementService } from "../../services/procurement.service"
import { getErrorMessage } from "../../utils/errorHandler"

function InfoRow({ label, value }) {
  if (!value) return null
  return (
    <div style={{ display:"flex", gap:12, marginBottom:10 }}>
      <span style={{ fontSize:13, fontWeight:600, color:"var(--color-text-muted)", minWidth:160, flexShrink:0 }}>{label}</span>
      <span style={{ fontSize:13, color:"var(--color-text)", lineHeight:1.5 }}>{value}</span>
    </div>
  )
}

export default function RFQDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [rfq,     setRFQ]     = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState("")
  const [approving, setApproving] = useState(false)
  const [approved,  setApproved]  = useState(false)

  const load = useCallback(async () => {
    if (!id) return
    setLoading(true); setError("")
    try {
      const res = await procurementService.getRFQ(id)
      setRFQ(res?.rfq || res)
    } catch (e) {
      setError(getErrorMessage(e))
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { load() }, [load])

  const handleApprove = async () => {
    if (!window.confirm("Approve this RFQ? Once approved, it will be marked as ready for supplier matching.")) return
    setApproving(true); setError("")
    try {
      await procurementService.approveRFQ(id)
      setApproved(true)
      navigate(`/rfqs/${id}/success`)
    } catch (e) {
      setError(getErrorMessage(e))
      setApproving(false)
    }
  }

  if (loading) return <AppShell><div style={{ padding:40 }}><Loading text="Loading RFQ…" /></div></AppShell>
  if (!rfq && !loading) return (
    <AppShell>
      <ErrorBanner message="RFQ not found." />
      <Button variant="outline" style={{ marginTop:16 }} onClick={() => navigate("/procurement-requests")}>Back to requests</Button>
    </AppShell>
  )

  const items = rfq?.items || []
  const company = rfq?.company || {}
  const procReq = rfq?.procurementRequest || {}
  const isApproved = rfq?.status === "APPROVED"

  return (
    <AppShell>
      {/* Back nav */}
      <div style={{ marginBottom:20 }}>
        <button
          onClick={() => navigate(procReq?.id ? `/procurement-requests/${procReq.id}` : "/procurement-requests")}
          style={{ background:"none", border:"none", cursor:"pointer", color:"var(--color-text-muted)", fontSize:13, padding:0, display:"flex", alignItems:"center", gap:4 }}
        >
          ← Back to Request
        </button>
      </div>

      {error && <ErrorBanner message={error} style={{ marginBottom:16 }} />}

      {/* RFQ Card */}
      <div style={{ maxWidth:800, margin:"0 auto" }}>

        {/* Header block */}
        <div style={{
          background:"var(--color-surface,#fff)", borderRadius:14, border:"1px solid var(--color-border)",
          padding:"28px 32px", marginBottom:16,
        }}>
          {/* Status + Company */}
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12, marginBottom:20 }}>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <div style={{ width:36, height:36, borderRadius:8, background:"rgba(99,102,241,0.1)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>
                📋
              </div>
              <div>
                <div style={{ fontSize:11, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.06em", color:"var(--color-text-muted)" }}>
                  Request for Quotation
                </div>
                <div style={{ fontSize:11, color:"var(--color-text-muted)" }}>
                  RFQ #{id?.slice(0, 8).toUpperCase()}
                </div>
              </div>
            </div>
            <span style={{
              background: isApproved ? "rgba(16,185,129,0.1)" : "rgba(99,102,241,0.08)",
              color: isApproved ? "#059669" : "var(--color-primary)",
              padding:"5px 14px", borderRadius:20, fontSize:12, fontWeight:600, textTransform:"uppercase",
            }}>
              {isApproved ? "✓ Approved" : rfq?.status?.replace(/_/g," ")}
            </span>
          </div>

          {/* Title */}
          <h1 style={{ fontSize:22, fontWeight:700, color:"var(--color-text)", margin:"0 0 16px", lineHeight:1.3 }}>
            {rfq?.title}
          </h1>

          {/* Company Info */}
          {company?.name && (
            <div style={{ background:"rgba(107,114,128,0.04)", borderRadius:8, padding:"12px 16px", marginBottom:16, fontSize:13 }}>
              <div style={{ fontWeight:700, fontSize:14, marginBottom:4 }}>{company.name}</div>
              {company.email && <div style={{ color:"var(--color-text-muted)" }}>✉ {company.email}</div>}
              {company.phone && <div style={{ color:"var(--color-text-muted)" }}>📞 {company.phone}</div>}
              {(company.city || company.state) && <div style={{ color:"var(--color-text-muted)" }}>📍 {[company.city, company.state, company.country].filter(Boolean).join(", ")}</div>}
            </div>
          )}

          {/* Key Details */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"4px 32px", marginBottom: rfq?.description ? 16 : 0 }}>
            <InfoRow label="Delivery Location"  value={rfq?.deliveryLocation} />
            <InfoRow label="Response Deadline"  value={rfq?.responseDeadline ? new Date(rfq.responseDeadline).toLocaleDateString("en-IN", { day:"numeric", month:"long", year:"numeric" }) : null} />
            <InfoRow label="Created"            value={new Date(rfq?.createdAt).toLocaleDateString("en-IN", { day:"numeric", month:"long", year:"numeric" })} />
          </div>

          {/* Description */}
          {rfq?.description && (
            <div style={{ marginTop:16 }}>
              <div style={{ fontSize:13, fontWeight:600, color:"var(--color-text)", marginBottom:6 }}>Scope of Requirement</div>
              <p style={{ fontSize:14, color:"var(--color-text)", lineHeight:1.7, margin:0, whiteSpace:"pre-wrap" }}>{rfq.description}</p>
            </div>
          )}
        </div>

        {/* Line Items */}
        <div style={{ background:"var(--color-surface,#fff)", borderRadius:14, border:"1px solid var(--color-border)", padding:"24px 32px", marginBottom:16 }}>
          <h2 style={{ fontSize:16, fontWeight:700, margin:"0 0 16px", color:"var(--color-text)" }}>
            Line Items ({items.length})
          </h2>

          {items.length === 0 ? (
            <p style={{ color:"var(--color-text-muted)", fontSize:14 }}>No items found.</p>
          ) : (
            <div style={{ overflowX:"auto" }}>
              <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
                <thead>
                  <tr style={{ borderBottom:"2px solid var(--color-border)" }}>
                    {["#","Category","Product","Qty","Unit","Specifications"].map((h,i) => (
                      <th key={i} style={{ padding:"8px 12px", textAlign:"left", fontWeight:600, color:"var(--color-text-muted)", fontSize:12, textTransform:"uppercase", letterSpacing:"0.05em", whiteSpace:"nowrap" }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => {
                    const specs = Array.isArray(item.specifications) ? item.specifications :
                      (typeof item.specifications === "string" ? JSON.parse(item.specifications || "[]") : [])
                    return (
                      <tr key={item.id || idx} style={{ borderBottom:"1px solid var(--color-border)" }}>
                        <td style={{ padding:"12px 12px", color:"var(--color-text-muted)", fontSize:12 }}>{idx+1}</td>
                        <td style={{ padding:"12px 12px" }}>
                          <span style={{ background:"rgba(99,102,241,0.08)", color:"var(--color-primary)", padding:"2px 8px", borderRadius:4, fontSize:11, fontWeight:600, textTransform:"uppercase" }}>
                            {item.category}
                          </span>
                        </td>
                        <td style={{ padding:"12px 12px" }}>
                          <div style={{ fontWeight:600, color:"var(--color-text)" }}>{item.productName || item.product_name}</div>
                          {item.description && <div style={{ color:"var(--color-text-muted)", fontSize:12, marginTop:2, maxWidth:220 }}>{item.description}</div>}
                        </td>
                        <td style={{ padding:"12px 12px", fontWeight:600, color:"var(--color-text)", whiteSpace:"nowrap" }}>
                          {item.quantity ?? "—"}
                        </td>
                        <td style={{ padding:"12px 12px", color:"var(--color-text-muted)", whiteSpace:"nowrap" }}>
                          {item.unit || "—"}
                        </td>
                        <td style={{ padding:"12px 12px" }}>
                          {specs.length > 0 ? (
                            <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
                              {specs.map((s,si) => (
                                <span key={si} style={{ fontSize:11, background:"rgba(107,114,128,0.08)", color:"var(--color-text-muted)", padding:"2px 6px", borderRadius:4 }}>{s}</span>
                              ))}
                            </div>
                          ) : <span style={{ color:"var(--color-text-muted)" }}>—</span>}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Terms */}
        {rfq?.terms && (
          <div style={{ background:"var(--color-surface,#fff)", borderRadius:14, border:"1px solid var(--color-border)", padding:"24px 32px", marginBottom:16 }}>
            <h2 style={{ fontSize:16, fontWeight:700, margin:"0 0 12px", color:"var(--color-text)" }}>Terms & Conditions</h2>
            <p style={{ fontSize:13, color:"var(--color-text)", lineHeight:1.8, margin:0, whiteSpace:"pre-wrap" }}>{rfq.terms}</p>
          </div>
        )}

        {/* Action bar */}
        {!isApproved && (
          <div style={{ display:"flex", gap:12, flexWrap:"wrap", paddingTop:4 }}>
            <Button variant="primary" size="lg" loading={approving} onClick={handleApprove}>
              ✅ Approve RFQ
            </Button>
            <Button variant="outline" onClick={() => navigate(`/rfqs/${id}/edit`)}>
              ✏️ Edit RFQ
            </Button>
          </div>
        )}

        {isApproved && (
          <div style={{ background:"rgba(16,185,129,0.06)", border:"1px solid rgba(16,185,129,0.2)", borderRadius:12, padding:"20px 24px" }}>
            <div style={{ fontWeight:700, fontSize:16, color:"#059669", marginBottom:6 }}>🎉 RFQ Approved</div>
            <div style={{ fontSize:14, color:"var(--color-text-muted)" }}>
              This RFQ is ready for supplier matching. Supplier matching will be available in Phase 3.
            </div>
          </div>
        )}
      </div>
    </AppShell>
  )
}
