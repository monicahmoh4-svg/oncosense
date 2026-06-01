import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Building2, MapPin, Phone, Search,
  ChevronDown, Navigation, Video,
  MessageCircle, Sparkles, Shield, CheckCircle2
} from 'lucide-react'
import { clinicService, consultationService } from '../services/api'
import toast from 'react-hot-toast'

var KENYA_COUNTIES = [
  'Baringo','Bomet','Bungoma','Busia','Elgeyo Marakwet','Embu','Garissa',
  'Homa Bay','Isiolo','Kajiado','Kakamega','Kericho','Kiambu','Kilifi',
  'Kirinyaga','Kisii','Kisumu','Kitui','Kwale','Laikipia','Lamu','Machakos',
  'Makueni','Mandera','Marsabit','Meru','Migori','Mombasa','Murang-a',
  'Nairobi','Nakuru','Nandi','Narok','Nyamira','Nyandarua','Nyeri','Samburu',
  'Siaya','Taita Taveta','Tana River','Tharaka Nithi','Trans Nzoia','Turkana',
  'Uasin Gishu','Vihiga','Wajir','West Pokot'
]

var RESOURCE_BADGE = {
  high:   'bg-emerald-100 text-emerald-700 border-emerald-200',
  medium: 'bg-amber-100 text-amber-700 border-amber-200',
  low:    'bg-orange-100 text-orange-700 border-orange-200',
}

var INSURANCE_COLORS = {
  'SHA':        'bg-blue-100 text-blue-700',
  'NHIF':       'bg-green-100 text-green-700',
  'AAR':        'bg-purple-100 text-purple-700',
  'Jubilee':    'bg-yellow-100 text-yellow-700',
  'CIC':        'bg-orange-100 text-orange-700',
  'Britam':     'bg-red-100 text-red-700',
  'Resolution': 'bg-teal-100 text-teal-700',
  'UAP':        'bg-indigo-100 text-indigo-700',
  'Madison':    'bg-pink-100 text-pink-700',
  'Sanlam':     'bg-cyan-100 text-cyan-700',
}

function mapsUrl(lat, lng) {
  return 'https://www.google.com/maps/dir/?api=1&destination=' + lat + ',' + lng
}

export default function Consultations() {
  var navigate = useNavigate()
  var [step, setStep]                     = useState('choose')
  var [county, setCounty]                 = useState('')
  var [clinics, setClinics]               = useState([])
  var [clinicsLoading, setClinicsLoading] = useState(false)
  var [selectedClinic, setSelectedClinic] = useState(null)
  var [expandedClinic, setExpandedClinic] = useState(null)
  var [consultType, setConsultType]       = useState('chat')
  var [complaint, setComplaint]           = useState('')
  var [creating, setCreating]             = useState(false)
  var [searchTerm, setSearchTerm]         = useState('')
  var [insuranceFilter, setInsuranceFilter] = useState('')

  function loadClinics(c) {
    if (!c) return
    setClinicsLoading(true)
    setClinics([])
    setSelectedClinic(null)
    var params = { country: 'Kenya', county: c }
    if (insuranceFilter) params.insurance = insuranceFilter
    clinicService.getAll(params)
      .then(function(r) { setClinics(r.data.clinics || []) })
      .catch(function() { toast.error('Could not load hospitals for ' + c) })
      .finally(function() { setClinicsLoading(false) })
  }

  function handleCountyChange(e) {
    var val = e.target.value
    setCounty(val); setSearchTerm('')
    loadClinics(val)
  }

  function filteredClinics() {
    var list = clinics
    if (searchTerm.trim()) {
      var t = searchTerm.toLowerCase()
      list = list.filter(function(c) {
        return c.name.toLowerCase().includes(t) || (c.district || '').toLowerCase().includes(t)
      })
    }
    return list
  }

  function selectClinic(clinic) {
    setSelectedClinic(clinic); setExpandedClinic(null); setStep('details')
  }

  async function startConsultation() {
    if (!complaint.trim()) { toast.error('Please describe your concern'); return }
    setCreating(true)
    try {
      var res = await consultationService.create({
        chief_complaint: complaint,
        consultation_type: consultType,
        clinic_id: selectedClinic.id
      })
      toast.success('Connected to ' + selectedClinic.name)
      navigate(
        '/consultations/' + res.data.consultation.id +
        '?clinic=' + encodeURIComponent(selectedClinic.name) +
        '&type=' + consultType
      )
    } catch(err) {
      toast.error(err.response?.data?.error || 'Failed to connect. Please try again.')
    } finally { setCreating(false) }
  }

  var list = filteredClinics()

  return (
    <div className="max-w-3xl mx-auto space-y-6">

      <div>
        <h1 className="font-display text-3xl text-gray-900">Consultations</h1>
        <p className="text-gray-500 mt-1">Chat or video call with a hospital — or get instant AI answers</p>
      </div>

      {/* AI CTA */}
      {React.createElement('a', {
        href: '/ai-consultant',
        className: 'flex items-center gap-4 bg-gradient-to-br from-indigo-600 to-blue-700 rounded-2xl p-5 text-white hover:-translate-y-0.5 transition-all cursor-pointer no-underline'
      },
        React.createElement('div', { className: 'w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0' },
          React.createElement(Sparkles, { className: 'w-6 h-6 text-white' })
        ),
        React.createElement('div', { className: 'flex-1' },
          React.createElement('p', { className: 'font-bold text-lg' }, 'AI Health Assistant — Instant Answers'),
          React.createElement('p', { className: 'text-indigo-200 text-sm' }, 'Voice or text · No waiting · 24/7 · Powered by Google Gemini')
        ),
        React.createElement('span', { className: 'bg-white/20 border border-white/30 px-3 py-1.5 rounded-xl text-sm font-semibold flex-shrink-0' }, 'Try Now')
      )}

      {/* STEP 1 */}
      {step === 'choose' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-brand-600 rounded-full flex items-center justify-center text-white font-bold text-sm">1</div>
            <h2 className="font-bold text-gray-900 text-lg">Select a Hospital</h2>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">County</label>
              <select
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                value={county} onChange={handleCountyChange}>
                <option value="">-- Select your county --</option>
                {KENYA_COUNTIES.map(function(c) { return React.createElement('option', { key: c, value: c }, c + ' County') })}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Insurance (optional)</label>
              <select
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                value={insuranceFilter}
                onChange={function(e) { setInsuranceFilter(e.target.value); if (county) loadClinics(county) }}>
                <option value="">All hospitals</option>
                <option value="SHA">SHA</option>
                <option value="NHIF">NHIF</option>
                <option value="AAR">AAR</option>
                <option value="Jubilee">Jubilee Insurance</option>
                <option value="CIC">CIC Insurance</option>
                <option value="Britam">Britam</option>
                <option value="Resolution">Resolution Health</option>
                <option value="UAP">UAP</option>
                <option value="Madison">Madison Insurance</option>
              </select>
            </div>
          </div>

          {county && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Search hospital</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="text"
                  className="w-full border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                  placeholder="Filter hospitals..."
                  value={searchTerm}
                  onChange={function(e) { setSearchTerm(e.target.value) }} />
              </div>
            </div>
          )}

          {clinicsLoading && (
            <div className="flex items-center gap-2 py-4 text-gray-500 text-sm">
              <div className="w-4 h-4 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
              Loading hospitals in {county} County...
            </div>
          )}

          {!clinicsLoading && list.length > 0 && (
            <div>
              <p className="text-xs text-gray-400 font-medium mb-2">
                {list.length} hospital{list.length !== 1 ? 's' : ''} found
              </p>
              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {list.map(function(clinic) {
                  var isExpanded = expandedClinic === clinic.id
                  var badge      = RESOURCE_BADGE[clinic.resource_level] || RESOURCE_BADGE.medium

                  return (
                    <div key={clinic.id} className="border border-gray-200 rounded-xl overflow-hidden">
                      <div className="flex items-center gap-3 p-3">
                        <div className="w-9 h-9 bg-brand-100 rounded-xl flex items-center justify-center flex-shrink-0">
                          <Building2 className="w-4 h-4 text-brand-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 text-sm truncate">{clinic.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <p className="text-xs text-gray-500">{clinic.district || clinic.region}</p>
                            <span className={'text-xs font-medium capitalize ' + (clinic.ownership === 'private' ? 'text-purple-600' : 'text-brand-600')}>
                              {clinic.ownership || 'public'}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className={'text-xs font-semibold px-2 py-0.5 rounded-full border ' + badge}>
                            {clinic.resource_level}
                          </span>
                          <button type="button"
                            onClick={function() { setExpandedClinic(isExpanded ? null : clinic.id) }}
                            className="p-1 text-gray-400 hover:text-gray-600">
                            <ChevronDown className={'w-4 h-4 transition-transform ' + (isExpanded ? 'rotate-180' : '')} />
                          </button>
                          <button type="button"
                            onClick={function() { selectClinic(clinic) }}
                            className="bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-all">
                            Connect
                          </button>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="border-t border-gray-100 px-4 pb-4 pt-3 bg-gray-50 space-y-3">
                          {clinic.address && (
                            <div className="flex items-start gap-2">
                              <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                              <p className="text-sm text-gray-600">{clinic.address}</p>
                            </div>
                          )}
                          {clinic.phone && React.createElement('div', { className: 'flex items-center gap-2' },
                            React.createElement(Phone, { className: 'w-4 h-4 text-gray-400 flex-shrink-0' }),
                            React.createElement('a', { href: 'tel:' + clinic.phone, className: 'text-sm text-brand-600 font-medium hover:underline' }, clinic.phone)
                          )}
                          {clinic.services && clinic.services.length > 0 && (
                            <div>
                              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Services</p>
                              <div className="flex flex-wrap gap-1">
                                {clinic.services.map(function(s) {
                                  return React.createElement('span', { key: s, className: 'text-xs bg-white border border-gray-200 text-gray-600 px-2 py-0.5 rounded-full capitalize' }, s.replace(/_/g, ' '))
                                })}
                              </div>
                            </div>
                          )}
                          {clinic.insurance_accepted && clinic.insurance_accepted.length > 0 && (
                            <div>
                              <div className="flex items-center gap-1.5 mb-1.5">
                                <Shield className="w-3.5 h-3.5 text-brand-600" />
                                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Insurance Accepted</p>
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {clinic.insurance_accepted.map(function(ins) {
                                  var cls = INSURANCE_COLORS[ins] || 'bg-gray-100 text-gray-600'
                                  return React.createElement('span', { key: ins, className: 'text-xs font-semibold px-2 py-0.5 rounded-full ' + cls }, ins)
                                })}
                              </div>
                            </div>
                          )}
                          {clinic.latitude && clinic.longitude && React.createElement('a', {
                            href: mapsUrl(clinic.latitude, clinic.longitude),
                            target: '_blank', rel: 'noopener noreferrer',
                            className: 'inline-flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-all'
                          },
                            React.createElement(Navigation, { className: 'w-3.5 h-3.5' }),
                            'Get Directions'
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {!clinicsLoading && county && clinics.length === 0 && (
            <div className="text-center py-6">
              <Building2 className="w-10 h-10 text-gray-200 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">No hospitals found in {county} County</p>
            </div>
          )}
        </div>
      )}

      {/* STEP 2 */}
      {step === 'details' && selectedClinic && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-brand-600 rounded-full flex items-center justify-center text-white font-bold text-sm">2</div>
              <h2 className="font-bold text-gray-900 text-lg">Start Consultation</h2>
            </div>
            <button type="button"
              onClick={function() { setStep('choose'); setSelectedClinic(null) }}
              className="text-xs text-gray-400 hover:text-gray-600 underline">
              Change hospital
            </button>
          </div>

          {/* Hospital card */}
          <div className="bg-brand-50 border border-brand-200 rounded-2xl p-4 space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-brand-900">{selectedClinic.name}</p>
                <p className="text-sm text-brand-700">{selectedClinic.district || selectedClinic.region}, {selectedClinic.region}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={'text-xs font-semibold px-2 py-0.5 rounded-full border ' + (RESOURCE_BADGE[selectedClinic.resource_level] || RESOURCE_BADGE.medium)}>
                    {selectedClinic.resource_level} resource
                  </span>
                  <span className={'text-xs font-medium capitalize ' + (selectedClinic.ownership === 'private' ? 'text-purple-700' : 'text-brand-700')}>
                    {selectedClinic.ownership || 'public'}
                  </span>
                </div>
              </div>
            </div>
            {selectedClinic.address && (
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-brand-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-brand-800">{selectedClinic.address}</p>
              </div>
            )}
            {selectedClinic.phone && React.createElement('a', { href: 'tel:' + selectedClinic.phone, className: 'inline-flex items-center gap-1 text-xs text-brand-600 font-medium hover:underline' },
              React.createElement(Phone, { className: 'w-3 h-3' }), selectedClinic.phone
            )}
            {selectedClinic.insurance_accepted && selectedClinic.insurance_accepted.length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Shield className="w-3.5 h-3.5 text-brand-600" />
                  <p className="text-xs font-semibold text-brand-600 uppercase tracking-wider">Insurance Accepted</p>
                </div>
                <div className="flex flex-wrap gap-1">
                  {selectedClinic.insurance_accepted.map(function(ins) {
                    var cls = INSURANCE_COLORS[ins] || 'bg-gray-100 text-gray-600'
                    return React.createElement('span', { key: ins, className: 'text-xs font-semibold px-2.5 py-1 rounded-full ' + cls }, ins)
                  })}
                </div>
              </div>
            )}
            {selectedClinic.services && selectedClinic.services.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-brand-600 uppercase tracking-wider mb-1.5">Services</p>
                <div className="flex flex-wrap gap-1">
                  {selectedClinic.services.map(function(s) {
                    return React.createElement('span', { key: s, className: 'text-xs bg-white border border-brand-200 text-brand-700 px-2.5 py-1 rounded-full font-medium capitalize' }, s.replace(/_/g, ' '))
                  })}
                </div>
              </div>
            )}
            {selectedClinic.latitude && selectedClinic.longitude && React.createElement('a', {
              href: mapsUrl(selectedClinic.latitude, selectedClinic.longitude),
              target: '_blank', rel: 'noopener noreferrer',
              className: 'inline-flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold px-3 py-2 rounded-xl transition-all'
            },
              React.createElement(Navigation, { className: 'w-3.5 h-3.5' }),
              'Get Directions to Hospital'
            )}
          </div>

          {/* Type selector */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Consultation type</label>
            <div className="grid grid-cols-2 gap-3">
              {[['chat','Chat','Text message with attendant'],['video','Video Call','Face-to-face video']].map(function(arr) {
                var val    = arr[0]; var label = arr[1]; var sub = arr[2]
                var active = consultType === val
                return (
                  <button key={val} type="button"
                    onClick={function() { setConsultType(val) }}
                    className={'flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ' + (active ? 'border-brand-500 bg-brand-50' : 'border-gray-200 hover:border-gray-300')}>
                    {val === 'chat'
                      ? React.createElement(MessageCircle, { className: 'w-5 h-5 ' + (active ? 'text-brand-600' : 'text-gray-400') })
                      : React.createElement(Video, { className: 'w-5 h-5 ' + (active ? 'text-brand-600' : 'text-gray-400') })
                    }
                    <div>
                      <p className={'text-sm font-bold ' + (active ? 'text-brand-900' : 'text-gray-700')}>{label}</p>
                      <p className="text-xs text-gray-400">{sub}</p>
                    </div>
                    {active && React.createElement(CheckCircle2, { className: 'w-4 h-4 text-brand-600 ml-auto flex-shrink-0' })}
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Describe your concern <span className="text-red-400">*</span>
            </label>
            <textarea rows={4}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 resize-none"
              placeholder="Describe your symptoms or health concern in detail. The more information you give, the better the hospital staff can help you."
              value={complaint}
              onChange={function(e) { setComplaint(e.target.value) }} />
            <p className="text-xs text-gray-400 mt-1">{complaint.length} characters</p>
          </div>

          <button type="button" onClick={startConsultation}
            disabled={creating || !complaint.trim()}
            className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-4 rounded-xl transition-all disabled:opacity-40 flex items-center justify-center gap-2 text-base">
            {creating
              ? 'Connecting to ' + selectedClinic.name + '...'
              : (consultType === 'video' ? 'Start Video Call' : 'Start Chat') + ' with ' + selectedClinic.name
            }
          </button>
          <p className="text-xs text-gray-400 text-center">You will be connected to a hospital attendant. Response times may vary.</p>
        </motion.div>
      )}
    </div>
  )
}
