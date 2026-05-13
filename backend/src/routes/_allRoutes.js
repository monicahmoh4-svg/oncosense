// ─── profiles.js ───────────────────────────────────────────────
const express = require("express");
const { authenticate } = require("../middleware/auth");
const { query } = require("../config/database");
const { v4: uuidv4 } = require("uuid");

const profileRouter = express.Router();

profileRouter.get("/me", authenticate, async (req, res, next) => {
  try {
    const result = await query(
      "SELECT * FROM health_profiles WHERE user_id = $1",
      [req.user.id]
    );
    res.json({ profile: result.rows[0] || null });
  } catch (error) { next(error); }
});

profileRouter.put("/me", authenticate, async (req, res, next) => {
  try {
    const existing = await query("SELECT id FROM health_profiles WHERE user_id = $1", [req.user.id]);

    const fields = [
      "date_of_birth", "gender", "country", "region", "district",
      "smoking_status", "smoking_pack_years", "alcohol_use", "physical_activity",
      "bmi", "diet_quality", "hiv_status", "diabetes", "hypertension",
      "previous_cancer", "previous_cancer_type", "immunosuppressed",
      "number_of_pregnancies", "breastfeeding_history", "age_first_menstruation",
      "menopause_status", "hpv_vaccinated", "oral_contraceptive_use",
      "family_cancer_history", "family_cancer_types", "family_cancer_relations"
    ];

    const values = fields.map(f => req.body[f] !== undefined ? req.body[f] : null);
    const hasRequiredFields = req.body.date_of_birth && req.body.gender;

    if (existing.rows.length > 0) {
      const setClause = fields.map((f, i) => `${f} = $${i + 2}`).join(", ");
      await query(
        `UPDATE health_profiles SET ${setClause}, profile_completed = $${fields.length + 2}, last_updated = NOW() WHERE user_id = $1`,
        [req.user.id, ...values, !!hasRequiredFields]
      );
    } else {
      const cols = ["id", "user_id", ...fields, "profile_completed"];
      const placeholders = cols.map((_, i) => `$${i + 1}`).join(", ");
      await query(
        `INSERT INTO health_profiles (${cols.join(", ")}) VALUES (${placeholders})`,
        [uuidv4(), req.user.id, ...values, !!hasRequiredFields]
      );
    }

    const updated = await query("SELECT * FROM health_profiles WHERE user_id = $1", [req.user.id]);
    res.json({ profile: updated.rows[0] });
  } catch (error) { next(error); }
});

module.exports.profileRouter = profileRouter;

// ─── users.js ──────────────────────────────────────────────────
const userRouter = express.Router();

userRouter.get("/", authenticate, async (req, res, next) => {
  try {
    const result = await query(
      "SELECT id, email, phone, role, first_name, last_name, preferred_language, created_at FROM users WHERE id = $1",
      [req.user.id]
    );
    res.json({ user: result.rows[0] });
  } catch (error) { next(error); }
});

userRouter.patch("/language", authenticate, async (req, res, next) => {
  try {
    const { language } = req.body;
    await query("UPDATE users SET preferred_language = $1 WHERE id = $2", [language, req.user.id]);
    res.json({ message: "Language updated" });
  } catch (error) { next(error); }
});

module.exports.userRouter = userRouter;

// ─── consultations.js ──────────────────────────────────────────
const consultRouter = express.Router();

consultRouter.post("/", authenticate, async (req, res, next) => {
  try {
    const { chief_complaint, consultation_type = "chat", assessment_id } = req.body;

    // Find available clinician
    const clinician = await query(
      `SELECT id FROM users WHERE role = 'clinician' AND is_active = true LIMIT 1`
    );

    const id = uuidv4();
    const roomId = `room_${id.replace(/-/g, "").substring(0, 12)}`;

    const result = await query(
      `INSERT INTO consultations (id, patient_id, clinician_id, assessment_id, status, consultation_type, chief_complaint, webrtc_room_id)
       VALUES ($1, $2, $3, $4, 'pending', $5, $6, $7)
       RETURNING *`,
      [id, req.user.id, clinician.rows[0]?.id || null, assessment_id || null, consultation_type, chief_complaint, roomId]
    );

    res.status(201).json({ consultation: result.rows[0] });
  } catch (error) { next(error); }
});

consultRouter.get("/", authenticate, async (req, res, next) => {
  try {
    const field = req.user.role === "clinician" ? "clinician_id" : "patient_id";
    const result = await query(
      `SELECT c.*, 
              p.first_name as patient_first, p.last_name as patient_last, p.phone as patient_phone,
              cl.first_name as clinician_first, cl.last_name as clinician_last
       FROM consultations c
       JOIN users p ON p.id = c.patient_id
       LEFT JOIN users cl ON cl.id = c.clinician_id
       WHERE c.${field} = $1
       ORDER BY c.created_at DESC`,
      [req.user.id]
    );
    res.json({ consultations: result.rows });
  } catch (error) { next(error); }
});

consultRouter.get("/:id", authenticate, async (req, res, next) => {
  try {
    const result = await query(
      `SELECT c.*,
              p.first_name as patient_first, p.last_name as patient_last, p.phone as patient_phone,
              cl.first_name as clinician_first, cl.last_name as clinician_last
       FROM consultations c
       JOIN users p ON p.id = c.patient_id
       LEFT JOIN users cl ON cl.id = c.clinician_id
       WHERE c.id = $1`,
      [req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: "Not found" });
    res.json({ consultation: result.rows[0] });
  } catch (error) { next(error); }
});

consultRouter.patch("/:id/complete", authenticate, async (req, res, next) => {
  try {
    const { clinical_notes, follow_up_required, follow_up_date } = req.body;
    await query(
      `UPDATE consultations SET status = 'completed', ended_at = NOW(), clinical_notes = $1,
       follow_up_required = $2, follow_up_date = $3, updated_at = NOW()
       WHERE id = $4`,
      [clinical_notes, !!follow_up_required, follow_up_date || null, req.params.id]
    );
    res.json({ message: "Consultation completed" });
  } catch (error) { next(error); }
});

module.exports.consultRouter = consultRouter;

// ─── messages.js ───────────────────────────────────────────────
const messageRouter = express.Router();

messageRouter.get("/:consultation_id", authenticate, async (req, res, next) => {
  try {
    const result = await query(
      `SELECT m.*, u.first_name, u.last_name, u.role as sender_role
       FROM messages m
       JOIN users u ON u.id = m.sender_id
       WHERE m.consultation_id = $1
       ORDER BY m.created_at ASC`,
      [req.params.consultation_id]
    );

    // Mark as read
    await query(
      "UPDATE messages SET is_read = true, read_at = NOW() WHERE consultation_id = $1 AND sender_id != $2 AND is_read = false",
      [req.params.consultation_id, req.user.id]
    );

    res.json({ messages: result.rows });
  } catch (error) { next(error); }
});

module.exports.messageRouter = messageRouter;

// ─── clinics.js ────────────────────────────────────────────────
const clinicRouter = express.Router();

clinicRouter.get("/", authenticate, async (req, res, next) => {
  try {
    const { country, region, lat, lng, radius_km = 50 } = req.query;

    let whereClause = "WHERE is_active = true";
    const params = [];
    let p = 0;

    if (country) { p++; whereClause += ` AND country = $${p}`; params.push(country); }
    if (region) { p++; whereClause += ` AND region = $${p}`; params.push(region); }

    let orderBy = "ORDER BY name";
    if (lat && lng) {
      const latF = parseFloat(lat);
      const lngF = parseFloat(lng);
      whereClause += ` AND (
        6371 * acos(cos(radians($${p + 1})) * cos(radians(latitude)) *
        cos(radians(longitude) - radians($${p + 2})) +
        sin(radians($${p + 1})) * sin(radians(latitude))) < $${p + 3}
      )`;
      params.push(latF, lngF, parseFloat(radius_km));
      orderBy = `ORDER BY 6371 * acos(cos(radians(${latF})) * cos(radians(latitude)) * cos(radians(longitude) - radians(${lngF})) + sin(radians(${latF})) * sin(radians(latitude)))`;
    }

    const result = await query(
      `SELECT * FROM clinics ${whereClause} ${orderBy} LIMIT 20`,
      params
    );
    res.json({ clinics: result.rows });
  } catch (error) { next(error); }
});

module.exports.clinicRouter = clinicRouter;

// ─── notifications.js ──────────────────────────────────────────
const notifRouter = express.Router();

notifRouter.get("/", authenticate, async (req, res, next) => {
  try {
    const result = await query(
      "SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20",
      [req.user.id]
    );
    res.json({ notifications: result.rows });
  } catch (error) { next(error); }
});

notifRouter.patch("/:id/read", authenticate, async (req, res, next) => {
  try {
    await query(
      "UPDATE notifications SET is_read = true, read_at = NOW() WHERE id = $1 AND user_id = $2",
      [req.params.id, req.user.id]
    );
    res.json({ message: "Marked as read" });
  } catch (error) { next(error); }
});

module.exports.notifRouter = notifRouter;

// ─── recommendations.js ────────────────────────────────────────
const recRouter = express.Router();

recRouter.get("/", authenticate, async (req, res, next) => {
  try {
    const result = await query(
      `SELECT r.* FROM recommendations r
       WHERE r.user_id = $1
       ORDER BY r.created_at DESC LIMIT 20`,
      [req.user.id]
    );
    res.json({ recommendations: result.rows });
  } catch (error) { next(error); }
});

recRouter.patch("/:id/complete", authenticate, async (req, res, next) => {
  try {
    await query(
      "UPDATE recommendations SET is_completed = true, completed_at = NOW() WHERE id = $1 AND user_id = $2",
      [req.params.id, req.user.id]
    );
    res.json({ message: "Recommendation completed" });
  } catch (error) { next(error); }
});

module.exports.recRouter = recRouter;
