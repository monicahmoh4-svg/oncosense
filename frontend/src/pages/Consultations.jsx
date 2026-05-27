import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Video, MessageCircle, Plus, Clock, CheckCircle2, AlertCircle, Bot } from 'lucide-react'
import { consultationService } from '../services/api'
import toast from 'react-hot-toast'

const statusColors = {
  pending:   'text-amber-600 bg-amber-50 border-amber-200',
  active:    'text-brand-600 bg-brand-50 border-brand-200',
  completed: 'text-gray-500 bg-gray-50 border-gray-200',
  cancelled: 'text-red-500 bg-red-50 border-red-200',
}

export default function Consultations() {
  const [consultations, setConsultations] = useState([])
  const [loading, setLoading]   = useState(true)
  const [creating, setCreating] = useState(false)
  const [showNew, setShowNew]   = useState(false)
  const [newForm, setNewForm]   = useState({ chief_complaint: '', consultation_type: 'chat' })

  useEffect(() => {
    consultationService.getAll()
      .then(r => setConsultations(r.data.consultations || []))
      .catch(() => toast.error('Failed to load consultations'))
      .finally(() => setLoading(false))
  }, [])

  const create = async () => {
    if (!newForm.chief_complaint.trim()) { toast.error('Please describe your concern'); return }
    setCreating(true)
    try {
      const res = await consultationService.create(newForm)
      setConsultations(prev => [res.data.consultation, ...prev])
      setShowNew(false)
      setNewForm({ chief_complaint: '', consultation_type: 'chat' })
      toast.success('Consultation requested!')
    } catch { toast.error('Failed to create consultation') }
    finally { setCreating(false) }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl text-gray-900">Consultations</h1>
          <p className="text-gray-500 mt-1">Connect with doctors and health workers</p>
        </div>
        <button onClick={() => setShowNew(true)}
          className="bg-brand-600 hover:bg-brand-700 text-white font-semibold px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all">
          <Plus className="w-4 h-4" /> New
        </button>
      </div>

      {/* AI Consultant CTA */}
      <Link to="/ai-consultant"
        className="block bg-gradient-to-br from-brand-600 to-teal-700 rounded-2xl p-5 text-white hover:-translate-y-0.5 transition-all">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
            <Bot className="w-7 h-7 text-white" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-lg">AI Health Assistant</p>
            <p className="text-brand-200 text-sm">Ask questions via voice or text — available 24/7</p>
          </div>
          <span className="bg-white/20 px-3 py-1.5 rounded-xl text-sm font-semibold">🎙️ Voice + Text</span>
        </div>
      </Link>

      {showNew && (
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border-2 border-brand-200 p-5">
          <h3 className="font-bold text-gray-900 mb-4">Request Clinician Consultation</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {[['chat','💬 Chat'],['video','📹 Video Call']].map(([v,l]) => (
                <button key={v} type="button" onClick={() => setNewForm(p => ({ ...p, consultation_type: v }))}
                  className={`py-2.5 rounded-xl border-2 text-sm font-semibold transition-all
                    ${newForm.consultation_type === v ? 'border-brand-500 bg-brand-50 text-brand-800' : 'border-gray-200 text-gray-600'}`}>
                  {l}
                </button>
              ))}
            </div>
            <textarea className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400" rows={3}
              placeholder="Describe your main health concern..."
              value={newForm.chief_complaint} onChange={e => setNewForm(p => ({ ...p, chief_complaint: e.target.value }))} />
            <div className="flex gap-3">
              <button onClick={() => setShowNew(false)} className="flex-1 border-2 border-gray-200 text-gray-600 font-semibold py-2.5 rounded-xl hover:bg-gray-50 transition-all">Cancel</button>
              <button onClick={create} disabled={creating}
                className="flex-1 bg-brand-600 hover:bg-brand-700 text-white font-semibold py-2.5 rounded-xl transition-all disabled:opacity-40">
                {creating ? 'Requesting...' : 'Request Consultation'}
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" /></div>
      ) : consultations.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <Video className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No consultations yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {consultations.map((c, i) => (
            <motion.div key={c.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${c.consultation_type === 'video' ? 'bg-purple-100' : 'bg-brand-100'}`}>
                    {c.consultation_type === 'video' ? <Video className="w-5 h-5 text-purple-600" /> : <MessageCircle className="w-5 h-5 text-brand-600" />}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{c.chief_complaint || 'General consultation'}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Dr. {c.clinician_first || '—'} {c.clinician_last || ''} · {new Date(c.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${statusColors[c.status]}`}>
                    {c.status}
                  </span>
                  {c.status !== 'completed' && c.status !== 'cancelled' && (
                    <Link to={`/consultations/${c.id}`}
                      className="bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold px-3 py-1.5 rounded-xl transition-all">
                      Open
                    </Link>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
