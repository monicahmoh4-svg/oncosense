const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/auth");
const { query } = require("../config/database");

router.get("/", authenticate, async (req, res, next) => {
  try {
    const { country, region } = req.query;
    let where = "WHERE is_active=true"; const params = []; let p = 0;
    if (country) { p++; where += ` AND country=$${p}`; params.push(country); }
    if (region) { p++; where += ` AND region=$${p}`; params.push(region); }
    const result = await query(`SELECT * FROM clinics ${where} ORDER BY name LIMIT 20`, params);
    res.json({ clinics: result.rows });
  } catch (error) { next(error); }
});

module.exports = router;
