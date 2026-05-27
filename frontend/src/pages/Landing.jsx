import React from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import {
  Activity, ShieldCheck, Users, Globe, ArrowRight,
  Zap, Heart, MapPin, MessageCircle, CheckCircle2
} from 'lucide-react'

const features = [
  { icon: Activity,       title: 'AI Risk Assessment',       desc: 'Hybrid rule-based + machine learning engine for personalised cancer risk scoring',          color: 'brand' },
  { icon: ShieldCheck,    title: 'Screening Guidance',        desc: 'Region-aware recommendations tailored to available local health resources',                 color: 'blue' },
  { icon: MessageCircle,  title: 'Telemedicine',              desc: 'Connect directly with clinicians via chat and video consultation',                          color: 'purple' },
  { icon: Globe,          title: 'Offline-First',             desc: 'Works without internet. Syncs automatically when connectivity returns',                     color: 'amber' },
  { icon: MapPin,         title: 'Nearby Clinics',            desc: 'Find the nearest cancer screening facilities in your area',                                 color: 'rose' },
  { icon: Users,          title: 'Community Health Workers',  desc: 'Empower health workers with digital tools for community outreach',                          color: 'teal' },
]

const stats = [
  { value: '8+',     label: 'Cancer Types Screened' },
  { value: '3',      label: 'Languages Supported' },
  { value: '100%',   label: 'Free to Use' },
  { value: 'Offline',label: 'Works Anywhere' },
]

const cancerTypes = ['Cervical','Breast','Lung','Colorectal','Oral','Prostate','Liver','Esophageal']

// High-quality free medical images from Unsplash
const HERO_IMAGE   = 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=900&q=80&auto=format&fit=crop'
// Doctor reviewing results on tablet — warm, approachable
const CARD_IMAGE_1 = 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=600&q=80&auto=format&fit=crop'
// Community health worker with patient in rural Africa
const CARD_IMAGE_2 = 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=600&q=80&auto=format&fit=crop'

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
                <button key={lang}
                  onClick={() => { i18n.changeLanguage(lang); localStorage.setItem('oncosense-lang', lang) }}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold uppercase transition-all
                    ${i18n.language === lang ? 'bg-brand-600 text-white' : 'text-gray-500 hover:bg-gray-100'}`}>
                  {lang}
                </button>
              ))}
            </div>
            <Link to="/login"    className="text-sm font-semibold text-gray-600 hover:text-brand-700 px-3 py-2">{t('login')}</Link>
            <Link to="/register" className="btn-primary text-sm py-2 px-4">{t('register')}</Link>
          </div>
        </div>
      </nav>

      {/* ── Hero */}
      <section className="pt-16 min-h-screen relative overflow-hidden">
        {/* Full-bleed HD background image */}
        <div className="absolute inset-0 z-0">
          <img
            src={HERO_IMAGE}
            alt="Medical professional reviewing cancer screening results"
            className="w-full h-full object-cover"
            loading="eager"
          />
          {/* Dark gradient overlay so text is readable */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/55 to-black/20" />
          {/* Bottom fade to white */}
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent" />
        </div>

        {/* Hero content */}
        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 flex items-center min-h-screen pb-16">
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="max-w-2xl"
          >
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/25 text-white px-4 py-2 rounded-full text-sm font-semibold mb-6">
              <Zap className="w-4 h-4 text-brand-300" /> AI-Powered Screening Platform
            </div>

            <h1 className="font-display text-5xl lg:text-6xl text-white leading-tight mb-5 drop-shadow-lg">
              {t('heroTitle')}<br />
              <span className="text-brand-300">{t('heroSubtitle')}</span>
            </h1>

            <p className="text-lg text-white/85 mb-8 leading-relaxed max-w-xl drop-shadow">
              {t('heroDesc')}
            </p>

            <div className="flex flex-wrap gap-3 mb-6">
              <Link to="/register"
                className="inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white font-bold px-8 py-4 rounded-2xl transition-all shadow-lg hover:shadow-xl active:scale-95 text-base">
                {t('startAssessment')} <ArrowRight className="w-5 h-5" />
              </Link>
              <a href="#features"
                className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm hover:bg-white/25 border border-white/30 text-white font-bold px-8 py-4 rounded-2xl transition-all text-base">
                {t('learnMore')}
              </a>
            </div>

            {/* Disclaimer */}
            <div className="inline-flex items-start gap-2 bg-amber-500/20 backdrop-blur-sm border border-amber-400/30 rounded-xl p-3 max-w-lg">
              <span className="text-amber-300 text-sm flex-shrink-0 mt-0.5">⚠️</span>
              <p className="text-xs text-amber-100">
                This platform is for screening support only — not medical diagnosis. Always consult a healthcare provider.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Stats bar */}
      <section className="py-12 bg-brand-600">
        <div className="max-w-6xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((s, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="text-center">
              <p className="font-display text-4xl text-white font-bold">{s.value}</p>
              <p className="text-brand-200 text-sm mt-1">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Impact section with image */}
      <section className="py-20 px-4 sm:px-6 bg-white">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="text-brand-600 font-semibold text-sm uppercase tracking-wider">Why It Matters</span>
            <h2 className="font-display text-4xl text-gray-900 mt-2 mb-5 leading-tight">
              Early Detection Saves Lives in Underserved Communities
            </h2>
            <p className="text-gray-600 leading-relaxed mb-6">
              In low-resource settings across sub-Saharan Africa, most cancers are diagnosed at late stages when treatment options are limited. OncoSense brings AI-powered screening to community level — no expensive equipment required.
            </p>
            <div className="space-y-3">
              {[
                'Free and accessible to all — no insurance needed',
                'Works on any smartphone, even with low connectivity',
                'Supports community health workers in the field',
                'Available in English, Kiswahili, and Français',
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-brand-600 flex-shrink-0" />
                  <span className="text-gray-700 text-sm">{item}</span>
                </div>
              ))}
            </div>
            <Link to="/register" className="btn-primary mt-8 inline-flex">
              Get Started Free <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="relative"
          >
            <div className="rounded-3xl overflow-hidden shadow-2xl">
              <img
                src={CARD_IMAGE_1}
                alt="Doctor reviewing patient health data on tablet"
                className="w-full h-80 object-cover"
                loading="lazy"
              />
            </div>
            {/* Floating badge */}
            <div className="absolute -bottom-4 -left-4 bg-white rounded-2xl shadow-xl p-4 flex items-center gap-3 border border-gray-100">
              <div className="w-10 h-10 bg-brand-100 rounded-xl flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-brand-600" />
              </div>
              <div>
                <p className="font-bold text-gray-900 text-sm">Risk Assessment</p>
                <p className="text-xs text-gray-500">AI-powered, instant results</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Features */}
      <section id="features" className="py-20 px-4 sm:px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-display text-4xl text-gray-900 mb-4">Built for Real-World Impact</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Designed specifically for low-resource settings and underserved communities across Africa and beyond.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="card group hover:-translate-y-1">
                <div className="w-12 h-12 bg-brand-100 rounded-2xl flex items-center justify-center mb-4">
                  <f.icon className="w-6 h-6 text-brand-600" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Community health worker image section */}
      <section className="py-20 px-4 sm:px-6 bg-white overflow-hidden">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="relative order-2 lg:order-1"
          >
            <div className="rounded-3xl overflow-hidden shadow-2xl">
              <img
                src={CARD_IMAGE_2}
                alt="Community health worker conducting cancer screening"
                className="w-full h-80 object-cover"
                loading="lazy"
              />
            </div>
            {/* Floating stats badge */}
            <div className="absolute -top-4 -right-4 bg-brand-600 text-white rounded-2xl shadow-xl p-4 text-center">
              <p className="font-display text-3xl font-bold">8+</p>
              <p className="text-brand-200 text-xs mt-0.5">Cancer Types</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="order-1 lg:order-2"
          >
            <span className="text-brand-600 font-semibold text-sm uppercase tracking-wider">For Health Workers</span>
            <h2 className="font-display text-4xl text-gray-900 mt-2 mb-5 leading-tight">
              Empowering Community Health Workers
            </h2>
            <p className="text-gray-600 leading-relaxed mb-6">
              Community health workers are the frontline of healthcare in rural areas. OncoSense gives them digital tools to conduct structured risk assessments, refer patients to the right facilities, and track outcomes — all from a basic smartphone.
            </p>
            <div className="flex flex-wrap gap-3">
              {cancerTypes.map(c => (
                <span key={c} className="bg-brand-50 text-brand-800 border border-brand-200 px-3 py-1.5 rounded-full text-sm font-semibold">
                  {c}
                </span>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── CTA */}
      <section className="py-20 px-4 bg-gradient-to-br from-brand-700 to-brand-900 relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full translate-x-1/2 translate-y-1/2" />
        </div>
        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <Heart className="w-12 h-12 text-brand-300 mx-auto mb-4" />
          <h2 className="font-display text-4xl text-white mb-4">Start Your Free Assessment Today</h2>
          <p className="text-brand-200 text-lg mb-8">No cost. No complex equipment. Just answers — and a path to the right care.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/register"
              className="bg-white text-brand-700 font-bold px-8 py-4 rounded-2xl hover:bg-brand-50 transition-all flex items-center gap-2 shadow-lg">
              {t('startAssessment')} <ArrowRight className="w-5 h-5" />
            </Link>
            <Link to="/login"
              className="border-2 border-white text-white font-bold px-8 py-4 rounded-2xl hover:bg-white/10 transition-all">
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
