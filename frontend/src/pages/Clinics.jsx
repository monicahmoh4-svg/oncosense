import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MapPin, Phone, Search, ChevronDown, Building2, Navigation } from 'lucide-react'
import { clinicService } from '../services/api'
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

const resourceBadge = {
  high:   'bg-emerald-100 text-emerald-700 border-emerald-200',
  medium: 'bg-amber-100 text-amber-700 border-amber-200',
  low:    'bg-orange-100 text-orange-700 border-orange-200',
}

export default function Clinics() {
  const [clinics, setClinics]   = useState([])
  const [loading, setLoading]   = useState(false)
  const [searched, setSearched] = useState(false)
  const [expanded, setExpanded] = useState(null)
  const [country, setCountry]   = useState('Kenya')
  const [county, setCounty]     = useState('')
  const [search, setSearch]     = useState('')

  const fetchClinics = async () => {
    if (!county && !search.trim()) {
      toast.error('Please select a county or enter a search term')
      return
    }
    setLoading(true)
    setSearched(true)
    setExpanded(null)
    try {
      const params = { country }
      if (county)        params.county = county
      if (search.trim()) params.search = search.trim()
      const res   = await clinicService.getAll(params)
      const found = res.data.clinics || []
      setClinics(found)
      if (found.length === 0) toast('No clinics found for this selection', { icon: 'ℹ️' })
    } catch (err) {
      console.error('Clinics error:', err)
      toast.error(err.response?.data?.error || 'Could not load clinics. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">

      <div>
        <h1 className="font-display text-3xl text-gray-900">Find Screening Clinics</h1>
        <p className="text-gray-500 mt-1">Search cancer screening facilities across all 47 Kenyan counties</p>
      </div>

      {/* Search panel */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">

        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Country</label>
          <select
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
            value={country}
            onChange={e => { setCountry(e.target.value); setCounty(''); setClinics([]); setSearched(false) }}>
            <option value="Kenya">🇰🇪 Kenya</option>
            <option value="Uganda">Uganda</option>
            <option value="Tanzania">Tanzania</option>
            <option value="Rwanda">Rwanda</option>
            <option value="Ethiopia">Ethiopia</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
            County <span className="text-red-400">*</span>
          </label>
          <select
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
            value={county}
            onChange={e => setCounty(e.target.value)}>
            <option value="">— Select a county —</option>
            {KENYA_COUNTIES.map(c => (
              <option key={c} value={c}>{c} County</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
            Search by name (optional)
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              className="w-full border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
              placeholder="e.g. Kenyatta, maternity, oncology..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && fetchClinics()}
            />
          </div>
        </div>

        <button
          onClick={fetchClinics}
          disabled={loading}
          className="w-full bg-brand-600 hover:bg-brand-700 text-white font-semibold py-3 rounded-xl transition-all disabled:opacity-40 flex items-center justify-center gap-2 active:scale-95">
          {loading
            ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Searching...</>
            : <><Search className="w-4 h-4" />Search Clinics</>}
        </button>
      </div>

      {/* Initial state */}
      {!searched && !loading && (
        <div className="bg-brand-50 border border-brand-100 rounded-2xl p-8 text-center">
          <MapPin className="w-12 h-12 text-brand-300 mx-auto mb-3" />
          <p className="text-brand-700 font-semibold text-lg">Select your county to find nearby clinics</p>
          <p className="text-brand-500 text-sm mt-2">Clinics available across all 47 Kenyan counties</p>
          <div className="flex flex-wrap justify-center gap-2 mt-4">
            {['Nairobi','Mombasa','Kisumu','Nakuru','Uasin Gishu','Kiambu','Meru'].map(c => (
              <button key={c}
                onClick={() => { setCounty(c); setCountry('Kenya') }}
                className="text-xs bg-white border border-brand-200 text-brand-700 px-3 py-1.5 rounded-full hover:bg-brand-100 transition-all font-medium">
                {c}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* No results */}
      {searched && !loading && clinics.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600 font-semibold">No clinics found</p>
          <p className="text-gray-400 text-sm mt-1">Try selecting a different county</p>
        </div>
      )}

      {/* Results list */}
      {clinics.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500 font-medium">
              {clinics.length} clinic{clinics.length !== 1 ? 's' : ''} found
              {county ? ` in ${county} County` : ''}
            </p>
            <button
              onClick={() => { setClinics([]); setSearched(false); setCounty(''); setSearch('') }}
              className="text-xs text-gray-400 hover:text-gray-600 underline">
              Clear
            </button>
          </div>

          {clinics.map((c, i) => (
            <motion.div key={c.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

              {/* Header */}
              <button
                className="w-full flex items-start justify-between gap-4 p-5 text-left hover:bg-gray-50 transition-colors"
                onClick={() => setExpanded(expanded === c.id ? null : c.id)}>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-brand-100 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                    <MapPin className="w-5 h-5 text-brand-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-gray-900">{c.name}</p>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {c.district ? `${c.district}, ` : ''}{c.region}
                    </p>
                    {c.phone && (
                      <a href={`tel:${c.phone}`}
                        onClick={e => e.stopPropagation()}
                        className="inline-flex items-center gap-1 text-xs text-brand-600 font-medium mt-1 hover:underline">
                        <Phone className="w-3 h-3" />{c.phone}
                      </a>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border capitalize ${resourceBadge[c.resource_level] || resourceBadge.medium}`}>
                    {c.resource_level}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${expanded === c.id ? 'rotate-180' : ''}`} />
                </div>
              </button>

              {/* Expanded details */}
              <AnimatePresence>
                {expanded === c.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden">
                    <div className="px-5 pb-5 pt-3 border-t border-gray-100 space-y-4">

                      {c.address && (
                        <div>
                          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Address</p>
                          <p className="text-sm text-gray-700">{c.address}</p>
                        </div>
                      )}

                      <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Facility Type</p>
                        <p className="text-sm text-gray-700 capitalize">{c.type?.replace(/_/g, ' ')}</p>
                      </div>

                      {c.services?.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Services Available</p>
                          <div className="flex flex-wrap gap-1.5">
                            {c.services.map(s => (
                              <span key={s}
                                className="text-xs bg-brand-50 text-brand-700 border border-brand-200 px-2.5 py-1 rounded-full font-medium capitalize">
                                {s.replace(/_/g, ' ')}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2 pt-1">
                        {c.phone && (
                          <a href={`tel:${c.phone}`}
                            className="flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold px-4 py-2 rounded-xl transition-all">
                            <Phone className="w-4 h-4" />Call
                          </a>
                        )}
                        {c.latitude && c.longitude && (
                          
                            href={`https://www.google.com/maps/dir/?api=1&destination=${c.latitude},${c.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all">
                            <Navigation className="w-4 h-4" />Get Directions
                          </a>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
