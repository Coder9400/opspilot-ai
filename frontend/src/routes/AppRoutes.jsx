import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from '../components/ProtectedRoute'

// Public pages
import Landing from '../pages/Landing'
import Login from '../pages/Login'
import Register from '../pages/Register'

// Protected pages
import Dashboard from '../pages/Dashboard'
import Enquiries from '../pages/Enquiries'
import EnquiryNew from '../pages/EnquiryNew'
import EnquiryDetail from '../pages/EnquiryDetail'
import Quotations from '../pages/Quotations'
import QuotationDetail from '../pages/QuotationDetail'
import FollowUps from '../pages/FollowUps'
import Approvals from '../pages/Approvals'

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected */}
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/enquiries" element={<ProtectedRoute><Enquiries /></ProtectedRoute>} />
        <Route path="/enquiries/new" element={<ProtectedRoute><EnquiryNew /></ProtectedRoute>} />
        <Route path="/enquiries/:id" element={<ProtectedRoute><EnquiryDetail /></ProtectedRoute>} />
        <Route path="/quotations" element={<ProtectedRoute><Quotations /></ProtectedRoute>} />
        <Route path="/quotations/:id" element={<ProtectedRoute><QuotationDetail /></ProtectedRoute>} />
        <Route path="/followups" element={<ProtectedRoute><FollowUps /></ProtectedRoute>} />
        <Route path="/approvals" element={<ProtectedRoute><Approvals /></ProtectedRoute>} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
