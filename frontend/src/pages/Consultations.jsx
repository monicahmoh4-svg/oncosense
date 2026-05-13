import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Video, MessageCircle, Plus, Clock, CheckCircle2, AlertCircle, Bot } from 'lucide-react'
import { consultationService, assessmentService } from '../services/api'
import toast from 'react-hot-toast'

const statusColors = {
  pending: 'text-amber-600 bg-amber-50 border-amber-200',
  active: 'text-brand-600 bg-brand-50 border-brand-200',
  completed: 'text-gray-500 bg-gray-50 border-gray-200',
  cancelled: 'text-red-500 bg-red-50 border-red-200',
}
const statusIcons = {
  pending: Clock, active: Video, completed: CheckCircle2, cancelled: AlertCircle
}

export default function Consultations() {
  const [consultations, setConsultations] = useState([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [newForm, setNewForm] = useState({ chief_complaint: '', consultation_type: 'chat' })

  useEffect(() => {
    consultationService.getAll()
      .then(r => setConsultations(r.data.consultations || []))
      .catch(() => toast.error('Failed to load consultations'))
      .finally(() => setLoading(false))
  }, [])

  const createConsultation = async () => {
    if (!newForm.chief_complaint.trim()) { toast.error('Please describe your concern'); return }
    setCreating(true)
    try {
      const res = await consultationService.create(newForm)
      setConsultations(prev => [res.data.consultation, ...prev])
      setShowNew(false)
      setNewForm({ chief_complaint: '', consultation_type: 'chat' })
      toast.success('Consultation request created!')
    } catch { toast.error('Failed to create consultation') }
    finally { setCreating(false) }
  }

  return (
    <div className="max-w-3xl mx-auto animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl text-gray-900">Consultations</h1>
          <p className="text-gray-500 mt-1">Connect with doctors and health workers</p>
        </div>
        <button onClick={() => setShowNew(true)} className="btn-primary">
          <Plus className="w-4 h-4" /> New Consultation
        </button>
      </div>

      {/* AI Consultant CTA */}
      <Link to="/ai-consultant"
        className="block card bg-gradient-to-br from-brand-600 to-teal-700 border-0 text-white hover:-translate-y-1">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
            <Bot className="w-7 h-7 text-white" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-lg">AI Health Assistant</p>
            <p className="text-brand-200 text-sm">Ask questions via voice or text — available 24/7. Not a replacement for a doctor.</p>
          </div>
          <div className="flex items-center gap-2 bg-white/20 px-3 py-1.5 rounded-xl text-sm font-semibold">
            🎙️ Voice + Text
          </div>
        </div>
      </Link>

      {/* New consultation form */}
      {showNew && (
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="card border-2 border-brand-200">
          <h3 className="font-bold text-gray-900 mb-4">Request Consultation with Clinician</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Consultation Type</label>
              <div className="grid grid-cols-2 gap-3">
                {[['chat','💬 Chat'],['video','📹 Video Call']].map(([v,l]) => (
                  <button key={v} type="button" onClick={() => setNewForm(p => ({ ...p, consultation_type: v }))}
                    className={`py-2.5 rounded-xl border-2 text-sm font-semibold transition-all
                      ${newForm.consultation_type === v ? 'border-brand-500 bg-brand-50 text-brand-800' : 'border-gray-200 text-gray-600'}`}>
                    {l}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Chief Complaint *</label>
              <textarea className="input-field" rows={3}
                placeholder="Describe your main health concern or symptoms..."
                value={newForm.chief_complaint}
                onChange={e => setNewForm(p => ({ ...p, chief_complaint: e.target.value }))} />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowNew(false)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={createConsultation} disabled={creating} className="btn-primary flex-1">
                {creating ? <span className="spinner" /> : 'Request Consultation'}
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Consultations list */}
      {loading ? (
        <div className="flex justify-center py-12"><div className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} /></div>
      ) : consultations.length === 0 ? (
        <div className="card text-center py-12">
          <Video className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No consultations yet</p>
          <p className="text-gray-400 text-sm mt-1">Request a consultation with a clinician above</p>
        </div>
      ) : (
        <div className="space-y-3">
          {consultations.map((c, i) => {
            const StatusIcon = statusIcons[c.status] || Clock
            return (
              <motion.div key={c.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }} className="card hover:-translate-y-0.5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${c.consultation_type === 'video' ? 'bg-purple-100' : 'bg-brand-100'}`}>
                      {c.consultation_type === 'video'
                        ? <Video className="w-5 h-5 text-purple-600" />
                        : <MessageCircle className="w-5 h-5 text-brand-600" />}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{c.chief_complaint || 'General consultation'}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Dr. {c.clinician_first || '—'} {c.clinician_last || ''} · {new Date(c.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${statusColors[c.status]}`}>
                      <StatusIcon className="w-3 h-3" /> {c.status}
                    </span>
                    {c.status !== 'completed' && c.status !== 'cancelled' && (
                      <Link to={`/consultations/${c.id}`} className="btn-primary text-xs py-1.5 px-3">
                        Open
                      </Link>
                    )}
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
