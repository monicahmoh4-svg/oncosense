const express = require("express");
const router  = express.Router();
const axios   = require("axios");
const { authenticate } = require("../middleware/auth");
const logger  = require("../utils/logger");

const GEMINI_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

const SYSTEM = `You are OncoSense AI, a compassionate and highly knowledgeable health assistant.
You specialise in:
- Cancer awareness, risk factors, early detection and prevention
- Cancer screening guidelines and recommendations for Kenya and Africa
- Symptoms that may indicate cancer or require urgent medical evaluation
- Healthy lifestyle changes that reduce cancer risk
- Navigating healthcare in Kenya including SHA, NHIF, and county hospitals

STRICT RULES:
1. NEVER provide a medical diagnosis under any circumstances
2. Always clarify your responses are for educational and awareness purposes only
3. Always recommend consulting a qualified healthcare professional
4. For red-flag symptoms (unexplained weight loss >10% in 6 months, persistent rectal or vaginal bleeding, new lumps or swellings that grow, non-healing sores >3 weeks, coughing blood, persistent difficulty swallowing) — URGENTLY recommend immediate medical evaluation
5. Keep responses clear and concise — 2-5 sentences unless a list genuinely helps
6. Use simple accessible language suitable for all literacy levels
7. Be warm, empathetic and supportive — patients may be scared
8. For cervical cancer: mention VIA screening, Pap smear, HPV vaccine available free in Kenya
9. For breast cancer: mention BSE monthly, clinical exam annually, mammogram after 40
10. Always end with: "Please consult a healthcare provider for personalised advice."`;

// POST /api/ai-chat/chat
router.post("/chat", authenticate, async (req, res) => {
  try {
    if (!GEMINI_KEY) {
      logger.error("GEMINI_API_KEY not set");
      return res.status(503).json({
        error: "AI service not configured. Set GEMINI_API_KEY in environment variables.",
        text: null
      });
    }

    const { messages } = req.body;
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "messages array is required" });
    }

    // Build Gemini contents — filter system messages, ensure starts with user
    let contents = messages
      .filter(m => m.role !== "system" && m.content && String(m.content).trim())
      .map(m => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: String(m.content).trim() }]
      }));

    // Must start with user role
    while (contents.length > 0 && contents[0].role === "model") {
      contents = contents.slice(1);
    }

    // Merge consecutive same-role messages (Gemini requires strict alternation)
    const merged = [];
    for (const msg of contents) {
      if (merged.length > 0 && merged[merged.length - 1].role === msg.role) {
        merged[merged.length - 1].parts[0].text += "\n" + msg.parts[0].text;
      } else {
        merged.push({ role: msg.role, parts: [{ text: msg.parts[0].text }] });
      }
    }

    if (merged.length === 0) {
      return res.status(400).json({ error: "No valid messages" });
    }

    const payload = {
      systemInstruction: { parts: [{ text: SYSTEM }] },
      contents: merged.slice(-24),
      generationConfig: {
        maxOutputTokens: 700,
        temperature: 0.72,
        topP: 0.9
      },
      safetySettings: [
        { category: "HARM_CATEGORY_HARASSMENT",        threshold: "BLOCK_MEDIUM_AND_ABOVE" },
        { category: "HARM_CATEGORY_HATE_SPEECH",       threshold: "BLOCK_MEDIUM_AND_ABOVE" },
        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" }
      ]
    };

    const response = await axios.post(
      GEMINI_URL + "?key=" + GEMINI_KEY,
      payload,
      { headers: { "Content-Type": "application/json" }, timeout: 25000 }
    );

    const text = response.data?.candidates?.[0]?.content?.parts
      ?.map(p => p.text).join("") || "";

    if (!text) {
      const reason = response.data?.candidates?.[0]?.finishReason;
      logger.warn("Gemini empty response, finishReason:", reason);
      return res.status(500).json({ error: "AI returned empty response", text: null });
    }

    logger.info("AI chat OK user=" + req.user.id + " tokens=" + (response.data?.usageMetadata?.totalTokenCount || "?"));
    return res.json({ text, role: "assistant" });

  } catch (err) {
    logger.error("AI chat error:", err.message, err.response?.data);
    if (err.response?.status === 429) {
      return res.status(429).json({ error: "AI rate limit. Please wait a moment.", text: null });
    }
    if (err.response?.status === 400) {
      logger.error("Gemini 400:", JSON.stringify(err.response?.data));
      return res.status(400).json({ error: "Bad AI request: " + (err.response?.data?.error?.message || err.message), text: null });
    }
    if (err.code === "ECONNABORTED") {
      return res.status(504).json({ error: "AI request timed out. Please try again.", text: null });
    }
    return res.status(500).json({ error: "AI service error: " + err.message, text: null });
  }
});

module.exports = router;
