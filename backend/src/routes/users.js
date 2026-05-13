const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/auth");
const { query } = require("../config/database");

router.get("/", authenticate, async (req, res, next) => {
  try {
    const result = await query("SELECT id,email,phone,role,first_name,last_name,preferred_language,created_at FROM users WHERE id = $1", [req.user.id]);
    res.json({ user: result.rows[0] });
  } catch (error) { next(error); }
});

router.patch("/language", authenticate, async (req, res, next) => {
  try {
    await query("UPDATE users SET preferred_language = $1 WHERE id = $2", [req.body.language, req.user.id]);
    res.json({ message: "Language updated" });
  } catch (error) { next(error); }
});

module.exports = router;
