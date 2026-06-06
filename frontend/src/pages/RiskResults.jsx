import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  AlertTriangle, CheckCircle2, AlertCircle, Activity,
  MessageCircle, MapPin, BookOpen, ChevronDown, ChevronUp, RefreshCw
} from 'lucide-react'
import { assessmentService } from '../services/api'
import toast from 'react-hot-toast'

const RISK_CONFIG = {
  low:      { color: 'emerald', label: 'Low Risk',      icon: CheckCircle2,  bg: 'bg-emerald-50',  border: 'border-emerald-200', text: 'text-emerald-700', bar: 'bg-emerald-500' },
  medium:   { color: 'amber',   label: 'Moderate Risk', icon: AlertCircle,   bg: 'bg-amber-50',    border: 'border-amber-200',   text: 'text-amber-700',   bar: 'bg-amber-500' },
  high:     { color: 'orange',  label: 'High Risk',     icon: AlertTriangle, bg: 'bg-orange-50',   border: 'border-orange-200',  text: 'text-orange-700',  bar: 'bg-orange-500' },
  critical: { color: 'red',     label: 'Critical',      icon: AlertTriangle, bg: 'bg-red-50',      border: 'border-red-200',     text: 'text-red-700',     bar: 'bg-red-500' },
}

const REC_TYPE_CONFIG = {
  immediate:    { label: 'Immediate Action',  color: 'bg-red-100 text-red-700 border-red-200' },
  urgent:       { label: 'Urgent',            color: 'bg-orange-100 text-orange-700 border-orange-200' },
  routine:      { label: 'Routine Screening', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  lifestyle:    { label: 'Lifestyle',         color: 'bg-green-100 text-green-700 border-green-200' },
  monitoring:   { label: 'Monitoring',        color: 'bg-purple-100 text-purple-700 border-purple-200' },
}

const RISK_DESCRIPTIONS = {
  low:      'Your current risk profile is reassuring. No immediate action is needed, but maintaining healthy habits and regular check-ups is important.',
  medium:   'You have several risk factors that warrant attention. Lifestyle changes and routine screening are recommended. Consult a healthcare provider.',
  high:     'Your risk profile is elevated. A medical evaluation is recommended. Please contact a healthcare provider or visit your nearest county referral hospital.',
  critical: 'Your risk profile indicates potential signs that require URGENT medical evaluation. Please seek medical care as soon as possible — do not delay.',
}

export default function RiskResults() {
  const { id } = useParams()
  const [assessment, setAssessment]         = useState(null)
  const [recommendations, setRecommendations] = useState([])
  const [loading, setLoading]               = useState(true)
  const [showDetails, setShowDetails]       = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        let res
        if (id) {
          res = await assessmentService.getById(id)
        } else {
          res = await assessmentService.getLatest()
        }
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
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!assessment) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20">
        <Activity className="w-16 h-16 text-gray-200 mx-auto mb-4" />
        <h2 className="font-display text-2xl text-gray-700 mb-2">No Assessment Found</h2>
        <p className="text-gray-500 mb-6">Complete a health assessment to see your personalised risk results.</p>
        <Link to="/assessment"
          className="bg-brand-600 hover:bg-brand-700 text-white font-semibold px-6 py-3 rounded-xl transition-all inline-flex items-center gap-2">
          <Activity className="w-4 h-4" /> Start Assessment
        </Link>
      </div>
    )
  }

  const riskLevel = assessment.risk_level || 'low'
  const cfg       = RISK_CONFIG[riskLevel] || RISK_CONFIG.low
  const RiskIcon  = cfg.icon
  const score     = Math.round((assessment.final_score || 0) * 100)
  const confidence = Math.round((assessment.confidence_score || 0.7) * 100)

  const factors = assessment.feature_importance?.factors || {}
  const categories = Array.isArray(assessment.suspected_categories)
    ? assessment.suspected_categories
    : (typeof assessment.suspected_categories === 'string'
        ? JSON.parse(assessment.suspected_categories || '[]')
        : [])

  return (
    <div className="max-w-2xl mx-auto space-y-6">

      <div>
        <h1 className="font-display text-3xl text-gray-900">Your Risk Assessment Results</h1>
        <p className="text-gray-500 mt-1 text-sm">
          Assessment completed {new Date(assessment.created_at).toLocaleDateString('en-KE', { dateStyle: 'long' })}
        </p>
      </div>

      {/* Risk level card */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        className={'rounded-2xl border-2 p-6 ' + cfg.bg + ' ' + cfg.border}>
        <div className="flex items-start gap-4">
          <div className={'w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 bg-white shadow-sm'}>
            <RiskIcon className={'w-8 h-8 ' + cfg.text} />
          </div>
          <div className="flex-1">
            <p className={'font-display text-2xl font-bold ' + cfg.text}>{cfg.label}</p>
            <p className="text-gray-700 text-sm mt-1 leading-relaxed">{RISK_DESCRIPTIONS[riskLevel]}</p>
          </div>
        </div>

        {/* Score bar */}
        <div className="mt-5">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-gray-500 font-medium">Risk Score</span>
            <span className={'font-bold text-base ' + cfg.text}>{score}%</span>
          </div>
          <div className="w-full bg-white/70 rounded-full h-3 overflow-hidden">
            <motion.div
              className={'h-3 rounded-full ' + cfg.bar}
              initial={{ width: 0 }}
              animate={{ width: score + '%' }}
              transition={{ duration: 0.8, ease: 'easeOut' }} />
          </div>
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>Low (0-20%)</span>
            <span>Moderate (20-40%)</span>
            <span>High (40-65%)</span>
            <span>Critical (65%+)</span>
          </div>
        </div>

        <div className="flex items-center gap-4 mt-4 text-xs text-gray-500">
          <span>Confidence: <strong className="text-gray-700">{confidence}%</strong></span>
          {assessment.symptom_count > 0 && (
            <span>Symptoms: <strong className="text-gray-700">{assessment.symptom_count}</strong></span>
          )}
          {assessment.age && (
            <span>Age: <strong className="text-gray-700">{assessment.age} years</strong></span>
          )}
        </div>
      </motion.div>

      {/* Suspected cancer categories */}
      {categories.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-bold text-gray-900 mb-3">Areas of Concern</h3>
          <p className="text-xs text-gray-500 mb-3">Based on your risk factors and symptoms, these cancer types warrant awareness:</p>
          <div className="flex flex-wrap gap-2">
            {categories.map(cat => (
              <span key={cat}
                className="bg-orange-50 text-orange-700 border border-orange-200 px-3 py-1.5 rounded-full text-sm font-semibold">
                {cat}
              </span>
            ))}
          </div>
        </motion.div>
      )}

      {/* Risk factors breakdown */}
      {Object.keys(factors).length > 0 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <button type="button"
            onClick={() => setShowDetails(!showDetails)}
            className="w-full flex items-center justify-between">
            <h3 className="font-bold text-gray-900">Contributing Risk Factors</h3>
            {showDetails ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
          </button>
          {showDetails && (
            <div className="mt-4 space-y-2">
              {Object.entries(factors)
                .filter(([k]) => !k.startsWith('symptom_'))
                .map(([key, val]) => (
                <div key={key} className="flex items-center gap-3 bg-gray-50 rounded-xl px-3 py-2">
                  <div className="w-2 h-2 bg-amber-400 rounded-full flex-shrink-0" />
                  <p className="text-sm text-gray-700">{val}</p>
                </div>
              ))}
              {Object.entries(factors)
                .filter(([k]) => k.startsWith('symptom_'))
                .map(([key, val]) => (
                <div key={key} className="flex items-center gap-3 bg-red-50 rounded-xl px-3 py-2">
                  <div className="w-2 h-2 bg-red-400 rounded-full flex-shrink-0" />
                  <p className="text-sm text-red-800 capitalize">{val}</p>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="space-y-3">
          <h3 className="font-bold text-gray-900 text-lg">Personalised Recommendations</h3>
          {recommendations.map((rec, i) => {
            const typeCfg = REC_TYPE_CONFIG[rec.type] || REC_TYPE_CONFIG.monitoring
            return (
              <motion.div key={i}
                initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.08 }}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={'text-xs font-semibold px-2.5 py-0.5 rounded-full border ' + typeCfg.color}>
                        {typeCfg.label}
                      </span>
                      {rec.timeframe && (
                        <span className="text-xs text-gray-400">{rec.timeframe}</span>
                      )}
                    </div>
                    <p className="font-bold text-gray-900 text-sm mb-1">{rec.title}</p>
                    <p className="text-sm text-gray-600 leading-relaxed">{rec.description}</p>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </motion.div>
      )}

      {/* Action buttons */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
        className="grid sm:grid-cols-3 gap-3">
        <Link to="/consultations"
          className="flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold py-3 rounded-xl transition-all text-sm">
          <MessageCircle className="w-4 h-4" /> Talk to a Doctor
        </Link>
        <Link to="/clinics"
          className="flex items-center justify-center gap-2 border-2 border-brand-600 text-brand-700 font-semibold py-3 rounded-xl hover:bg-brand-50 transition-all text-sm">
          <MapPin className="w-4 h-4" /> Find Clinics
        </Link>
        <Link to="/ai-consultant"
          className="flex items-center justify-center gap-2 border-2 border-indigo-400 text-indigo-700 font-semibold py-3 rounded-xl hover:bg-indigo-50 transition-all text-sm">
          <BookOpen className="w-4 h-4" /> Ask AI
        </Link>
      </motion.div>

      {/* Redo assessment */}
      <div className="flex items-center justify-between bg-gray-50 rounded-xl p-4">
        <div>
          <p className="text-sm font-semibold text-gray-700">Take a new assessment</p>
          <p className="text-xs text-gray-400">Re-assess when your health situation changes</p>
        </div>
        <Link to="/assessment"
          className="flex items-center gap-1.5 text-xs font-semibold text-brand-600 hover:text-brand-800">
          <RefreshCw className="w-3.5 h-3.5" /> Redo
        </Link>
      </div>

      {/* Disclaimer */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <p className="text-xs text-amber-700">
          <strong>⚠️ Disclaimer:</strong> This assessment is a screening support tool only and does NOT constitute a medical diagnosis.
          Results are based on statistical risk models. Always consult a qualified healthcare provider for proper medical evaluation.
          In Kenya, call the emergency line <strong>0800 723 253</strong> (Afya House) for cancer-related health concerns.
        </p>
      </div>
    </div>
  )
}
