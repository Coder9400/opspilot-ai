import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import AppShell from "../../components/AppShell"
import Loading from "../../components/Loading"
import ErrorBanner from "../../components/ErrorBanner"
import Button from "../../components/Button"
import { procurementService } from "../../services/procurement.service"
import { getErrorMessage } from "../../utils/errorHandler"

/**
 * RequestRFQRedirect — loads the RFQ for a given procurement request
 * and redirects to /rfqs/:rfqId so users can navigate from request → RFQ.
 */
export default function RequestRFQRedirect() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [error, setError] = useState("")

  useEffect(() => {
    if (!id) return
    procurementService.listRFQs()
      .then(res => {
        const rfqs = res?.rfqs || []
        const match = rfqs.find(r => r.procurementRequestId === id || r.procurement_request_id === id)
        if (match) {
          navigate(`/rfqs/${match.id}`, { replace: true })
        } else {
          navigate(`/procurement-requests/${id}`, { replace: true })
        }
      })
      .catch(e => setError(getErrorMessage(e)))
  }, [id, navigate])

  if (error) return (
    <AppShell>
      <ErrorBanner message={error} />
      <Button variant="outline" style={{ marginTop:16 }} onClick={() => navigate(`/procurement-requests/${id}`)}>
        Back to Request
      </Button>
    </AppShell>
  )

  return <AppShell><div style={{ padding:40 }}><Loading text="Loading RFQ…" /></div></AppShell>
}
