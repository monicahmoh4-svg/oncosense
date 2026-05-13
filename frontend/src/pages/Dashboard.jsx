import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  ClipboardList, AlertCircle, CheckCircle2, ArrowRight,
  Activity, TrendingUp, Calendar, MapPin, Video
} from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { assessmentService, recommendationService } from '../services/api'

const RiskGauge = ({ score, level }) => {
  const colors = { low: '#10b981', medium: '#f59e0b', high: '#f97316', critical: '#ef4444' }
  const color = colors[level] || '#10b981'
  const pct = Math.round(score * 100)

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-32 h-32">
        <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
          <circle cx="60" cy="60" r="50" fill="none" stroke="#f1f5f9" strokeWidth="12" />
          <circle cx="60" cy="60" r="50" fill="none" stroke={color} strokeWidth="12"
            strokeDasharray={`${pct * 3.14} 314`} strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 0.8s ease' }} />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <p className="text-2xl font-bold" style={{ color }}>{pct}%</p>
            <p className="text-xs text-gray-500 capitalize">{level}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { user } = useAuthStore()
  const [assessment, setAssessment] = useState(null)
  const [recommendations, setRecommendations] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [assessRes, recRes] = await Promise.all([
          assessmentService.getLatest(),
          recommendationService.getAll()
        ])
        setAssessment(assessRes.data.assessment)
        setRecommendations(recRes.data.recommendations?.slice(0, 4) || [])
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const riskColors = { low: 'text-emerald-600 bg-emerald-50', medium: 'text-amber-600 bg-amber-50', high: 'text-orange-600 bg-orange-50', critical: 'text-red-600 bg-red-50' }

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      {/* Greeting */}
      <div>
        <h1 className="font-display text-3xl text-gray-900">
          Good day, {user?.first_name} 👋
        </h1>
        <p className="text-gray-500 mt-1">Your health overview at a glance</p>
      </div>

      {/* No assessment CTA */}
      {!loading && !assessment && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-brand-600 to-brand-700 rounded-2xl p-6 text-white">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-5 h-5 text-brand-200" />
                <span className="font-semibold text-brand-100">No assessment yet</span>
              </div>
              <h2 className="font-display text-2xl mb-2">Start your cancer risk assessment</h2>
              <p className="text-brand-200 text-sm mb-4">Takes about 5 minutes. Completely free and confidential.</p>
              <Link to="/intake" className="inline-flex items-center gap-2 bg-white text-brand-700 font-bold px-6 py-3 rounded-xl hover:bg-brand-50 transition-all">
                Begin Assessment <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <ClipboardList className="w-16 h-16 text-brand-400 hidden sm:block" />
          </div>
        </motion.div>
      )}

      {/* Risk Overview */}
      {assessment && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900">Latest Risk Assessment</h2>
            <Link to="/results" className="text-sm text-brand-600 font-semibold hover:underline flex items-center gap-1">
              Full Report <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <RiskGauge score={assessment.final_score || 0.1} level={assessment.risk_level || 'low'} />
            <div className="flex-1">
              <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-bold mb-3 ${riskColors[assessment.risk_level] || riskColors.low}`}>
                <Activity className="w-4 h-4" />
                {assessment.risk_level?.charAt(0).toUpperCase() + assessment.risk_level?.slice(1)} Risk Level
              </div>
              {assessment.suspected_categories && (
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-2">Areas of Concern:</p>
                  <div className="flex flex-wrap gap-2">
                    {(typeof assessment.suspected_categories === 'string'
                      ? JSON.parse(assessment.suspected_categories)
                      : assessment.suspected_categories
                    )?.slice(0, 3).map((cat, i) => (
                      <span key={i} className="text-xs bg-gray-100 text-gray-700 px-2.5 py-1 rounded-lg font-medium">
                        {cat.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <p className="text-xs text-gray-400 mt-3">
                Assessed {assessment.created_at ? new Date(assessment.created_at).toLocaleDateString() : 'recently'}
              </p>
            </div>
          </div>
          <div className="mt-4 disclaimer-box text-xs">
            ⚠️ This is a screening tool only — not a medical diagnosis. Consult a healthcare professional.
          </div>
        </motion.div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { to: '/intake', icon: ClipboardList, label: 'New Assessment', color: 'brand' },
          { to: '/consultations', icon: Video, label: 'Consult Doctor', color: 'blue' },
          { to: '/clinics', icon: MapPin, label: 'Find Clinics', color: 'teal' },
          { to: '/image-screening', icon: Activity, label: 'Image Check', color: 'purple' },
        ].map((item, i) => (
          <Link key={i} to={item.to}
            className="card flex flex-col items-center gap-2 p-4 hover:-translate-y-1 cursor-pointer text-center">
            <div className={`w-10 h-10 bg-${item.color}-100 rounded-xl flex items-center justify-center`}>
              <item.icon className={`w-5 h-5 text-${item.color}-600`} />
            </div>
            <span className="text-xs font-semibold text-gray-700">{item.label}</span>
          </Link>
        ))}
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900">Your Recommendations</h2>
            <span className="text-xs text-gray-500">{recommendations.filter(r => !r.is_completed).length} pending</span>
          </div>
          <div className="space-y-3">
            {recommendations.map((rec, i) => (
              <div key={i} className={`flex items-start gap-3 p-3 rounded-xl border transition-all ${rec.is_completed ? 'bg-gray-50 border-gray-100 opacity-60' : 'bg-white border-gray-200'}`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  rec.type === 'immediate' ? 'bg-red-100' :
                  rec.type === 'urgent' ? 'bg-orange-100' :
                  rec.type === 'lifestyle' ? 'bg-teal-100' : 'bg-brand-100'
                }`}>
                  {rec.is_completed
                    ? <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    : <TrendingUp className={`w-4 h-4 ${rec.type === 'immediate' ? 'text-red-600' : 'text-brand-600'}`} />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">{rec.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{rec.timeframe}</p>
                </div>
                {rec.type === 'immediate' && !rec.is_completed && (
                  <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-semibold">Urgent</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
