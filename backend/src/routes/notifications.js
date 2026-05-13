const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/auth");
const { query } = require("../config/database");

router.get("/", authenticate, async (req, res, next) => {
  try {
    const result = await query("SELECT * FROM notifications WHERE user_id=$1 ORDER BY created_at DESC LIMIT 20", [req.user.id]);
    res.json({ notifications: result.rows });
  } catch (error) { next(error); }
});

router.patch("/:id/read", authenticate, async (req, res, next) => {
  try {
    await query("UPDATE notifications SET is_read=true,read_at=NOW() WHERE id=$1 AND user_id=$2", [req.params.id, req.user.id]);
    res.json({ message: "Read" });
  } catch (error) { next(error); }
});

module.exports = router;
