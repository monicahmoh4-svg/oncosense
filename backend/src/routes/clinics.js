const express = require("express");
const router  = express.Router();
const { authenticate } = require("../middleware/auth");
const { query } = require("../config/database");
const logger = require("../utils/logger");

// GET /clinics/counties?country=Kenya
router.get("/counties", authenticate, async (req, res) => {
  try {
    const country = req.query.country || "Kenya";
    const result  = await query(
      `SELECT DISTINCT region FROM clinics
       WHERE country = $1 AND region IS NOT NULL AND is_active = true
       ORDER BY region ASC`,
      [country]
    );
    res.json({ counties: result.rows.map(r => r.region) });
  } catch (err) {
    logger.error("Counties error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /clinics?country=Kenya&county=Nairobi&search=hospital
router.get("/", authenticate, async (req, res) => {
  try {
    const { country, county, region, search } = req.query;
    let where    = "WHERE is_active = true";
    const params = [];
    let p        = 0;

    if (country) {
      p++;
      where += ` AND country = $${p}`;
      params.push(country);
    }

    const countyVal = county || region;
    if (countyVal) {
      p++;
      where += ` AND region = $${p}`;
      params.push(countyVal);
    }

    if (search) {
      p++;
      where += ` AND (name ILIKE $${p} OR address ILIKE $${p} OR district ILIKE $${p})`;
      params.push(`%${search}%`);
    }

    const result = await query(
      `SELECT * FROM clinics ${where} ORDER BY name ASC LIMIT 100`,
      params
    );

    logger.info(`Clinics: country=${country} county=${countyVal} found=${result.rows.length}`);
    res.json({ clinics: result.rows });
  } catch (err) {
    logger.error("Clinics error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
