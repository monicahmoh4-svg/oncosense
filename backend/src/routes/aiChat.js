const express = require("express");
const router  = express.Router();
const axios   = require("axios");
const { authenticate } = require("../middleware/auth");
const logger  = require("../utils/logger");

const GEMINI_KEY    = process.env.GEMINI_API_KEY;
const GEMINI_URL    = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";
const SYSTEM_PROMPT = `You are OncoSense AI, a compassionate and highly knowledgeable health assistant specialising in:
- Cancer awareness, risk factors, and early detection
- Cancer screening guidelines and recommendations
- Symptoms that may indicate cancer or require medical evaluation
- Healthy lifestyle and cancer prevention
- Navigating the healthcare system in Kenya and Africa

STRICT RULES:
1. Never provide a medical diagnosis under any circumstances
2. Always clarify your responses are for educational and awareness purposes only
3. Always encourage consulting a qualified healthcare professional
4. For any red-flag symptoms (unexplained weight loss, persistent bleeding, new lumps, non-healing sores, coughing blood, changes in bowel habits lasting more than 3 weeks) — URGENTLY recommend immediate medical evaluation
5. Keep responses clear, concise, and accessible (2-5 sentences maximum unless a list is needed)
6. Use simple language appropriate for all literacy levels
7. Be warm, empathetic, and supportive
8. End every substantive response with: "Please consult a healthcare provider for personalised medical advice."`;

router.post("/chat", authenticate, async (req, res) => {
  try {
    if (!GEMINI_KEY) {
      return res.status(503).json({ error: "AI service not configured. Please set GEMINI_API_KEY." });
    }

    const { messages } = req.body;
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "Messages array is required" });
    }

    // Convert to Gemini format — filter out system messages, ensure valid alternation
    let contents = messages
      .filter(m => m.role !== "system" && m.content && m.content.trim())
      .map(m => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content.trim() }]
      }));

    // Gemini requires conversation to start with "user"
    while (contents.length > 0 && contents[0].role === "model") {
      contents = contents.slice(1);
    }

    // Ensure alternating roles (Gemini requirement)
    const cleaned = [];
    let lastRole = null;
    for (const msg of contents) {
      if (msg.role !== lastRole) {
        cleaned.push(msg);
        lastRole = msg.role;
      } else {
        // Merge consecutive same-role messages
        if (cleaned.length > 0) {
          cleaned[cleaned.length - 1].parts[0].text += "\n" + msg.parts[0].text;
        }
      }
    }

    if (cleaned.length === 0) {
      return res.status(400).json({ error: "No valid messages to process" });
    }

    const payload = {
      systemInstruction: {
        parts: [{ text: SYSTEM_PROMPT }]
      },
      contents: cleaned.slice(-20), // Last 20 messages max
      generationConfig: {
        maxOutputTokens: 800,
        temperature: 0.7,
        topP: 0.9,
        topK: 40
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
      {
        headers: { "Content-Type": "application/json" },
        timeout: 30000
      }
    );

    const candidate = response.data?.candidates?.[0];
    const text = candidate?.content?.parts?.map(p => p.text).join("") || "";

    if (!text) {
      logger.warn("Gemini returned empty response:", JSON.stringify(response.data));
      return res.status(500).json({ error: "AI returned empty response. Please try again." });
    }

    logger.info("AI chat: user=" + req.user.id + " tokens=" + (response.data?.usageMetadata?.totalTokenCount || "?"));
    return res.json({ text, role: "assistant" });

  } catch (err) {
    logger.error("AI chat error:", err.message);
    if (err.response?.status === 400) {
      return res.status(400).json({ error: "Invalid request to AI service: " + (err.response?.data?.error?.message || err.message) });
    }
    if (err.response?.status === 429) {
      return res.status(429).json({ error: "AI service rate limit reached. Please wait a moment and try again." });
    }
    if (err.code === "ECONNABORTED") {
      return res.status(504).json({ error: "AI service timed out. Please try again." });
    }
    return res.status(500).json({ error: "AI service error: " + err.message });
  }
});

module.exports = router;
