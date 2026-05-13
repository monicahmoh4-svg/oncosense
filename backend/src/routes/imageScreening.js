const express = require("express");
const router = express.Router();
const multer = require("multer");
const axios = require("axios");
const FormData = require("form-data");
const { authenticate } = require("../middleware/auth");
const { query } = require("../config/database");
const { v4: uuidv4 } = require("uuid");
const path = require("path");
const fs = require("fs");

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, "../../uploads/screenings");
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `${uuidv4()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 }, fileFilter: (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) cb(null, true);
  else cb(new Error("Only images allowed"));
}});

router.post("/analyze", authenticate, upload.single("file"), async (req, res, next) => {
  try {
    const { image_type = "skin", consent_given, disclaimer_acknowledged } = req.body;
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    if (!consent_given || !disclaimer_acknowledged) return res.status(400).json({ error: "Consent required" });

    const form = new FormData();
    form.append("file", fs.createReadStream(req.file.path), { filename: req.file.filename, contentType: req.file.mimetype });
    form.append("image_type", image_type);
    form.append("consent_given", "true");
    form.append("disclaimer_acknowledged", "true");

    const aiResponse = await axios.post(`${AI_SERVICE_URL}/image/analyze`, form, {
      headers: form.getHeaders(), timeout: 30000
    });
    const aiResult = aiResponse.data;

    const imageUrl = `/uploads/screenings/${req.file.filename}`;
    await query(
      `INSERT INTO image_screenings (id,user_id,image_url,image_type,status,ai_result,abnormality_detected,confidence_score,ai_notes,consent_given,disclaimer_acknowledged) VALUES ($1,$2,$3,$4,'reviewed',$5,$6,$7,$8,true,true)`,
      [uuidv4(), req.user.id, imageUrl, image_type, JSON.stringify(aiResult), aiResult.abnormality_detected, aiResult.confidence_score, aiResult.finding]
    );

    res.json(aiResult);
  } catch (error) { next(error); }
});

router.get("/my-screenings", authenticate, async (req, res, next) => {
  try {
    const result = await query("SELECT * FROM image_screenings WHERE user_id=$1 ORDER BY created_at DESC", [req.user.id]);
    res.json({ screenings: result.rows });
  } catch (error) { next(error); }
});

module.exports = router;
