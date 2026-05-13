/**
 * OncoSense AI Chat Route
 * Uses Google Gemini API (gemini-1.5-flash) as the AI backend.
 * API key is kept server-side — never exposed to the browser.
 */
const express = require('express')
const router  = express.Router()
const axios   = require('axios')
const { authenticate } = require('../middleware/auth')
const logger  = require('../utils/logger')

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || ''
const GEMINI_MODEL   = 'gemini-1.5-flash'
const GEMINI_BASE    = 'https://generativelanguage.googleapis.com/v1beta/models'

const SYSTEM_INSTRUCTION = `You are OncoSense AI, a compassionate health assistant specialising in cancer awareness, risk factors, early detection, and screening guidance.

CRITICAL RULES — follow these without exception:
1. You NEVER diagnose cancer or any medical condition.
2. Always state your responses are for educational and screening-support purposes only.
3. Strongly encourage users to consult a qualified healthcare professional.
4. Be empathetic, calm, and supportive — many users may be anxious or in low-resource settings.
5. Keep responses concise: 2-4 sentences for voice; a short paragraph for text.
6. For symptoms: explain general clinical associations but ALWAYS recommend seeing a doctor.
7. Focus on: cancer risk factors, screening methods, healthy lifestyle, when to seek care.
8. RED-FLAG symptoms (coughing blood, rectal bleeding, unexplained weight loss, new lumps, non-healing sores) — urgently recommend immediate medical evaluation.
9. Use simple, jargon-free language accessible to all literacy levels.
10. End every response with a brief professional reminder such as: "Please consult a healthcare provider for a proper evaluation." or "Early detection saves lives — don't delay seeking care."`

/** Convert flat [{role,content}] -> Gemini contents format */
function toGeminiContents (messages) {
  return messages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }]
  }))
}

// POST /ai-chat/chat
router.post('/chat', authenticate, async (req, res) => {
  try {
    const { messages } = req.body
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'messages array is required' })
    }

    if (!GEMINI_API_KEY) {
      return res.json({
        text: "I'm OncoSense AI. The AI service is not yet configured on this server. Please add your GEMINI_API_KEY to the backend environment. For any health concerns, please consult a qualified healthcare provider."
      })
    }

    // Keep last 14 messages (7 turns); Gemini must start with user role
    let contents = toGeminiContents(messages.slice(-14))
    if (contents.length > 0 && contents[0].role === 'model') contents = contents.slice(1)

    const payload = {
      systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
      contents,
      generationConfig: { maxOutputTokens: 800, temperature: 0.7, topP: 0.9 },
      safetySettings: [
        { category: 'HARM_CATEGORY_HARASSMENT',        threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_HATE_SPEECH',       threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' }
      ]
    }

    const url = `${GEMINI_BASE}/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`
    const response = await axios.post(url, payload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 30000
    })

    const candidate = response.data?.candidates?.[0]
    const text = candidate?.content?.parts?.map(p => p.text).join('') || ''

    if (!text) {
      logger.warn(`Gemini empty response. finishReason: ${candidate?.finishReason}`)
      return res.json({
        text: "I wasn't able to generate a response right now. Please try again. For urgent health concerns, please visit a healthcare facility immediately.",
        finishReason: candidate?.finishReason
      })
    }

    res.json({ text })

  } catch (err) {
    const status = err.response?.status || 500
    const errMsg = err.response?.data?.error?.message || err.message || 'Gemini API error'
    logger.error(`Gemini API error [${status}]: ${errMsg}`)
    res.status(status >= 500 ? 502 : status).json({
      error: errMsg,
      text: "I'm having trouble connecting to the AI service. Please try again shortly. For urgent symptoms, seek medical care immediately."
    })
  }
})

// GET /ai-chat/status
router.get('/status', authenticate, (req, res) => {
  res.json({
    available: !!GEMINI_API_KEY,
    model: GEMINI_MODEL,
    provider: 'Google Gemini',
    reason: GEMINI_API_KEY ? null : 'GEMINI_API_KEY not configured'
  })
})

module.exports = router
