import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Mic, MicOff, Volume2, VolumeX, Sparkles, User, AlertCircle, RefreshCw, ChevronRight } from 'lucide-react'
import toast from 'react-hot-toast'

// ── System prompt for highly accurate AI responses
const SYSTEM = `You are OncoSense AI, a compassionate and expert health assistant specialising in cancer awareness for Kenya and Africa.

Your expertise covers:
- All major cancers: cervical, breast, lung, colorectal, prostate, oral, liver, oesophageal, lymphoma, leukaemia, skin cancer
- Risk factors specific to Kenya: HIV/AIDS, HPV, aflatoxin exposure, smoking, alcohol
- Kenya cancer screening programmes: free VIA at county hospitals, Pap smear, HPV vaccine for girls 10-14
- SHA and NHIF coverage for cancer treatment
- KNH, MTRH, Coast General oncology services

RULES:
1. NEVER diagnose — always say "this requires professional evaluation"
2. Give practical, actionable advice relevant to Kenya
3. For red-flag symptoms → URGENTLY direct to nearest county referral hospital
4. Be warm, clear, concise (3-5 sentences unless listing is needed)
5. Mention free screening options when relevant
6. End every response: "Please consult a healthcare provider for personalised medical advice."

Red-flag symptoms requiring URGENT care:
- Unexplained weight loss >5kg in 2 months
- Any persistent bleeding (rectal, vaginal, coughing blood, blood in urine)
- New lump or swelling anywhere that is growing
- Non-healing sore or ulcer > 3 weeks
- Persistent difficulty swallowing
- Severe persistent abdominal pain`

const SUGGESTIONS = [
  'What are early signs of cervical cancer?',
  'How do I perform a breast self-examination?',
  'Is VIA screening available for free in Kenya?',
  'What lifestyle changes reduce cancer risk?',
  'My mother had breast cancer — am I at risk?',
  'What does unexplained weight loss mean?',
  'How does SHA cover cancer treatment?',
  'When should I see a doctor about a persistent cough?',
]

function getToken() {
  try {
    const s = localStorage.getItem('oncosense-auth')
    return s ? JSON.parse(s)?.state?.token : null
  } catch { return null }
}

export default function AIConsultant() {
  const [messages, setMessages]     = useState([{
    id: '0', role: 'assistant', ts: new Date(),
    text: "Hello! I'm OncoSense AI, your cancer awareness assistant powered by Google Gemini.\n\nI can help with questions about cancer risk factors, symptoms, screening options available in Kenya, and healthy lifestyle choices.\n\nHow can I help you today?"
  }])
  const [input, setInput]           = useState('')
  const [loading, setLoading]       = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking]  = useState(false)
  const [voiceOn, setVoiceOn]        = useState(true)
  const [sttSupported, setSttSupported] = useState(false)
  const [interimText, setInterimText]   = useState('')

  const recRef   = useRef(null)
  const synthRef = useRef(null)
  const endRef   = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    if ('speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (SR) {
      setSttSupported(true)
      const rec = new SR()
      rec.continuous    = false
      rec.interimResults = true
      rec.lang          = 'en-US'
      rec.onstart  = () => setIsListening(true)
      rec.onend    = () => { setIsListening(false); setInterimText('') }
      rec.onerror  = (e) => { setIsListening(false); setInterimText(''); if (e.error !== 'no-speech') toast.error('Mic: ' + e.error) }
      rec.onresult = (e) => {
        let interim = '', final = ''
        for (let i = e.resultIndex; i < e.results.length; i++) {
          if (e.results[i].isFinal) final += e.results[i][0].transcript
          else interim += e.results[i][0].transcript
        }
        setInterimText(interim)
        if (final.trim()) { setInput(p => (p + ' ' + final).trim()); setInterimText('') }
      }
      recRef.current = rec
    }
    return () => { recRef.current?.abort(); synthRef.current?.cancel() }
  }, [])

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, loading])

  function speak(text) {
    if (!synthRef.current || !voiceOn || !text) return
    synthRef.current.cancel()
    const clean = text.replace(/\n+/g, '. ').replace(/[*_`#]/g, '').trim()
    const utt = new SpeechSynthesisUtterance(clean)
    utt.rate = 0.88; utt.pitch = 1.05; utt.volume = 0.95
    const voices = synthRef.current.getVoices()
    const fv = voices.find(v => v.lang.startsWith('en') && /female|samantha|karen|victoria|kate/i.test(v.name))
    if (fv) utt.voice = fv
    utt.onstart = () => setIsSpeaking(true)
    utt.onend   = () => setIsSpeaking(false)
    utt.onerror = () => setIsSpeaking(false)
    synthRef.current.speak(utt)
  }

  function stopSpeaking() { synthRef.current?.cancel(); setIsSpeaking(false) }

  function toggleMic() {
    if (!sttSupported) { toast.error('Speech recognition requires Chrome or Edge'); return }
    if (isListening) { recRef.current?.stop() }
    else { stopSpeaking(); try { recRef.current?.start() } catch { toast.error('Could not start mic') } }
  }

  async function sendMessage(overrideText) {
    const text = (overrideText || input).trim()
    if (!text || loading) return
    stopSpeaking()
    setInput('')
    setInterimText('')

    const userMsg = { id: 'u' + Date.now(), role: 'user', ts: new Date(), text }
    setMessages(prev => [...prev, userMsg])
    setLoading(true)

    try {
      const history = messages.slice(-20).map(m => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.text
      }))
      history.push({ role: 'user', content: text })

      let aiText = null

      // PRIMARY: backend proxy (uses server-side GEMINI_API_KEY)
      const token = getToken()
      if (token) {
        try {
          const r = await fetch('/api/ai-chat/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
            body: JSON.stringify({ messages: history }),
            signal: AbortSignal.timeout(25000)
          })
          if (r.ok) {
            const d = await r.json()
            if (d.text) aiText = d.text
          } else {
            const err = await r.json().catch(() => ({}))
            console.warn('AI backend error:', r.status, err)
          }
        } catch (e) {
          console.warn('AI backend fetch error:', e.message)
        }
      }

      // FALLBACK: direct Gemini (requires VITE_GEMINI_API_KEY at build time)
      if (!aiText) {
        const key = import.meta.env.VITE_GEMINI_API_KEY
        if (key) {
          try {
            let contents = history
              .filter(m => m.content && m.content.trim())
              .map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] }))
            while (contents.length > 0 && contents[0].role === 'model') contents = contents.slice(1)
            // Merge consecutive same roles
            const merged = []
            for (const c of contents) {
              if (merged.length > 0 && merged[merged.length-1].role === c.role) {
                merged[merged.length-1].parts[0].text += '\n' + c.parts[0].text
              } else {
                merged.push({ role: c.role, parts: [{ text: c.parts[0].text }] })
              }
            }
            const gr = await fetch(
              'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + key,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  systemInstruction: { parts: [{ text: SYSTEM }] },
                  contents: merged.slice(-20),
                  generationConfig: { maxOutputTokens: 700, temperature: 0.72 }
                }),
                signal: AbortSignal.timeout(20000)
              }
            )
            if (gr.ok) {
              const gd = await gr.json()
              aiText = gd?.candidates?.[0]?.content?.parts?.map(p => p.text).join('') || null
            }
          } catch (e) {
            console.warn('Direct Gemini error:', e.message)
          }
        }
      }

      if (!aiText) {
        aiText = "I'm having trouble reaching the AI service. This is usually caused by:\n• The GEMINI_API_KEY not being set on the server\n• A temporary connection issue\n\nPlease try again in a moment. For urgent health concerns, please visit your nearest county referral hospital."
      }

      const aiMsg = { id: 'a' + Date.now(), role: 'assistant', ts: new Date(), text: aiText }
      setMessages(prev => [...prev, aiMsg])
      if (voiceOn) setTimeout(() => speak(aiText), 200)

    } catch (err) {
      setMessages(prev => [...prev, {
        id: 'e' + Date.now(), role: 'assistant', isError: true, ts: new Date(),
        text: 'Sorry, an error occurred. Please try again.'
      }])
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  return (
    <div className="max-w-3xl mx-auto h-[calc(100vh-8rem)] flex flex-col gap-3">

      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-2xl flex items-center justify-center shadow">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-display text-2xl text-gray-900">AI Health Assistant</h1>
            <p className="text-xs text-gray-400">Powered by Google Gemini · Cancer awareness for Kenya</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button type="button"
            onClick={() => { setVoiceOn(v => !v); stopSpeaking() }}
            className={'p-2.5 rounded-xl border-2 transition-all ' + (voiceOn ? 'border-indigo-400 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-400')}>
            {voiceOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
          <button type="button"
            onClick={() => {
              stopSpeaking()
              setMessages([{ id: '0', role: 'assistant', ts: new Date(), text: "Chat cleared. How can I help you?" }])
            }}
            className="p-2.5 rounded-xl border-2 border-gray-200 text-gray-400 hover:border-red-300 hover:text-red-500 transition-all text-xs font-semibold">
            Clear
          </button>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2 flex-shrink-0">
        <p className="text-xs text-amber-700">
          <strong>Educational only</strong> — OncoSense AI does not diagnose. Always consult a healthcare provider for medical advice.
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-4">

        {/* Suggestions */}
        {messages.length === 1 && (
          <div className="space-y-2">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Suggested questions</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {SUGGESTIONS.map(q => (
                <button key={q} type="button"
                  onClick={() => sendMessage(q)}
                  className="text-left text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 px-3 py-2.5 rounded-xl transition-all flex items-center gap-2">
                  <ChevronRight className="w-3 h-3 flex-shrink-0" />
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
            <motion.div key={msg.id}
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              className={'flex gap-3 ' + (isUser ? 'justify-end' : 'justify-start')}>
              {!isUser && (
                <div className={'w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center mt-1 ' + (msg.isError ? 'bg-red-100' : 'bg-gradient-to-br from-indigo-500 to-blue-600')}>
                  {msg.isError
                    ? <AlertCircle className="w-4 h-4 text-red-500" />
                    : <Sparkles className="w-4 h-4 text-white" />
                  }
                </div>
              )}
              <div className={'max-w-xl flex flex-col gap-1 ' + (isUser ? 'items-end' : 'items-start')}>
                <div className={'px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ' + (
                  isUser ? 'bg-indigo-600 text-white rounded-br-sm'
                  : msg.isError ? 'bg-red-50 text-red-800 border border-red-200 rounded-bl-sm'
                  : 'bg-gray-50 text-gray-900 border border-gray-100 rounded-bl-sm'
                )}>
                  {msg.text}
                </div>
                <div className={'flex items-center gap-2 ' + (isUser ? 'flex-row-reverse' : '')}>
                  <span className="text-xs text-gray-400">
                    {msg.ts?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {!isUser && !msg.isError && (
                    <button type="button"
                      onClick={() => isSpeaking ? stopSpeaking() : speak(msg.text)}
                      className="text-xs text-gray-400 hover:text-indigo-600 flex items-center gap-0.5 transition-all">
                      {isSpeaking ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
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

        {/* Thinking */}
        {loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-4 h-4 text-white animate-pulse" />
            </div>
            <div className="bg-gray-50 border border-gray-100 px-4 py-3 rounded-2xl rounded-bl-sm flex items-center gap-2">
              {[0,1,2].map(i => (
                <div key={i} className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"
                  style={{ animationDelay: i * 0.15 + 's' }} />
              ))}
              <span className="text-xs text-gray-400 ml-1">Gemini thinking...</span>
            </div>
          </motion.div>
        )}

        {/* Speaking indicator */}
        <AnimatePresence>
          {isSpeaking && (
            <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="flex items-center justify-between bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-2">
              <div className="flex items-center gap-2">
                <div className="flex gap-0.5 items-end h-4">
                  {[1,2,3,4,5].map(i => (
                    <div key={i} className="w-1 bg-indigo-500 rounded-full animate-pulse"
                      style={{ height: (5 + (i%3)*4) + 'px', animationDelay: i*0.1 + 's' }} />
                  ))}
                </div>
                <span className="text-xs font-semibold text-indigo-700">AI speaking...</span>
              </div>
              <button type="button" onClick={stopSpeaking} className="text-xs text-indigo-600 font-bold hover:text-indigo-800">
                Stop
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={endRef} />
      </div>

      {/* Input */}
      <div className="bg-white border border-gray-200 rounded-2xl p-3 shadow-sm flex-shrink-0">
        <AnimatePresence>
          {interimText && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              className="mb-2 overflow-hidden">
              <div className="px-3 py-2 bg-indigo-50 rounded-xl border border-indigo-200">
                <p className="text-sm text-indigo-600 italic flex items-center gap-2">
                  <Mic className="w-3 h-3 animate-pulse" />{interimText}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div className="flex items-end gap-2">
          {sttSupported && (
            <button type="button" onClick={toggleMic}
              className={'p-3 rounded-xl border-2 flex-shrink-0 transition-all ' + (isListening
                ? 'border-red-400 bg-red-50 text-red-600 animate-pulse'
                : 'border-gray-200 text-gray-400 hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50')}>
              {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>
          )}
          <textarea ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder={isListening ? '🎙️ Listening... speak now' : 'Ask a health question or tap 🎙️ to speak...'}
            rows={1}
            className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none min-h-[44px] max-h-32"
            onInput={e => { e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 128) + 'px' }}
          />
          {messages.length > 1 && (
            <button type="button" disabled={isSpeaking}
              onClick={() => { const last = [...messages].reverse().find(m => m.role === 'assistant'); if (last) speak(last.text) }}
              className="p-3 rounded-xl border-2 border-gray-200 text-gray-400 hover:border-indigo-400 hover:text-indigo-600 transition-all disabled:opacity-40">
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
          <button type="button"
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
            className="p-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all disabled:opacity-40 flex-shrink-0">
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
