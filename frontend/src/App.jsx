import React, { Suspense, lazy } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from './store/authStore'

// Lazy-load pages for faster initial load
const Landing        = lazy(() => import('./pages/Landing'))
const Login          = lazy(() => import('./pages/Login'))
const Register       = lazy(() => import('./pages/Register'))
const Dashboard      = lazy(() => import('./pages/Dashboard'))
const HealthIntake   = lazy(() => import('./pages/HealthIntake'))
const RiskResults    = lazy(() => import('./pages/RiskResults'))
const AIConsultant   = lazy(() => import('./pages/AIConsultant'))
const Consultations  = lazy(() => import('./pages/Consultations'))
const ConsultationRoom = lazy(() => import('./pages/ConsultationRoom'))
const Clinics        = lazy(() => import('./pages/Clinics'))
const ImageScreening = lazy(() => import('./pages/ImageScreening'))
const Profile        = lazy(() => import('./pages/Profile'))

// Admin pages
const AdminLayout    = lazy(() => import('./pages/admin/AdminLayout'))
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'))
const AdminUsers     = lazy(() => import('./pages/admin/AdminUsers'))
const AdminAssessments = lazy(() => import('./pages/admin/AdminAssessments'))

function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-400 font-medium">Loading...</p>
      </div>
    </div>
  )
}

function ErrorBoundary({ children }) {
  const [error, setError] = React.useState(null)
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-2xl border border-red-200 p-6 max-w-md w-full text-center">
          <p className="text-red-600 font-bold mb-2">Something went wrong</p>
          <p className="text-gray-500 text-sm mb-4">{error.message}</p>
          <button
            type="button"
            onClick={() => { setError(null); window.location.href = '/' }}
            className="bg-brand-600 text-white px-4 py-2 rounded-xl text-sm font-semibold">
            Go Home
          </button>
        </div>
      </div>
    )
  }
  return (
    <ErrorBoundaryInner onError={setError}>{children}</ErrorBoundaryInner>
  )
}

class ErrorBoundaryInner extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false } }
  static getDerivedStateFromError(error) { return { hasError: true, error } }
  componentDidCatch(error) { if (this.props.onError) this.props.onError(error) }
  render() { return this.state.hasError ? null : this.props.children }
}

// Layout for authenticated pages
function AppLayout({ children }) {
  const { user, logout } = useAuthStore()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = React.useState(false)

  const navItems = [
    { path: '/dashboard',    label: 'Dashboard',       icon: '🏠' },
    { path: '/assessment',   label: 'Assessment',      icon: '📋' },
    { path: '/results',      label: 'My Results',      icon: '📊' },
    { path: '/ai-consultant',label: 'AI Assistant',    icon: '🤖' },
    { path: '/consultations',label: 'Consultations',   icon: '💬' },
    { path: '/clinics',      label: 'Find Clinics',    icon: '🏥' },
    { path: '/image-screening', label: 'Image Screen', icon: '🔬' },
    { path: '/profile',      label: 'Profile',         icon: '👤' },
  ]

  if (user?.role === 'admin' || user?.role === 'clinician') {
    navItems.push({ path: '/admin', label: 'Admin', icon: '⚙️' })
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-100 flex flex-col transform transition-transform duration-200 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:flex`}>

        {/* Logo */}
        <div className="p-5 border-b border-gray-100 flex items-center gap-3">
          <div className="w-8 h-8 bg-brand-600 rounded-xl flex items-center justify-center">
            <span className="text-white text-sm font-bold">O</span>
          </div>
          <div>
            <p className="font-display text-base font-bold text-brand-900">OncoSense</p>
            <p className="text-xs text-gray-400">Health Platform</p>
          </div>
        </div>

        {/* User info */}
        {user && (
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-brand-600 rounded-xl flex items-center justify-center text-white font-bold text-sm">
                {(user.first_name?.[0] || '') + (user.last_name?.[0] || '')}
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">{user.first_name} {user.last_name}</p>
                <p className="text-xs text-gray-400 capitalize">{user.role?.replace('_', ' ')}</p>
              </div>
            </div>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navItems.map(item => {
            const isActive = location.pathname === item.path ||
              (item.path !== '/dashboard' && location.pathname.startsWith(item.path))
            return (
              <a key={item.path} href={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-brand-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}>
                <span className="text-base">{item.icon}</span>
                {item.label}
                {item.path === '/ai-consultant' && (
                  <span className="ml-auto bg-indigo-100 text-indigo-700 text-xs px-1.5 py-0.5 rounded-full font-semibold">AI</span>
                )}
              </a>
            )
          })}
        </nav>

        {/* Language + Logout */}
        <div className="p-4 border-t border-gray-100 space-y-2">
          <div className="flex gap-1.5">
            {['en', 'sw', 'fr'].map(lang => (
              <button key={lang} type="button"
                onClick={() => {
                  try {
                    const i18n = require('i18next').default
                    i18n.changeLanguage(lang)
                  } catch {}
                  localStorage.setItem('oncosense-lang', lang)
                }}
                className="flex-1 py-1.5 rounded-lg text-xs font-semibold uppercase border-2 transition-all text-gray-500 border-gray-200 hover:border-brand-400 hover:text-brand-700">
                {lang}
              </button>
            ))}
          </div>
          <button type="button" onClick={logout}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 font-medium hover:bg-red-50 rounded-xl transition-all">
            <span>🚪</span> Logout
          </button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Mobile topbar */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100">
          <button type="button" onClick={() => setSidebarOpen(true)} className="p-2 rounded-xl hover:bg-gray-100">
            <span className="text-xl">☰</span>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-brand-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-xs font-bold">O</span>
            </div>
            <span className="font-display text-base font-bold text-brand-900">OncoSense</span>
          </div>
          <div className="w-9" />
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuthStore()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return children
}

function PublicRoute({ children }) {
  const { isAuthenticated } = useAuthStore()
  if (isAuthenticated) return <Navigate to="/dashboard" replace />
  return children
}

export default function App() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<PublicRoute><Landing /></PublicRoute>} />
          <Route path="/login"    element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

          {/* Protected routes */}
          <Route path="/dashboard" element={<ProtectedRoute><AppLayout><Dashboard /></AppLayout></ProtectedRoute>} />
          <Route path="/assessment" element={<ProtectedRoute><AppLayout><HealthIntake /></AppLayout></ProtectedRoute>} />
          <Route path="/results" element={<ProtectedRoute><AppLayout><RiskResults /></AppLayout></ProtectedRoute>} />
          <Route path="/results/:id" element={<ProtectedRoute><AppLayout><RiskResults /></AppLayout></ProtectedRoute>} />
          <Route path="/ai-consultant" element={<ProtectedRoute><AppLayout><AIConsultant /></AppLayout></ProtectedRoute>} />
          <Route path="/consultations" element={<ProtectedRoute><AppLayout><Consultations /></AppLayout></ProtectedRoute>} />
          <Route path="/consultations/:id" element={<ProtectedRoute><AppLayout><ConsultationRoom /></AppLayout></ProtectedRoute>} />
          <Route path="/clinics" element={<ProtectedRoute><AppLayout><Clinics /></AppLayout></ProtectedRoute>} />
          <Route path="/image-screening" element={<ProtectedRoute><AppLayout><ImageScreening /></AppLayout></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><AppLayout><Profile /></AppLayout></ProtectedRoute>} />

          {/* Admin routes */}
          <Route path="/admin" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="assessments" element={<AdminAssessments />} />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  )
}
