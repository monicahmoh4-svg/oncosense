import React, { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { io } from 'socket.io-client'
import { motion } from 'framer-motion'
import { Send, Video, VideoOff, Mic, MicOff, Phone, PhoneOff, User } from 'lucide-react'
import { consultationService } from '../services/api'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'

export default function ConsultationRoom() {
  const { id } = useParams()
  const { user } = useAuthStore()
  const [consultation, setConsultation] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMsg, setNewMsg] = useState('')
  const [socket, setSocket] = useState(null)
  const [inCall, setInCall] = useState(false)
  const [videoEnabled, setVideoEnabled] = useState(true)
  const [audioEnabled, setAudioEnabled] = useState(true)
  const [remoteStream, setRemoteStream] = useState(null)
  const [typing, setTyping] = useState(false)

  const localVideoRef = useRef(null)
  const remoteVideoRef = useRef(null)
  const peerRef = useRef(null)
  const streamRef = useRef(null)
  const messagesEndRef = useRef(null)
  const token = JSON.parse(localStorage.getItem('oncosense-auth') || '{}')?.state?.token

  useEffect(() => {
    const loadData = async () => {
      try {
        const [cRes, mRes] = await Promise.all([
          consultationService.getById(id),
          consultationService.getMessages(id)
        ])
        setConsultation(cRes.data.consultation)
        setMessages(mRes.data.messages || [])
      } catch { toast.error('Failed to load consultation') }
    }
    loadData()

    // Init socket
    const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || '/'
    const sock = io(SOCKET_URL, { auth: { token }, transports: ['websocket'] })
    setSocket(sock)

    sock.emit('join_consultation', { consultation_id: id })
    sock.on('new_message', (msg) => setMessages(prev => [...prev, msg]))
    sock.on('user_typing', () => { setTyping(true); setTimeout(() => setTyping(false), 2000) })
    sock.on('incoming_call', handleIncomingCall)
    sock.on('webrtc_offer', handleOffer)
    sock.on('webrtc_answer', handleAnswer)
    sock.on('webrtc_ice_candidate', handleICE)
    sock.on('call_ended', endCall)

    return () => { sock.disconnect(); endCall() }
  }, [id])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = () => {
    if (!newMsg.trim() || !socket) return
    socket.emit('send_message', { consultation_id: id, content: newMsg.trim() })
    setNewMsg('')
  }

  const handleTyping = (e) => {
    setNewMsg(e.target.value)
    socket?.emit('typing', { consultation_id: id })
  }

  const startCall = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      streamRef.current = stream
      if (localVideoRef.current) localVideoRef.current.srcObject = stream
      
      const pc = createPeerConnection()
      stream.getTracks().forEach(track => pc.addTrack(track, stream))
      
      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)
      socket?.emit('webrtc_offer', { consultation_id: id, offer })
      socket?.emit('call_started', { consultation_id: id })
      setInCall(true)
    } catch { toast.error('Could not access camera/microphone') }
  }

  const createPeerConnection = () => {
    const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] })
    peerRef.current = pc
    
    pc.onicecandidate = (e) => {
      if (e.candidate) socket?.emit('webrtc_ice_candidate', { consultation_id: id, candidate: e.candidate })
    }
    pc.ontrack = (e) => {
      setRemoteStream(e.streams[0])
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = e.streams[0]
    }
    return pc
  }

  const handleIncomingCall = async () => {
    toast('📞 Incoming video call', { duration: 8000 })
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      streamRef.current = stream
      if (localVideoRef.current) localVideoRef.current.srcObject = stream
      createPeerConnection()
      stream.getTracks().forEach(track => peerRef.current?.addTrack(track, stream))
      setInCall(true)
    } catch { toast.error('Could not join call') }
  }

  const handleOffer = async ({ offer }) => {
    if (!peerRef.current) return
    await peerRef.current.setRemoteDescription(offer)
    const answer = await peerRef.current.createAnswer()
    await peerRef.current.setLocalDescription(answer)
    socket?.emit('webrtc_answer', { consultation_id: id, answer })
  }

  const handleAnswer = async ({ answer }) => {
    await peerRef.current?.setRemoteDescription(answer)
  }

  const handleICE = async ({ candidate }) => {
    try { await peerRef.current?.addIceCandidate(candidate) } catch {}
  }

  const endCall = () => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    peerRef.current?.close()
    peerRef.current = null
    streamRef.current = null
    setInCall(false)
    setRemoteStream(null)
    socket?.emit('call_ended', { consultation_id: id })
  }

  const toggleVideo = () => {
    const track = streamRef.current?.getVideoTracks()[0]
    if (track) { track.enabled = !videoEnabled; setVideoEnabled(!videoEnabled) }
  }

  const toggleAudio = () => {
    const track = streamRef.current?.getAudioTracks()[0]
    if (track) { track.enabled = !audioEnabled; setAudioEnabled(!audioEnabled) }
  }

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      <div className="mb-4">
        <h1 className="font-display text-2xl text-gray-900">Consultation Room</h1>
        {consultation && (
          <p className="text-gray-500 text-sm">
            With Dr. {consultation.clinician_first} {consultation.clinician_last} •
            Status: <span className={`font-semibold ${consultation.status === 'active' ? 'text-brand-600' : 'text-amber-600'}`}>
              {consultation.status}
            </span>
          </p>
        )}
      </div>

      <div className="grid lg:grid-cols-5 gap-4 h-[600px]">
        {/* Video Panel */}
        <div className="lg:col-span-2 card p-0 overflow-hidden flex flex-col">
          <div className="bg-gray-900 flex-1 relative">
            {inCall ? (
              <>
                <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
                <video ref={localVideoRef} autoPlay playsInline muted
                  className="absolute bottom-3 right-3 w-24 h-20 object-cover rounded-lg border-2 border-white" />
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-white">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-3">
                    <User className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-400 text-sm">Video not started</p>
                </div>
              </div>
            )}
          </div>
          <div className="p-3 flex items-center justify-center gap-3 bg-gray-800">
            {!inCall ? (
              <button onClick={startCall} className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all">
                <Video className="w-4 h-4" /> Start Call
              </button>
            ) : (
              <>
                <button onClick={toggleAudio} className={`p-2.5 rounded-full transition-all ${audioEnabled ? 'bg-gray-600 text-white' : 'bg-red-500 text-white'}`}>
                  {audioEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                </button>
                <button onClick={toggleVideo} className={`p-2.5 rounded-full transition-all ${videoEnabled ? 'bg-gray-600 text-white' : 'bg-red-500 text-white'}`}>
                  {videoEnabled ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                </button>
                <button onClick={endCall} className="p-2.5 bg-red-600 text-white rounded-full hover:bg-red-700 transition-all">
                  <PhoneOff className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Chat Panel */}
        <div className="lg:col-span-3 card p-0 flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="font-bold text-gray-900">Chat</p>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg, i) => {
              const isMe = msg.sender_id === user?.id
              return (
                <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xs ${isMe ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                    {!isMe && <span className="text-xs text-gray-500 px-1">{msg.first_name} ({msg.sender_role})</span>}
                    <div className={`px-4 py-2.5 rounded-2xl text-sm ${
                      isMe ? 'bg-brand-600 text-white rounded-br-sm' : 'bg-gray-100 text-gray-900 rounded-bl-sm'
                    }`}>
                      {msg.content}
                    </div>
                    <span className="text-xs text-gray-400 px-1">{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </motion.div>
              )
            })}
            {typing && (
              <div className="flex justify-start">
                <div className="bg-gray-100 px-4 py-2.5 rounded-2xl rounded-bl-sm flex gap-1">
                  {[0,1,2].map(i => <div key={i} className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: `${i*0.1}s` }} />)}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-3 border-t border-gray-100 flex gap-2">
            <input type="text" value={newMsg} onChange={handleTyping}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
              placeholder="Type a message..."
              className="flex-1 input-field py-2" />
            <button onClick={sendMessage} disabled={!newMsg.trim()}
              className="w-10 h-10 bg-brand-600 hover:bg-brand-700 text-white rounded-xl flex items-center justify-center transition-all disabled:opacity-40">
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
