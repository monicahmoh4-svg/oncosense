import React, { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'

// Public pages
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'

// Patient pages
import Dashboard from './pages/Dashboard'
import HealthIntake from './pages/HealthIntake'
import RiskResults from './pages/RiskResults'
import Consultations from './pages/Consultations'
import ConsultationRoom from './pages/ConsultationRoom'
import AIConsultant from './pages/AIConsultant'
import Clinics from './pages/Clinics'
import ImageScreening from './pages/ImageScreening'
import Profile from './pages/Profile'

// Admin pages
import AdminLayout from './pages/admin/AdminLayout'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminUsers from './pages/admin/AdminUsers'
import AdminAssessments from './pages/admin/AdminAssessments'
import AdminAnalytics from './pages/admin/AdminAnalytics'

// Layout
import AppLayout from './components/layout/AppLayout'

const ProtectedRoute = ({ children, roles }) => {
  const { user, token } = useAuthStore()
  if (!token || !user) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />
  return children
}

const PublicRoute = ({ children }) => {
  const { token } = useAuthStore()
  if (token) return <Navigate to="/dashboard" replace />
  return children
}

export default function App() {
  const { loadUser } = useAuthStore()

  useEffect(() => {
    loadUser()
  }, [])

  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

      {/* Patient App */}
      <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="intake" element={<HealthIntake />} />
        <Route path="results/:id" element={<RiskResults />} />
        <Route path="results" element={<RiskResults />} />
        <Route path="consultations" element={<Consultations />} />
        <Route path="consultations/:id" element={<ConsultationRoom />} />
        <Route path="ai-consultant" element={<AIConsultant />} />
        <Route path="clinics" element={<Clinics />} />
        <Route path="image-screening" element={<ImageScreening />} />
        <Route path="profile" element={<Profile />} />
      </Route>

      {/* Admin */}
      <Route path="/admin" element={
        <ProtectedRoute roles={['admin', 'clinician']}>
          <AdminLayout />
        </ProtectedRoute>
      }>
        <Route index element={<AdminDashboard />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="assessments" element={<AdminAssessments />} />
        <Route path="analytics" element={<AdminAnalytics />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
