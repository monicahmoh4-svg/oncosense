import React, { useState } from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { 
  Activity, LayoutDashboard, Users, FileText, 
  BarChart3, LogOut, Menu, X, Shield, ArrowLeft
} from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import toast from 'react-hot-toast'

const navItems = [
  { path: '/admin', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { path: '/admin/users', icon: Users, label: 'User Management' },
  { path: '/admin/assessments', icon: FileText, label: 'Assessments' },
  { path: '/admin/analytics', icon: BarChart3, label: 'Analytics' },
]

export default function AdminLayout() {
  const { user, logout } = useAuthStore()
  const location = useLocation()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  const handleLogout = () => { logout(); toast.success('Logged out'); navigate('/') }

  const isActive = (item) => item.exact ? location.pathname === item.path : location.pathname.startsWith(item.path)

  const Sidebar = () => (
    <div className="flex flex-col h-full bg-gray-900">
      <div className="flex items-center gap-3 px-5 py-5 border-b border-gray-700">
        <div className="w-9 h-9 bg-brand-500 rounded-xl flex items-center justify-center">
          <Shield className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="font-display text-lg text-white">OncoSense</p>
          <p className="text-xs text-gray-400">Admin Panel</p>
        </div>
      </div>

      <div className="px-3 py-3 border-b border-gray-700">
        <div className="flex items-center gap-3 bg-gray-800 rounded-xl p-3">
          <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
            {user?.first_name?.[0]}{user?.last_name?.[0]}
          </div>
          <div>
            <p className="text-white text-sm font-semibold">{user?.first_name} {user?.last_name}</p>
            <p className="text-gray-400 text-xs capitalize">{user?.role}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(item => (
          <Link key={item.path} to={item.path} onClick={() => setOpen(false)}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all
              ${isActive(item) ? 'bg-brand-600 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'}`}>
            <item.icon className="w-5 h-5 flex-shrink-0" />
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="px-3 pb-4 border-t border-gray-700 pt-3 space-y-2">
        <Link to="/dashboard" className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white transition-all">
          <ArrowLeft className="w-4 h-4" /> Patient View
        </Link>
        <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-300 hover:bg-red-900/50 hover:text-red-300 transition-all">
          <LogOut className="w-4 h-4" /> Logout
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      <aside className="hidden lg:flex w-60 flex-col flex-shrink-0"><Sidebar /></aside>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-64 flex flex-col shadow-2xl"><Sidebar /></aside>
        </div>
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between lg:hidden">
          <button onClick={() => setOpen(true)} className="p-2 rounded-xl hover:bg-gray-100"><Menu className="w-5 h-5" /></button>
          <span className="font-display text-lg text-gray-900">Admin</span>
          <div />
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
