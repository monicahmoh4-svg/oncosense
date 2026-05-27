const express = require("express");
const router  = express.Router();
const { authenticate } = require("../middleware/auth");
const { query } = require("../config/database");
const logger = require("../utils/logger");

// GET /clinics?country=Kenya&county=Nairobi
router.get("/", authenticate, async (req, res) => {
  try {
    const { country, county, region, search } = req.query;

    let where  = "WHERE is_active = true";
    const params = [];
    let p = 0;

    if (country) { p++; where += ` AND country = $${p}`;  params.push(country); }

    // Support both 'county' and 'region' as the same field
    const regionVal = county || region;
    if (regionVal) { p++; where += ` AND region = $${p}`; params.push(regionVal); }

    if (search) {
      p++;
      where += ` AND (name ILIKE $${p} OR district ILIKE $${p} OR address ILIKE $${p})`;
      params.push(`%${search}%`);
    }

    const result = await query(
      `SELECT * FROM clinics ${where} ORDER BY name ASC LIMIT 100`,
      params
    );

    res.json({ clinics: result.rows });
  } catch (err) {
    logger.error("Clinics error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /clinics/counties?country=Kenya — returns distinct counties/regions
router.get("/counties", authenticate, async (req, res) => {
  try {
    const { country = "Kenya" } = req.query;
    const result = await query(
      `SELECT DISTINCT region FROM clinics WHERE country = $1 AND region IS NOT NULL ORDER BY region ASC`,
      [country]
    );
    res.json({ counties: result.rows.map(r => r.region) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
