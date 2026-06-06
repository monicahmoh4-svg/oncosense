import React, { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, X, Eye, AlertCircle, CheckCircle2, Shield, Info } from 'lucide-react'
import { imageService } from '../services/api'
import toast from 'react-hot-toast'

var SEVERITY_STYLES = {
  'HIGH CONCERN':     'border-red-300 bg-red-50',
  'MODERATE CONCERN': 'border-amber-300 bg-amber-50',
  'LOW CONCERN':      'border-emerald-300 bg-emerald-50',
  'INCONCLUSIVE':     'border-gray-300 bg-gray-50',
}
var SEVERITY_TEXT = {
  'HIGH CONCERN':     'text-red-700',
  'MODERATE CONCERN': 'text-amber-700',
  'LOW CONCERN':      'text-emerald-700',
  'INCONCLUSIVE':     'text-gray-700',
}

function mapsIcon(severity) {
  if (severity === 'LOW CONCERN') return CheckCircle2
  return AlertCircle
}

export default function ImageScreening() {
  var [file, setFile]           = useState(null)
  var [preview, setPreview]     = useState(null)
  var [imageType, setImageType] = useState('skin')
  var [consented, setConsented] = useState(false)
  var [discAck, setDiscAck]     = useState(false)
  var [loading, setLoading]     = useState(false)
  var [result, setResult]       = useState(null)
  var fileRef = useRef(null)

  function handleFile(f) {
    if (!f) return
    if (!f.type.startsWith('image/')) { toast.error('Please select an image file (JPG, PNG)'); return }
    if (f.size > 15 * 1024 * 1024) { toast.error('Image must be under 15MB'); return }
    setFile(f); setResult(null)
    setPreview(URL.createObjectURL(f))
  }

  function handleDrop(e) { e.preventDefault(); handleFile(e.dataTransfer.files[0]) }

  async function analyze() {
    if (!file)      { toast.error('Please upload an image'); return }
    if (!consented) { toast.error('Please provide consent'); return }
    if (!discAck)   { toast.error('Please acknowledge the disclaimer'); return }
    setLoading(true)
    try {
      var fd = new FormData()
      fd.append('file', file)
      fd.append('image_type', imageType)
      fd.append('consent_given', 'true')
      fd.append('disclaimer_acknowledged', 'true')
      var res = await imageService.analyze(fd)
      setResult(res.data)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Analysis failed. Please try again.')
    } finally { setLoading(false) }
  }

  function reset() {
    setFile(null); setPreview(null); setResult(null)
    setConsented(false); setDiscAck(false)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">

      <div>
        <h1 className="font-display text-3xl text-gray-900">Image Pre-Screening</h1>
        <p className="text-gray-500 mt-1">AI-assisted analysis of skin lesions and oral abnormalities</p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-2">
        <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-amber-800 text-sm">Screening Support Only</p>
          <p className="text-xs text-amber-700 mt-0.5">
            This tool uses pixel analysis — NOT deep learning or medical-grade AI.
            Results are indicative only. Always consult a qualified healthcare professional.
          </p>
        </div>
      </div>

      {!result ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">What are you screening?</label>
            <div className="grid grid-cols-2 gap-3">
              {[
                ['skin', 'Skin Lesion / Mole', 'Moles, lesions, unusual skin changes'],
                ['oral', 'Oral Cavity', 'Mouth ulcers, white/red patches, tongue'],
              ].map(function(arr) {
                var v = arr[0]; var l = arr[1]; var d = arr[2]
                return (
                  React.createElement('button', {
                    key: v, type: 'button',
                    onClick: function() { setImageType(v) },
                    className: 'p-3 rounded-xl border-2 text-left transition-all ' + (imageType === v ? 'border-brand-500 bg-brand-50' : 'border-gray-200 hover:border-gray-300')
                  },
                    React.createElement('p', { className: 'text-sm font-bold ' + (imageType === v ? 'text-brand-900' : 'text-gray-700') }, l),
                    React.createElement('p', { className: 'text-xs text-gray-400 mt-0.5' }, d)
                  )
                )
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Upload Image</label>
            {!preview ? (
              <div
                onDrop={handleDrop}
                onDragOver={function(e) { e.preventDefault() }}
                onClick={function() { fileRef.current && fileRef.current.click() }}
                className="border-2 border-dashed border-gray-300 hover:border-brand-400 rounded-2xl p-8 text-center cursor-pointer transition-all bg-gray-50 hover:bg-brand-50">
                <Camera className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="font-semibold text-gray-600 text-sm">Drag and drop or click to upload</p>
                <p className="text-xs text-gray-400 mt-1">JPG, PNG up to 15MB · Use good lighting and a close-up shot</p>
                <input ref={fileRef} type="file" accept="image/*" className="hidden"
                  onChange={function(e) { handleFile(e.target.files[0]) }} />
              </div>
            ) : (
              <div className="relative rounded-2xl overflow-hidden border-2 border-gray-200 bg-gray-50">
                <img src={preview} alt="Preview" className="w-full max-h-64 object-contain" />
                <button type="button"
                  onClick={function() { setFile(null); setPreview(null) }}
                  className="absolute top-2 right-2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-red-50 transition-all">
                  <X className="w-4 h-4 text-gray-600" />
                </button>
              </div>
            )}
          </div>

          <div className="space-y-3">
            {[
              [consented, setConsented, 'I consent to this image being analyzed by the OncoSense AI screening system'],
              [discAck, setDiscAck, 'I understand this is NOT a medical diagnosis and I will consult a healthcare professional for proper evaluation'],
            ].map(function(arr, i) {
              var val = arr[0]; var setter = arr[1]; var label = arr[2]
              return (
                React.createElement('label', { key: i, className: 'flex items-start gap-3 cursor-pointer' },
                  React.createElement('button', {
                    type: 'button',
                    onClick: function() { setter(!val) },
                    className: 'w-5 h-5 rounded border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-all ' + (val ? 'border-brand-500 bg-brand-500' : 'border-gray-300 bg-white')
                  },
                    val && React.createElement(CheckCircle2, { className: 'w-3.5 h-3.5 text-white' })
                  ),
                  React.createElement('span', { className: 'text-sm text-gray-600 leading-tight' }, label)
                )
              )
            })}
          </div>

          <button type="button" onClick={analyze}
            disabled={!file || !consented || !discAck || loading}
            className="w-full bg-brand-600 hover:bg-brand-700 text-white font-semibold py-4 rounded-xl transition-all disabled:opacity-40 flex items-center justify-center gap-2 text-base">
            {loading
              ? React.createElement(React.Fragment, null,
                  React.createElement('div', { className: 'w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin' }),
                  'Analyzing image...'
                )
              : React.createElement(React.Fragment, null,
                  React.createElement(Eye, { className: 'w-5 h-5' }),
                  'Analyze Image'
                )
            }
          </button>
        </div>
      ) : (
        React.createElement(motion.div, {
          initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 },
          className: 'space-y-4'
        },
          React.createElement('div', {
            className: 'rounded-2xl border-2 p-5 ' + (SEVERITY_STYLES[result.severity_hint] || SEVERITY_STYLES['INCONCLUSIVE'])
          },
            React.createElement('div', { className: 'flex items-start gap-4' },
              preview && React.createElement('img', {
                src: preview, alt: 'Analyzed',
                className: 'w-20 h-20 object-cover rounded-xl border border-white/50 flex-shrink-0'
              }),
              React.createElement('div', { className: 'flex-1' },
                React.createElement('div', {
                  className: 'flex items-center gap-2 mb-2 ' + (SEVERITY_TEXT[result.severity_hint] || 'text-gray-700')
                },
                  React.createElement(mapsIcon(result.severity_hint), { className: 'w-5 h-5 flex-shrink-0' }),
                  React.createElement('span', { className: 'font-bold' }, result.severity_hint),
                  React.createElement('span', { className: 'text-xs bg-white/70 px-2 py-0.5 rounded-full border border-current/20 ml-auto' },
                    Math.round((result.confidence_score || 0) * 100) + '% confidence'
                  )
                ),
                React.createElement('p', { className: 'font-semibold text-sm mb-2' }, result.finding),
                React.createElement('p', { className: 'text-sm opacity-80' }, result.recommendation)
              )
            )
          ),

          result.regions_of_concern && result.regions_of_concern.length > 0 && (
            React.createElement('div', { className: 'bg-white rounded-2xl border border-gray-100 p-5' },
              React.createElement('h3', { className: 'font-bold text-gray-900 mb-3 flex items-center gap-2' },
                React.createElement(AlertCircle, { className: 'w-4 h-4 text-amber-500' }),
                'Detailed Findings'
              ),
              React.createElement('div', { className: 'space-y-2' },
                result.regions_of_concern.map(function(f, i) {
                  return React.createElement('div', {
                    key: i,
                    className: 'flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2'
                  },
                    React.createElement(AlertCircle, { className: 'w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5' }),
                    React.createElement('p', { className: 'text-sm text-amber-800' }, f)
                  )
                })
              )
            )
          ),

          result.pixel_analysis && (
            React.createElement('div', { className: 'bg-white rounded-2xl border border-gray-100 p-5' },
              React.createElement('h3', { className: 'font-bold text-gray-900 mb-3 flex items-center gap-2' },
                React.createElement(Shield, { className: 'w-4 h-4 text-brand-600' }),
                'Analysis Metrics'
              ),
              React.createElement('div', { className: 'grid grid-cols-3 gap-3' },
                [
                  ['Brightness', (result.pixel_analysis.mean_brightness || 0).toFixed(1), '/255'],
                  ['Irregularity', ((result.pixel_analysis.irregularity || 0) * 100).toFixed(1), '%'],
                  ['Contrast', (result.pixel_analysis.avg_contrast || 0).toFixed(1), '/255'],
                  ['Dark areas', ((result.pixel_analysis.dark_ratio || 0) * 100).toFixed(1), '%'],
                  ['Light areas', ((result.pixel_analysis.light_ratio || 0) * 100).toFixed(1), '%'],
                  ['Red tone', ((result.pixel_analysis.red_dominance || 0) * 100).toFixed(1), '%'],
                ].map(function(arr) {
                  return React.createElement('div', {
                    key: arr[0],
                    className: 'bg-gray-50 rounded-xl p-3 text-center'
                  },
                    React.createElement('p', { className: 'text-xs text-gray-400 font-medium' }, arr[0]),
                    React.createElement('p', { className: 'font-bold text-gray-900 text-sm mt-1' }, arr[1] + arr[2])
                  )
                })
              )
            )
          ),

          React.createElement('div', { className: 'bg-amber-50 border border-amber-200 rounded-xl p-4' },
            React.createElement('p', { className: 'text-xs text-amber-700' }, result.disclaimer)
          ),

          React.createElement('div', { className: 'grid grid-cols-2 gap-3' },
            React.createElement('button', {
              type: 'button', onClick: reset,
              className: 'border-2 border-brand-600 text-brand-700 font-semibold py-3 rounded-xl hover:bg-brand-50 transition-all'
            }, 'Analyze Another'),
            React.createElement('a', {
              href: '/consultations',
              className: 'bg-brand-600 hover:bg-brand-700 text-white font-semibold py-3 rounded-xl text-center transition-all flex items-center justify-center'
            }, 'Consult a Doctor')
          )
        )
      )}
    </div>
  )
}
