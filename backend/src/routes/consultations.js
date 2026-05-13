const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/auth");
const { query } = require("../config/database");
const { v4: uuidv4 } = require("uuid");

router.post("/", authenticate, async (req, res, next) => {
  try {
    const { chief_complaint, consultation_type = "chat", assessment_id } = req.body;
    const clinician = await query("SELECT id FROM users WHERE role='clinician' AND is_active=true LIMIT 1");
    const id = uuidv4();
    const roomId = `room_${id.replace(/-/g,"").substring(0,12)}`;
    const result = await query(
      `INSERT INTO consultations (id,patient_id,clinician_id,assessment_id,status,consultation_type,chief_complaint,webrtc_room_id) VALUES ($1,$2,$3,$4,'pending',$5,$6,$7) RETURNING *`,
      [id, req.user.id, clinician.rows[0]?.id||null, assessment_id||null, consultation_type, chief_complaint, roomId]
    );
    res.status(201).json({ consultation: result.rows[0] });
  } catch (error) { next(error); }
});

router.get("/", authenticate, async (req, res, next) => {
  try {
    const field = req.user.role === "clinician" ? "clinician_id" : "patient_id";
    const result = await query(
      `SELECT c.*, p.first_name as patient_first, p.last_name as patient_last, p.phone as patient_phone, cl.first_name as clinician_first, cl.last_name as clinician_last FROM consultations c JOIN users p ON p.id=c.patient_id LEFT JOIN users cl ON cl.id=c.clinician_id WHERE c.${field}=$1 ORDER BY c.created_at DESC`,
      [req.user.id]
    );
    res.json({ consultations: result.rows });
  } catch (error) { next(error); }
});

router.get("/:id", authenticate, async (req, res, next) => {
  try {
    const result = await query(
      `SELECT c.*, p.first_name as patient_first, p.last_name as patient_last, cl.first_name as clinician_first, cl.last_name as clinician_last FROM consultations c JOIN users p ON p.id=c.patient_id LEFT JOIN users cl ON cl.id=c.clinician_id WHERE c.id=$1`,
      [req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: "Not found" });
    res.json({ consultation: result.rows[0] });
  } catch (error) { next(error); }
});

router.patch("/:id/complete", authenticate, async (req, res, next) => {
  try {
    const { clinical_notes, follow_up_required, follow_up_date } = req.body;
    await query(
      `UPDATE consultations SET status='completed',ended_at=NOW(),clinical_notes=$1,follow_up_required=$2,follow_up_date=$3,updated_at=NOW() WHERE id=$4`,
      [clinical_notes, !!follow_up_required, follow_up_date||null, req.params.id]
    );
    res.json({ message: "Consultation completed" });
  } catch (error) { next(error); }
});

module.exports = router;
