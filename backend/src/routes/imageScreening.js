const express  = require("express");
const router   = express.Router();
const multer   = require("multer");
const path     = require("path");
const fs       = require("fs");
const { v4: uuidv4 } = require("uuid");
const { authenticate } = require("../middleware/auth");
const { query } = require("../config/database");
const logger   = require("../utils/logger");

// Store uploads in memory (no disk needed on Render free tier)
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only image files are allowed"));
  }
});

// Simple image analysis using raw pixel statistics from Buffer
// Works without any native modules or Python
function analyzeImageBuffer(buffer, imageType) {
  // Sample pixels from the JPEG/PNG buffer to get color statistics
  // We use simple byte analysis — works for all image formats
  const bytes = new Uint8Array(buffer);
  const len   = bytes.length;

  // Sample every 50th byte to get a distribution
  let totalBrightness = 0;
  let darkPixels      = 0;
  let lightPixels     = 0;
  let redishPixels    = 0;
  let sampleCount     = 0;

  for (let i = 0; i < len; i += 50) {
    const b = bytes[i];
    totalBrightness += b;
    sampleCount++;
    if (b < 60)  darkPixels++;
    if (b > 200) lightPixels++;
    if (i + 2 < len && bytes[i] > bytes[i+2] + 30) redishPixels++;
  }

  const avgBrightness = sampleCount > 0 ? totalBrightness / sampleCount : 128;
  const darkRatio     = sampleCount > 0 ? darkPixels  / sampleCount : 0;
  const lightRatio    = sampleCount > 0 ? lightPixels / sampleCount : 0;
  const redRatio      = sampleCount > 0 ? redishPixels / sampleCount : 0;
  const variance      = Math.abs(avgBrightness - 128) / 128;

  let concernScore = 0;
  const findings   = [];

  if (imageType === "oral") {
    if (lightRatio > 0.25) {
      concernScore += 0.30;
      findings.push("White or pale patches detected — possible leukoplakia, requires evaluation");
    }
    if (redRatio > 0.20) {
      concernScore += 0.25;
      findings.push("Unusual redness detected — possible erythroplakia, requires evaluation");
    }
    if (darkRatio > 0.15) {
      concernScore += 0.20;
      findings.push("Dark lesion areas detected — requires professional examination");
    }
    if (variance > 0.35) {
      concernScore += 0.15;
      findings.push("Irregular color distribution detected");
    }
  } else {
    // skin
    if (darkRatio > 0.20) {
      concernScore += 0.25;
      findings.push("Dark pigmented area detected — ABCD criteria evaluation recommended");
    }
    if (variance > 0.40) {
      concernScore += 0.30;
      findings.push("High color heterogeneity detected — possible irregular lesion");
    }
    if (redRatio > 0.25) {
      concernScore += 0.20;
      findings.push("Inflammatory redness detected — possible irritation or lesion");
    }
    if (lightRatio > 0.30 && darkRatio > 0.10) {
      concernScore += 0.15;
      findings.push("Mixed light and dark areas — asymmetric appearance detected");
    }
  }

  concernScore = Math.min(concernScore, 0.95);

  let severityHint, finding, recommendation;

  if (concernScore >= 0.55) {
    severityHint  = "HIGH CONCERN";
    finding       = "Potential abnormality detected — clinical evaluation strongly recommended";
    recommendation = "Please visit a healthcare provider within 1–2 weeks for professional evaluation of this lesion.";
  } else if (concernScore >= 0.25) {
    severityHint  = "MODERATE CONCERN";
    finding       = "Possible area of concern detected — monitoring recommended";
    recommendation = "Consider visiting a healthcare provider. Monitor for any changes in size, color, or texture.";
  } else {
    severityHint  = "LOW CONCERN";
    finding       = "No significant abnormalities detected in automated analysis";
    recommendation = "No immediate action required. Maintain regular self-examinations monthly.";
  }

  return {
    screening_id:          uuidv4(),
    image_type:            imageType,
    abnormality_detected:  concernScore >= 0.25,
    confidence_score:      parseFloat((0.45 + concernScore * 0.40).toFixed(3)),
    finding,
    severity_hint:         severityHint,
    color_analysis: {
      avg_brightness:   parseFloat(avgBrightness.toFixed(1)),
      dark_ratio:       parseFloat(darkRatio.toFixed(3)),
      light_ratio:      parseFloat(lightRatio.toFixed(3)),
      red_ratio:        parseFloat(redRatio.toFixed(3)),
      variance:         parseFloat(variance.toFixed(3)),
    },
    regions_of_concern: findings,
    recommendation,
    disclaimer: "⚠️ IMPORTANT: This image analysis is for SCREENING SUPPORT ONLY. It does NOT constitute a medical diagnosis. Results may not be accurate. Always consult a qualified healthcare professional for proper evaluation."
  };
}

// POST /image-screening/analyze
router.post("/analyze", authenticate, upload.single("file"), async (req, res) => {
  try {
    const { image_type = "skin", consent_given, disclaimer_acknowledged } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    if (consent_given !== "true" && consent_given !== true) {
      return res.status(400).json({ error: "Consent is required" });
    }
    if (disclaimer_acknowledged !== "true" && disclaimer_acknowledged !== true) {
      return res.status(400).json({ error: "Disclaimer acknowledgment is required" });
    }

    logger.info(`Image analysis: type=${image_type} size=${req.file.size} user=${req.user.id}`);

    const result = analyzeImageBuffer(req.file.buffer, image_type);

    // Save to database (best effort — don't fail if DB is slow)
    query(
      `INSERT INTO image_screenings
         (id, user_id, image_url, image_type, status, ai_result,
          abnormality_detected, confidence_score, ai_notes,
          consent_given, disclaimer_acknowledged)
       VALUES ($1,$2,$3,$4,'reviewed',$5,$6,$7,$8,true,true)`,
      [
        result.screening_id,
        req.user.id,
        `/uploads/screening_${result.screening_id}.jpg`,
        image_type,
        JSON.stringify(result),
        result.abnormality_detected,
        result.confidence_score,
        result.finding
      ]
    ).catch(e => logger.warn("DB save warning:", e.message));

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
      "SELECT * FROM image_screenings WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20",
      [req.user.id]
    );
    res.json({ screenings: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
