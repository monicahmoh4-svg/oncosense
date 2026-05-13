import React, { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, Upload, AlertCircle, CheckCircle2, X, Eye } from 'lucide-react'
import api from '../services/api'
import toast from 'react-hot-toast'

export default function ImageScreening() {
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [imageType, setImageType] = useState('skin')
  const [consented, setConsented] = useState(false)
  const [disclaimerAck, setDisclaimerAck] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const fileInputRef = useRef(null)

  const handleFile = (f) => {
    if (!f) return
    if (!f.type.startsWith('image/')) { toast.error('Please select an image file'); return }
    if (f.size > 10 * 1024 * 1024) { toast.error('Image must be under 10MB'); return }
    setFile(f)
    setResult(null)
    const url = URL.createObjectURL(f)
    setPreview(url)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }

  const analyze = async () => {
    if (!file || !consented || !disclaimerAck) { toast.error('Please upload an image and check all consent boxes'); return }
    setLoading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('image_type', imageType)
      fd.append('consent_given', 'true')
      fd.append('disclaimer_acknowledged', 'true')
      const res = await api.post('/image-screening/analyze', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      setResult(res.data)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Analysis failed')
    } finally { setLoading(false) }
  }

  const reset = () => { setFile(null); setPreview(null); setResult(null); setConsented(false); setDisclaimerAck(false) }

  const severityStyle = {
    'HIGH CONCERN': 'bg-red-50 border-red-300 text-red-800',
    'MODERATE CONCERN': 'bg-amber-50 border-amber-300 text-amber-800',
    'LOW CONCERN': 'bg-emerald-50 border-emerald-300 text-emerald-800',
  }

  return (
    <div className="max-w-2xl mx-auto animate-fade-in space-y-6">
      <div>
        <h1 className="font-display text-3xl text-gray-900">Image Pre-Screening</h1>
        <p className="text-gray-500 mt-1">Upload an image of a skin lesion or oral abnormality for AI-assisted analysis</p>
      </div>

      <div className="disclaimer-box">
        <p className="font-bold text-amber-800 mb-1">⚠️ Important Notice</p>
        <p className="text-xs">This image analysis uses automated pattern detection for SCREENING SUPPORT ONLY. It does NOT constitute a medical diagnosis and may not be accurate. Always consult a qualified healthcare professional for proper evaluation of any skin or oral abnormality.</p>
      </div>

      {!result ? (
        <div className="card space-y-5">
          {/* Type selector */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Image Type</label>
            <div className="grid grid-cols-2 gap-3">
              {[['skin','🔬 Skin Lesion / Mole'],['oral','👄 Oral Cavity / Mouth']].map(([v,l]) => (
                <button key={v} type="button" onClick={() => setImageType(v)}
                  className={`py-3 px-4 rounded-xl border-2 text-sm font-semibold transition-all text-left
                    ${imageType === v ? 'border-brand-500 bg-brand-50 text-brand-800' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                  {l}
                </button>
              ))}
            </div>
          </div>

          {/* Upload area */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Upload Image</label>
            {!preview ? (
              <div onDrop={handleDrop} onDragOver={e => e.preventDefault()}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 hover:border-brand-400 rounded-2xl p-8 text-center cursor-pointer transition-all bg-gray-50 hover:bg-brand-50">
                <Camera className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="font-semibold text-gray-600">Drag & drop or click to upload</p>
                <p className="text-sm text-gray-400 mt-1">JPG, PNG up to 10MB</p>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
                  onChange={e => handleFile(e.target.files[0])} />
              </div>
            ) : (
              <div className="relative rounded-2xl overflow-hidden border border-gray-200">
                <img src={preview} alt="Upload preview" className="w-full max-h-64 object-contain bg-gray-50" />
                <button onClick={() => { setFile(null); setPreview(null) }}
                  className="absolute top-2 right-2 w-8 h-8 bg-white rounded-full shadow flex items-center justify-center hover:bg-red-50">
                  <X className="w-4 h-4 text-gray-600" />
                </button>
                <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded-lg">
                  {file?.name} · {(file?.size / 1024 / 1024).toFixed(1)}MB
                </div>
              </div>
            )}
          </div>

          {/* Consent checkboxes */}
          <div className="space-y-3">
            {[
              [consented, setConsented, 'I consent to this image being analyzed by the OncoSense AI system for screening purposes'],
              [disclaimerAck, setDisclaimerAck, 'I understand this is NOT a medical diagnosis and I will consult a healthcare professional for proper evaluation'],
            ].map(([val, setter, label], i) => (
              <label key={i} className="flex items-start gap-3 cursor-pointer group">
                <div onClick={() => setter(!val)}
                  className={`w-5 h-5 rounded border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-all cursor-pointer
                    ${val ? 'border-brand-500 bg-brand-500' : 'border-gray-300 group-hover:border-brand-400'}`}>
                  {val && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                </div>
                <span className="text-sm text-gray-600">{label}</span>
              </label>
            ))}
          </div>

          <button onClick={analyze} disabled={!file || !consented || !disclaimerAck || loading}
            className="btn-primary w-full py-4 text-base">
            {loading ? (
              <><span className="spinner" /> Analyzing image...</>
            ) : (
              <><Eye className="w-5 h-5" /> Analyze Image</>
            )}
          </button>
        </div>
      ) : (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          {/* Result card */}
          <div className={`card border-2 ${severityStyle[result.severity_hint] || severityStyle['LOW CONCERN']}`}>
            <div className="flex items-start gap-4">
              {preview && <img src={preview} alt="Analyzed" className="w-20 h-20 object-cover rounded-xl flex-shrink-0" />}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  {result.abnormality_detected
                    ? <AlertCircle className="w-5 h-5 text-orange-600" />
                    : <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
                  <span className="font-bold text-sm">{result.severity_hint}</span>
                  <span className="text-xs bg-white/60 px-2 py-0.5 rounded-full border border-current opacity-70">
                    {Math.round(result.confidence_score * 100)}% confidence
                  </span>
                </div>
                <p className="font-semibold mb-1">{result.finding}</p>
                <p className="text-sm opacity-80">{result.recommendation}</p>
              </div>
            </div>
          </div>

          {/* Regions of concern */}
          {result.regions_of_concern?.length > 0 && (
            <div className="card">
              <h3 className="font-bold text-gray-900 mb-3">🔍 Findings</h3>
              <div className="space-y-2">
                {result.regions_of_concern.map((r, i) => (
                  <div key={i} className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                    <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                    <p className="text-sm text-amber-800">{r}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Disclaimer */}
          <div className="disclaimer-box">
            <p className="text-xs">{result.disclaimer}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button onClick={reset} className="btn-secondary">Analyze Another</button>
            <a href="/consultations" className="btn-primary justify-center flex items-center gap-2">
              Consult a Doctor
            </a>
          </div>
        </motion.div>
      )}
    </div>
  )
}
