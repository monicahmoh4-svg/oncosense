import React, { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, Upload, X, Eye, AlertCircle, CheckCircle2, Shield, Info } from 'lucide-react'
import { imageService } from '../services/api'
import toast from 'react-hot-toast'

const SEVERITY_STYLES = {
  'HIGH CONCERN':     'border-red-300 bg-red-50',
  'MODERATE CONCERN': 'border-amber-300 bg-amber-50',
  'LOW CONCERN':      'border-emerald-300 bg-emerald-50',
  'INCONCLUSIVE':     'border-gray-300 bg-gray-50',
}
const SEVERITY_TEXT = {
  'HIGH CONCERN':     'text-red-700',
  'MODERATE CONCERN': 'text-amber-700',
  'LOW CONCERN':      'text-emerald-700',
  'INCONCLUSIVE':     'text-gray-700',
}
const SEVERITY_ICON = {
  'HIGH CONCERN':     AlertCircle,
  'MODERATE CONCERN': AlertCircle,
  'LOW CONCERN':      CheckCircle2,
  'INCONCLUSIVE':     Info,
}

export default function ImageScreening() {
  const [file, setFile]               = useState(null)
  const [preview, setPreview]         = useState(null)
  const [imageType, setImageType]     = useState('skin')
  const [consented, setConsented]     = useState(false)
  const [discAck, setDiscAck]         = useState(false)
  const [loading, setLoading]         = useState(false)
  const [result, setResult]           = useState(null)
  const fileRef = useRef(null)

  function handleFile(f) {
    if (!f) return
    if (!f.type.startsWith('image/')) { toast.error('Please select an image file (JPG, PNG)'); return }
    if (f.size > 15 * 1024 * 1024) { toast.error('Image must be under 15MB'); return }
    setFile(f)
    setResult(null)
    const url = URL.createObjectURL(f)
    setPreview(url)
  }

  function handleDrop(e) { e.preventDefault(); handleFile(e.dataTransfer.files[0]) }

  async function analyze() {
    if (!file)      { toast.error('Please upload an image'); return }
    if (!consented) { toast.error('Please provide consent to analyze'); return }
    if (!discAck)   { toast.error('Please acknowledge the disclaimer'); return }

    setLoading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('image_type', imageType)
      fd.append('consent_given', 'true')
      fd.append('disclaimer_acknowledged', 'true')

      const res = await imageService.analyze(fd)
      setResult(res.data)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Analysis failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function reset() {
    setFile(null); setPreview(null); setResult(null)
    setConsented(false); setDiscAck(false)
  }

  const SevIcon = result ? (SEVERITY_ICON[result.severity_hint] || Info) : null

  return (
    <div className="max-w-2xl mx-auto space-y-6">

      <div>
        <h1 className="font-display text-3xl text-gray-900">Image Pre-Screening</h1>
        <p className="text-gray-500 mt-1">AI-assisted analysis of skin lesions and oral abnormalities</p>
      </div>

      {/* Disclaimer */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <div className="flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-amber-800 text-sm">Important Notice</p>
            <p className="text-xs text-amber-700 mt-0.5">
              This tool provides SCREENING SUPPORT ONLY using pixel analysis. It does NOT replace professional medical evaluation.
              Results may be inaccurate. Always consult a qualified dermatologist or oncologist.
            </p>
          </div>
        </div>
      </div>

      {!result ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">

          {/* Image type */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">What are you screening?</label>
            <div className="grid grid-cols-2 gap-3">
              {[['skin','🔬 Skin Lesion / Mole','Moles, lesions, unusual skin changes'],
                ['oral','👄 Oral Cavity','Mouth ulcers, white/red patches, tongue lesions']].map(([v,l,d]) => (
                <button key={v} type="button"
                  onClick={() => setImageType(v)}
                  className={'p-3 rounded-xl border-2 text-left transition-all ' + (imageType === v ? 'border-brand-500 bg-brand-50' : 'border-gray-200 hover:border-gray-300')}>
                  <p className={'text-sm font-bold ' + (imageType === v ? 'text-brand-900' : 'text-gray-700')}>{l}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{d}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Upload area */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Upload Image</label>
            {!preview ? (
              <div
                onDrop={handleDrop}
                onDragOver={e => e.preventDefault()}
                onClick={() => fileRef.current?.click()}
                className="border-2 border-dashed border-gray-300 hover:border-brand-400 rounded-2xl p-8 text-center cursor-pointer transition-all bg-gray-50 hover:bg-brand-50">
                <Camera className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="font-semibold text-gray-600 text-sm">Drag and drop or click to upload</p>
                <p className="text-xs text-gray-400 mt-1">JPG, PNG, WEBP up to 15MB</p>
                <p className="text-xs text-gray-400 mt-1">For best results: good lighting, in-focus, close-up of the area</p>
                <input ref={fileRef} type="file" accept="image/*" className="hidden"
                  onChange={e => handleFile(e.target.files[0])} />
              </div>
            ) : (
              <div className="relative rounded-2xl overflow-hidden border-2 border-gray-200 bg-gray-50">
                <img src={preview} alt="Preview" className="w-full max-h-64 object-contain" />
                <button type="button"
                  onClick={() => { setFile(null); setPreview(null) }}
                  className="absolute top-2 right-2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-red-50 transition-all">
                  <X className="w-4 h-4 text-gray-600" />
                </button>
                <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded-lg">
                  {file?.name} · {(file?.size / 1024).toFixed(0)} KB
                </div>
              </div>
            )}
          </div>

          {/* Consent checkboxes */}
          <div className="space-y-3">
            {[
              [consented, setConsented, 'I consent to this image being analyzed by the OncoSense AI screening system for health assessment purposes'],
              [discAck, setDiscAck, 'I understand this analysis is NOT a medical diagnosis and I will consult a qualified healthcare professional for proper evaluation'],
            ].map(([val, setter, label], i) => (
              <label key={i} className="flex items-start gap-3 cursor-pointer">
                <button type="button"
                  onClick={() => setter(!val)}
                  className={'w-5 h-5 rounded border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-all ' + (val ? 'border-brand-500 bg-brand-500' : 'border-gray-300 bg-white')}>
                  {val && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                </button>
                <span className="text-sm text-gray-600 leading-tight">{label}</span>
              </label>
            ))}
          </div>

          {/* Analyze button */}
          <button type="button"
            onClick={analyze}
            disabled={!file || !consented || !discAck || loading}
            className="w-full bg-brand-600 hover:bg-brand-700 text-white font-semibold py-4 rounded-xl transition-all disabled:opacity-40 flex items-center justify-center gap-2 text-base">
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Analyzing image...
              </>
            ) : (
              <><Eye className="w-5 h-5" /> Analyze Image</>
            )}
          </button>

          <p className="text-xs text-gray-400 text-center">
            Analysis uses pixel-based pattern recognition — not deep learning. For clinical accuracy, see a specialist.
          </p>
        </div>
      ) : (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">

          {/* Main result card */}
          <div className={'rounded-2xl border-2 p-5 ' + (SEVERITY_STYLES[result.severity_hint] || SEVERITY_STYLES['INCONCLUSIVE'])}>
            <div className="flex items-start gap-4">
              {preview && (
                <img src={preview} alt="Analyzed" className="w-20 h-20 object-cover rounded-xl border border-white/50 flex-shrink-0" />
              )}
              <div className="flex-1">
                <div className={'flex items-center gap-2 mb-2 ' + (SEVERITY_TEXT[result.severity_hint] || 'text-gray-700')}>
                  {SevIcon && React.createElement(SevIcon, { className: 'w-5 h-5 flex-shrink-0' })}
                  <span className="font-bold">{result.severity_hint}</span>
                  <span className="text-xs bg-white/70 px-2 py-0.5 rounded-full border border-current/20 ml-auto">
                    {Math.round((result.confidence_score || 0) * 100)}% confidence
                  </span>
                </div>
                <p className="font-semibold text-sm mb-2">{result.finding}</p>
                <p className="text-sm opacity-80">{result.recommendation}</p>
              </div>
            </div>
          </div>

          {/* Findings */}
          {result.regions_of_concern?.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-500" /> Detailed Findings
              </h3>
              <div className="space-y-2">
                {result.regions_of_concern.map((f, i) => (
                  <div key={i} className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                    <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-amber-800">{f}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pixel analysis stats */}
          {result.pixel_analysis && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Shield className="w-4 h-4 text-brand-600" /> Analysis Metrics
              </h3>
              <div className="grid grid-cols-3 gap-3">
                {[
                  ['Brightness', result.pixel_analysis.mean_brightness, '/255'],
                  ['Irregularity', (result.pixel_analysis.irregularity * 100).toFixed(1), '%'],
                  ['Contrast', result.pixel_analysis.avg_contrast, '/255'],
                  ['Dark areas', (result.pixel_analysis.dark_ratio * 100).toFixed(1), '%'],
                  ['Light areas', (result.pixel_analysis.light_ratio * 100).toFixed(1), '%'],
                  ['Red tone', (result.pixel_analysis.red_dominance * 100).toFixed(1), '%'],
                ].map(([label, val, unit]) => (
                  <div key={label} className="bg-gray-50 rounded-xl p-3 text-center">
                    <p className="text-xs text-gray-400 font-medium">{label}</p>
                    <p className="font-bold text-gray-900 text-sm mt-1">{typeof val === 'number' ? val.toFixed(1) : val}{unit}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Disclaimer */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <p className="text-xs text-amber-700">{result.disclaimer}</p>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-3">
            <button type="button" onClick={reset}
              className="border-2 border-brand-600 text-brand-700 font-semibold py-3 rounded-xl hover:bg-brand-50 transition-all">
              Analyze Another
            </button>
            {React.createElement('a', {
              href: '/consultations',
              className: 'bg-brand-600 hover:bg-brand-700 text-white font-semibold py-3 rounded-xl text-center transition-all flex items-center justify-center'
            }, 'Consult a Doctor')}
          </div>
        </motion.div>
      )}
    </div>
  )
}
