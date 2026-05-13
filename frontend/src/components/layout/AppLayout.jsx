import React, { useState } from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { 
  Activity, LayoutDashboard, ClipboardList, FileText, 
  Video, MapPin, Camera, User, LogOut, Menu, X,
  Bell, Shield, Wifi, WifiOff, Bot, Sparkles
} from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import toast from 'react-hot-toast'

const navItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', key: 'dashboard' },
  { path: '/intake', icon: ClipboardList, label: 'Assessment', key: 'assessment' },
  { path: '/results', icon: FileText, label: 'My Results', key: 'results' },
  { path: '/ai-consultant', icon: Sparkles, label: 'AI Assistant', key: 'aiConsultant', highlight: true },
  { path: '/consultations', icon: Video, label: 'Consultations', key: 'consultations' },
  { path: '/clinics', icon: MapPin, label: 'Find Clinics', key: 'clinics' },
  { path: '/image-screening', icon: Camera, label: 'Image Screening', key: 'imageScreening' },
  { path: '/profile', icon: User, label: 'Profile', key: 'profile' },
]

export default function AppLayout() {
  const { t, i18n } = useTranslation()
  const { user, logout } = useAuthStore()
  const location = useLocation()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [online, setOnline] = useState(navigator.onLine)

  React.useEffect(() => {
    const onOnline = () => setOnline(true)
    const onOffline = () => setOnline(false)
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    return () => { window.removeEventListener('online', onOnline); window.removeEventListener('offline', onOffline) }
  }, [])

  const handleLogout = () => {
    logout()
    toast.success('Logged out successfully')
    navigate('/')
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-gray-100">
        <div className="w-9 h-9 bg-brand-600 rounded-xl flex items-center justify-center">
          <Activity className="w-5 h-5 text-white" />
        </div>
        <div>
          <span className="font-display text-lg text-brand-900">OncoSense</span>
          <p className="text-xs text-gray-400 -mt-0.5">Health Platform</p>
        </div>
      </div>

      {/* User badge */}
      <div className="px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-3 bg-brand-50 rounded-xl p-3">
          <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
            {user?.first_name?.[0]}{user?.last_name?.[0]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 text-sm truncate">{user?.first_name} {user?.last_name}</p>
            <p className="text-xs text-gray-500 capitalize">{user?.role?.replace('_', ' ')}</p>
          </div>
          {!online && <WifiOff className="w-4 h-4 text-amber-500" />}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(item => {
          const active = location.pathname === item.path
          return (
            <Link key={item.path} to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={`sidebar-link ${active ? 'active' : ''} ${item.highlight && !active ? 'bg-gradient-to-r from-brand-50 to-teal-50 text-brand-700 border border-brand-200' : ''}`}>
              <item.icon className={`w-5 h-5 flex-shrink-0 ${item.highlight && !active ? 'text-brand-500' : ''}`} />
              <span>{item.label}</span>
              {item.highlight && !active && <span className="ml-auto text-xs bg-brand-100 text-brand-700 px-1.5 py-0.5 rounded-full font-bold">AI</span>}
            </Link>
          )
        })}

        {(user?.role === 'admin' || user?.role === 'clinician') && (
          <Link to="/admin" onClick={() => setSidebarOpen(false)} className="sidebar-link border-t border-gray-100 mt-2 pt-3">
            <Shield className="w-5 h-5 text-purple-600" />
            <span className="text-purple-700">Admin Panel</span>
          </Link>
        )}
      </nav>

      {/* Language switcher + Logout */}
      <div className="px-3 pb-4 border-t border-gray-100 pt-3">
        <div className="flex gap-1 mb-3">
          {['en', 'sw', 'fr'].map(lang => (
            <button key={lang} onClick={() => { i18n.changeLanguage(lang); localStorage.setItem('oncosense-lang', lang) }}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold uppercase transition-all
                ${i18n.language === lang ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
              {lang}
            </button>
          ))}
        </div>
        <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all">
          <LogOut className="w-4 h-4" />
          {t('logout')}
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 flex-col bg-white border-r border-gray-100 flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-72 bg-white flex flex-col shadow-xl">
            <div className="flex justify-end p-3">
              <button onClick={() => setSidebarOpen(false)} className="p-2 rounded-xl hover:bg-gray-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar (mobile) */}
        <header className="lg:hidden bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
          <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-xl hover:bg-gray-100">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-brand-600" />
            <span className="font-display text-lg text-brand-900">OncoSense</span>
          </div>
          <div className="flex items-center gap-2">
            {!online && <WifiOff className="w-4 h-4 text-amber-500" />}
            <Bell className="w-5 h-5 text-gray-400" />
          </div>
        </header>

        {/* Offline banner */}
        {!online && (
          <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-center text-sm text-amber-700 flex items-center justify-center gap-2">
            <WifiOff className="w-4 h-4" /> Offline mode — data will sync when connection returns
          </div>
        )}

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
