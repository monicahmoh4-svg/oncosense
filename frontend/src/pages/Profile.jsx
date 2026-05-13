import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { User, Save, Globe, Shield } from 'lucide-react'
import { profileService } from '../services/api'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'

export default function Profile() {
  const { user } = useAuthStore()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({})

  useEffect(() => {
    profileService.get()
      .then(r => { setProfile(r.data.profile); setForm(r.data.profile || {}) })
      .catch(() => setForm({}))
      .finally(() => setLoading(false))
  }, [])

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const save = async () => {
    setSaving(true)
    try {
      await profileService.update(form)
      toast.success('Profile updated!')
    } catch { toast.error('Failed to save') }
    finally { setSaving(false) }
  }

  if (loading) return <div className="flex justify-center py-20"><div className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} /></div>

  return (
    <div className="max-w-2xl mx-auto animate-fade-in space-y-6">
      <div>
        <h1 className="font-display text-3xl text-gray-900">My Profile</h1>
        <p className="text-gray-500 mt-1">Your health profile helps improve assessment accuracy</p>
      </div>

      {/* User Info */}
      <div className="card">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 bg-brand-600 rounded-2xl flex items-center justify-center text-white font-bold text-2xl">
            {user?.first_name?.[0]}{user?.last_name?.[0]}
          </div>
          <div>
            <h2 className="font-bold text-xl text-gray-900">{user?.first_name} {user?.last_name}</h2>
            <p className="text-gray-500 text-sm">{user?.email || user?.phone}</p>
            <span className="inline-block mt-1 text-xs bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full font-semibold capitalize">{user?.role?.replace('_', ' ')}</span>
          </div>
        </div>
      </div>

      {/* Health Profile */}
      <div className="card space-y-5">
        <h3 className="font-bold text-gray-900 flex items-center gap-2"><User className="w-5 h-5 text-brand-600" /> Health Profile</h3>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Date of Birth</label>
            <input type="date" className="input-field" value={form.date_of_birth?.split('T')[0] || ''}
              onChange={e => set('date_of_birth', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Sex</label>
            <select className="input-field" value={form.gender || ''} onChange={e => set('gender', e.target.value)}>
              <option value="">Select...</option>
              <option value="female">Female</option>
              <option value="male">Male</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Country</label>
            <select className="input-field" value={form.country || ''} onChange={e => set('country', e.target.value)}>
              {['Kenya','Uganda','Tanzania','Rwanda','Ethiopia','Nigeria','Ghana','South Africa','Other'].map(c =>
                <option key={c} value={c}>{c}</option>
              )}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Region / County</label>
            <input type="text" className="input-field" placeholder="e.g. Nairobi"
              value={form.region || ''} onChange={e => set('region', e.target.value)} />
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Smoking Status</label>
            <select className="input-field" value={form.smoking_status || 'never'} onChange={e => set('smoking_status', e.target.value)}>
              <option value="never">Never</option>
              <option value="former">Former</option>
              <option value="current">Current</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Alcohol Use</label>
            <select className="input-field" value={form.alcohol_use || 'none'} onChange={e => set('alcohol_use', e.target.value)}>
              <option value="none">None</option>
              <option value="occasional">Occasional</option>
              <option value="moderate">Moderate</option>
              <option value="heavy">Heavy</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">BMI</label>
            <input type="number" step="0.1" min="10" max="70" className="input-field" placeholder="e.g. 24.5"
              value={form.bmi || ''} onChange={e => set('bmi', e.target.value)} />
          </div>
        </div>

        <button onClick={save} disabled={saving} className="btn-primary">
          {saving ? <span className="spinner" /> : <Save className="w-4 h-4" />}
          {saving ? 'Saving...' : 'Save Profile'}
        </button>
      </div>

      {/* Privacy */}
      <div className="card bg-gray-50">
        <div className="flex items-center gap-3 mb-3">
          <Shield className="w-5 h-5 text-brand-600" />
          <h3 className="font-bold text-gray-900">Privacy & Data</h3>
        </div>
        <p className="text-sm text-gray-600">Your health data is encrypted and stored securely. OncoSense does not share your personal information with third parties. Data is used solely for your personal health assessment.</p>
      </div>
    </div>
  )
}
