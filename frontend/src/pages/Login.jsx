// Login.jsx
import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { Activity, Eye, EyeOff, LogIn } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'

export default function Login() {
  const { t } = useTranslation()
  const { login, loading } = useAuthStore()
  const navigate = useNavigate()
  const [form, setForm] = useState({ identifier: '', password: '' })
  const [showPass, setShowPass] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    const result = await login(form.identifier, form.password)
    if (result.success) {
      toast.success(`Welcome back, ${result.user.first_name}!`)
      if (result.user.role === 'admin' || result.user.role === 'clinician') {
        navigate('/admin')
      } else {
        navigate('/dashboard')
      }
    } else {
      toast.error(result.error)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 to-teal-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <span className="font-display text-2xl text-brand-900">OncoSense</span>
          </Link>
          <h1 className="font-display text-3xl text-gray-900">Welcome back</h1>
          <p className="text-gray-500 mt-1">Sign in to continue your health journey</p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Email or Phone</label>
              <input type="text" placeholder="+254... or email@..." value={form.identifier}
                onChange={e => setForm(p => ({ ...p, identifier: e.target.value }))}
                className="input-field" required />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">{t('password')}</label>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} placeholder="Enter password"
                  value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  className="input-field pr-10" required />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full py-4 text-base mt-2">
              {loading ? <span className="spinner" /> : <><LogIn className="w-5 h-5" /> {t('login')}</>}
            </button>
          </form>

          <div className="mt-4 text-center text-sm">
            <p className="text-gray-500">Demo: <span className="font-mono text-xs text-brand-700">admin@oncosense.health / Admin@OncoSense2024</span></p>
          </div>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="text-brand-600 font-semibold hover:underline">{t('register')}</Link>
        </p>
      </motion.div>
    </div>
  )
}
