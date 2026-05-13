import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { MapPin, Phone, Clock, Search, Filter } from 'lucide-react'
import { clinicService } from '../services/api'
import { cacheManager } from '../offline/db'

export default function Clinics() {
  const [clinics, setClinics] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState({ country: 'Kenya', region: '' })

  useEffect(() => {
    const load = async () => {
      try {
        const res = await clinicService.getAll({ country: filters.country, region: filters.region || undefined })
        const data = res.data.clinics || []
        setClinics(data)
        await cacheManager.saveClinics(data)
      } catch {
        // Fallback to cached
        const cached = await cacheManager.getClinics()
        if (cached.length) setClinics(cached)
      } finally { setLoading(false) }
    }
    load()
  }, [filters.country, filters.region])

  const filtered = clinics.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.district?.toLowerCase().includes(search.toLowerCase())
  )

  const resourceColor = { high: 'text-brand-600 bg-brand-50', medium: 'text-amber-600 bg-amber-50', low: 'text-orange-600 bg-orange-50' }

  return (
    <div className="max-w-3xl mx-auto animate-fade-in space-y-6">
      <div>
        <h1 className="font-display text-3xl text-gray-900">Find Screening Clinics</h1>
        <p className="text-gray-500 mt-1">Locate cancer screening facilities near you</p>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="grid sm:grid-cols-3 gap-3">
          <div className="relative sm:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" className="input-field pl-9" placeholder="Search by name or area..."
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="input-field" value={filters.country}
            onChange={e => setFilters(p => ({ ...p, country: e.target.value, region: '' }))}>
            {['Kenya','Uganda','Tanzania','Rwanda','Ethiopia','Nigeria','Ghana','South Africa'].map(c =>
              <option key={c} value={c}>{c}</option>
            )}
          </select>
        </div>
      </div>

      {/* Clinics list */}
      {loading ? (
        <div className="flex justify-center py-12"><div className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} /></div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-12">
          <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No clinics found. Try a different region.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-gray-500">{filtered.length} facilities found</p>
          {filtered.map((c, i) => (
            <motion.div key={c.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }} className="card">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-brand-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5 text-brand-600" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">{c.name}</p>
                    <p className="text-sm text-gray-500 mt-0.5">{c.address}</p>
                    <p className="text-xs text-gray-400">{c.district}, {c.region}</p>
                    {c.phone && (
                      <a href={`tel:${c.phone}`} className="flex items-center gap-1 text-xs text-brand-600 font-medium mt-1 hover:underline">
                        <Phone className="w-3 h-3" /> {c.phone}
                      </a>
                    )}
                    {c.services?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {c.services.slice(0, 4).map(s => (
                          <span key={s} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-lg">
                            {s.replace(/_/g, ' ')}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex-shrink-0 text-right">
                  <span className={`text-xs font-semibold px-2 py-1 rounded-lg ${resourceColor[c.resource_level] || resourceColor.medium}`}>
                    {c.resource_level} resource
                  </span>
                  <p className="text-xs text-gray-400 mt-1 capitalize">{c.type?.replace('_', ' ')}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
