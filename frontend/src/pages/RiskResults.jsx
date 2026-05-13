import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  AlertTriangle, CheckCircle2, Info, Download, 
  MapPin, Video, ArrowRight, ChevronDown, ChevronUp, Activity
} from 'lucide-react'
import { assessmentService } from '../services/api'
import toast from 'react-hot-toast'

const riskConfig = {
  low: { color: 'emerald', bg: 'bg-emerald-50', border: 'border-emerald-300', text: 'text-emerald-700', label: '🟢 Low Risk', icon: CheckCircle2 },
  medium: { color: 'amber', bg: 'bg-amber-50', border: 'border-amber-300', text: 'text-amber-700', label: '🟡 Moderate Risk', icon: Info },
  high: { color: 'orange', bg: 'bg-orange-50', border: 'border-orange-300', text: 'text-orange-700', label: '🔴 High Risk', icon: AlertTriangle },
  critical: { color: 'red', bg: 'bg-red-50', border: 'border-red-300', text: 'text-red-700', label: '🚨 Critical Risk — Seek Care Immediately', icon: AlertTriangle },
}

const FeatureBar = ({ label, value }) => (
  <div className="mb-2">
    <div className="flex justify-between text-xs mb-1">
      <span className="text-gray-600 capitalize">{label.replace(/_/g, ' ')}</span>
      <span className="font-semibold text-brand-700">{(value * 100).toFixed(0)}%</span>
    </div>
    <div className="w-full bg-gray-100 rounded-full h-2">
      <div className="bg-brand-500 h-2 rounded-full progress-fill" style={{ width: `${Math.min(value * 100, 100)}%` }} />
    </div>
  </div>
)

export default function RiskResults() {
  const { id } = useParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showExplain, setShowExplain] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        let res
        if (id) {
          res = await assessmentService.getById(id)
          setData(res.data.assessment)
        } else {
          res = await assessmentService.getLatest()
          setData(res.data.assessment)
        }
      } catch {
        toast.error('Could not load results')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <div className="spinner mx-auto mb-3" style={{ width: 32, height: 32, borderWidth: 3 }} />
        <p className="text-gray-500">Analyzing your results...</p>
      </div>
    </div>
  )

  if (!data) return (
    <div className="max-w-2xl mx-auto text-center py-16">
      <Activity className="w-16 h-16 text-gray-300 mx-auto mb-4" />
      <h2 className="font-display text-2xl text-gray-700 mb-2">No Assessment Found</h2>
      <p className="text-gray-500 mb-6">Complete a health intake assessment to see your results.</p>
      <Link to="/intake" className="btn-primary">Start Assessment</Link>
    </div>
  )

  const level = data.risk_level || 'low'
  const cfg = riskConfig[level] || riskConfig.low
  const score = Math.round((data.final_score || 0) * 100)
  const cats = typeof data.suspected_categories === 'string'
    ? JSON.parse(data.suspected_categories) : (data.suspected_categories || [])
  const recs = typeof data.recommendations === 'string'
    ? JSON.parse(data.recommendations) : (data.recommendations || [])
  const featureImportance = typeof data.feature_importance === 'string'
    ? JSON.parse(data.feature_importance) : (data.feature_importance || {})

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display text-3xl text-gray-900">Your Risk Assessment Results</h1>
        <p className="text-gray-500 mt-1">Based on your health profile and symptoms</p>
      </div>

      {/* Disclaimer */}
      <div className="disclaimer-box">
        <p className="text-xs font-semibold mb-1">⚠️ IMPORTANT NOTICE</p>
        <p className="text-xs">This assessment is for SCREENING PURPOSES ONLY and does NOT constitute a medical diagnosis. These results do not replace professional medical advice. Please consult a qualified healthcare provider about any health concerns.</p>
      </div>

      {/* Risk Score Card */}
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className={`card border-2 ${cfg.border} ${cfg.bg}`}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-sm font-semibold text-gray-500 mb-1">Overall Risk Level</p>
            <h2 className={`font-display text-3xl ${cfg.text}`}>{cfg.label}</h2>
          </div>
          <div className="text-right">
            <p className={`text-5xl font-bold ${cfg.text}`}>{score}%</p>
            <p className="text-xs text-gray-500 mt-1">Risk Score</p>
          </div>
        </div>

        {/* Score bar */}
        <div className="mb-4">
          <div className="w-full bg-white/60 rounded-full h-4 overflow-hidden">
            <motion.div initial={{ width: 0 }} animate={{ width: `${score}%` }}
              transition={{ duration: 1, delay: 0.3 }}
              className={`h-4 rounded-full ${
                level === 'low' ? 'bg-emerald-500' :
                level === 'medium' ? 'bg-amber-500' :
                level === 'high' ? 'bg-orange-500' : 'bg-red-500'
              }`} />
          </div>
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>Low</span><span>Medium</span><span>High</span><span>Critical</span>
          </div>
        </div>

        <div className="flex gap-3 text-xs text-gray-500">
          <span>ML Score: <strong>{Math.round((data.ml_score||0)*100)}%</strong></span>
          <span>Rule Score: <strong>{Math.round((data.rule_based_score||0)*100)}%</strong></span>
          <span>Confidence: <strong>{Math.round((data.confidence_score||0)*100)}%</strong></span>
        </div>
      </motion.div>

      {/* Cancer Areas of Concern */}
      {cats.length > 0 && (
        <div className="card">
          <h3 className="font-bold text-gray-900 mb-4">⚠️ Areas of Concern</h3>
          <p className="text-xs text-gray-500 mb-4">These are cancer types where your profile indicates elevated risk factors — NOT a diagnosis.</p>
          <div className="space-y-3">
            {cats.map((cat, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{cat.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{cat.note}</p>
                  <p className="text-xs text-brand-600 font-medium mt-1">Screening: {cat.screening_recommended}</p>
                </div>
                <div className="text-right flex-shrink-0 ml-4">
                  <div className="w-16 h-16 relative">
                    <svg viewBox="0 0 50 50" className="w-full h-full -rotate-90">
                      <circle cx="25" cy="25" r="20" fill="none" stroke="#f1f5f9" strokeWidth="5" />
                      <circle cx="25" cy="25" r="20" fill="none" stroke="#f59e0b" strokeWidth="5"
                        strokeDasharray={`${(cat.concern_score || 0) * 125.6} 125.6`} strokeLinecap="round" />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs font-bold text-amber-600">{Math.round((cat.concern_score||0)*100)}%</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Explanations */}
      {data.explanations && (
        <div className="card">
          <button type="button" onClick={() => setShowExplain(!showExplain)}
            className="w-full flex items-center justify-between">
            <h3 className="font-bold text-gray-900">🔍 Why This Score?</h3>
            {showExplain ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
          </button>
          {showExplain && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
              className="mt-4 space-y-2">
              {(typeof data.explanations === 'string' ? JSON.parse(data.explanations) : data.explanations)?.map((exp, i) => (
                <div key={i} className="flex items-start gap-2 p-3 bg-blue-50 rounded-xl">
                  <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-blue-800">{exp}</p>
                </div>
              ))}
              {Object.keys(featureImportance).length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-semibold text-gray-700 mb-3">Top Contributing Factors:</p>
                  {Object.entries(featureImportance).slice(0,8).map(([k,v]) => (
                    <FeatureBar key={k} label={k} value={v} />
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </div>
      )}

      {/* Recommendations */}
      <div className="card">
        <h3 className="font-bold text-gray-900 mb-4">📋 Recommended Actions</h3>
        <div className="space-y-3">
          {recs.length > 0 ? recs.map((rec, i) => (
            <div key={i} className={`p-4 rounded-xl border ${
              rec.type === 'immediate' ? 'bg-red-50 border-red-200' :
              rec.type === 'urgent' ? 'bg-orange-50 border-orange-200' :
              rec.type === 'lifestyle' ? 'bg-teal-50 border-teal-200' :
              'bg-brand-50 border-brand-200'
            }`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className={`font-bold text-sm ${
                    rec.type === 'immediate' ? 'text-red-800' :
                    rec.type === 'urgent' ? 'text-orange-800' :
                    'text-brand-900'
                  }`}>{rec.title}</p>
                  <p className="text-xs text-gray-600 mt-1">{rec.description}</p>
                  {rec.timeframe && <p className="text-xs font-semibold text-gray-500 mt-1">⏱ {rec.timeframe}</p>}
                </div>
                {rec.type === 'immediate' && <span className="text-xs bg-red-600 text-white px-2 py-0.5 rounded-full font-bold flex-shrink-0">URGENT</span>}
              </div>
            </div>
          )) : (
            <div className="bg-brand-50 p-4 rounded-xl">
              <p className="text-sm text-brand-800 font-medium">Continue routine health monitoring and maintain a healthy lifestyle.</p>
            </div>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Link to="/consultations" className="btn-primary justify-center">
          <Video className="w-4 h-4" /> Consult Doctor
        </Link>
        <Link to="/clinics" className="btn-secondary justify-center">
          <MapPin className="w-4 h-4" /> Find Clinic
        </Link>
        <Link to="/intake" className="btn-secondary justify-center">
          <Activity className="w-4 h-4" /> New Assessment
        </Link>
      </div>
    </div>
  )
}
