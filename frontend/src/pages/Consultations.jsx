import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Video, MessageCircle, Plus, Clock, CheckCircle2, AlertCircle, Bot, Building2, Search } from 'lucide-react'
import { consultationService, clinicService } from '../services/api'
import toast from 'react-hot-toast'

const KENYA_COUNTIES = [
  'Baringo','Bomet','Bungoma','Busia','Elgeyo Marakwet','Embu','Garissa',
  'Homa Bay','Isiolo','Kajiado','Kakamega','Kericho','Kiambu','Kilifi',
  'Kirinyaga','Kisii','Kisumu','Kitui','Kwale','Laikipia','Lamu','Machakos',
  'Makueni','Mandera','Marsabit','Meru','Migori','Mombasa','Murang-a',
  'Nairobi','Nakuru','Nandi','Narok','Nyamira','Nyandarua','Nyeri','Samburu',
  'Siaya','Taita Taveta','Tana River','Tharaka Nithi','Trans Nzoia','Turkana',
  'Uasin Gishu','Vihiga','Wajir','West Pokot'
]

const STATUS_COLORS = {
  pending:   'text-amber-600 bg-amber-50 border-amber-200',
  active:    'text-brand-600 bg-brand-50 border-brand-200',
  completed: 'text-gray-500 bg-gray-50 border-gray-200',
  cancelled: 'text-red-500 bg-red-50 border-red-200',
}

export default function Consultations() {
  const [consultations, setConsultations] = useState([])
  const [loading, setLoading]     = useState(true)
  const [showNew, setShowNew]     = useState(false)
  const [creating, setCreating]   = useState(false)
  const [county, setCounty]       = useState('')
  const [clinics, setClinics]     = useState([])
  const [clinicsLoading, setClinicsLoading] = useState(false)
  const [form, setForm] = useState({
    chief_complaint: '',
    consultation_type: 'chat',
    clinic_id: '',
    clinic_name: ''
  })

  useEffect(function() {
    consultationService.getAll()
      .then(function(r) { setConsultations(r.data.consultations || []) })
      .catch(function() { toast.error('Failed to load consultations') })
      .finally(function() { setLoading(false) })
  }, [])

  function handleCountyChange(e) {
    var val = e.target.value
    setCounty(val)
    setForm(function(p) { return Object.assign({}, p, { clinic_id: '', clinic_name: '' }) })
    if (!val) { setClinics([]); return }
    setClinicsLoading(true)
    clinicService.getAll({ country: 'Kenya', county: val })
      .then(function(r) { setClinics(r.data.clinics || []) })
      .catch(function() { toast.error('Could not load hospitals') })
      .finally(function() { setClinicsLoading(false) })
  }

  function handleClinicSelect(clinic) {
    setForm(function(p) { return Object.assign({}, p, { clinic_id: clinic.id, clinic_name: clinic.name }) })
  }

  async function createConsultation() {
    if (!form.chief_complaint.trim()) { toast.error('Please describe your concern'); return }
    if (!form.clinic_id) { toast.error('Please select a hospital'); return }
    setCreating(true)
    try {
      var payload = {
        chief_complaint: form.chief_complaint,
        consultation_type: form.consultation_type,
        clinic_id: form.clinic_id
      }
      var res = await consultationService.create(payload)
      setConsultations(function(prev) { return [res.data.consultation].concat(prev) })
      setShowNew(false)
      setForm({ chief_complaint: '', consultation_type: 'chat', clinic_id: '', clinic_name: '' })
      setCounty('')
      setClinics([])
      toast.success('Consultation request sent to ' + form.clinic_name)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create consultation')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">

      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl text-gray-900">Consultations</h1>
          <p className="text-gray-500 mt-1">Connect with hospitals and health workers</p>
        </div>
        <button onClick={function() { setShowNew(true) }}
          className="bg-brand-600 hover:bg-brand-700 text-white font-semibold px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all">
          <Plus className="w-4 h-4" /> New Consultation
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
            <p className="text-brand-200 text-sm">Instant answers via voice or text — available 24/7. No waiting.</p>
          </div>
          <span className="bg-white/20 px-3 py-1.5 rounded-xl text-sm font-semibold">Voice + Text</span>
        </div>
      </Link>

      {/* New consultation form */}
      {showNew && (
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border-2 border-brand-200 p-6 space-y-5">

          <div className="flex items-center justify-between">
            <h3 className="font-bold text-gray-900 text-lg">Request Hospital Consultation</h3>
            <button onClick={function() { setShowNew(false); setCounty(''); setClinics([]) }}
              className="text-gray-400 hover:text-gray-600 text-sm">Cancel</button>
          </div>

          {/* Consultation type */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Consultation Type</label>
            <div className="grid grid-cols-2 gap-3">
              {[['chat','Chat Message'],['video','Video Call']].map(function(arr) {
                return (
                  <button key={arr[0]} type="button"
                    onClick={function() { setForm(function(p) { return Object.assign({}, p, { consultation_type: arr[0] }) }) }}
                    className={'py-2.5 rounded-xl border-2 text-sm font-semibold transition-all ' + (form.consultation_type === arr[0] ? 'border-brand-500 bg-brand-50 text-brand-800' : 'border-gray-200 text-gray-600')}>
                    {arr[1]}
                  </button>
                )
              })}
            </div>
          </div>

          {/* County selector */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Select County <span className="text-red-400">*</span>
            </label>
            <select
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
              value={county} onChange={handleCountyChange}>
              <option value="">-- Choose your county --</option>
              {KENYA_COUNTIES.map(function(c) { return <option key={c} value={c}>{c} County</option> })}
            </select>
          </div>

          {/* Hospital selector */}
          {county && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Select Hospital <span className="text-red-400">*</span>
              </label>
              {clinicsLoading ? (
                <div className="flex items-center gap-2 py-3 text-gray-500 text-sm">
                  <div className="w-4 h-4 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
                  Loading hospitals in {county} County...
                </div>
              ) : clinics.length === 0 ? (
                <p className="text-sm text-gray-400 py-2">No hospitals found in {county} County.</p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {clinics.map(function(clinic) {
                    var isSelected = form.clinic_id === clinic.id
                    return (
                      <button key={clinic.id} type="button"
                        onClick={function() { handleClinicSelect(clinic) }}
                        className={'w-full text-left p-3 rounded-xl border-2 transition-all ' + (isSelected ? 'border-brand-500 bg-brand-50' : 'border-gray-200 hover:border-brand-300 hover:bg-gray-50')}>
                        <div className="flex items-center gap-3">
                          <Building2 className={'w-5 h-5 flex-shrink-0 ' + (isSelected ? 'text-brand-600' : 'text-gray-400')} />
                          <div>
                            <p className={'font-semibold text-sm ' + (isSelected ? 'text-brand-900' : 'text-gray-800')}>{clinic.name}</p>
                            <p className="text-xs text-gray-500">{clinic.district || clinic.region}</p>
                          </div>
                          {isSelected && (
                            <CheckCircle2 className="w-4 h-4 text-brand-600 ml-auto flex-shrink-0" />
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* Chief complaint */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Describe Your Concern <span className="text-red-400">*</span>
            </label>
            <textarea
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 resize-none"
              rows={3}
              placeholder="Describe your main health concern or symptoms..."
              value={form.chief_complaint}
              onChange={function(e) { setForm(function(p) { return Object.assign({}, p, { chief_complaint: e.target.value }) }) }}
            />
          </div>

          {/* Selected hospital summary */}
          {form.clinic_name && (
            <div className="bg-brand-50 border border-brand-200 rounded-xl p-3">
              <p className="text-sm text-brand-800">
                <span className="font-semibold">Sending to:</span> {form.clinic_name}
              </p>
            </div>
          )}

          <button onClick={createConsultation} disabled={creating || !form.clinic_id || !form.chief_complaint.trim()}
            className="w-full bg-brand-600 hover:bg-brand-700 text-white font-semibold py-3 rounded-xl transition-all disabled:opacity-40 flex items-center justify-center gap-2">
            {creating
              ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Sending request...</>
              : <>Send Consultation Request</>
            }
          </button>
        </motion.div>
      )}

      {/* Consultations list */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : consultations.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <Video className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No consultations yet</p>
          <p className="text-gray-400 text-sm mt-1">Request a consultation with a hospital above</p>
        </div>
      ) : (
        <div className="space-y-3">
          {consultations.map(function(c, i) {
            return (
              <motion.div key={c.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className={'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ' + (c.consultation_type === 'video' ? 'bg-purple-100' : 'bg-brand-100')}>
                      {c.consultation_type === 'video'
                        ? <Video className="w-5 h-5 text-purple-600" />
                        : <MessageCircle className="w-5 h-5 text-brand-600" />
                      }
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{c.chief_complaint || 'General consultation'}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {c.clinician_first ? 'Attendant: ' + c.clinician_first + ' ' + c.clinician_last : 'Awaiting attendant'}
                        {' · '}{new Date(c.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={'px-2.5 py-1 rounded-full text-xs font-semibold border ' + (STATUS_COLORS[c.status] || STATUS_COLORS.pending)}>
                      {c.status}
                    </span>
                    {c.status !== 'completed' && c.status !== 'cancelled' && (
                      <Link to={'/consultations/' + c.id}
                        className="bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold px-3 py-1.5 rounded-xl transition-all">
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
