import { useState, useEffect, useCallback } from "react"
import { useNavigate, useParams } from "react-router-dom"
import AppShell from "../../components/AppShell"
import Button from "../../components/Button"
import Loading from "../../components/Loading"
import ErrorBanner from "../../components/ErrorBanner"
import { procurementService } from "../../services/procurement.service"
import { getErrorMessage } from "../../utils/errorHandler"

export default function RFQSuccess() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [rfq, setRFQ] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const load = useCallback(async () => {
    if (!id) return
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

  if (loading) return <AppShell><div style={{ padding:40 }}><Loading text="Loading…" /></div></AppShell>

  return (
    <AppShell>
      {error && <ErrorBanner message={error} style={{ marginBottom:16 }} />}

      <div style={{ maxWidth:560, margin:"40px auto", textAlign:"center" }}>
        {/* Success icon */}
        <div style={{
          width:80, height:80, borderRadius:"50%", background:"rgba(16,185,129,0.1)",
          display:"flex", alignItems:"center", justifyContent:"center",
          fontSize:40, margin:"0 auto 24px",
          border:"3px solid rgba(16,185,129,0.2)",
        }}>
          ✅
        </div>

        <h1 style={{ fontSize:26, fontWeight:700, color:"var(--color-text)", margin:"0 0 12px" }}>
          RFQ Approved!
        </h1>
        <p style={{ fontSize:15, color:"var(--color-text-muted)", lineHeight:1.7, marginBottom:32 }}>
          Your Request for Quotation has been approved and is ready for supplier matching.
          Supplier matching will be available in Phase 3.
        </p>

        {/* RFQ Details card */}
        {rfq && (
          <div style={{
            background:"var(--color-surface,#fff)", borderRadius:14, border:"1px solid var(--color-border)",
            padding:"20px 24px", textAlign:"left", marginBottom:32,
          }}>
            <div style={{ fontSize:12, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.06em", color:"var(--color-text-muted)", marginBottom:14 }}>
              RFQ Summary
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              <div style={{ display:"flex", gap:12 }}>
                <span style={{ fontSize:13, fontWeight:600, color:"var(--color-text-muted)", minWidth:140 }}>RFQ ID</span>
                <span style={{ fontSize:13, color:"var(--color-text)", fontFamily:"monospace" }}>
                  {id?.slice(0,8).toUpperCase()}…
                </span>
              </div>
              <div style={{ display:"flex", gap:12 }}>
                <span style={{ fontSize:13, fontWeight:600, color:"var(--color-text-muted)", minWidth:140 }}>Title</span>
                <span style={{ fontSize:13, color:"var(--color-text)" }}>{rfq.title}</span>
              </div>
              <div style={{ display:"flex", gap:12 }}>
                <span style={{ fontSize:13, fontWeight:600, color:"var(--color-text-muted)", minWidth:140 }}>Status</span>
                <span style={{
                  fontSize:12, fontWeight:600, background:"rgba(16,185,129,0.1)", color:"#059669",
                  padding:"2px 10px", borderRadius:20, textTransform:"uppercase",
                }}>
                  Approved
                </span>
              </div>
              <div style={{ display:"flex", gap:12 }}>
                <span style={{ fontSize:13, fontWeight:600, color:"var(--color-text-muted)", minWidth:140 }}>Created</span>
                <span style={{ fontSize:13, color:"var(--color-text)" }}>
                  {new Date(rfq.createdAt).toLocaleDateString("en-IN", { day:"numeric", month:"long", year:"numeric" })}
                </span>
              </div>
              {rfq.deliveryLocation && (
                <div style={{ display:"flex", gap:12 }}>
                  <span style={{ fontSize:13, fontWeight:600, color:"var(--color-text-muted)", minWidth:140 }}>Delivery</span>
                  <span style={{ fontSize:13, color:"var(--color-text)" }}>{rfq.deliveryLocation}</span>
                </div>
              )}
              {rfq.items?.length > 0 && (
                <div style={{ display:"flex", gap:12 }}>
                  <span style={{ fontSize:13, fontWeight:600, color:"var(--color-text-muted)", minWidth:140 }}>Line Items</span>
                  <span style={{ fontSize:13, color:"var(--color-text)" }}>{rfq.items.length} item{rfq.items.length !== 1 ? "s" : ""}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Phase 3 notice */}
        <div style={{
          background:"rgba(99,102,241,0.04)", border:"1px solid rgba(99,102,241,0.12)",
          borderRadius:12, padding:"16px 20px", marginBottom:28, textAlign:"left",
        }}>
          <div style={{ fontSize:13, fontWeight:600, color:"var(--color-primary)", marginBottom:6 }}>
            🚀 Next: Supplier Matching (Phase 3)
          </div>
          <div style={{ fontSize:13, color:"var(--color-text-muted)", lineHeight:1.6 }}>
            In Phase 3, your approved RFQ will be automatically matched with verified suppliers
            who can fulfill your requirements. Supplier responses will be collected and compared for you.
          </div>
        </div>

        {/* Actions */}
        <div style={{ display:"flex", gap:12, justifyContent:"center", flexWrap:"wrap" }}>
          <Button variant="primary" onClick={() => navigate(`/rfqs/${id}`)}>View RFQ</Button>
          <Button variant="outline" onClick={() => navigate("/procurement-requests")}>All Requests</Button>
        </div>
      </div>
    </AppShell>
  )
}
