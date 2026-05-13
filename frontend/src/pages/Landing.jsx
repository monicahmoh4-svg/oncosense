import React from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { 
  Activity, ShieldCheck, Users, Globe, ArrowRight, 
  Zap, Heart, MapPin, MessageCircle, CheckCircle2
} from 'lucide-react'

const features = [
  { icon: Activity, title: 'AI Risk Assessment', desc: 'Hybrid rule-based + machine learning engine for personalized cancer risk scoring', color: 'brand' },
  { icon: ShieldCheck, title: 'Screening Guidance', desc: 'Region-aware recommendations tailored to available local health resources', color: 'blue' },
  { icon: MessageCircle, title: 'Telemedicine', desc: 'Connect directly with clinicians via chat and video consultation', color: 'purple' },
  { icon: Globe, title: 'Offline-First', desc: 'Works without internet. Syncs automatically when connectivity returns', color: 'amber' },
  { icon: MapPin, title: 'Nearby Clinics', desc: 'Find the nearest cancer screening facilities in your area', color: 'rose' },
  { icon: Users, title: 'Community Health Workers', desc: 'Empower health workers with digital tools for community outreach', color: 'teal' },
]

const stats = [
  { value: '8+', label: 'Cancer Types Screened' },
  { value: '3', label: 'Languages Supported' },
  { value: '100%', label: 'Free to Use' },
  { value: 'Offline', label: 'Works Anywhere' },
]

const cancerTypes = ['Cervical', 'Breast', 'Lung', 'Colorectal', 'Oral', 'Prostate', 'Liver', 'Esophageal']

export default function Landing() {
  const { t, i18n } = useTranslation()

  return (
    <div className="min-h-screen bg-white font-body">
      {/* ── Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <span className="font-display text-xl text-brand-900">OncoSense</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex gap-1">
              {['en','sw','fr'].map(lang => (
                <button key={lang} onClick={() => { i18n.changeLanguage(lang); localStorage.setItem('oncosense-lang', lang) }}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold uppercase transition-all ${i18n.language === lang ? 'bg-brand-600 text-white' : 'text-gray-500 hover:bg-gray-100'}`}>
                  {lang}
                </button>
              ))}
            </div>
            <Link to="/login" className="text-sm font-semibold text-gray-600 hover:text-brand-700 px-3 py-2">{t('login')}</Link>
            <Link to="/register" className="btn-primary text-sm py-2 px-4">{t('register')}</Link>
          </div>
        </div>
      </nav>

      {/* ── Hero */}
      <section className="pt-24 pb-16 px-4 sm:px-6 bg-gradient-to-br from-brand-50 via-white to-teal-50">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <div className="inline-flex items-center gap-2 bg-brand-100 text-brand-700 px-4 py-2 rounded-full text-sm font-semibold mb-6">
                <Zap className="w-4 h-4" /> AI-Powered Screening Platform
              </div>
              <h1 className="font-display text-5xl lg:text-6xl text-gray-900 leading-tight mb-4">
                {t('heroTitle')}<br />
                <span className="text-brand-600">{t('heroSubtitle')}</span>
              </h1>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">{t('heroDesc')}</p>
              <div className="flex flex-wrap gap-3">
                <Link to="/register" className="btn-primary text-base px-8 py-4 rounded-2xl">
                  {t('startAssessment')} <ArrowRight className="w-5 h-5" />
                </Link>
                <a href="#features" className="btn-secondary text-base px-8 py-4 rounded-2xl">{t('learnMore')}</a>
              </div>
              <div className="mt-6 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3">
                <span className="text-amber-500 text-sm">⚠️</span>
                <p className="text-xs text-amber-700">This platform is for screening support only — not medical diagnosis. Always consult a healthcare provider.</p>
              </div>
            </motion.div>

            {/* Hero visual */}
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.2 }}
              className="relative">
              <div className="bg-white rounded-3xl shadow-2xl p-8 border border-gray-100">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-brand-100 rounded-xl flex items-center justify-center">
                    <Activity className="w-6 h-6 text-brand-600" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">Risk Assessment</p>
                    <p className="text-sm text-gray-500">Completed just now</p>
                  </div>
                  <span className="ml-auto risk-badge-medium">Moderate Risk</span>
                </div>
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600 font-medium">Risk Score</span>
                    <span className="font-bold text-amber-600">42%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-3">
                    <div className="bg-gradient-to-r from-amber-400 to-orange-500 h-3 rounded-full w-5/12 progress-fill"></div>
                  </div>
                </div>
                <div className="space-y-3">
                  {['Cervical Cancer Screening', 'Lifestyle Modifications', 'Follow-up in 4 weeks'].map((rec, i) => (
                    <div key={i} className="flex items-center gap-3 bg-brand-50 rounded-xl p-3">
                      <CheckCircle2 className="w-5 h-5 text-brand-600 flex-shrink-0" />
                      <span className="text-sm font-medium text-brand-900">{rec}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap gap-2">
                  {cancerTypes.slice(0,4).map(c => (
                    <span key={c} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-lg">{c}</span>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Stats */}
      <section className="py-12 bg-brand-600">
        <div className="max-w-6xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              className="text-center">
              <p className="font-display text-4xl text-white font-bold">{s.value}</p>
              <p className="text-brand-200 text-sm mt-1">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Features */}
      <section id="features" className="py-20 px-4 sm:px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-display text-4xl text-gray-900 mb-4">Built for Real-World Impact</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">Designed specifically for low-resource settings and underserved communities across Africa and beyond.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                className="card group hover:-translate-y-1">
                <div className={`w-12 h-12 bg-${f.color === 'brand' ? 'brand' : f.color}-100 rounded-2xl flex items-center justify-center mb-4`}>
                  <f.icon className={`w-6 h-6 text-${f.color === 'brand' ? 'brand' : f.color}-600`} />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Cancer Types */}
      <section className="py-16 px-4 sm:px-6 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-display text-3xl text-gray-900 mb-4">Cancer Types Covered</h2>
          <p className="text-gray-600 mb-8">Our AI engine screens for the most prevalent cancers in sub-Saharan Africa</p>
          <div className="flex flex-wrap justify-center gap-3">
            {cancerTypes.map(c => (
              <span key={c} className="bg-brand-50 text-brand-800 border border-brand-200 px-4 py-2 rounded-full font-semibold text-sm">{c}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA */}
      <section className="py-20 px-4 bg-gradient-to-br from-brand-700 to-brand-900">
        <div className="max-w-3xl mx-auto text-center">
          <Heart className="w-12 h-12 text-brand-300 mx-auto mb-4" />
          <h2 className="font-display text-4xl text-white mb-4">Start Your Free Assessment Today</h2>
          <p className="text-brand-200 text-lg mb-8">No cost. No complex equipment. Just answers — and a path to the right care.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/register" className="bg-white text-brand-700 font-bold px-8 py-4 rounded-2xl hover:bg-brand-50 transition-all flex items-center gap-2">
              {t('startAssessment')} <ArrowRight className="w-5 h-5" />
            </Link>
            <Link to="/login" className="border-2 border-white text-white font-bold px-8 py-4 rounded-2xl hover:bg-white/10 transition-all">
              {t('login')}
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer */}
      <footer className="py-8 bg-gray-900 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Activity className="w-5 h-5 text-brand-400" />
          <span className="font-display text-lg text-white">OncoSense</span>
        </div>
        <p className="text-gray-500 text-sm">© 2024 OncoSense Health Platform. For screening support only — not medical diagnosis.</p>
        <p className="text-gray-600 text-xs mt-2">Designed for low-resource healthcare settings.</p>
      </footer>
    </div>
  )
}
