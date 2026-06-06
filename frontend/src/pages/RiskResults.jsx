import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  AlertTriangle, CheckCircle2, AlertCircle, Activity,
  ChevronDown, ChevronUp, RefreshCw
} from 'lucide-react'
import { assessmentService } from '../services/api'
import toast from 'react-hot-toast'

var RISK_CONFIG = {
  low:      { label: 'Low Risk',      bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', bar: 'bg-emerald-500' },
  medium:   { label: 'Moderate Risk', bg: 'bg-amber-50',   border: 'border-amber-200',   text: 'text-amber-700',   bar: 'bg-amber-500' },
  high:     { label: 'High Risk',     bg: 'bg-orange-50',  border: 'border-orange-200',  text: 'text-orange-700',  bar: 'bg-orange-500' },
  critical: { label: 'Critical',      bg: 'bg-red-50',     border: 'border-red-200',     text: 'text-red-700',     bar: 'bg-red-500' },
}

var RISK_DESC = {
  low:      'Your current risk profile is reassuring. Maintain healthy habits and attend regular check-ups.',
  medium:   'You have risk factors that warrant attention. Lifestyle changes and routine screening are recommended.',
  high:     'Your risk profile is elevated. A medical evaluation is strongly recommended. Please contact a healthcare provider soon.',
  critical: 'Your profile indicates signs that require URGENT medical evaluation. Please seek medical care immediately — do not delay.',
}

var REC_COLORS = {
  immediate: 'bg-red-100 text-red-700 border-red-200',
  urgent:    'bg-orange-100 text-orange-700 border-orange-200',
  routine:   'bg-blue-100 text-blue-700 border-blue-200',
  lifestyle: 'bg-green-100 text-green-700 border-green-200',
  monitoring:'bg-purple-100 text-purple-700 border-purple-200',
}

var REC_LABELS = {
  immediate: 'Immediate Action',
  urgent:    'Urgent',
  routine:   'Routine Screening',
  lifestyle: 'Lifestyle',
  monitoring:'Monitoring',
}

export default function RiskResults() {
  var params   = useParams()
  var navigate = useNavigate()
  var id       = params.id

  var [assessment,     setAssessment]     = useState(null)
  var [recommendations,setRecommendations]= useState([])
  var [loading,        setLoading]        = useState(true)
  var [showFactors,    setShowFactors]    = useState(false)

  useEffect(function() {
    var load = async function() {
      try {
        var res
        if (id) res = await assessmentService.getById(id)
        else    res = await assessmentService.getLatest()
        setAssessment(res.data.assessment)
        setRecommendations(res.data.recommendations || [])
      } catch (err) {
        toast.error('Could not load assessment results')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  if (loading) {
    return React.createElement('div', { className: 'flex items-center justify-center h-64' },
      React.createElement('div', { className: 'w-10 h-10 border-2 border-brand-400 border-t-transparent rounded-full animate-spin' })
    )
  }

  if (!assessment) {
    return React.createElement('div', { className: 'max-w-2xl mx-auto text-center py-20' },
      React.createElement(Activity, { className: 'w-16 h-16 text-gray-200 mx-auto mb-4' }),
      React.createElement('h2', { className: 'font-display text-2xl text-gray-700 mb-2' }, 'No Assessment Found'),
      React.createElement('p', { className: 'text-gray-500 mb-6' }, 'Complete a health assessment to see your personalised risk results.'),
      React.createElement('button', {
        type: 'button',
        onClick: function() { navigate('/assessment') },
        className: 'bg-brand-600 hover:bg-brand-700 text-white font-semibold px-6 py-3 rounded-xl transition-all inline-flex items-center gap-2'
      },
        React.createElement(Activity, { className: 'w-4 h-4' }),
        'Start Assessment'
      )
    )
  }

  var riskLevel = assessment.risk_level || 'low'
  var cfg       = RISK_CONFIG[riskLevel] || RISK_CONFIG.low
  var score     = Math.round((assessment.final_score || 0) * 100)
  var confidence = Math.round((assessment.confidence_score || 0.7) * 100)

  var factors = {}
  try {
    var fi = assessment.feature_importance
    if (typeof fi === 'string') fi = JSON.parse(fi)
    factors = fi?.factors || {}
  } catch {}

  var categories = []
  try {
    var sc = assessment.suspected_categories
    if (typeof sc === 'string') sc = JSON.parse(sc)
    categories = Array.isArray(sc) ? sc : []
  } catch {}

  var riskIcon = riskLevel === 'low' ? CheckCircle2 : AlertTriangle

  return (
    <div className="max-w-2xl mx-auto space-y-6">

      <div>
        <h1 className="font-display text-3xl text-gray-900">Your Risk Assessment Results</h1>
        <p className="text-gray-500 mt-1 text-sm">
          {'Assessed on ' + new Date(assessment.created_at).toLocaleDateString('en-KE', { dateStyle: 'long' })}
        </p>
      </div>

      {/* Risk card */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        className={'rounded-2xl border-2 p-6 ' + cfg.bg + ' ' + cfg.border}>
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 bg-white shadow-sm">
            {React.createElement(riskIcon, { className: 'w-8 h-8 ' + cfg.text })}
          </div>
          <div className="flex-1">
            <p className={'font-display text-2xl font-bold ' + cfg.text}>{cfg.label}</p>
            <p className="text-gray-700 text-sm mt-1 leading-relaxed">{RISK_DESC[riskLevel]}</p>
          </div>
        </div>

        <div className="mt-5">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-gray-500 font-medium">Risk Score</span>
            <span className={'font-bold text-base ' + cfg.text}>{score + '%'}</span>
          </div>
          <div className="w-full bg-white/70 rounded-full h-3 overflow-hidden">
            <motion.div
              className={'h-3 rounded-full ' + cfg.bar}
              initial={{ width: 0 }}
              animate={{ width: score + '%' }}
              transition={{ duration: 0.8, ease: 'easeOut' }} />
          </div>
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>Low</span><span>Moderate</span><span>High</span><span>Critical</span>
          </div>
        </div>

        <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
          <span>{'Confidence: '}<strong className="text-gray-700">{confidence + '%'}</strong></span>
          {assessment.symptom_count > 0 && (
            <span>{'Symptoms: '}<strong className="text-gray-700">{assessment.symptom_count}</strong></span>
          )}
          {assessment.age && (
            <span>{'Age: '}<strong className="text-gray-700">{assessment.age + ' yrs'}</strong></span>
          )}
        </div>
      </motion.div>

      {/* Suspected categories */}
      {categories.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-bold text-gray-900 mb-2">Areas of Concern</h3>
          <p className="text-xs text-gray-500 mb-3">Based on your risk factors and symptoms:</p>
          <div className="flex flex-wrap gap-2">
            {categories.map(function(cat) {
              return React.createElement('span', {
                key: cat,
                className: 'bg-orange-50 text-orange-700 border border-orange-200 px-3 py-1.5 rounded-full text-sm font-semibold'
              }, cat)
            })}
          </div>
        </motion.div>
      )}

      {/* Risk factors */}
      {Object.keys(factors).length > 0 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <button type="button"
            onClick={function() { setShowFactors(!showFactors) }}
            className="w-full flex items-center justify-between">
            <h3 className="font-bold text-gray-900">Contributing Risk Factors</h3>
            {showFactors
              ? React.createElement(ChevronUp, { className: 'w-5 h-5 text-gray-400' })
              : React.createElement(ChevronDown, { className: 'w-5 h-5 text-gray-400' })
            }
          </button>
          {showFactors && (
            <div className="mt-4 space-y-2">
              {Object.entries(factors)
                .filter(function(e) { return !e[0].startsWith('symptom_') })
                .map(function(e) {
                  return React.createElement('div', {
                    key: e[0],
                    className: 'flex items-center gap-3 bg-gray-50 rounded-xl px-3 py-2'
                  },
                    React.createElement('div', { className: 'w-2 h-2 bg-amber-400 rounded-full flex-shrink-0' }),
                    React.createElement('p', { className: 'text-sm text-gray-700' }, e[1])
                  )
                })
              }
              {Object.entries(factors)
                .filter(function(e) { return e[0].startsWith('symptom_') })
                .map(function(e) {
                  return React.createElement('div', {
                    key: e[0],
                    className: 'flex items-center gap-3 bg-red-50 rounded-xl px-3 py-2'
                  },
                    React.createElement('div', { className: 'w-2 h-2 bg-red-400 rounded-full flex-shrink-0' }),
                    React.createElement('p', { className: 'text-sm text-red-800 capitalize' }, e[1])
                  )
                })
              }
            </div>
          )}
        </motion.div>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="space-y-3">
          <h3 className="font-bold text-gray-900 text-lg">Personalised Recommendations</h3>
          {recommendations.map(function(rec, i) {
            var typeCls = REC_COLORS[rec.type] || REC_COLORS.monitoring
            var typeLabel = REC_LABELS[rec.type] || rec.type
            return (
              React.createElement(motion.div, {
                key: i,
                initial: { opacity: 0, x: -12 }, animate: { opacity: 1, x: 0 },
                transition: { delay: 0.3 + i * 0.07 },
                className: 'bg-white rounded-2xl border border-gray-100 shadow-sm p-5'
              },
                React.createElement('div', { className: 'flex items-center gap-2 mb-2' },
                  React.createElement('span', {
                    className: 'text-xs font-semibold px-2.5 py-0.5 rounded-full border ' + typeCls
                  }, typeLabel),
                  rec.timeframe && React.createElement('span', { className: 'text-xs text-gray-400' }, rec.timeframe)
                ),
                React.createElement('p', { className: 'font-bold text-gray-900 text-sm mb-1' }, rec.title),
                React.createElement('p', { className: 'text-sm text-gray-600 leading-relaxed' }, rec.description)
              )
            )
          })}
        </motion.div>
      )}

      {/* Action buttons */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
        className="grid sm:grid-cols-3 gap-3">
        {React.createElement('a', { href: '/consultations', className: 'flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold py-3 rounded-xl transition-all text-sm' }, 'Talk to a Doctor')}
        {React.createElement('a', { href: '/clinics', className: 'flex items-center justify-center gap-2 border-2 border-brand-600 text-brand-700 font-semibold py-3 rounded-xl hover:bg-brand-50 transition-all text-sm' }, 'Find Clinics')}
        {React.createElement('a', { href: '/ai-consultant', className: 'flex items-center justify-center gap-2 border-2 border-indigo-400 text-indigo-700 font-semibold py-3 rounded-xl hover:bg-indigo-50 transition-all text-sm' }, 'Ask AI Assistant')}
      </motion.div>

      {/* Redo */}
      <div className="flex items-center justify-between bg-gray-50 rounded-xl p-4">
        <div>
          <p className="text-sm font-semibold text-gray-700">Take a new assessment</p>
          <p className="text-xs text-gray-400">Re-assess when your health situation changes</p>
        </div>
        {React.createElement('a', {
          href: '/assessment',
          className: 'flex items-center gap-1.5 text-xs font-semibold text-brand-600 hover:text-brand-800'
        },
          React.createElement(RefreshCw, { className: 'w-3.5 h-3.5' }),
          'Redo Assessment'
        )}
      </div>

      {/* Disclaimer */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <p className="text-xs text-amber-700">
          <strong>Disclaimer:</strong> This assessment is a screening support tool only and does NOT constitute a medical diagnosis.
          Always consult a qualified healthcare provider. In Kenya, call <strong>0800 723 253</strong> (Afya House) for health concerns.
        </p>
      </div>
    </div>
  )
}
