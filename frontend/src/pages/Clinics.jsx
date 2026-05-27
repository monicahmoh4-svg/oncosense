import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { MapPin, Phone, Search, ChevronDown, Building2 } from 'lucide-react'
import { clinicService } from '../services/api'
import api from '../services/api'
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

const COUNTRIES = ['Kenya','Uganda','Tanzania','Rwanda','Ethiopia','Nigeria','Ghana','South Africa']

export default function Clinics() {
  const [clinics, setClinics]     = useState([])
  const [loading, setLoading]     = useState(false)
  const [searched, setSearched]   = useState(false)
  const [search, setSearch]       = useState('')
  const [country, setCountry]     = useState('Kenya')
  const [county, setCounty]       = useState('')
  const [expanded, setExpanded]   = useState(null)

  const fetchClinics = async () => {
    if (!county && !search) { toast.error('Please select a county or enter a search term'); return }
    setLoading(true)
    setSearched(true)
    try {
      const params = { country }
      if (county) params.county  = county
      if (search) params.search  = search
      const res = await clinicService.getAll(params)
      setClinics(res.data.clinics || [])
      if ((res.data.clinics || []).length === 0) toast('No clinics found for this selection', { icon: 'ℹ️' })
    } catch { toast.error('Could not load clinics') }
    finally { setLoading(false) }
  }

  const resourceBadge = {
    high:   'bg-emerald-100 text-emerald-700',
    medium: 'bg-amber-100 text-amber-700',
    low:    'bg-orange-100 text-orange-700'
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-3xl text-gray-900">Find Screening Clinics</h1>
        <p className="text-gray-500 mt-1">Search for cancer screening facilities by county</p>
      </div>

      {/* Search panel */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Country</label>
            <select
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
              value={country}
              onChange={e => { setCountry(e.target.value); setCounty(''); setClinics([]) }}>
              {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">County / Region</label>
            <select
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
              value={county}
              onChange={e => setCounty(e.target.value)}>
              <option value="">— Select county —</option>
              {KENYA_COUNTIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text"
            className="w-full border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
            placeholder="Search by clinic name or area (optional)..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && fetchClinics()} />
        </div>
        <button onClick={fetchClinics} disabled={loading}
          className="w-full bg-brand-600 hover:bg-brand-700 text-white font-semibold py-3 rounded-xl transition-all disabled:opacity-40 flex items-center justify-center gap-2">
          {loading
            ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Searching...</>
            : <><Search className="w-4 h-4" /> Search Clinics</>}
        </button>
      </div>

      {/* Results */}
      {!searched && !loading && (
        <div className="bg-brand-50 border border-brand-200 rounded-2xl p-6 text-center">
          <MapPin className="w-10 h-10 text-brand-400 mx-auto mb-3" />
          <p className="text-brand-700 font-semibold">Select a county above to find clinics near you</p>
          <p className="text-brand-500 text-sm mt-1">We have clinics across all 47 Kenyan counties</p>
        </div>
      )}

      {searched && !loading && clinics.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600 font-semibold">No clinics found</p>
          <p className="text-gray-400 text-sm mt-1">Try a different county or search term</p>
        </div>
      )}

      {clinics.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm text-gray-500 font-medium">
            {clinics.length} clinic{clinics.length !== 1 ? 's' : ''} found
            {county ? ` in ${county} County` : ''}
          </p>
          {clinics.map((c, i) => (
            <motion.div key={c.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

              {/* Header row */}
              <button
                className="w-full flex items-start justify-between gap-4 p-5 text-left"
                onClick={() => setExpanded(expanded === c.id ? null : c.id)}>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-brand-100 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                    <MapPin className="w-5 h-5 text-brand-600" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">{c.name}</p>
                    <p className="text-sm text-gray-500">{c.district || c.region}, {c.region}</p>
                    {c.phone && (
                      <a href={`tel:${c.phone}`}
                        onClick={e => e.stopPropagation()}
                        className="flex items-center gap-1 text-xs text-brand-600 font-medium mt-1 hover:underline">
                        <Phone className="w-3 h-3" /> {c.phone}
                      </a>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${resourceBadge[c.resource_level] || resourceBadge.medium}`}>
                    {c.resource_level}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${expanded === c.id ? 'rotate-180' : ''}`} />
                </div>
              </button>

              {/* Expanded details */}
              {expanded === c.id && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="px-5 pb-5 border-t border-gray-100 pt-4 space-y-3">

                  {c.address && (
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Address</p>
                      <p className="text-sm text-gray-700">{c.address}</p>
                    </div>
                  )}

                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Facility Type</p>
                    <p className="text-sm text-gray-700 capitalize">{c.type?.replace('_', ' ')}</p>
                  </div>

                  {c.services?.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Services Available</p>
                      <div className="flex flex-wrap gap-1.5">
                        {c.services.map(s => (
                          <span key={s} className="text-xs bg-brand-50 text-brand-700 border border-brand-200 px-2.5 py-1 rounded-full font-medium">
                            {s.replace(/_/g, ' ')}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {c.latitude && c.longitude && (
                    
                      href={`https://www.google.com/maps/dir/?api=1&destination=${c.latitude},${c.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all mt-1">
                      <MapPin className="w-4 h-4" /> Get Directions
                    </a>
                  )}
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
