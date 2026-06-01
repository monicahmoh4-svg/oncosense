import React, { useState, useEffect, useRef } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { io } from 'socket.io-client'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Send, Video, VideoOff, Mic, MicOff, PhoneOff,
  User, Sparkles, Volume2, VolumeX, RefreshCw,
  Building2, Phone, MapPin, Navigation, Info,
  MessageCircle, ChevronRight
} from 'lucide-react'
import { consultationService } from '../services/api'
import toast from 'react-hot-toast'

var GEMINI_SYSTEM = [
  'You are OncoSense AI, a compassionate and knowledgeable health assistant.',
  'You specialise in cancer awareness, risk factors, early detection, and screening guidance.',
  'RULES: Never diagnose any condition. Always clarify your responses are for educational purposes only.',
  'Encourage professional consultation. Keep responses clear and concise (2-4 sentences).',
  'For red-flag symptoms (coughing blood, rectal bleeding, unexplained weight loss, new lumps, non-healing sores) urgently recommend immediate medical evaluation.',
  'Use simple language accessible to all literacy levels.',
  'End every response with a brief reminder to consult a qualified healthcare provider.'
].join(' ')

function getToken() {
  try { return JSON.parse(localStorage.getItem('oncosense-auth') || '{}')?.state?.token } catch { return null }
}
function getUserId() {
  try { return JSON.parse(localStorage.getItem('oncosense-auth') || '{}')?.state?.user?.id } catch { return null }
}
function getUserName() {
  try {
    var u = JSON.parse(localStorage.getItem('oncosense-auth') || '{}')?.state?.user
    return u ? (u.first_name + ' ' + u.last_name) : 'You'
  } catch { return 'You' }
}

async function callGeminiAI(messages) {
  var token = getToken()
  if (token) {
    try {
      var r = await fetch('/api/ai-chat/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
        body: JSON.stringify({ messages: messages })
      })
      if (r.ok) {
        var d = await r.json()
        if (d.text) return d.text
      }
    } catch(e) {}
  }
  var key = import.meta.env.VITE_GEMINI_API_KEY || ''
  if (!key) return null
  var contents = messages.slice(-12).filter(function(m) { return m.role !== 'system' }).map(function(m) {
    return { role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] }
  })
  if (contents.length > 0 && contents[0].role === 'model') contents = contents.slice(1)
  var r2 = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + key, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: GEMINI_SYSTEM }] },
      contents: contents,
      generationConfig: { maxOutputTokens: 700, temperature: 0.75 }
    })
  })
  var data = await r2.json()
  return data?.candidates?.[0]?.content?.parts?.map(function(p) { return p.text }).join('') || null
}

var AI_SUGGESTIONS = [
  'What are signs of cervical cancer?',
  'How can I reduce my cancer risk?',
  'When should I get a mammogram?',
  'What is a Pap smear test?',
]

export default function ConsultationRoom() {
  var params   = useParams()
  var location = useLocation()
  var navigate = useNavigate()
  var id       = params.id

  var searchParams  = new URLSearchParams(location.search)
  var clinicNameUrl = searchParams.get('clinic') || ''
  var consultTypeUrl = searchParams.get('type') || 'chat'

  var [consultation, setConsultation] = useState(null)
  var [activeTab, setActiveTab]       = useState('hospital')
  var [hospitalMsgs, setHospitalMsgs] = useState([])
  var [aiMsgs, setAiMsgs]             = useState([{
    id: 'ai-0', role: 'assistant', timestamp: new Date(),
    content: 'Hello! I am OncoSense AI, your health assistant powered by Google Gemini. While you wait for the hospital attendant, I can answer questions about cancer screening, risk factors, symptoms, and healthy lifestyle. How can I help you today?'
  }])
  var [hospitalInput, setHospitalInput] = useState('')
  var [aiInput, setAiInput]             = useState('')
  var [socket, setSocket]               = useState(null)
  var [aiLoading, setAiLoading]         = useState(false)
  var [attendantTyping, setAttendantTyping] = useState(false)
  var [inCall, setInCall]               = useState(false)
  var [videoOn, setVideoOn]             = useState(true)
  var [audioOn, setAudioOn]             = useState(true)
  var [voiceEnabled, setVoiceEnabled]   = useState(true)
  var [isSpeaking, setIsSpeaking]       = useState(false)
  var [showHospitalInfo, setShowHospitalInfo] = useState(false)

  var localVideoRef  = useRef(null)
  var remoteVideoRef = useRef(null)
  var peerRef        = useRef(null)
  var streamRef      = useRef(null)
  var hospitalEndRef = useRef(null)
  var aiEndRef       = useRef(null)
  var synthRef       = useRef(null)

  useEffect(function() {
    if ('speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis
      window.speechSynthesis.onvoiceschanged = function() {}
    }
  }, [])

  useEffect(function() {
    consultationService.getById(id)
      .then(function(r) { setConsultation(r.data.consultation) })
      .catch(function() {})
    consultationService.getMessages(id)
      .then(function(r) { setHospitalMsgs(r.data.messages || []) })
      .catch(function() {})

    var token = getToken()
    var sock  = io('/', { auth: { token: token }, transports: ['websocket', 'polling'] })
    setSocket(sock)
    sock.emit('join_consultation', { consultation_id: id })
    sock.on('new_message', function(msg) {
      setHospitalMsgs(function(prev) { return prev.concat([msg]) })
    })
    sock.on('user_typing', function() {
      setAttendantTyping(true)
      setTimeout(function() { setAttendantTyping(false) }, 2500)
    })
    sock.on('webrtc_offer',         handleOffer)
    sock.on('webrtc_answer',        handleAnswer)
    sock.on('webrtc_ice_candidate', handleICE)
    sock.on('call_ended',           endCall)
    sock.on('incoming_call',        function() { toast('Incoming video call from attendant', { icon: 'video' }) })

    return function() { sock.disconnect(); endCall() }
  }, [id])

  useEffect(function() {
    if (hospitalEndRef.current) hospitalEndRef.current.scrollIntoView({ behavior: 'smooth' })
  }, [hospitalMsgs, attendantTyping])

  useEffect(function() {
    if (aiEndRef.current) aiEndRef.current.scrollIntoView({ behavior: 'smooth' })
  }, [aiMsgs, aiLoading])

  function speak(text) {
    if (!synthRef.current || !voiceEnabled || !text) return
    synthRef.current.cancel()
    var clean = text.replace(/[*_`#]/g, '').replace(/\n+/g, '. ').trim()
    var utt = new SpeechSynthesisUtterance(clean)
    utt.rate = 0.88; utt.pitch = 1.05; utt.volume = 0.95
    var voices = synthRef.current.getVoices()
    var femaleVoice = voices.find(function(v) {
      return v.lang.startsWith('en') && /female|samantha|karen|victoria|kate|susan/i.test(v.name)
    })
    if (femaleVoice) utt.voice = femaleVoice
    utt.onstart = function() { setIsSpeaking(true) }
    utt.onend   = function() { setIsSpeaking(false) }
    utt.onerror = function() { setIsSpeaking(false) }
    synthRef.current.speak(utt)
  }

  function stopSpeaking() {
    if (synthRef.current) synthRef.current.cancel()
    setIsSpeaking(false)
  }

  function sendHospitalMsg() {
    if (!hospitalInput.trim() || !socket) return
    socket.emit('send_message', { consultation_id: id, content: hospitalInput.trim() })
    setHospitalInput('')
  }

  async function sendAiMsg(overrideText) {
    var text = (overrideText || aiInput).trim()
    if (!text || aiLoading) return
    stopSpeaking()
    setAiInput('')
    var userMsg = { id: 'u-' + Date.now(), role: 'user', content: text, timestamp: new Date() }
    setAiMsgs(function(prev) { return prev.concat([userMsg]) })
    setAiLoading(true)
    try {
      var history = aiMsgs.slice(-12).concat([userMsg])
      var aiText = await callGeminiAI(history)
      if (!aiText) {
        aiText = 'I am having trouble connecting right now. Please try again in a moment. For urgent health concerns, please speak directly with the hospital attendant.'
      }
      var aiMsg = { id: 'a-' + Date.now(), role: 'assistant', content: aiText, timestamp: new Date() }
      setAiMsgs(function(prev) { return prev.concat([aiMsg]) })
      if (voiceEnabled) setTimeout(function() { speak(aiText) }, 200)
    } catch(err) {
      var errMsg = { id: 'e-' + Date.now(), role: 'assistant', isError: true, timestamp: new Date(),
        content: 'Sorry, I encountered an error. Please try again. For urgent concerns, consult the hospital attendant.' }
      setAiMsgs(function(prev) { return prev.concat([errMsg]) })
      toast.error('AI error — please try again')
    } finally {
      setAiLoading(false)
    }
  }

  function createPC() {
    var pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] })
    peerRef.current = pc
    pc.onicecandidate = function(e) {
      if (e.candidate && socket) socket.emit('webrtc_ice_candidate', { consultation_id: id, candidate: e.candidate })
    }
    pc.ontrack = function(e) {
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = e.streams[0]
    }
    return pc
  }

  async function startCall() {
    try {
      var stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      streamRef.current = stream
      if (localVideoRef.current) localVideoRef.current.srcObject = stream
      var pc = createPC()
      stream.getTracks().forEach(function(t) { pc.addTrack(t, stream) })
      var offer = await pc.createOffer()
      await pc.setLocalDescription(offer)
      if (socket) {
        socket.emit('webrtc_offer', { consultation_id: id, offer: offer })
        socket.emit('call_started', { consultation_id: id })
      }
      setInCall(true)
      setActiveTab('video')
    } catch(e) {
      toast.error('Could not access camera or microphone. Please check permissions.')
    }
  }

  async function handleOffer(data) {
    if (!peerRef.current) return
    await peerRef.current.setRemoteDescription(data.offer)
    var answer = await peerRef.current.createAnswer()
    await peerRef.current.setLocalDescription(answer)
    if (socket) socket.emit('webrtc_answer', { consultation_id: id, answer: answer })
  }
  async function handleAnswer(data) {
    if (peerRef.current) await peerRef.current.setRemoteDescription(data.answer)
  }
  async function handleICE(data) {
    try { if (peerRef.current) await peerRef.current.addIceCandidate(data.candidate) } catch(e) {}
  }
  function endCall() {
    if (streamRef.current) streamRef.current.getTracks().forEach(function(t) { t.stop() })
    if (peerRef.current) { peerRef.current.close(); peerRef.current = null }
    streamRef.current = null
    setInCall(false)
    if (socket) socket.emit('call_ended', { consultation_id: id })
  }
  function toggleVideo() {
    var t = streamRef.current && streamRef.current.getVideoTracks()[0]
    if (t) { t.enabled = !videoOn; setVideoOn(function(v) { return !v }) }
  }
  function toggleAudio() {
    var t = streamRef.current && streamRef.current.getAudioTracks()[0]
    if (t) { t.enabled = !audioOn; setAudioOn(function(v) { return !v }) }
  }

  var myId      = getUserId()
  var myName    = getUserName()
  var hospName  = clinicNameUrl || (consultation ? (consultation.clinician_first ? consultation.clinician_first + ' ' + consultation.clinician_last : 'Hospital') : 'Hospital')

  function mapsUrl(lat, lng) { return 'https://www.google.com/maps/dir/?api=1&destination=' + lat + ',' + lng }

  return (
    <div className="max-w-5xl mx-auto space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl text-gray-900">Consultation Room</h1>
          <div className="flex items-center gap-2 mt-1">
            <Building2 className="w-4 h-4 text-brand-600" />
            <span className="text-gray-700 text-sm font-semibold">{hospName}</span>
            {consultation && (
              <span className={'text-xs font-semibold px-2 py-0.5 rounded-full ' + (consultation.status === 'active' ? 'bg-brand-100 text-brand-700' : 'bg-amber-100 text-amber-700')}>
                {consultation.status}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {consultation && (
            <button
              onClick={function() { setShowHospitalInfo(function(v) { return !v }) }}
              className={'p-2.5 rounded-xl border-2 transition-all ' + (showHospitalInfo ? 'border-brand-400 bg-brand-50 text-brand-700' : 'border-gray-200 text-gray-400 hover:border-gray-300')}>
              <Info className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={function() { navigate('/consultations') }}
            className="text-xs text-gray-400 hover:text-gray-600 underline">
            Back
          </button>
        </div>
      </div>

      {/* Hospital info panel */}
      <AnimatePresence>
        {showHospitalInfo && consultation && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden">
            <div className="bg-brand-50 border border-brand-200 rounded-2xl p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-bold text-brand-900">{hospName}</p>
                  <p className="text-sm text-brand-700">Attendant: {consultation.clinician_first || 'On duty'} {consultation.clinician_last || ''}</p>
                </div>
                {consultation.phone && (
                  <a href={'tel:' + consultation.phone}
                    className="flex items-center gap-1 bg-brand-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-brand-700 transition-all">
                    <Phone className="w-3.5 h-3.5" /> Call
                  </a>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-brand-600 font-semibold uppercase tracking-wider mb-1">Consultation Type</p>
                  <p className="text-brand-800 capitalize">{consultTypeUrl}</p>
                </div>
                <div>
                  <p className="text-xs text-brand-600 font-semibold uppercase tracking-wider mb-1">Status</p>
                  <p className="text-brand-800 capitalize">{consultation.status}</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid lg:grid-cols-5 gap-4" style={{ height: '560px' }}>

        {/* Left: Video panel */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 overflow-hidden flex flex-col">
          <div className="bg-gray-900 flex-1 relative" style={{ minHeight: '320px' }}>
            {inCall ? (
              <div className="w-full h-full relative">
                <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
                <video ref={localVideoRef} autoPlay playsInline muted
                  className="absolute bottom-3 right-3 w-28 h-20 object-cover rounded-xl border-2 border-white shadow-lg" />
                <div className="absolute top-3 left-3 bg-black/50 text-white text-xs px-2 py-1 rounded-lg">
                  Live
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-white px-4">
                  <div className="w-20 h-20 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Building2 className="w-10 h-10 text-gray-400" />
                  </div>
                  <p className="text-gray-300 font-medium">{hospName}</p>
                  <p className="text-gray-500 text-xs mt-1">Video not started</p>
                  <p className="text-gray-600 text-xs mt-1">Start a video call to see the attendant</p>
                </div>
              </div>
            )}
          </div>

          {/* Video controls */}
          <div className="p-3 flex items-center justify-center gap-3 bg-gray-800">
            {!inCall ? (
              <button onClick={startCall}
                className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all">
                <Video className="w-4 h-4" /> Start Video Call
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <button onClick={toggleAudio}
                  className={'p-2.5 rounded-full text-white transition-all ' + (audioOn ? 'bg-gray-600 hover:bg-gray-500' : 'bg-red-500 hover:bg-red-600')}>
                  {audioOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                </button>
                <button onClick={toggleVideo}
                  className={'p-2.5 rounded-full text-white transition-all ' + (videoOn ? 'bg-gray-600 hover:bg-gray-500' : 'bg-red-500 hover:bg-red-600')}>
                  {videoOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                </button>
                <button onClick={endCall}
                  className="p-2.5 bg-red-600 hover:bg-red-700 text-white rounded-full transition-all">
                  <PhoneOff className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right: Chat panel with tabs */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-100 flex flex-col overflow-hidden">

          {/* Tab bar */}
          <div className="flex border-b border-gray-100 flex-shrink-0">
            <button
              onClick={function() { setActiveTab('hospital') }}
              className={'flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold transition-all border-b-2 ' + (activeTab === 'hospital' ? 'text-brand-700 border-brand-600 bg-brand-50' : 'text-gray-500 border-transparent hover:text-gray-700 hover:bg-gray-50')}>
              <Building2 className="w-4 h-4" />
              Hospital Chat
              {attendantTyping && <span className="w-2 h-2 bg-brand-500 rounded-full animate-pulse" />}
            </button>
            <button
              onClick={function() { setActiveTab('ai') }}
              className={'flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold transition-all border-b-2 ' + (activeTab === 'ai' ? 'text-indigo-700 border-indigo-600 bg-indigo-50' : 'text-gray-500 border-transparent hover:text-gray-700 hover:bg-gray-50')}>
              <Sparkles className="w-4 h-4" />
              AI Assistant
            </button>
          </div>

          {/* HOSPITAL CHAT TAB */}
          {activeTab === 'hospital' && (
            <div className="flex flex-col flex-1 overflow-hidden">
              <div className="px-4 py-2 bg-brand-50 border-b border-brand-100 flex-shrink-0">
                <p className="text-xs text-brand-700 font-semibold">{hospName}</p>
                <p className="text-xs text-brand-500">Real-time chat with hospital staff · Messages are private</p>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {hospitalMsgs.length === 0 && (
                  <div className="text-center py-10">
                    <Building2 className="w-12 h-12 text-gray-100 mx-auto mb-3" />
                    <p className="text-gray-400 font-medium text-sm">Waiting for hospital attendant</p>
                    <p className="text-gray-300 text-xs mt-1">Your message will be received by {hospName}</p>
                    <p className="text-gray-300 text-xs mt-1">While you wait, try the AI Assistant tab</p>
                  </div>
                )}
                {hospitalMsgs.map(function(msg, i) {
                  var isMe = msg.sender_id === myId
                  return (
                    <motion.div key={msg.id || i}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={'flex gap-2 ' + (isMe ? 'justify-end' : 'justify-start')}>
                      {!isMe && (
                        <div className="w-7 h-7 bg-brand-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                          <Building2 className="w-3.5 h-3.5 text-brand-600" />
                        </div>
                      )}
                      <div className={'max-w-xs flex flex-col gap-1 ' + (isMe ? 'items-end' : 'items-start')}>
                        {!isMe && <span className="text-xs text-gray-500 px-1">{msg.first_name || 'Attendant'}</span>}
                        <div className={'px-4 py-2.5 rounded-2xl text-sm leading-relaxed ' + (isMe ? 'bg-brand-600 text-white rounded-br-sm' : 'bg-gray-100 text-gray-900 rounded-bl-sm')}>
                          {msg.content}
                        </div>
                        <span className="text-xs text-gray-400 px-1">
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      {isMe && (
                        <div className="w-7 h-7 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                          <User className="w-3.5 h-3.5 text-gray-500" />
                        </div>
                      )}
                    </motion.div>
                  )
                })}
                {attendantTyping && (
                  <div className="flex gap-2 justify-start">
                    <div className="w-7 h-7 bg-brand-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-3.5 h-3.5 text-brand-600" />
                    </div>
                    <div className="bg-gray-100 px-4 py-2.5 rounded-2xl rounded-bl-sm flex gap-1 items-center">
                      {[0,1,2].map(function(i) {
                        return <div key={i} className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: (i * 0.1) + 's' }} />
                      })}
                      <span className="text-xs text-gray-400 ml-1">Attendant typing...</span>
                    </div>
                  </div>
                )}
                <div ref={hospitalEndRef} />
              </div>

              <div className="p-3 border-t border-gray-100 flex gap-2 flex-shrink-0">
                <input
                  type="text"
                  value={hospitalInput}
                  onChange={function(e) { setHospitalInput(e.target.value) }}
                  onKeyDown={function(e) { if (e.key === 'Enter') sendHospitalMsg() }}
                  onFocus={function() { if (socket) socket.emit('typing', { consultation_id: id }) }}
                  placeholder="Message hospital attendant..."
                  className="flex-1 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                />
                <button onClick={sendHospitalMsg} disabled={!hospitalInput.trim()}
                  className="w-10 h-10 bg-brand-600 hover:bg-brand-700 text-white rounded-xl flex items-center justify-center transition-all disabled:opacity-40">
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* AI ASSISTANT TAB */}
          {activeTab === 'ai' && (
            <div className="flex flex-col flex-1 overflow-hidden">
              {/* AI header */}
              <div className="px-4 py-2 bg-indigo-50 border-b border-indigo-100 flex items-center justify-between flex-shrink-0">
                <div>
                  <p className="text-xs text-indigo-700 font-semibold flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" /> OncoSense AI — Powered by Google Gemini
                  </p>
                  <p className="text-xs text-indigo-400">For awareness only · Not a diagnosis</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={function() { setVoiceEnabled(function(v) { return !v }); stopSpeaking() }}
                    title={voiceEnabled ? 'Mute voice' : 'Enable voice'}
                    className={'p-1.5 rounded-lg transition-all ' + (voiceEnabled ? 'bg-indigo-100 text-indigo-600' : 'text-gray-400 hover:bg-gray-100')}>
                    {voiceEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={function() {
                      var last = aiMsgs.slice().reverse().find(function(m) { return m.role === 'assistant' && !m.isError })
                      if (last) speak(last.content)
                    }}
                    disabled={isSpeaking}
                    title="Replay last response"
                    className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-all disabled:opacity-40">
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Speaking indicator */}
              <AnimatePresence>
                {isSpeaking && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden">
                    <div className="mx-3 mt-2 flex items-center justify-between bg-indigo-50 border border-indigo-200 rounded-xl px-3 py-1.5">
                      <div className="flex items-center gap-2">
                        <div className="flex gap-0.5 items-end h-4">
                          {[1,2,3,4,5].map(function(i) {
                            return <div key={i} className="w-1 bg-indigo-500 rounded-full animate-pulse" style={{ height: (5 + (i % 3) * 4) + 'px', animationDelay: (i * 0.1) + 's' }} />
                          })}
                        </div>
                        <span className="text-xs font-medium text-indigo-700">AI speaking...</span>
                      </div>
                      <button onClick={stopSpeaking} className="text-xs text-indigo-600 font-semibold hover:text-indigo-800">Stop</button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">

                {/* Suggestion pills on first load */}
                {aiMsgs.length === 1 && (
                  <div className="space-y-2">
                    <p className="text-xs text-gray-400 font-medium">Suggested questions:</p>
                    {AI_SUGGESTIONS.map(function(q) {
                      return (
                        <button key={q}
                          onClick={function() { sendAiMsg(q) }}
                          className="w-full text-left text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 px-3 py-2.5 rounded-xl transition-all flex items-center gap-2">
                          <ChevronRight className="w-3 h-3 flex-shrink-0" />
                          {q}
                        </button>
                      )
                    })}
                  </div>
                )}

                {aiMsgs.map(function(msg, i) {
                  var isUser = msg.role === 'user'
                  return (
                    <motion.div key={msg.id || i}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={'flex gap-2 ' + (isUser ? 'justify-end' : 'justify-start')}>
                      {!isUser && (
                        <div className={'w-7 h-7 rounded-xl flex-shrink-0 flex items-center justify-center mt-1 ' + (msg.isError ? 'bg-red-100' : 'bg-gradient-to-br from-blue-500 to-indigo-600')}>
                          <Sparkles className="w-3.5 h-3.5 text-white" />
                        </div>
                      )}
                      <div className={'max-w-xs flex flex-col gap-1 ' + (isUser ? 'items-end' : 'items-start')}>
                        <div className={'px-3 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ' + (isUser ? 'bg-indigo-600 text-white rounded-br-sm' : msg.isError ? 'bg-red-50 text-red-800 border border-red-200 rounded-bl-sm' : 'bg-gray-50 text-gray-900 border border-gray-100 rounded-bl-sm')}>
                          {msg.content}
                        </div>
                        <div className={'flex items-center gap-1.5 ' + (isUser ? 'flex-row-reverse' : 'flex-row')}>
                          <span className="text-xs text-gray-400">
                            {msg.timestamp && new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {!isUser && !msg.isError && (
                            <button
                              onClick={function() { isSpeaking ? stopSpeaking() : speak(msg.content) }}
                              className="text-xs text-gray-400 hover:text-indigo-600 flex items-center gap-0.5 transition-all">
                              {isSpeaking ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                            </button>
                          )}
                        </div>
                      </div>
                      {isUser && (
                        <div className="w-7 h-7 bg-gray-200 rounded-xl flex-shrink-0 flex items-center justify-center mt-1">
                          <User className="w-3.5 h-3.5 text-gray-500" />
                        </div>
                      )}
                    </motion.div>
                  )
                })}

                {aiLoading && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2">
                    <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                      <Sparkles className="w-3.5 h-3.5 text-white animate-pulse" />
                    </div>
                    <div className="bg-gray-50 border border-gray-100 px-4 py-2.5 rounded-2xl rounded-bl-sm flex items-center gap-1.5">
                      {[0,1,2].map(function(i) {
                        return <div key={i} className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: (i * 0.15) + 's' }} />
                      })}
                      <span className="text-xs text-gray-400 ml-1">Gemini thinking...</span>
                    </div>
                  </motion.div>
                )}
                <div ref={aiEndRef} />
              </div>

              {/* AI input */}
              <div className="p-3 border-t border-gray-100 flex gap-2 flex-shrink-0">
                <input
                  type="text"
                  value={aiInput}
                  onChange={function(e) { setAiInput(e.target.value) }}
                  onKeyDown={function(e) { if (e.key === 'Enter') sendAiMsg() }}
                  placeholder="Ask AI a health question..."
                  className="flex-1 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
                <button
                  onClick={function() { sendAiMsg() }}
                  disabled={!aiInput.trim() || aiLoading}
                  className="w-10 h-10 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl flex items-center justify-center transition-all disabled:opacity-40">
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
