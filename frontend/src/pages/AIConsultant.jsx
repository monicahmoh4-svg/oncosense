import React, { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Mic, MicOff, Volume2, VolumeX, Send, User,
  AlertCircle, RefreshCw, Settings, Sparkles,
  X, Info, CheckCircle2, Wifi, WifiOff
} from 'lucide-react'
import toast from 'react-hot-toast'

// ─── Voice style presets ───────────────────────────────────────
const VOICE_PRESETS = [
  { id: 'calm',    label: 'Calm & Clear',    rate: 0.88, pitch: 1.00, desc: 'Steady, easy to follow' },
  { id: 'warm',    label: 'Warm & Friendly', rate: 1.00, pitch: 1.10, desc: 'Natural conversational' },
  { id: 'precise', label: 'Precise & Slow',  rate: 0.72, pitch: 0.95, desc: 'For accessibility' },
]

// ─── Gemini system prompt (injected client-side when using direct API) ──
const GEMINI_SYSTEM = `You are OncoSense AI, a compassionate health assistant specialising in cancer awareness, risk factors, early detection, and screening guidance.

CRITICAL RULES:
1. NEVER diagnose cancer or any medical condition.
2. Always clarify responses are for educational/screening support only.
3. Encourage consultation with a qualified healthcare professional.
4. Be empathetic, calm, supportive — users may be anxious or in low-resource settings.
5. Keep responses concise (2-4 sentences for voice; short paragraph for text).
6. For symptoms: explain general associations but ALWAYS recommend seeing a doctor.
7. Focus: cancer risk factors, screening methods, healthy lifestyle, when to seek care.
8. RED-FLAG symptoms (coughing blood, rectal bleeding, unexplained weight loss, lumps, non-healing sores) → urgently recommend immediate medical evaluation.
9. Use simple, jargon-free language accessible to all literacy levels.
10. End every response with a brief reminder: "Please consult a healthcare provider." or "Early detection saves lives — don't delay seeking care."`

// ─── Gemini REST helper (direct browser call as fallback) ──────
const GEMINI_MODEL = 'gemini-1.5-flash'
const GEMINI_BASE  = 'https://generativelanguage.googleapis.com/v1beta/models'

async function callGeminiDirect (messages, apiKey) {
  // Convert to Gemini contents format (role: user|model)
  let contents = messages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }]
  }))
  // Gemini requires first turn to be "user"
  if (contents.length > 0 && contents[0].role === 'model') contents = contents.slice(1)

  const payload = {
    systemInstruction: { parts: [{ text: GEMINI_SYSTEM }] },
    contents,
    generationConfig: { maxOutputTokens: 800, temperature: 0.7, topP: 0.9 }
  }

  const res = await fetch(
    `${GEMINI_BASE}/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }
  )

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error?.message || `Gemini error ${res.status}`)
  }

  const data = await res.json()
  return data?.candidates?.[0]?.content?.parts?.map(p => p.text).join('') || ''
}

// ─── Suggested starter questions ──────────────────────────────
const SUGGESTIONS = [
  'What are the early warning signs of cervical cancer?',
  'How often should women get a breast cancer screening?',
  'What lifestyle changes can lower cancer risk?',
  'When should I see a doctor about a persistent cough?',
  'What is a Pap smear and who needs one?',
  'How does smoking increase cancer risk?',
]

// ══════════════════════════════════════════════════════════════
export default function AIConsultant () {
  // ─── State ─────────────────────────────────────────────────
  const [messages, setMessages] = useState([{
    id: '0', role: 'assistant', timestamp: new Date(),
    content: "Hello! I'm OncoSense AI — your cancer awareness assistant powered by Google Gemini. I can answer questions about cancer risk factors, screening, symptoms, and healthy lifestyle choices.\n\nYou can type to me or press the 🎙️ microphone button to speak. How can I help you today?"
  }])
  const [input,           setInput]           = useState('')
  const [loading,         setLoading]         = useState(false)
  const [aiAvailable,     setAiAvailable]     = useState(null)  // null=checking, true, false
  const [isListening,     setIsListening]     = useState(false)
  const [isSpeaking,      setIsSpeaking]      = useState(false)
  const [voiceEnabled,    setVoiceEnabled]    = useState(true)
  const [voicePreset,     setVoicePreset]     = useState(VOICE_PRESETS[0])
  const [showSettings,    setShowSettings]    = useState(false)
  const [selectedVoice,   setSelectedVoice]   = useState(null)
  const [availableVoices, setAvailableVoices] = useState([])
  const [interimText,     setInterimText]     = useState('')
  const [sttSupported,    setSttSupported]    = useState(false)
  const [ttsSupported,    setTtsSupported]    = useState(false)

  const recognitionRef = useRef(null)
  const synthRef       = useRef(null)
  const messagesEndRef = useRef(null)
  const textareaRef    = useRef(null)

  // ─── Check backend AI availability ────────────────────────
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const stored = localStorage.getItem('oncosense-auth')
        const token  = stored ? JSON.parse(stored)?.state?.token : null
        if (!token) { setAiAvailable(false); return }

        const res = await fetch('/api/ai-chat/status', {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (res.ok) {
          const data = await res.json()
          setAiAvailable(data.available)
        } else {
          setAiAvailable(false)
        }
      } catch {
        setAiAvailable(false)
      }
    }
    checkStatus()
  }, [])

  // ─── Init TTS ─────────────────────────────────────────────
  useEffect(() => {
    if (!('speechSynthesis' in window)) return
    synthRef.current = window.speechSynthesis
    setTtsSupported(true)

    const loadVoices = () => {
      const all = window.speechSynthesis.getVoices()
      const eng = all.filter(v => v.lang.startsWith('en'))
      // Prefer female-sounding voices for health empathy
      const sorted = [
        ...eng.filter(v => /female|woman|samantha|karen|kate|susan|moira|tessa|victoria|zira|siri/i.test(v.name)),
        ...eng.filter(v => !/female|woman|samantha|karen|kate|susan|moira|tessa|victoria|zira|siri/i.test(v.name))
      ]
      setAvailableVoices(sorted)
      if (!selectedVoice && sorted.length > 0) setSelectedVoice(sorted[0])
    }

    loadVoices()
    window.speechSynthesis.onvoiceschanged = loadVoices

    return () => { window.speechSynthesis.cancel() }
  }, [])

  // ─── Init STT ─────────────────────────────────────────────
  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) return
    setSttSupported(true)

    const rec = new SR()
    rec.continuous     = false
    rec.interimResults = true
    rec.lang           = 'en-US'
    rec.maxAlternatives = 1

    rec.onstart  = () => setIsListening(true)
    rec.onend    = () => { setIsListening(false); setInterimText('') }
    rec.onerror  = (e) => {
      setIsListening(false); setInterimText('')
      if (e.error !== 'no-speech') toast.error(`Mic error: ${e.error}`)
    }
    rec.onresult = (e) => {
      let interim = '', final = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript
        if (e.results[i].isFinal) final += t
        else interim += t
      }
      setInterimText(interim)
      if (final.trim()) {
        setInput(prev => (prev + ' ' + final).trim())
        setInterimText('')
      }
    }

    recognitionRef.current = rec
    return () => rec.abort()
  }, [])

  // ─── Auto-scroll ──────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  // ─── TTS speak ────────────────────────────────────────────
  const speak = useCallback((text) => {
    if (!ttsSupported || !voiceEnabled || !text) return
    synthRef.current?.cancel()

    const clean = text
      .replace(/#{1,6}\s/g, '')
      .replace(/[*_`]/g, '')
      .replace(/[\u{1F300}-\u{1F9FF}]/gu, '')
      .replace(/\n+/g, '. ')
      .trim()

    const utt = new SpeechSynthesisUtterance(clean)
    utt.rate   = voicePreset.rate
    utt.pitch  = voicePreset.pitch
    utt.volume = 0.95
    if (selectedVoice) utt.voice = selectedVoice

    utt.onstart = () => setIsSpeaking(true)
    utt.onend   = () => setIsSpeaking(false)
    utt.onerror = () => setIsSpeaking(false)

    synthRef.current?.speak(utt)
  }, [ttsSupported, voiceEnabled, voicePreset, selectedVoice])

  const stopSpeaking = useCallback(() => {
    synthRef.current?.cancel()
    setIsSpeaking(false)
  }, [])

  // ─── Toggle mic ───────────────────────────────────────────
  const toggleMic = () => {
    if (!sttSupported) {
      toast.error('Speech recognition requires Chrome, Edge, or Safari.')
      return
    }
    if (isListening) {
      recognitionRef.current?.stop()
    } else {
      stopSpeaking()
      try { recognitionRef.current?.start() }
      catch { toast.error('Could not start microphone') }
    }
  }

  // ─── Send message ─────────────────────────────────────────
  const sendMessage = async (override) => {
    const text = (override || input).trim()
    if (!text || loading) return

    stopSpeaking()
    setInput('')
    setInterimText('')

    const userMsg = { id: Date.now().toString(), role: 'user', content: text, timestamp: new Date() }
    setMessages(prev => [...prev, userMsg])
    setLoading(true)

    try {
      const history = [...messages.slice(-12), userMsg]
      let aiText = null

      // ── 1. Try backend proxy (Gemini key stays server-side)
      try {
        const stored = localStorage.getItem('oncosense-auth')
        const token  = stored ? JSON.parse(stored)?.state?.token : null

        const proxyRes = await fetch('/api/ai-chat/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          body: JSON.stringify({ messages: history })
        })

        if (proxyRes.ok) {
          const data = await proxyRes.json()
          aiText = data.text || null
        }
      } catch (proxyErr) {
        console.warn('Backend proxy unavailable, trying direct Gemini call…', proxyErr.message)
      }

      // ── 2. Direct browser fallback (needs VITE_GEMINI_API_KEY set at build time)
      if (!aiText) {
        const directKey = import.meta.env.VITE_GEMINI_API_KEY
        if (directKey) {
          aiText = await callGeminiDirect(history, directKey)
        }
      }

      if (!aiText) {
        aiText = "I'm having trouble reaching the AI service right now. Please try again shortly. For any urgent health concerns, please visit a healthcare facility immediately."
      }

      const aiMsg = { id: (Date.now() + 1).toString(), role: 'assistant', content: aiText, timestamp: new Date() }
      setMessages(prev => [...prev, aiMsg])
      if (voiceEnabled) setTimeout(() => speak(aiText), 150)

    } catch (err) {
      console.error('AI error:', err)
      const errMsg = { id: (Date.now() + 1).toString(), role: 'assistant', isError: true, timestamp: new Date(),
        content: "I'm sorry, I encountered an error. Please try again. If you have urgent symptoms, please seek medical care immediately." }
      setMessages(prev => [...prev, errMsg])
      toast.error('Could not reach AI service')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  const respeakLast = () => {
    const last = [...messages].reverse().find(m => m.role === 'assistant')
    if (last) speak(last.content)
  }

  const clearChat = () => {
    stopSpeaking()
    setMessages([{
      id: Date.now().toString(), role: 'assistant', timestamp: new Date(),
      content: "Chat cleared. How can I help you with cancer awareness or screening information?"
    }])
  }

  // ─── Render ────────────────────────────────────────────────
  return (
    <div className="max-w-3xl mx-auto h-[calc(100vh-7rem)] flex flex-col gap-3 animate-fade-in">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-2xl text-gray-900">AI Health Assistant</h1>
              {aiAvailable === true  && <span className="text-xs bg-emerald-100 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/>Gemini Online</span>}
              {aiAvailable === false && <span className="text-xs bg-amber-100 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1"><WifiOff className="w-3 h-3"/>Limited</span>}
            </div>
            <p className="text-xs text-gray-400">Powered by Google Gemini · Voice + Text</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => { setVoiceEnabled(v => !v); if (isSpeaking) stopSpeaking() }}
            title={voiceEnabled ? 'Mute voice' : 'Enable voice'}
            className={`p-2.5 rounded-xl border-2 transition-all ${voiceEnabled ? 'border-indigo-400 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-400'}`}>
            {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
          <button onClick={() => setShowSettings(s => !s)}
            className={`p-2.5 rounded-xl border-2 transition-all ${showSettings ? 'border-indigo-400 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-400'}`}>
            <Settings className="w-4 h-4" />
          </button>
          <button onClick={clearChat}
            className="p-2.5 rounded-xl border-2 border-gray-200 text-gray-400 hover:border-red-300 hover:text-red-500 transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Settings panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-4">

              <div>
                <p className="text-sm font-bold text-gray-700 mb-2">🎙️ Voice Style</p>
                <div className="grid grid-cols-3 gap-2">
                  {VOICE_PRESETS.map(p => (
                    <button key={p.id} onClick={() => setVoicePreset(p)}
                      className={`p-2.5 rounded-xl border-2 text-left transition-all ${voicePreset.id === p.id ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'}`}>
                      <p className="text-xs font-bold text-gray-900">{p.label}</p>
                      <p className="text-xs text-gray-500">{p.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {availableVoices.length > 0 && (
                <div>
                  <p className="text-sm font-bold text-gray-700 mb-2">🔊 Voice</p>
                  <select className="input-field text-sm"
                    value={selectedVoice?.name || ''}
                    onChange={e => setSelectedVoice(availableVoices.find(v => v.name === e.target.value))}>
                    {availableVoices.slice(0, 14).map(v => (
                      <option key={v.name} value={v.name}>{v.name} ({v.lang})</option>
                    ))}
                  </select>
                </div>
              )}

              {!sttSupported && (
                <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3">
                  <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                  <p className="text-xs text-amber-700">Voice input requires Chrome, Edge, or Safari.</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => speak("Voice output is working. I'm your OncoSense AI health assistant, powered by Google Gemini.")}
                  className="btn-secondary text-sm py-2">🔊 Test Voice</button>
                {aiAvailable === false && (
                  <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                    <Info className="w-4 h-4 text-amber-500 flex-shrink-0" />
                    <p className="text-xs text-amber-700">Add <code>GEMINI_API_KEY</code> to backend env to enable full AI.</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Disclaimer */}
      <div className="disclaimer-box flex items-start gap-2 py-2.5">
        <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-amber-700">
          <strong>AI Assistant</strong> — For cancer awareness &amp; education only. Does <strong>NOT</strong> diagnose. Always consult a qualified healthcare provider for medical concerns.
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-4">

        {/* Suggested questions (first load) */}
        {messages.length === 1 && (
          <div className="mb-2">
            <p className="text-xs text-gray-400 font-medium mb-2">💡 Suggested questions:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {SUGGESTIONS.map((q, i) => (
                <button key={i} onClick={() => sendMessage(q)}
                  className="text-left text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 px-3 py-2.5 rounded-xl transition-all">
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Message list */}
        {messages.map(msg => {
          const isUser = msg.role === 'user'
          return (
            <motion.div key={msg.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>

              {!isUser && (
                <div className={`w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center mt-1 ${msg.isError ? 'bg-red-100' : 'bg-gradient-to-br from-blue-500 to-indigo-600'}`}>
                  {msg.isError ? <AlertCircle className="w-4 h-4 text-red-500" /> : <Sparkles className="w-4 h-4 text-white" />}
                </div>
              )}

              <div className={`max-w-lg flex flex-col gap-1 ${isUser ? 'items-end' : 'items-start'}`}>
                <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                  isUser
                    ? 'bg-indigo-600 text-white rounded-br-sm'
                    : msg.isError
                    ? 'bg-red-50 text-red-800 border border-red-200 rounded-bl-sm'
                    : 'bg-gray-50 text-gray-900 border border-gray-100 rounded-bl-sm'
                }`}>
                  {msg.content}
                </div>

                <div className={`flex items-center gap-2 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                  <span className="text-xs text-gray-400">
                    {msg.timestamp?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {!isUser && !msg.isError && ttsSupported && (
                    <button onClick={() => isSpeaking ? stopSpeaking() : speak(msg.content)}
                      className="text-xs text-gray-400 hover:text-indigo-600 flex items-center gap-1 transition-all">
                      {isSpeaking ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                      {isSpeaking ? 'Stop' : 'Listen'}
                    </button>
                  )}
                </div>
              </div>

              {isUser && (
                <div className="w-8 h-8 bg-gray-200 rounded-xl flex-shrink-0 flex items-center justify-center mt-1">
                  <User className="w-4 h-4 text-gray-500" />
                </div>
              )}
            </motion.div>
          )
        })}

        {/* Loading dots */}
        {loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-4 h-4 text-white animate-pulse" />
            </div>
            <div className="bg-gray-50 border border-gray-100 px-4 py-3 rounded-2xl rounded-bl-sm flex items-center gap-2">
              {[0,1,2].map(i => (
                <div key={i} className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
              <span className="text-xs text-gray-400 ml-1">Gemini is thinking…</span>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Speaking indicator */}
      <AnimatePresence>
        {isSpeaking && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
            className="flex items-center justify-between bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-2.5">
            <div className="flex items-center gap-3">
              <div className="flex gap-0.5 items-end h-5">
                {[1,2,3,4,5].map(i => (
                  <div key={i} className="w-1 bg-indigo-500 rounded-full animate-pulse"
                    style={{ height: `${8 + (i % 3) * 5}px`, animationDelay: `${i * 0.1}s` }} />
                ))}
              </div>
              <span className="text-sm font-semibold text-indigo-700">AI is speaking…</span>
            </div>
            <button onClick={stopSpeaking}
              className="text-xs text-indigo-600 font-semibold hover:text-indigo-800 flex items-center gap-1">
              <VolumeX className="w-3 h-3" /> Stop
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input bar */}
      <div className="bg-white border border-gray-200 rounded-2xl p-3 shadow-sm">

        {/* Interim transcript */}
        <AnimatePresence>
          {interimText && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }} className="overflow-hidden mb-2">
              <div className="px-3 py-2 bg-indigo-50 rounded-xl border border-indigo-200">
                <p className="text-sm text-indigo-600 italic flex items-center gap-2">
                  <Mic className="w-3 h-3 animate-pulse" /> {interimText}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-end gap-2">
          {/* Mic button */}
          {sttSupported && (
            <button onClick={toggleMic} title={isListening ? 'Stop listening' : 'Start voice input'}
              className={`p-3 rounded-xl border-2 flex-shrink-0 transition-all ${
                isListening
                  ? 'border-red-400 bg-red-50 text-red-600 animate-pulse-soft'
                  : 'border-gray-200 text-gray-400 hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50'
              }`}>
              {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>
          )}

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isListening ? '🎙️ Listening… speak now' : 'Type a question or tap 🎙️ to speak…'}
            rows={1}
            className="flex-1 input-field resize-none min-h-[44px] max-h-32 py-2.5"
            onInput={e => {
              e.target.style.height = 'auto'
              e.target.style.height = Math.min(e.target.scrollHeight, 128) + 'px'
            }}
          />

          {/* Replay last */}
          {ttsSupported && messages.length > 1 && (
            <button onClick={respeakLast} title="Replay last response" disabled={isSpeaking}
              className="p-3 rounded-xl border-2 border-gray-200 text-gray-400 hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all flex-shrink-0 disabled:opacity-40">
              <RefreshCw className="w-4 h-4" />
            </button>
          )}

          {/* Send */}
          <button onClick={() => sendMessage()} disabled={!input.trim() || loading}
            className="p-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all flex-shrink-0 disabled:opacity-40 active:scale-95">
            <Send className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center justify-between mt-2 px-1 text-xs text-gray-400">
          <span>
            {isListening
              ? <span className="text-red-500 font-semibold flex items-center gap-1"><span className="w-1.5 h-1.5 bg-red-500 rounded-full inline-block" /> Listening…</span>
              : 'Enter to send · Shift+Enter for newline'}
          </span>
          <span className={`flex items-center gap-1 ${voiceEnabled ? 'text-indigo-600' : ''}`}>
            {ttsSupported && <><Volume2 className="w-3 h-3" />{voiceEnabled ? 'Voice on' : 'Voice off'}</>}
          </span>
        </div>
      </div>
    </div>
  )
}
