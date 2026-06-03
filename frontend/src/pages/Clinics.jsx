import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MapPin, Phone, Search, ChevronDown, Building2, Navigation, Shield } from 'lucide-react'
import { clinicService } from '../services/api'
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

var INSURANCE_COLOR = {
  'SHA':        'bg-blue-100 text-blue-700',
  'NHIF':       'bg-green-100 text-green-700',
  'AAR':        'bg-purple-100 text-purple-700',
  'Jubilee':    'bg-yellow-100 text-yellow-800',
  'CIC':        'bg-orange-100 text-orange-700',
  'Britam':     'bg-red-100 text-red-700',
  'Resolution': 'bg-teal-100 text-teal-700',
  'UAP':        'bg-indigo-100 text-indigo-700',
  'Madison':    'bg-pink-100 text-pink-700',
}

function mapsUrl(lat, lng) {
  return 'https://www.google.com/maps/dir/?api=1&destination=' + lat + ',' + lng
}

export default function Clinics() {
  var [country,    setCountry]    = useState('Kenya')
  var [county,     setCounty]     = useState('')
  var [search,     setSearch]     = useState('')
  var [insurance,  setInsurance]  = useState('')
  var [clinics,    setClinics]    = useState([])
  var [loading,    setLoading]    = useState(false)
  var [searched,   setSearched]   = useState(false)
  var [expanded,   setExpanded]   = useState(null)

  function doSearch() {
    if (!county && !search.trim()) {
      toast.error('Please select a county first')
      return
    }
    setLoading(true)
    setSearched(true)
    setExpanded(null)
    var params = { country: country }
    if (county)       params.county    = county
    if (search.trim()) params.search   = search.trim()
    if (insurance)    params.insurance = insurance
    clinicService.getAll(params)
      .then(function(r) {
        var list = r.data.clinics || []
        setClinics(list)
        if (list.length === 0) {
          toast('No clinics found. Try a different county or remove the insurance filter.', { icon: 'ℹ️' })
        }
      })
      .catch(function(err) {
        console.error('Clinics API error:', err)
        toast.error('Could not load clinics: ' + (err.response?.data?.error || err.message))
      })
      .finally(function() { setLoading(false) })
  }

  function handleCountyChange(e) {
    var val = e.target.value
    setCounty(val)
    setClinics([])
    setSearched(false)
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">

      <div>
        <h1 className="font-display text-3xl text-gray-900">Find Screening Clinics</h1>
        <p className="text-gray-500 mt-1">Search cancer screening facilities across all 47 Kenyan counties</p>
      </div>

      {/* Search panel */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">

        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
              Country
            </label>
            <select
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
              value={country}
              onChange={function(e) { setCountry(e.target.value); setCounty(''); setClinics([]) }}>
              <option value="Kenya">Kenya</option>
              <option value="Uganda">Uganda</option>
              <option value="Tanzania">Tanzania</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
              County <span className="text-red-400">*</span>
            </label>
            <select
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
              value={county}
              onChange={handleCountyChange}>
              <option value="">-- Select county --</option>
              {KENYA_COUNTIES.map(function(c) {
                return React.createElement('option', { key: c, value: c }, c + ' County')
              })}
            </select>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
              Insurance
            </label>
            <select
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
              value={insurance}
              onChange={function(e) { setInsurance(e.target.value) }}>
              <option value="">All hospitals</option>
              <option value="SHA">SHA</option>
              <option value="NHIF">NHIF</option>
              <option value="AAR">AAR</option>
              <option value="Jubilee">Jubilee</option>
              <option value="CIC">CIC</option>
              <option value="Britam">Britam</option>
              <option value="Resolution">Resolution Health</option>
              <option value="UAP">UAP</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
              Search by name
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text"
                className="w-full border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                placeholder="e.g. Kenyatta, maternity..."
                value={search}
                onChange={function(e) { setSearch(e.target.value) }}
                onKeyDown={function(e) { if (e.key === 'Enter') doSearch() }} />
            </div>
          </div>
        </div>

        <button type="button" onClick={doSearch} disabled={loading}
          className="w-full bg-brand-600 hover:bg-brand-700 text-white font-semibold py-3 rounded-xl transition-all disabled:opacity-40 flex items-center justify-center gap-2">
          {loading
            ? React.createElement(React.Fragment, null,
                React.createElement('div', { className: 'w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin' }),
                'Searching...'
              )
            : React.createElement(React.Fragment, null,
                React.createElement(Search, { className: 'w-4 h-4' }),
                'Search Clinics'
              )
          }
        </button>
      </div>

      {/* Prompt */}
      {!searched && !loading && (
        <div className="bg-brand-50 border border-brand-100 rounded-2xl p-8 text-center">
          <MapPin className="w-12 h-12 text-brand-300 mx-auto mb-3" />
          <p className="text-brand-700 font-semibold text-lg">Select your county to find hospitals</p>
          <p className="text-brand-500 text-sm mt-2">Hospitals available across all 47 Kenyan counties</p>
          <div className="flex flex-wrap justify-center gap-2 mt-4">
            {['Nairobi','Mombasa','Kisumu','Nakuru','Uasin Gishu','Kiambu','Bungoma'].map(function(c) {
              return (
                React.createElement('button', {
                  key: c, type: 'button',
                  onClick: function() { setCounty(c); setCountry('Kenya') },
                  className: 'text-xs bg-white border border-brand-200 text-brand-700 px-3 py-1.5 rounded-full hover:bg-brand-100 transition-all font-medium'
                }, c)
              )
            })}
          </div>
        </div>
      )}

      {/* No results */}
      {searched && !loading && clinics.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <Building2 className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-600 font-semibold">No clinics found</p>
          <p className="text-gray-400 text-sm mt-1">Try a different county or remove the insurance filter</p>
        </div>
      )}

      {/* Results */}
      {clinics.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500 font-medium">
              {clinics.length} hospital{clinics.length !== 1 ? 's' : ''} found
              {county ? ' in ' + county + ' County' : ''}
            </p>
            <button type="button"
              onClick={function() { setClinics([]); setSearched(false); setCounty(''); setSearch('') }}
              className="text-xs text-gray-400 hover:text-gray-600 underline">
              Clear
            </button>
          </div>

          {clinics.map(function(c, i) {
            var isExpanded = expanded === c.id
            var badge = RESOURCE_BADGE[c.resource_level] || RESOURCE_BADGE.medium

            return (
              React.createElement(motion.div, {
                key: c.id,
                initial: { opacity: 0, y: 8 },
                animate: { opacity: 1, y: 0 },
                transition: { delay: i * 0.03 },
                className: 'bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden'
              },

                /* Header row */
                React.createElement('button', {
                  type: 'button',
                  className: 'w-full flex items-start justify-between gap-3 p-4 text-left hover:bg-gray-50 transition-colors',
                  onClick: function() { setExpanded(isExpanded ? null : c.id) }
                },
                  React.createElement('div', { className: 'flex items-start gap-3' },
                    React.createElement('div', { className: 'w-10 h-10 bg-brand-100 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5' },
                      React.createElement(Building2, { className: 'w-5 h-5 text-brand-600' })
                    ),
                    React.createElement('div', { className: 'text-left' },
                      React.createElement('p', { className: 'font-bold text-gray-900 text-sm' }, c.name),
                      React.createElement('p', { className: 'text-xs text-gray-500 mt-0.5' },
                        (c.district ? c.district + ', ' : '') + c.region
                      ),
                      c.phone && React.createElement('a', {
                        href: 'tel:' + c.phone,
                        onClick: function(e) { e.stopPropagation() },
                        className: 'inline-flex items-center gap-1 text-xs text-brand-600 font-medium mt-1 hover:underline'
                      },
                        React.createElement(Phone, { className: 'w-3 h-3' }),
                        c.phone
                      )
                    )
                  ),
                  React.createElement('div', { className: 'flex items-center gap-2 flex-shrink-0' },
                    React.createElement('span', {
                      className: 'text-xs font-semibold px-2 py-0.5 rounded-full border capitalize ' + badge
                    }, c.resource_level),
                    React.createElement('span', {
                      className: 'text-xs font-medium capitalize ' + (c.ownership === 'private' ? 'text-purple-600' : 'text-brand-600')
                    }, c.ownership || 'public'),
                    React.createElement(ChevronDown, {
                      className: 'w-4 h-4 text-gray-400 transition-transform ' + (isExpanded ? 'rotate-180' : '')
                    })
                  )
                ),

                /* Expanded details */
                React.createElement(AnimatePresence, null,
                  isExpanded && React.createElement(motion.div, {
                    initial: { height: 0, opacity: 0 },
                    animate: { height: 'auto', opacity: 1 },
                    exit: { height: 0, opacity: 0 },
                    transition: { duration: 0.2 },
                    className: 'overflow-hidden'
                  },
                    React.createElement('div', { className: 'px-4 pb-4 pt-3 border-t border-gray-100 space-y-3 bg-gray-50' },

                      c.address && React.createElement('div', { className: 'flex items-start gap-2' },
                        React.createElement(MapPin, { className: 'w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5' }),
                        React.createElement('p', { className: 'text-sm text-gray-600' }, c.address)
                      ),

                      c.services && c.services.length > 0 && React.createElement('div', null,
                        React.createElement('p', { className: 'text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5' }, 'Services'),
                        React.createElement('div', { className: 'flex flex-wrap gap-1' },
                          c.services.map(function(s) {
                            return React.createElement('span', {
                              key: s,
                              className: 'text-xs bg-white border border-gray-200 text-gray-600 px-2 py-0.5 rounded-full capitalize'
                            }, s.replace(/_/g, ' '))
                          })
                        )
                      ),

                      c.insurance_accepted && c.insurance_accepted.length > 0 && React.createElement('div', null,
                        React.createElement('div', { className: 'flex items-center gap-1.5 mb-1.5' },
                          React.createElement(Shield, { className: 'w-3.5 h-3.5 text-brand-600' }),
                          React.createElement('p', { className: 'text-xs font-semibold text-gray-400 uppercase tracking-wider' }, 'Insurance Accepted')
                        ),
                        React.createElement('div', { className: 'flex flex-wrap gap-1' },
                          c.insurance_accepted.map(function(ins) {
                            var cls = INSURANCE_COLOR[ins] || 'bg-gray-100 text-gray-600'
                            return React.createElement('span', {
                              key: ins,
                              className: 'text-xs font-semibold px-2.5 py-0.5 rounded-full ' + cls
                            }, ins)
                          })
                        )
                      ),

                      React.createElement('div', { className: 'flex gap-2 pt-1' },
                        c.phone && React.createElement('a', {
                          href: 'tel:' + c.phone,
                          className: 'flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold px-3 py-2 rounded-xl transition-all'
                        },
                          React.createElement(Phone, { className: 'w-3.5 h-3.5' }), 'Call'
                        ),
                        c.latitude && c.longitude && React.createElement('a', {
                          href: mapsUrl(c.latitude, c.longitude),
                          target: '_blank',
                          rel: 'noopener noreferrer',
                          className: 'flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold px-3 py-2 rounded-xl transition-all'
                        },
                          React.createElement(Navigation, { className: 'w-3.5 h-3.5' }), 'Get Directions'
                        )
                      )
                    )
                  )
                )
              )
            )
          })}
        </div>
      )}
    </div>
  )
}
