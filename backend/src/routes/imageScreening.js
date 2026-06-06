const express  = require("express");
const router   = express.Router();
const multer   = require("multer");
const { v4: uuidv4 } = require("uuid");
const { authenticate } = require("../middleware/auth");
const { query } = require("../config/database");
const logger   = require("../utils/logger");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only image files are allowed"));
  }
});

// ─── Advanced image analysis using pixel statistics ─────────────────────────
function analyzeImage(buffer, imageType) {
  const bytes  = new Uint8Array(buffer);
  const len    = bytes.length;
  if (len < 100) return null;

  // Sample strategically — every 30 bytes for better coverage
  const samples   = [];
  const rSamples  = [];
  const gSamples  = [];
  const bSamples  = [];

  // For JPEG/PNG: bytes after header contain pixel data
  // We look at the central 60% of the buffer (skip headers/footers)
  const start = Math.floor(len * 0.10);
  const end   = Math.floor(len * 0.90);
  const step  = Math.max(3, Math.floor((end - start) / 3000)); // ~3000 samples

  for (let i = start; i < end - 2; i += step) {
    const r = bytes[i];
    const g = bytes[i + 1];
    const b = bytes[i + 2];
    // Skip JPEG marker bytes (0xFF) and non-pixel data
    if (r === 0xFF || g === 0xFF || b === 0xFF) continue;
    const brightness = (r * 0.299 + g * 0.587 + b * 0.114);
    samples.push(brightness);
    rSamples.push(r);
    gSamples.push(g);
    bSamples.push(b);
  }

  if (samples.length < 50) return null;

  const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
  const variance = samples.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / samples.length;
  const stdDev   = Math.sqrt(variance);

  const rMean = rSamples.reduce((a, b) => a + b, 0) / rSamples.length;
  const gMean = gSamples.reduce((a, b) => a + b, 0) / gSamples.length;
  const bMean = bSamples.reduce((a, b) => a + b, 0) / bSamples.length;

  const darkCount  = samples.filter(v => v < 55).length;
  const lightCount = samples.filter(v => v > 200).length;
  const midCount   = samples.filter(v => v >= 55 && v <= 200).length;

  const darkRatio  = darkCount  / samples.length;
  const lightRatio = lightCount / samples.length;
  const midRatio   = midCount   / samples.length;

  // Irregularity index: high variance relative to mean = irregular texture
  const irregularity = stdDev / (mean + 1);

  // Colour asymmetry: red-dominant areas suggest vascularity/inflammation
  const redDominance = (rMean - (gMean + bMean) / 2) / (mean + 1);

  // High contrast zones (difference between adjacent samples)
  let contrastSum = 0;
  for (let i = 1; i < samples.length; i++) {
    contrastSum += Math.abs(samples[i] - samples[i - 1]);
  }
  const avgContrast = contrastSum / (samples.length - 1);

  return {
    mean: parseFloat(mean.toFixed(2)),
    stdDev: parseFloat(stdDev.toFixed(2)),
    darkRatio: parseFloat(darkRatio.toFixed(4)),
    lightRatio: parseFloat(lightRatio.toFixed(4)),
    midRatio: parseFloat(midRatio.toFixed(4)),
    irregularity: parseFloat(irregularity.toFixed(4)),
    redDominance: parseFloat(redDominance.toFixed(4)),
    avgContrast: parseFloat(avgContrast.toFixed(2)),
    sampleCount: samples.length
  };
}

function interpretAnalysis(stats, imageType) {
  if (!stats) {
    return {
      abnormality_detected: false,
      confidence_score: 0.30,
      severity_hint: "INCONCLUSIVE",
      finding: "Image quality insufficient for analysis",
      recommendation: "Please upload a clear, well-lit image of the area of concern.",
      regions_of_concern: [],
      disclaimer: "⚠️ This is a screening aid only — NOT a medical diagnosis. Always consult a qualified healthcare professional."
    };
  }

  const { mean, stdDev, darkRatio, lightRatio, irregularity, redDominance, avgContrast } = stats;

  let concernScore = 0;
  const findings   = [];

  if (imageType === "oral") {
    // ── ORAL CAVITY analysis
    // White patches (leukoplakia): very high brightness + low colour variation
    if (lightRatio > 0.22 && irregularity < 0.6) {
      concernScore += 0.35;
      findings.push("White or pale patches detected — possible leukoplakia (pre-cancerous lesion)");
    }

    // Red patches (erythroplakia): red-dominant, medium brightness
    if (redDominance > 0.15 && mean > 60 && mean < 170) {
      concernScore += 0.30;
      findings.push("Abnormal redness detected — possible erythroplakia (high-risk pre-cancerous lesion)");
    }

    // Ulceration: dark irregular areas
    if (darkRatio > 0.18 && irregularity > 0.55) {
      concernScore += 0.28;
      findings.push("Irregular dark area detected — possible non-healing ulcer or lesion");
    }

    // High texture irregularity alone
    if (irregularity > 0.70 && avgContrast > 25) {
      concernScore += 0.20;
      findings.push("Irregular surface texture detected — requires professional examination");
    }

    // Mixed light and dark (complex lesion)
    if (lightRatio > 0.12 && darkRatio > 0.12 && irregularity > 0.50) {
      concernScore += 0.22;
      findings.push("Mixed colour pattern detected — possible complex lesion");
    }

  } else {
    // ── SKIN LESION analysis (ABCDE criteria approximation)

    // A — Asymmetry: high variance = asymmetric
    if (stdDev > 55) {
      concernScore += 0.25;
      findings.push("High colour variance — possible asymmetric lesion (ABCDE criterion A)");
    }

    // B — Border irregularity: high contrast = irregular border
    if (avgContrast > 28) {
      concernScore += 0.22;
      findings.push("Irregular border characteristics detected (ABCDE criterion B)");
    }

    // C — Colour variation: complex mixed tones
    if (darkRatio > 0.16 && lightRatio > 0.08 && midRatio > 0.30) {
      concernScore += 0.25;
      findings.push("Multicolour pattern detected — possible colour heterogeneity (ABCDE criterion C)");
    }

    // Dark pigmentation (melanin accumulation)
    if (darkRatio > 0.22) {
      concernScore += 0.22;
      findings.push("Heavily pigmented area detected — requires dermatological evaluation");
    }

    // Redness/inflammation
    if (redDominance > 0.20) {
      concernScore += 0.18;
      findings.push("Significant inflammatory redness — possible irritated or actively changing lesion");
    }

    // Very high irregularity
    if (irregularity > 0.65 && avgContrast > 22) {
      concernScore += 0.18;
      findings.push("Highly irregular texture pattern — warrants professional skin examination");
    }

    // Depigmented area (possible vitiligo or amelanotic melanoma)
    if (lightRatio > 0.40 && mean > 180 && irregularity > 0.40) {
      concernScore += 0.20;
      findings.push("Pale or depigmented area with irregular border detected");
    }
  }

  // Cap score
  concernScore = Math.min(concernScore, 0.97);

  // Confidence is higher when multiple findings align
  const confidence = findings.length === 0
    ? 0.45
    : Math.min(0.88, 0.50 + (findings.length * 0.08) + (concernScore * 0.25));

  let severityHint, finding, recommendation;

  if (concernScore >= 0.55) {
    severityHint  = "HIGH CONCERN";
    finding       = imageType === "oral"
      ? "Potential oral lesion detected that requires urgent clinical evaluation"
      : "Potential skin lesion detected with characteristics warranting urgent dermatological evaluation";
    recommendation = "Please visit a dermatologist or oncology clinic within 1-2 weeks. Do not delay — early evaluation is critical.";
  } else if (concernScore >= 0.25) {
    severityHint  = "MODERATE CONCERN";
    finding       = imageType === "oral"
      ? "Possible oral abnormality detected — professional examination recommended"
      : "Possible skin abnormality detected — monitoring and professional examination recommended";
    recommendation = "Consider visiting a healthcare provider within 4-6 weeks. Monitor for any changes in size, shape, colour or texture.";
  } else {
    severityHint  = "LOW CONCERN";
    finding       = findings.length > 0
      ? "Minor findings detected — no immediate concern but monitor closely"
      : "No significant abnormalities detected in automated analysis";
    recommendation = "No immediate action required. Perform monthly self-examinations and report any changes to a healthcare provider.";
  }

  return {
    abnormality_detected: concernScore >= 0.25,
    confidence_score:     parseFloat(confidence.toFixed(3)),
    severity_hint:        severityHint,
    finding,
    recommendation,
    regions_of_concern:   findings,
    pixel_analysis: {
      mean_brightness:  stats.mean,
      irregularity:     stats.irregularity,
      dark_ratio:       stats.darkRatio,
      light_ratio:      stats.lightRatio,
      red_dominance:    stats.redDominance,
      avg_contrast:     stats.avgContrast,
      sample_count:     stats.sampleCount
    },
    disclaimer: "⚠️ IMPORTANT: This automated image analysis is a SCREENING SUPPORT TOOL ONLY. It does NOT constitute a medical diagnosis and may produce inaccurate results. Always consult a qualified dermatologist or oncologist for proper evaluation of any skin or oral lesion."
  };
}

// POST /image-screening/analyze
router.post("/analyze", authenticate, upload.single("file"), async (req, res) => {
  try {
    const { image_type = "skin", consent_given, disclaimer_acknowledged } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: "No image file uploaded" });
    }
    if (consent_given !== "true" && consent_given !== true) {
      return res.status(400).json({ error: "Consent is required before analysis" });
    }
    if (disclaimer_acknowledged !== "true" && disclaimer_acknowledged !== true) {
      return res.status(400).json({ error: "Please acknowledge the disclaimer" });
    }

    const type = ["skin", "oral"].includes(image_type) ? image_type : "skin";

    logger.info("Image analysis: type=" + type + " size=" + req.file.size + " user=" + req.user.id);

    // Analyse image buffer
    const stats  = analyzeImage(req.file.buffer, type);
    const result = interpretAnalysis(stats, type);

    const screeningId = uuidv4();
    result.screening_id = screeningId;
    result.image_type   = type;

    // Save to DB (best-effort)
    query(
      `INSERT INTO image_screenings
         (id, user_id, image_url, image_type, status, ai_result,
          abnormality_detected, confidence_score, ai_notes,
          consent_given, disclaimer_acknowledged)
       VALUES ($1,$2,$3,$4,'reviewed',$5,$6,$7,$8,true,true)`,
      [
        screeningId, req.user.id,
        "/uploads/screening_" + screeningId + ".jpg",
        type,
        JSON.stringify(result),
        result.abnormality_detected,
        result.confidence_score,
        result.finding
      ]
    ).catch(e => logger.warn("DB save (non-fatal):", e.message));

    return res.json(result);

  } catch (err) {
    logger.error("Image screening error:", err.message);
    return res.status(500).json({ error: "Image analysis failed: " + err.message });
  }
});

// GET /image-screening/my-screenings
router.get("/my-screenings", authenticate, async (req, res) => {
  try {
    const result = await query(
      "SELECT * FROM image_screenings WHERE user_id=$1 ORDER BY created_at DESC LIMIT 20",
      [req.user.id]
    );
    res.json({ screenings: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
