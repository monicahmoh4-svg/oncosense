import React, { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Mic, MicOff, Volume2, VolumeX, Send, User,
  AlertCircle, RefreshCw, Settings, Sparkles, X, Info, CheckCircle2
} from 'lucide-react'
import toast from 'react-hot-toast'

const VOICE_PRESETS = [
  { id: 'calm',    label: 'Calm & Clear',    rate: 0.88, pitch: 1.00 },
  { id: 'warm',    label: 'Warm & Friendly', rate: 1.00, pitch: 1.10 },
  { id: 'precise', label: 'Precise & Slow',  rate: 0.72, pitch: 0.95 },
]

const GEMINI_SYSTEM = `You are OncoSense AI, a compassionate health assistant specialising in cancer awareness, risk factors, early detection, and screening guidance.
RULES: Never diagnose. Always say responses are for educational purposes only. Encourage professional consultation. Keep responses concise. For red-flag symptoms (coughing blood, rectal bleeding, unexplained weight loss, lumps) urgently recommend immediate medical evaluation. End every response with a brief reminder to consult a healthcare provider.`

const SUGGESTIONS = [
  'What are early warning signs of cervical cancer?',
  'How often should I get a breast cancer screening?',
  'What lifestyle changes lower cancer risk?',
  'When should I see a doctor about a persistent cough?',
]

async function callGeminiDirect(messages, apiKey) {
  let contents = messages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }]
  }))
  if (contents.length > 0 && contents[0].role === 'model') contents = contents.slice(1)

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: GEMINI_SYSTEM }] },
        contents,
        generationConfig: { maxOutputTokens: 800, temperature: 0.7 }
      })
    }
  )
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error?.message || `Gemini error ${res.status}`)
  }
  const data = await res.json()
  return data?.candidates?.[0]?.content?.parts?.map(p => p.text).join('') || ''
}

export default function AIConsultant() {
  const [messages, setMessages] = useState([{
    id: '0', role: 'assistant', timestamp: new Date(),
    content: "Hello! I'm OncoSense AI — your cancer awareness assistant powered by Google Gemini. You can type or use the 🎙️ microphone to speak. How can I help you today?"
  }])
  const [input, setInput]               = useState('')
  const [loading, setLoading]           = useState(false)
  const [isListening, setIsListening]   = useState(false)
  const [isSpeaking, setIsSpeaking]     = useState(false)
  const [voiceEnabled, setVoiceEnabled] = useState(true)
  const [voicePreset, setVoicePreset]   = useState(VOICE_PRESETS[0])
  const [showSettings, setShowSettings] = useState(false)
  const [selectedVoice, setSelectedVoice] = useState(null)
  const [availableVoices, setAvailableVoices] = useState([])
  const [interimText, setInterimText]   = useState('')
  const [sttSupported, setSttSupported] = useState(false)
  const [ttsSupported, setTtsSupported] = useState(false)

  const recognitionRef = useRef(null)
  const synthRef       = useRef(null)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    if ('speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis
      setTtsSupported(true)
      const loadVoices = () => {
        const all = window.speechSynthesis.getVoices()
        const eng = all.filter(v => v.lang.startsWith('en'))
        const sorted = [
          ...eng.filter(v => /female|samantha|karen|kate|susan|moira|tessa|victoria|zira/i.test(v.name)),
          ...eng.filter(v => !/female|samantha|karen|kate|susan|moira|tessa|victoria|zira/i.test(v.name))
        ]
        setAvailableVoices(sorted)
        if (!selectedVoice && sorted.length > 0) setSelectedVoice(sorted[0])
      }
      loadVoices()
      window.speechSynthesis.onvoiceschanged = loadVoices
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (SR) {
      setSttSupported(true)
      const rec = new SR()
      rec.continuous = false; rec.interimResults = true; rec.lang = 'en-US'
      rec.onstart  = () => setIsListening(true)
      rec.onend    = () => { setIsListening(false); setInterimText('') }
      rec.onerror  = (e) => { setIsListening(false); setInterimText(''); if (e.error !== 'no-speech') toast.error(`Mic error: ${e.error}`) }
      rec.onresult = (e) => {
        let interim = '', final = ''
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const t = e.results[i][0].transcript
          if (e.results[i].isFinal) final += t
          else interim += t
        }
        setInterimText(interim)
        if (final.trim()) { setInput(prev => (prev + ' ' + final).trim()); setInterimText('') }
      }
      recognitionRef.current = rec
    }
    return () => { recognitionRef.current?.abort(); synthRef.current?.cancel() }
  }, [])

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, loading])

  const speak = useCallback((text) => {
    if (!ttsSupported || !voiceEnabled || !text) return
    synthRef.current?.cancel()
    const clean = text.replace(/[*_`#]/g, '').replace(/[\u{1F300}-\u{1F9FF}]/gu, '').replace(/\n+/g, '. ').trim()
    const utt = new SpeechSynthesisUtterance(clean)
    utt.rate = voicePreset.rate; utt.pitch = voicePreset.pitch; utt.volume = 0.95
    if (selectedVoice) utt.voice = selectedVoice
    utt.onstart = () => setIsSpeaking(true)
    utt.onend   = () => setIsSpeaking(false)
    utt.onerror = () => setIsSpeaking(false)
    synthRef.current?.speak(utt)
  }, [ttsSupported, voiceEnabled, voicePreset, selectedVoice])

  const stopSpeaking = useCallback(() => { synthRef.current?.cancel(); setIsSpeaking(false) }, [])

  const toggleMic = () => {
    if (!sttSupported) { toast.error('Speech recognition requires Chrome, Edge, or Safari.'); return }
    if (isListening) recognitionRef.current?.stop()
    else { stopSpeaking(); try { recognitionRef.current?.start() } catch { toast.error('Could not start microphone') } }
  }

  const sendMessage = async (override) => {
    const text = (override || input).trim()
    if (!text || loading) return
    stopSpeaking(); setInput(''); setInterimText('')
    const userMsg = { id: Date.now().toString(), role: 'user', content: text, timestamp: new Date() }
    setMessages(prev => [...prev, userMsg])
    setLoading(true)
    try {
      const history = [...messages.slice(-12), userMsg]
      let aiText = null

      // Try backend proxy first
      try {
        const stored = localStorage.getItem('oncosense-auth')
        const token  = stored ? JSON.parse(stored)?.state?.token : null
        const proxyRes = await fetch('/api/ai-chat/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          body: JSON.stringify({ messages: history })
        })
        if (proxyRes.ok) {
          const data = await proxyRes.json()
          aiText = data.text || null
        }
      } catch {}

      // Fallback to direct Gemini call
      if (!aiText) {
        const directKey = import.meta.env.VITE_GEMINI_API_KEY
        if (directKey) aiText = await callGeminiDirect(history, directKey)
      }

      if (!aiText) aiText = "I'm having trouble connecting right now. Please try again. For urgent health concerns, please visit a healthcare facility immediately."

      const aiMsg = { id: (Date.now() + 1).toString(), role: 'assistant', content: aiText, timestamp: new Date() }
      setMessages(prev => [...prev, aiMsg])
      if (voiceEnabled) setTimeout(() => speak(aiText), 150)
    } catch (err) {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(), role: 'assistant', isError: true, timestamp: new Date(),
        content: "Sorry, I encountered an error. Please try again. For urgent symptoms, seek medical care immediately."
      }])
      toast.error('Could not reach AI service')
    } finally { setLoading(false) }
  }

  return (
    <div className="max-w-3xl mx-auto h-[calc(100vh-7rem)] flex flex-col gap-3 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-display text-2xl text-gray-900">AI Health Assistant</h1>
            <p className="text-xs text-gray-400">Powered by Google Gemini · Voice + Text</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => { setVoiceEnabled(v => !v); if (isSpeaking) stopSpeaking() }}
            className={`p-2.5 rounded-xl border-2 transition-all ${voiceEnabled ? 'border-indigo-400 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-400'}`}>
            {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
          <button onClick={() => setShowSettings(s => !s)}
            className={`p-2.5 rounded-xl border-2 transition-all ${showSettings ? 'border-indigo-400 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-400'}`}>
            <Settings className="w-4 h-4" />
          </button>
          <button onClick={() => { stopSpeaking(); setMessages([{ id: Date.now().toString(), role: 'assistant', timestamp: new Date(), content: "Chat cleared. How can I help you?" }]) }}
            className="p-2.5 rounded-xl border-2 border-gray-200 text-gray-400 hover:border-red-300 hover:text-red-500 transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showSettings && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-3">
              <p className="text-sm font-bold text-gray-700">🎙️ Voice Style</p>
              <div className="grid grid-cols-3 gap-2">
                {VOICE_PRESETS.map(p => (
                  <button key={p.id} onClick={() => setVoicePreset(p)}
                    className={`p-2.5 rounded-xl border-2 text-left transition-all ${voicePreset.id === p.id ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'}`}>
                    <p className="text-xs font-bold text-gray-900">{p.label}</p>
                  </button>
                ))}
              </div>
              {availableVoices.length > 0 && (
                <select className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" value={selectedVoice?.name || ''}
                  onChange={e => setSelectedVoice(availableVoices.find(v => v.name === e.target.value))}>
                  {availableVoices.slice(0, 12).map(v => <option key={v.name} value={v.name}>{v.name}</option>)}
                </select>
              )}
              <button onClick={() => speak("Voice output is working. I am your OncoSense AI health assistant.")}
                className="w-full border-2 border-indigo-300 text-indigo-700 py-2 rounded-xl text-sm font-semibold hover:bg-indigo-50">
                🔊 Test Voice
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 flex items-start gap-2">
        <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-amber-700"><strong>AI Assistant</strong> — For cancer awareness only. Does NOT diagnose. Always consult a healthcare provider.</p>
      </div>

      <div className="flex-1 overflow-y-auto bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-4">
        {messages.length === 1 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
            <p className="col-span-full text-xs text-gray-400 font-medium">💡 Suggested questions:</p>
            {SUGGESTIONS.map((q, i) => (
              <button key={i} onClick={() => sendMessage(q)}
                className="text-left text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 px-3 py-2.5 rounded-xl transition-all">
                {q}
              </button>
            ))}
          </div>
        )}

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
                  isUser ? 'bg-indigo-600 text-white rounded-br-sm'
                  : msg.isError ? 'bg-red-50 text-red-800 border border-red-200 rounded-bl-sm'
                  : 'bg-gray-50 text-gray-900 border border-gray-100 rounded-bl-sm'}`}>
                  {msg.content}
                </div>
                <div className={`flex items-center gap-2 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                  <span className="text-xs text-gray-400">{msg.timestamp?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  {!isUser && !msg.isError && ttsSupported && (
                    <button onClick={() => isSpeaking ? stopSpeaking() : speak(msg.content)}
                      className="text-xs text-gray-400 hover:text-indigo-600 flex items-center gap-1">
                      {isSpeaking ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                      {isSpeaking ? 'Stop' : 'Listen'}
                    </button>
                  )}
                </div>
              </div>
              {isUser && <div className="w-8 h-8 bg-gray-200 rounded-xl flex-shrink-0 flex items-center justify-center mt-1"><User className="w-4 h-4 text-gray-500" /></div>}
            </motion.div>
          )
        })}

        {loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-4 h-4 text-white animate-pulse" />
            </div>
            <div className="bg-gray-50 border border-gray-100 px-4 py-3 rounded-2xl rounded-bl-sm flex items-center gap-2">
              {[0,1,2].map(i => <div key={i} className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: `${i*0.15}s` }} />)}
              <span className="text-xs text-gray-400 ml-1">Thinking…</span>
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <AnimatePresence>
        {isSpeaking && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
            className="flex items-center justify-between bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-2.5">
            <div className="flex items-center gap-3">
              <div className="flex gap-0.5 items-end h-5">
                {[1,2,3,4,5].map(i => <div key={i} className="w-1 bg-indigo-500 rounded-full animate-pulse" style={{ height: `${8+(i%3)*5}px`, animationDelay: `${i*0.1}s` }} />)}
              </div>
              <span className="text-sm font-semibold text-indigo-700">AI is speaking…</span>
            </div>
            <button onClick={stopSpeaking} className="text-xs text-indigo-600 font-semibold flex items-center gap-1">
              <VolumeX className="w-3 h-3" /> Stop
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-white border border-gray-200 rounded-2xl p-3 shadow-sm">
        <AnimatePresence>
          {interimText && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mb-2">
              <div className="px-3 py-2 bg-indigo-50 rounded-xl border border-indigo-200">
                <p className="text-sm text-indigo-600 italic flex items-center gap-2"><Mic className="w-3 h-3 animate-pulse" /> {interimText}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div className="flex items-end gap-2">
          {sttSupported && (
            <button onClick={toggleMic}
              className={`p-3 rounded-xl border-2 flex-shrink-0 transition-all ${isListening ? 'border-red-400 bg-red-50 text-red-600 animate-pulse' : 'border-gray-200 text-gray-400 hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50'}`}>
              {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>
          )}
          <textarea value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
            placeholder={isListening ? '🎙️ Listening… speak now' : 'Type a question or tap 🎙️ to speak…'}
            rows={1} className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none min-h-[44px] max-h-32"
            onInput={e => { e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 128) + 'px' }} />
          {ttsSupported && messages.length > 1 && (
            <button onClick={() => { const last = [...messages].reverse().find(m => m.role === 'assistant'); if (last) speak(last.content) }}
              disabled={isSpeaking} className="p-3 rounded-xl border-2 border-gray-200 text-gray-400 hover:border-indigo-400 hover:text-indigo-600 transition-all disabled:opacity-40">
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
          <button onClick={() => sendMessage()} disabled={!input.trim() || loading}
            className="p-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all disabled:opacity-40">
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
