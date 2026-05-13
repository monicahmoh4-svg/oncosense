const express = require("express");
const router = express.Router();
const { authenticate, authorize } = require("../middleware/auth");
const { query } = require("../config/database");

const adminOnly = [authenticate, authorize("admin", "clinician")];

// ── Dashboard Stats
router.get("/dashboard", adminOnly, async (req, res, next) => {
  try {
    const [
      totalUsers, riskBreakdown, recentAssessments,
      consultationStats, regionalData, weeklyTrend
    ] = await Promise.all([
      // Total users by role
      query(`SELECT role, COUNT(*) as count FROM users WHERE is_active = true GROUP BY role`),
      
      // Risk level breakdown
      query(`SELECT risk_level, COUNT(*) as count FROM risk_assessments 
             WHERE created_at >= NOW() - INTERVAL '30 days' GROUP BY risk_level`),
      
      // Recent assessments
      query(`SELECT ra.id, ra.risk_level, ra.final_score, ra.created_at,
                    u.first_name, u.last_name, u.email
             FROM risk_assessments ra
             JOIN users u ON u.id = ra.user_id
             ORDER BY ra.created_at DESC LIMIT 10`),
      
      // Consultation stats
      query(`SELECT status, COUNT(*) as count FROM consultations GROUP BY status`),
      
      // Regional distribution
      query(`SELECT hp.country, hp.region, COUNT(*) as users,
                    SUM(CASE WHEN ra.risk_level IN ('high','critical') THEN 1 ELSE 0 END) as high_risk
             FROM health_profiles hp
             LEFT JOIN risk_assessments ra ON ra.user_id = hp.user_id
             WHERE hp.country IS NOT NULL
             GROUP BY hp.country, hp.region
             ORDER BY users DESC LIMIT 20`),
      
      // Weekly trend (last 4 weeks)
      query(`SELECT DATE_TRUNC('week', created_at) as week,
                    COUNT(*) as assessments,
                    SUM(CASE WHEN risk_level IN ('high','critical') THEN 1 ELSE 0 END) as high_risk
             FROM risk_assessments
             WHERE created_at >= NOW() - INTERVAL '28 days'
             GROUP BY week ORDER BY week`)
    ]);

    res.json({
      total_users: totalUsers.rows,
      risk_breakdown: riskBreakdown.rows,
      recent_assessments: recentAssessments.rows,
      consultation_stats: consultationStats.rows,
      regional_data: regionalData.rows,
      weekly_trend: weeklyTrend.rows,
      generated_at: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

// ── User Management
router.get("/users", adminOnly, async (req, res, next) => {
  try {
    const { role, page = 1, limit = 20, search } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = "WHERE u.is_active = true";
    const params = [];
    let paramCount = 0;

    if (role) {
      paramCount++;
      whereClause += ` AND u.role = $${paramCount}`;
      params.push(role);
    }

    if (search) {
      paramCount++;
      whereClause += ` AND (u.first_name ILIKE $${paramCount} OR u.last_name ILIKE $${paramCount} OR u.email ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    params.push(limit, offset);

    const result = await query(
      `SELECT u.id, u.email, u.phone, u.role, u.first_name, u.last_name,
              u.is_active, u.is_verified, u.last_login, u.created_at,
              hp.profile_completed,
              (SELECT COUNT(*) FROM risk_assessments WHERE user_id = u.id) as assessment_count
       FROM users u
       LEFT JOIN health_profiles hp ON hp.user_id = u.id
       ${whereClause}
       ORDER BY u.created_at DESC
       LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`,
      params
    );

    const countResult = await query(
      `SELECT COUNT(*) FROM users u ${whereClause.replace(`LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`, "")}`,
      params.slice(0, paramCount)
    );

    res.json({
      users: result.rows,
      pagination: {
        total: parseInt(countResult.rows[0].count),
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(countResult.rows[0].count / limit)
      }
    });
  } catch (error) {
    next(error);
  }
});

// ── High Risk Users
router.get("/high-risk-users", adminOnly, async (req, res, next) => {
  try {
    const result = await query(
      `SELECT DISTINCT ON (ra.user_id)
              ra.id as assessment_id, ra.risk_level, ra.final_score, ra.created_at,
              u.first_name, u.last_name, u.email, u.phone,
              hp.country, hp.region, hp.district
       FROM risk_assessments ra
       JOIN users u ON u.id = ra.user_id
       LEFT JOIN health_profiles hp ON hp.user_id = u.id
       WHERE ra.risk_level IN ('high', 'critical')
       ORDER BY ra.user_id, ra.created_at DESC`
    );
    res.json({ users: result.rows });
  } catch (error) {
    next(error);
  }
});

// ── Analytics - Cancer type distribution
router.get("/analytics/cancer-types", adminOnly, async (req, res, next) => {
  try {
    const result = await query(
      `SELECT
         cat->>'type' as cancer_type,
         cat->>'name' as cancer_name,
         COUNT(*) as frequency,
         AVG((cat->>'concern_score')::float) as avg_concern
       FROM risk_assessments ra,
            jsonb_array_elements(suspected_categories) as cat
       WHERE ra.created_at >= NOW() - INTERVAL '90 days'
         AND jsonb_array_length(suspected_categories) > 0
       GROUP BY cat->>'type', cat->>'name'
       ORDER BY frequency DESC`
    );
    res.json({ distribution: result.rows });
  } catch (error) {
    next(error);
  }
});

// ── Toggle user status
router.patch("/users/:id/toggle", [authenticate, authorize("admin")], async (req, res, next) => {
  try {
    const result = await query(
      `UPDATE users SET is_active = NOT is_active, updated_at = NOW()
       WHERE id = $1 RETURNING id, is_active`,
      [req.params.id]
    );
    res.json({ user: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

// ── All assessments for admin review
router.get("/assessments", adminOnly, async (req, res, next) => {
  try {
    const { risk_level, reviewed, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let where = "WHERE 1=1";
    const params = [];
    let p = 0;

    if (risk_level) { p++; where += ` AND ra.risk_level = $${p}`; params.push(risk_level); }
    if (reviewed === "false") { where += ` AND ra.reviewed_by IS NULL`; }
    if (reviewed === "true") { where += ` AND ra.reviewed_by IS NOT NULL`; }

    params.push(limit, offset);

    const result = await query(
      `SELECT ra.id, ra.risk_level, ra.final_score, ra.confidence_score,
              ra.suspected_categories, ra.created_at, ra.reviewed_at,
              u.first_name, u.last_name, u.email,
              reviewer.first_name as reviewer_first, reviewer.last_name as reviewer_last
       FROM risk_assessments ra
       JOIN users u ON u.id = ra.user_id
       LEFT JOIN users reviewer ON reviewer.id = ra.reviewed_by
       ${where}
       ORDER BY ra.created_at DESC
       LIMIT $${p + 1} OFFSET $${p + 2}`,
      params
    );

    res.json({ assessments: result.rows });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
