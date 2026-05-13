const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/auth");
const { query } = require("../config/database");

router.get("/:consultation_id", authenticate, async (req, res, next) => {
  try {
    const result = await query(
      `SELECT m.*, u.first_name, u.last_name, u.role as sender_role FROM messages m JOIN users u ON u.id=m.sender_id WHERE m.consultation_id=$1 ORDER BY m.created_at ASC`,
      [req.params.consultation_id]
    );
    await query("UPDATE messages SET is_read=true,read_at=NOW() WHERE consultation_id=$1 AND sender_id!=$2 AND is_read=false", [req.params.consultation_id, req.user.id]);
    res.json({ messages: result.rows });
  } catch (error) { next(error); }
});

module.exports = router;
