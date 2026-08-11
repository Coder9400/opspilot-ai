import { useState, useEffect, useCallback } from "react"
import { useNavigate, useParams } from "react-router-dom"
import AppShell from "../../components/AppShell"
import Button from "../../components/Button"
import Loading from "../../components/Loading"
import ErrorBanner from "../../components/ErrorBanner"
import { procurementService } from "../../services/procurement.service"
import { getErrorMessage } from "../../utils/errorHandler"

function ItemRow({ item, index, onChange, onRemove }) {
  const specs = Array.isArray(item.specifications)
    ? item.specifications.join(", ")
    : (typeof item.specifications === "string" ? JSON.parse(item.specifications || "[]").join(", ") : "")

  return (
    <div style={{
      background:"var(--color-surface,#fff)", border:"1px solid var(--color-border)",
      borderRadius:10, padding:"16px 20px", position:"relative",
    }}>
      <button
        onClick={() => onRemove(index)}
        style={{ position:"absolute", top:12, right:14, background:"none", border:"none", cursor:"pointer", fontSize:16, color:"var(--color-text-muted)", lineHeight:1 }}
        title="Remove item"
      >×</button>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
        <div>
          <label style={{ fontSize:12, fontWeight:600, color:"var(--color-text-muted)", display:"block", marginBottom:4 }}>Category *</label>
          <input value={item.category || ""} onChange={(e) => onChange(index,"category",e.target.value)}
            placeholder="e.g. Steel" style={inputStyle} />
        </div>
        <div>
          <label style={{ fontSize:12, fontWeight:600, color:"var(--color-text-muted)", display:"block", marginBottom:4 }}>Product Name *</label>
          <input value={item.product_name || item.productName || ""} onChange={(e) => onChange(index,"product_name",e.target.value)}
            placeholder="e.g. Fe500 TMT Bars" style={inputStyle} />
        </div>
        <div style={{ gridColumn:"1/-1" }}>
          <label style={{ fontSize:12, fontWeight:600, color:"var(--color-text-muted)", display:"block", marginBottom:4 }}>Description</label>
          <input value={item.description || ""} onChange={(e) => onChange(index,"description",e.target.value)}
            placeholder="Brief description for suppliers" style={inputStyle} />
        </div>
        <div>
          <label style={{ fontSize:12, fontWeight:600, color:"var(--color-text-muted)", display:"block", marginBottom:4 }}>Quantity</label>
          <input type="number" value={item.quantity ?? ""} onChange={(e) => onChange(index,"quantity", e.target.value ? parseFloat(e.target.value) : null)}
            placeholder="e.g. 200" style={inputStyle} />
        </div>
        <div>
          <label style={{ fontSize:12, fontWeight:600, color:"var(--color-text-muted)", display:"block", marginBottom:4 }}>Unit</label>
          <input value={item.unit || ""} onChange={(e) => onChange(index,"unit",e.target.value)}
            placeholder="e.g. tons, bags, meters" style={inputStyle} />
        </div>
        <div style={{ gridColumn:"1/-1" }}>
          <label style={{ fontSize:12, fontWeight:600, color:"var(--color-text-muted)", display:"block", marginBottom:4 }}>Specifications</label>
          <input
            value={specs}
            onChange={(e) => onChange(index, "specifications", e.target.value.split(",").map(s => s.trim()).filter(Boolean))}
            placeholder="e.g. Fe500, IS:1786, 16mm dia (comma-separated)"
            style={inputStyle}
          />
        </div>
      </div>
    </div>
  )
}

const inputStyle = {
  width:"100%", padding:"9px 12px", borderRadius:7, fontSize:13, boxSizing:"border-box",
  border:"1px solid var(--color-border)", background:"var(--color-surface,#fff)",
  color:"var(--color-text)", outline:"none",
}

export default function EditRFQ() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [rfq,     setRFQ]     = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)
  const [error,   setError]   = useState("")

  // Form state
  const [title,    setTitle]    = useState("")
  const [desc,     setDesc]     = useState("")
  const [location, setLocation] = useState("")
  const [deadline, setDeadline] = useState("")
  const [terms,    setTerms]    = useState("")
  const [items,    setItems]    = useState([])

  const load = useCallback(async () => {
    if (!id) return
    setLoading(true)
    try {
      const res = await procurementService.getRFQ(id)
      const r = res?.rfq || res
      setRFQ(r)
      setTitle(r?.title || "")
      setDesc(r?.description || "")
      setLocation(r?.deliveryLocation || "")
      setDeadline(r?.responseDeadline ? r.responseDeadline.split("T")[0] : "")
      setTerms(r?.terms || "")
      const rawItems = (r?.items || []).map(item => ({
        ...item,
        product_name: item.productName || item.product_name || "",
        specifications: Array.isArray(item.specifications) ? item.specifications :
          (typeof item.specifications === "string" ? JSON.parse(item.specifications || "[]") : []),
      }))
      setItems(rawItems)
    } catch (e) {
      setError(getErrorMessage(e))
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { load() }, [load])

  const handleItemChange = (idx, field, value) => {
    setItems(prev => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item))
  }

  const handleRemoveItem = (idx) => {
    setItems(prev => prev.filter((_, i) => i !== idx))
  }

  const handleAddItem = () => {
    setItems(prev => [...prev, { category:"", product_name:"", description:"", quantity:null, unit:"", specifications:[] }])
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!title.trim()) { setError("Title is required."); return }
    if (items.some(item => !item.category?.trim() || !(item.product_name || item.productName)?.trim())) {
      setError("Each item must have a category and product name."); return
    }
    setSaving(true); setError("")
    try {
      await procurementService.updateRFQ(id, {
        title:             title.trim(),
        description:       desc.trim() || null,
        delivery_location: location.trim() || null,
        response_deadline: deadline || null,
        terms:             terms.trim() || null,
        items:             items.map(item => ({
          category:       item.category,
          product_name:   item.product_name || item.productName || "",
          description:    item.description || null,
          quantity:       item.quantity ?? null,
          unit:           item.unit || null,
          specifications: Array.isArray(item.specifications) ? item.specifications : [],
        })),
      })
      navigate(`/rfqs/${id}`)
    } catch (e) {
      setError(getErrorMessage(e))
      setSaving(false)
    }
  }

  if (loading) return <AppShell><div style={{ padding:40 }}><Loading text="Loading RFQ…" /></div></AppShell>

  return (
    <AppShell>
      <div style={{ marginBottom:24 }}>
        <button onClick={() => navigate(`/rfqs/${id}`)}
          style={{ background:"none", border:"none", cursor:"pointer", color:"var(--color-text-muted)", fontSize:13, padding:0, marginBottom:10 }}>
          ← Back to RFQ
        </button>
        <h1 style={{ fontSize:22, fontWeight:700, color:"var(--color-text)", margin:0 }}>Edit RFQ</h1>
        <p style={{ color:"var(--color-text-muted)", marginTop:6, fontSize:14 }}>
          Update the RFQ details and line items before approving.
        </p>
      </div>

      {error && <ErrorBanner message={error} style={{ marginBottom:16 }} />}

      <form onSubmit={handleSave}>
        <div style={{ display:"grid", gap:20, maxWidth:760 }}>

          {/* Title */}
          <div>
            <label style={{ fontSize:13, fontWeight:600, color:"var(--color-text)", display:"block", marginBottom:6 }}>RFQ Title *</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="RFQ title" style={{ ...inputStyle, padding:"11px 14px", fontSize:14 }} />
          </div>

          {/* Description */}
          <div>
            <label style={{ fontSize:13, fontWeight:600, color:"var(--color-text)", display:"block", marginBottom:6 }}>Scope Description</label>
            <textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={4} placeholder="Describe the overall scope…"
              style={{ ...inputStyle, padding:"11px 14px", fontSize:14, resize:"vertical", lineHeight:1.6, fontFamily:"inherit" }} />
          </div>

          {/* Grid: location + deadline */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
            <div>
              <label style={{ fontSize:13, fontWeight:600, color:"var(--color-text)", display:"block", marginBottom:6 }}>Delivery Location</label>
              <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Ahmedabad, Gujarat"
                style={{ ...inputStyle, padding:"11px 14px", fontSize:14 }} />
            </div>
            <div>
              <label style={{ fontSize:13, fontWeight:600, color:"var(--color-text)", display:"block", marginBottom:6 }}>Response Deadline</label>
              <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)}
                style={{ ...inputStyle, padding:"11px 14px", fontSize:14 }} />
            </div>
          </div>

          {/* Terms */}
          <div>
            <label style={{ fontSize:13, fontWeight:600, color:"var(--color-text)", display:"block", marginBottom:6 }}>Terms & Conditions</label>
            <textarea value={terms} onChange={(e) => setTerms(e.target.value)} rows={5} placeholder="Payment terms, delivery terms, warranty, etc."
              style={{ ...inputStyle, padding:"11px 14px", fontSize:14, resize:"vertical", lineHeight:1.6, fontFamily:"inherit" }} />
          </div>

          {/* Line Items */}
          <div>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
              <label style={{ fontSize:13, fontWeight:600, color:"var(--color-text)" }}>Line Items ({items.length})</label>
              <Button type="button" variant="outline" size="sm" onClick={handleAddItem}>+ Add Item</Button>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              {items.map((item, idx) => (
                <ItemRow key={idx} item={item} index={idx} onChange={handleItemChange} onRemove={handleRemoveItem} />
              ))}
              {items.length === 0 && (
                <div style={{ textAlign:"center", padding:"24px", color:"var(--color-text-muted)", fontSize:14, border:"1px dashed var(--color-border)", borderRadius:10 }}>
                  No items. Click "+ Add Item" to add line items.
                </div>
              )}
            </div>
          </div>

          {/* Save */}
          <div style={{ display:"flex", gap:12, paddingTop:4 }}>
            <Button type="submit" variant="primary" size="lg" loading={saving}>Save Changes</Button>
            <Button type="button" variant="outline" disabled={saving} onClick={() => navigate(`/rfqs/${id}`)}>Cancel</Button>
          </div>
        </div>
      </form>
    </AppShell>
  )
}
