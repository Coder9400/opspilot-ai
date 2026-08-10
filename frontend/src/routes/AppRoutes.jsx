import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from '../components/ProtectedRoute'

// ─── Public pages ─────────────────────────────────────────────────────────────
import Landing        from '../pages/Landing'
import Login          from '../pages/Login'
import Register       from '../pages/Register'
import SharedQuotation from '../pages/SharedQuotation'

// ─── Phase 1 — Core pages ─────────────────────────────────────────────────────
import Dashboard      from '../pages/Dashboard'

// Customer
import ProjectsPage   from '../pages/Projects'
import CreateProject  from '../pages/Projects/CreateProject'
import ProjectDetail  from '../pages/Projects/ProjectDetail'

// Supplier
import SupplierProfile  from '../pages/SupplierProfile'
import SupplierProducts from '../pages/SupplierProducts'

// Shared
import CompanySettings from '../pages/CompanySettings'

// ─── Legacy pages (preserved for Phase 2-5) ──────────────────────────────────
import Enquiries               from '../pages/Enquiries'
import EnquiryNew              from '../pages/EnquiryNew'
import EnquiryDetail           from '../pages/EnquiryDetail'
import AIAnalysis              from '../pages/AIAnalysis'
import Quotations              from '../pages/Quotations'
import QuotationDetail         from '../pages/QuotationDetail'
import FollowUps               from '../pages/FollowUps'
import ReceivedQuotations      from '../pages/ReceivedQuotations'
import ReceivedQuotationDetail from '../pages/ReceivedQuotations/ReceivedQuotationDetail'
import Settings                from '../pages/Settings'
import Approvals               from '../pages/Approvals'

function P({ children }) {
  return <ProtectedRoute>{children}</ProtectedRoute>
}

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ── Public ── */}
        <Route path="/"         element={<Landing />} />
        <Route path="/login"    element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/quotations/shared/:token" element={<SharedQuotation />} />

        {/* ── Phase 1: Dashboard ── */}
        <Route path="/dashboard" element={<P><Dashboard /></P>} />

        {/* ── Phase 1: Customer — Projects ── */}
        <Route path="/projects"         element={<P><ProjectsPage /></P>} />
        <Route path="/projects/new"     element={<P><CreateProject /></P>} />
        <Route path="/projects/:id"     element={<P><ProjectDetail /></P>} />

        {/* ── Phase 1: Supplier ── */}
        <Route path="/supplier/profile"  element={<P><SupplierProfile /></P>} />
        <Route path="/supplier/products" element={<P><SupplierProducts /></P>} />

        {/* ── Shared: Company settings ── */}
        <Route path="/company/settings" element={<P><CompanySettings /></P>} />

        {/* ── Legacy (Phase 2+) — preserved for reuse ── */}
        <Route path="/enquiries"            element={<P><Enquiries /></P>} />
        <Route path="/enquiries/new"        element={<P><EnquiryNew /></P>} />
        <Route path="/enquiries/:id"        element={<P><EnquiryDetail /></P>} />
        <Route path="/ai-analysis"          element={<P><AIAnalysis /></P>} />
        <Route path="/quotations"           element={<P><Quotations /></P>} />
        <Route path="/quotations/:id"       element={<P><QuotationDetail /></P>} />
        <Route path="/followups"            element={<P><FollowUps /></P>} />
        <Route path="/received-quotations"         element={<P><ReceivedQuotations /></P>} />
        <Route path="/received-quotations/:id"     element={<P><ReceivedQuotationDetail /></P>} />
        <Route path="/settings"    element={<P><Settings /></P>} />
        <Route path="/approvals"   element={<P><Approvals /></P>} />

        {/* ── Fallback ── */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
