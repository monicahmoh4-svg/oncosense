const express = require("express");
const router  = express.Router();
const { authenticate } = require("../middleware/auth");
const { query } = require("../config/database");
const { v4: uuidv4 } = require("uuid");
const logger = require("../utils/logger");

// POST /consultations — create with optional clinic
router.post("/", authenticate, async (req, res) => {
  try {
    const { chief_complaint, consultation_type = "chat", clinic_id } = req.body;

    // Find available clinician — prefer one linked to chosen clinic
    let clinicianId = null;
    let clinicName  = null;

    if (clinic_id) {
      // Get clinic name
      const clinicRes = await query("SELECT name FROM clinics WHERE id = $1", [clinic_id]);
      if (clinicRes.rows.length > 0) clinicName = clinicRes.rows[0].name;

      // Find clinician attached to this clinic via health_workers
      const hw = await query(
        `SELECT u.id FROM users u
         JOIN health_workers hw ON hw.user_id = u.id
         WHERE hw.clinic_id = $1 AND u.role IN ('clinician','health_worker') AND u.is_active = true
         LIMIT 1`,
        [clinic_id]
      );
      if (hw.rows.length > 0) clinicianId = hw.rows[0].id;
    }

    // Fall back to any available clinician
    if (!clinicianId) {
      const any = await query(
        "SELECT id FROM users WHERE role = 'clinician' AND is_active = true LIMIT 1"
      );
      if (any.rows.length > 0) clinicianId = any.rows[0].id;
    }

    const id     = uuidv4();
    const roomId = "room_" + id.replace(/-/g, "").substring(0, 12);

    const result = await query(
      `INSERT INTO consultations
         (id, patient_id, clinician_id, status, consultation_type,
          chief_complaint, webrtc_room_id, assessment_id)
       VALUES ($1,$2,$3,'pending',$4,$5,$6,$7)
       RETURNING *`,
      [id, req.user.id, clinicianId, consultation_type,
       chief_complaint || null, roomId, req.body.assessment_id || null]
    );

    const consultation = result.rows[0];

    // Store clinic reference in notes if provided
    if (clinicName) {
      await query(
        "UPDATE consultations SET clinical_notes = $1 WHERE id = $2",
        ["Hospital: " + clinicName, id]
      );
      consultation.hospital_name = clinicName;
    }

    logger.info("Consultation created: " + id + " clinic=" + (clinicName || "none"));
    res.status(201).json({ consultation });
  } catch (err) {
    logger.error("Create consultation error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /consultations
router.get("/", authenticate, async (req, res) => {
  try {
    const field  = req.user.role === "clinician" ? "clinician_id" : "patient_id";
    const result = await query(
      `SELECT c.*,
              p.first_name  AS patient_first,  p.last_name AS patient_last,  p.phone AS patient_phone,
              cl.first_name AS clinician_first, cl.last_name AS clinician_last
       FROM consultations c
       JOIN  users p  ON p.id  = c.patient_id
       LEFT JOIN users cl ON cl.id = c.clinician_id
       WHERE c.` + field + ` = $1
       ORDER BY c.created_at DESC`,
      [req.user.id]
    );
    res.json({ consultations: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /consultations/:id
router.get("/:id", authenticate, async (req, res) => {
  try {
    const result = await query(
      `SELECT c.*,
              p.first_name  AS patient_first,  p.last_name AS patient_last,
              cl.first_name AS clinician_first, cl.last_name AS clinician_last
       FROM consultations c
       JOIN  users p  ON p.id  = c.patient_id
       LEFT JOIN users cl ON cl.id = c.clinician_id
       WHERE c.id = $1`,
      [req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: "Not found" });
    res.json({ consultation: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /consultations/:id/complete
router.patch("/:id/complete", authenticate, async (req, res) => {
  try {
    const { clinical_notes, follow_up_required, follow_up_date } = req.body;
    await query(
      `UPDATE consultations SET status='completed', ended_at=NOW(),
       clinical_notes=$1, follow_up_required=$2, follow_up_date=$3, updated_at=NOW()
       WHERE id=$4`,
      [clinical_notes, !!follow_up_required, follow_up_date || null, req.params.id]
    );
    res.json({ message: "Consultation completed" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
