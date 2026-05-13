const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/auth");
const { query } = require("../config/database");
const { v4: uuidv4 } = require("uuid");

router.get("/me", authenticate, async (req, res, next) => {
  try {
    const result = await query("SELECT * FROM health_profiles WHERE user_id = $1", [req.user.id]);
    res.json({ profile: result.rows[0] || null });
  } catch (error) { next(error); }
});

router.put("/me", authenticate, async (req, res, next) => {
  try {
    const existing = await query("SELECT id FROM health_profiles WHERE user_id = $1", [req.user.id]);
    const fields = ["date_of_birth","gender","country","region","district","smoking_status","smoking_pack_years","alcohol_use","physical_activity","bmi","diet_quality","hiv_status","diabetes","hypertension","previous_cancer","previous_cancer_type","immunosuppressed","number_of_pregnancies","breastfeeding_history","age_first_menstruation","menopause_status","hpv_vaccinated","oral_contraceptive_use","family_cancer_history","family_cancer_types","family_cancer_relations"];
    const values = fields.map(f => req.body[f] !== undefined ? req.body[f] : null);
    const completed = !!(req.body.date_of_birth && req.body.gender);
    if (existing.rows.length > 0) {
      const setClause = fields.map((f, i) => `${f} = $${i+2}`).join(", ");
      await query(`UPDATE health_profiles SET ${setClause}, profile_completed = $${fields.length+2}, last_updated = NOW() WHERE user_id = $1`, [req.user.id, ...values, completed]);
    } else {
      const cols = ["id","user_id",...fields,"profile_completed"];
      const ph = cols.map((_,i) => `$${i+1}`).join(", ");
      await query(`INSERT INTO health_profiles (${cols.join(", ")}) VALUES (${ph})`, [uuidv4(), req.user.id, ...values, completed]);
    }
    const updated = await query("SELECT * FROM health_profiles WHERE user_id = $1", [req.user.id]);
    res.json({ profile: updated.rows[0] });
  } catch (error) { next(error); }
});

module.exports = router;
