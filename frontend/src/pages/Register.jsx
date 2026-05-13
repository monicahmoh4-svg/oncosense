import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Activity, User, Phone, UserCheck, ArrowRight } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'

const roles = [
  { id: 'patient', label: 'Patient / Individual', icon: User, desc: 'Get personal risk assessment and screening guidance' },
  { id: 'health_worker', label: 'Community Health Worker', icon: UserCheck, desc: 'Support community members with health assessments' },
]

export default function Register() {
  const { register, loading } = useAuthStore()
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({
    first_name: '', last_name: '', email: '', phone: '',
    password: '', role: 'patient', preferred_language: 'en'
  })

  const set = (key, val) => setForm(p => ({ ...p, [key]: val }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.email && !form.phone) {
      toast.error('Please provide email or phone number')
      return
    }
    const result = await register(form)
    if (result.success) {
      toast.success(`Welcome to OncoSense, ${result.user.first_name}!`)
      navigate('/dashboard')
    } else {
      toast.error(result.error)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 to-teal-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-lg">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <span className="font-display text-2xl text-brand-900">OncoSense</span>
          </Link>
          <h1 className="font-display text-3xl text-gray-900">Create your account</h1>
          <p className="text-gray-500 mt-1">Free cancer risk screening — takes 5 minutes</p>
        </div>

        <div className="card">
          {step === 1 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <h2 className="font-bold text-gray-900 mb-4">I am a...</h2>
              <div className="space-y-3 mb-6">
                {roles.map(r => (
                  <button key={r.id} type="button"
                    onClick={() => { set('role', r.id); setStep(2) }}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left
                      ${form.role === r.id ? 'border-brand-500 bg-brand-50' : 'border-gray-200 hover:border-brand-300'}`}>
                    <div className="w-10 h-10 bg-brand-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <r.icon className="w-5 h-5 text-brand-600" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">{r.label}</p>
                      <p className="text-sm text-gray-500">{r.desc}</p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-400 ml-auto" />
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">First Name *</label>
                    <input type="text" className="input-field" placeholder="Jane" required
                      value={form.first_name} onChange={e => set('first_name', e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Last Name *</label>
                    <input type="text" className="input-field" placeholder="Doe" required
                      value={form.last_name} onChange={e => set('last_name', e.target.value)} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center gap-2">
                    <Phone className="w-4 h-4" /> Phone Number
                  </label>
                  <input type="tel" className="input-field" placeholder="+254 700 000 000"
                    value={form.phone} onChange={e => set('phone', e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Email (optional)</label>
                  <input type="email" className="input-field" placeholder="jane@example.com"
                    value={form.email} onChange={e => set('email', e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Password *</label>
                  <input type="password" className="input-field" placeholder="Min. 8 chars, uppercase + number" required
                    value={form.password} onChange={e => set('password', e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Preferred Language</label>
                  <select className="input-field" value={form.preferred_language} onChange={e => set('preferred_language', e.target.value)}>
                    <option value="en">English</option>
                    <option value="sw">Kiswahili</option>
                    <option value="fr">Français</option>
                  </select>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setStep(1)} className="btn-secondary flex-1">Back</button>
                  <button type="submit" disabled={loading} className="btn-primary flex-1">
                    {loading ? <span className="spinner" /> : 'Create Account'}
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </div>

        <p className="text-center text-sm text-gray-500 mt-4">
          Already have an account? <Link to="/login" className="text-brand-600 font-semibold hover:underline">Log in</Link>
        </p>
        <p className="text-center text-xs text-gray-400 mt-2">
          By registering, you agree that this platform does not provide medical diagnosis.
        </p>
      </motion.div>
    </div>
  )
}
