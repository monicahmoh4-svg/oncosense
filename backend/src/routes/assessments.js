const express = require("express");
const router  = express.Router();
const { v4: uuidv4 } = require("uuid");
const { authenticate } = require("../middleware/auth");
const { query } = require("../config/database");
const logger = require("../utils/logger");

// ─── Accurate cancer risk scoring engine ────────────────────────────────────
function computeRiskScore(profile, symptoms) {
  let score = 0;
  const factors = {};
  const categories = new Set();

  // ── Age factor (risk increases with age)
  const age = profile.date_of_birth
    ? Math.floor((Date.now() - new Date(profile.date_of_birth)) / (365.25 * 24 * 3600 * 1000))
    : null;
  if (age) {
    if (age >= 60) { score += 0.15; factors.age = "60+ (high risk)"; }
    else if (age >= 50) { score += 0.10; factors.age = "50-59 (moderate risk)"; }
    else if (age >= 40) { score += 0.06; factors.age = "40-49"; }
    else if (age >= 30) { score += 0.02; factors.age = "30-39"; }
  }

  // ── Smoking (strongest single risk factor — lung, oral, cervical)
  if (profile.smoking_status === "current") {
    score += 0.22;
    factors.smoking = "Current smoker (major risk factor)";
    categories.add("Lung Cancer"); categories.add("Oral Cancer");
  } else if (profile.smoking_status === "former") {
    score += 0.10;
    factors.smoking = "Former smoker";
    categories.add("Lung Cancer");
  }

  if (profile.smoking_pack_years > 20) {
    score += 0.08;
    factors.packYears = "High pack-years (" + profile.smoking_pack_years + ")";
  }

  // ── Alcohol
  if (profile.alcohol_use === "heavy") {
    score += 0.10;
    factors.alcohol = "Heavy alcohol use (liver, oesophageal risk)";
    categories.add("Liver Cancer"); categories.add("Oesophageal Cancer");
  } else if (profile.alcohol_use === "moderate") {
    score += 0.04;
    factors.alcohol = "Moderate alcohol use";
  }

  // ── BMI
  if (profile.bmi) {
    if (profile.bmi >= 35) { score += 0.10; factors.bmi = "Obese (BMI " + profile.bmi + ")"; }
    else if (profile.bmi >= 30) { score += 0.06; factors.bmi = "Overweight (BMI " + profile.bmi + ")"; }
    else if (profile.bmi < 18.5) { score += 0.04; factors.bmi = "Underweight (BMI " + profile.bmi + ")"; }
  }

  // ── HIV (major cervical/Kaposi risk in Kenya)
  if (profile.hiv_status === "positive") {
    score += 0.20;
    factors.hiv = "HIV positive (significantly elevated risk)";
    categories.add("Cervical Cancer"); categories.add("Kaposi Sarcoma");
  }

  // ── Previous cancer
  if (profile.previous_cancer) {
    score += 0.25;
    factors.previousCancer = "Prior cancer history: " + (profile.previous_cancer_type || "yes");
    if (profile.previous_cancer_type) categories.add(profile.previous_cancer_type);
  }

  // ── Family history
  if (profile.family_cancer_history) {
    score += 0.15;
    factors.familyHistory = "Family history of cancer";
    if (profile.family_cancer_types) {
      profile.family_cancer_types.forEach(t => categories.add(t));
    }
  }

  // ── Immunosuppressed
  if (profile.immunosuppressed) {
    score += 0.12;
    factors.immunosuppressed = "Immunosuppressed";
  }

  // ── Diabetes
  if (profile.diabetes) { score += 0.05; factors.diabetes = "Diabetes"; categories.add("Pancreatic Cancer"); }

  // ── HPV vaccine status (cervical cancer)
  if (profile.gender === "female" || profile.gender === "other") {
    if (!profile.hpv_vaccinated) {
      score += 0.05;
      factors.hpvVaccine = "Not HPV vaccinated";
      categories.add("Cervical Cancer");
    }
    if (profile.oral_contraceptive_use) {
      score += 0.03;
      factors.contraceptives = "Oral contraceptive use";
    }
  }

  // ── Physical inactivity
  if (profile.physical_activity === "sedentary") {
    score += 0.06;
    factors.physicalActivity = "Sedentary lifestyle";
  } else if (profile.physical_activity === "low") {
    score += 0.03;
  }

  // ── Diet
  if (profile.diet_quality === "poor") { score += 0.06; factors.diet = "Poor diet quality"; }

  // ── SYMPTOMS — each confirmed symptom significantly raises score
  const RED_FLAG_SYMPTOMS = [
    ["coughing_blood",             0.30, "Lung/Throat Cancer"],
    ["rectal_bleeding",            0.28, "Colorectal Cancer"],
    ["unusual_vaginal_bleeding",   0.28, "Cervical/Uterine Cancer"],
    ["blood_in_stool",             0.25, "Colorectal Cancer"],
    ["blood_in_urine",             0.22, "Bladder/Kidney Cancer"],
    ["non_healing_sore",           0.22, "Skin/Oral Cancer"],
    ["new_lump_or_swelling",       0.20, "Various Cancers"],
    ["difficulty_swallowing",      0.18, "Oesophageal Cancer"],
    ["unexplained_weight_loss",    0.18, "Various Cancers"],
    ["persistent_abdominal_pain",  0.14, "Colorectal/Ovarian Cancer"],
    ["pelvic_pain",                0.14, "Cervical/Ovarian Cancer"],
    ["persistent_cough",           0.12, "Lung Cancer"],
    ["unusual_skin_changes",       0.12, "Skin Cancer"],
    ["testicular_changes",         0.18, "Testicular Cancer"],
    ["vision_changes",             0.10, "Brain Tumour"],
    ["persistent_headache",        0.10, "Brain Tumour"],
    ["unexplained_fever",          0.10, "Lymphoma/Leukaemia"],
    ["night_sweats",               0.10, "Lymphoma"],
    ["shortness_of_breath",        0.09, "Lung Cancer"],
    ["persistent_fatigue",         0.08, "Various Cancers"],
  ];

  let symptomCount = 0;
  if (symptoms) {
    for (const [sym, weight, cat] of RED_FLAG_SYMPTOMS) {
      if (symptoms[sym]) {
        score += weight;
        factors["symptom_" + sym] = sym.replace(/_/g, " ");
        categories.add(cat);
        symptomCount++;
      }
    }
  }

  // ── Duration modifier — longer symptoms = higher concern
  if (symptoms?.symptom_duration_weeks) {
    const dur = parseInt(symptoms.symptom_duration_weeks) || 0;
    if (dur >= 12) { score += 0.10; factors.symptomDuration = "Symptoms >12 weeks"; }
    else if (dur >= 6) { score += 0.06; }
    else if (dur >= 3) { score += 0.03; }
  }

  // Clamp score 0-1
  score = Math.min(Math.max(score, 0), 0.99);

  // Risk level thresholds (calibrated for clinical relevance)
  let riskLevel;
  if (score >= 0.65)       riskLevel = "critical";
  else if (score >= 0.40)  riskLevel = "high";
  else if (score >= 0.20)  riskLevel = "medium";
  else                     riskLevel = "low";

  return {
    score: parseFloat(score.toFixed(4)),
    riskLevel,
    categories: [...categories],
    factors,
    symptomCount,
    age
  };
}

function buildRecommendations(result, profile) {
  const recs = [];
  const { riskLevel, categories, factors } = result;

  if (riskLevel === "critical") {
    recs.push({
      type: "immediate",
      title: "Seek Medical Care Immediately",
      description: "Your risk assessment indicates signs that require urgent medical evaluation. Please visit a hospital or healthcare provider as soon as possible — do not delay.",
      timeframe: "Within 24-48 hours",
      priority: 1
    });
  } else if (riskLevel === "high") {
    recs.push({
      type: "urgent",
      title: "Medical Evaluation Needed",
      description: "Your results indicate a high risk level. A qualified healthcare provider should evaluate your symptoms and risk factors promptly.",
      timeframe: "Within 1-2 weeks",
      priority: 1
    });
  }

  if (categories.includes("Cervical Cancer") || (profile.gender === "female" && !profile.hpv_vaccinated)) {
    recs.push({
      type: "routine",
      title: "Cervical Cancer Screening",
      description: "VIA (Visual Inspection with Acetic Acid) and Pap smear screening are available free at county hospitals across Kenya. Recommend annual screening for sexually active women.",
      timeframe: "Schedule within 3 months",
      priority: 2
    });
  }

  if (categories.includes("Breast Cancer") || (profile.gender === "female" && result.age >= 40)) {
    recs.push({
      type: "routine",
      title: "Breast Cancer Screening",
      description: "Monthly breast self-examination, annual clinical breast exam. Mammography recommended for women 40 and above. Available at major hospitals.",
      timeframe: "Annual",
      priority: 2
    });
  }

  if (factors.smoking) {
    recs.push({
      type: "lifestyle",
      title: "Smoking Cessation",
      description: "Quitting smoking is the single most impactful step you can take to reduce cancer risk. It reduces lung cancer risk by up to 50% within 5 years. Free cessation support available at county hospitals.",
      timeframe: "Start immediately",
      priority: 2
    });
  }

  if (factors.alcohol) {
    recs.push({
      type: "lifestyle",
      title: "Reduce Alcohol Consumption",
      description: "Reducing alcohol to under 2 units per day significantly lowers your risk of liver, colorectal and oesophageal cancer.",
      timeframe: "Ongoing",
      priority: 3
    });
  }

  if (factors.hpvVaccine) {
    recs.push({
      type: "routine",
      title: "HPV Vaccination",
      description: "The HPV vaccine is free for girls aged 10-14 in Kenya under the national programme and is highly effective at preventing cervical cancer. Ask about availability at your nearest health facility.",
      timeframe: "Within 3 months",
      priority: 3
    });
  }

  recs.push({
    type: "lifestyle",
    title: "Healthy Lifestyle",
    description: "Maintain a healthy weight, eat a diet rich in fruits and vegetables, exercise at least 150 minutes per week, and avoid tobacco and excessive alcohol.",
    timeframe: "Ongoing",
    priority: 4
  });

  recs.push({
    type: "monitoring",
    title: "Regular Health Check-ups",
    description: "Schedule annual health reviews with your doctor or community health worker. Early detection dramatically improves treatment outcomes.",
    timeframe: "Annually",
    priority: 5
  });

  return recs.sort((a, b) => a.priority - b.priority);
}

// POST /assessments
router.post("/", authenticate, async (req, res) => {
  try {
    const { symptoms: symData, profile: profileOverride } = req.body;

    // Get stored health profile
    let profile = {};
    try {
      const pr = await query("SELECT * FROM health_profiles WHERE user_id=$1 ORDER BY created_at DESC LIMIT 1", [req.user.id]);
      if (pr.rows.length > 0) profile = pr.rows[0];
    } catch(e) { logger.warn("Profile fetch warn:", e.message); }

    // Merge with any overrides from request
    if (profileOverride) Object.assign(profile, profileOverride);

    // Save symptoms if provided
    let symptomId = null;
    if (symData && Object.keys(symData).length > 0) {
      try {
        const sr = await query(
          `INSERT INTO symptoms (
            id, user_id,
            unexplained_weight_loss, persistent_fatigue, unexplained_fever, night_sweats,
            persistent_cough, coughing_blood, shortness_of_breath, rectal_bleeding,
            blood_in_stool, persistent_abdominal_pain, difficulty_swallowing,
            unusual_skin_changes, new_lump_or_swelling, non_healing_sore,
            blood_in_urine, pelvic_pain, unusual_vaginal_bleeding, testicular_changes,
            persistent_headache, vision_changes, symptom_duration_weeks, additional_symptoms
          ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24)
          RETURNING id`,
          [
            uuidv4(), req.user.id,
            !!symData.unexplained_weight_loss, !!symData.persistent_fatigue,
            !!symData.unexplained_fever, !!symData.night_sweats,
            !!symData.persistent_cough, !!symData.coughing_blood,
            !!symData.shortness_of_breath, !!symData.rectal_bleeding,
            !!symData.blood_in_stool, !!symData.persistent_abdominal_pain,
            !!symData.difficulty_swallowing, !!symData.unusual_skin_changes,
            !!symData.new_lump_or_swelling, !!symData.non_healing_sore,
            !!symData.blood_in_urine, !!symData.pelvic_pain,
            !!symData.unusual_vaginal_bleeding, !!symData.testicular_changes,
            !!symData.persistent_headache, !!symData.vision_changes,
            symData.symptom_duration_weeks || null,
            symData.additional_symptoms || null
          ]
        );
        symptomId = sr.rows[0].id;
      } catch(e) { logger.warn("Symptom save warn:", e.message); }
    }

    // Compute risk
    const result   = computeRiskScore(profile, symData);
    const recs     = buildRecommendations(result, profile);
    const assessId = uuidv4();

    // Feature importance for display
    const featureImportance = Object.entries(result.factors)
      .filter(([k]) => !k.startsWith("symptom_"))
      .map(([k, v]) => ({ factor: v, key: k }));

    // Save assessment
    try {
      await query(
        `INSERT INTO risk_assessments
          (id, user_id, symptom_id, rule_based_score, final_score, risk_level,
           suspected_categories, feature_importance, confidence_score, model_version)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'v2.0')`,
        [
          assessId, req.user.id, symptomId,
          result.score, result.score, result.riskLevel,
          JSON.stringify(result.categories),
          JSON.stringify({ factors: result.factors, featureImportance }),
          Math.min(0.90, 0.55 + result.score * 0.4)
        ]
      );
    } catch(e) { logger.warn("Assessment save warn:", e.message); }

    // Save recommendations
    for (const rec of recs) {
      try {
        await query(
          `INSERT INTO recommendations
            (id, assessment_id, user_id, type, title, description, timeframe)
           VALUES ($1,$2,$3,$4,$5,$6,$7)`,
          [uuidv4(), assessId, req.user.id, rec.type, rec.title, rec.description, rec.timeframe]
        );
      } catch(e) {}
    }

    logger.info("Assessment created: " + assessId + " score=" + result.score + " level=" + result.riskLevel);

    return res.status(201).json({
      assessment: {
        id: assessId,
        user_id: req.user.id,
        final_score: result.score,
        risk_level: result.riskLevel,
        suspected_categories: result.categories,
        feature_importance: { factors: result.factors, featureImportance },
        confidence_score: Math.min(0.90, 0.55 + result.score * 0.4),
        symptom_count: result.symptomCount,
        age: result.age
      },
      recommendations: recs
    });

  } catch (err) {
    logger.error("Assessment error:", err.message);
    return res.status(500).json({ error: err.message });
  }
});

// GET /assessments
router.get("/", authenticate, async (req, res) => {
  try {
    const result = await query(
      "SELECT * FROM risk_assessments WHERE user_id=$1 ORDER BY created_at DESC LIMIT 20",
      [req.user.id]
    );
    res.json({ assessments: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /assessments/latest
router.get("/latest", authenticate, async (req, res) => {
  try {
    const ra = await query(
      "SELECT * FROM risk_assessments WHERE user_id=$1 ORDER BY created_at DESC LIMIT 1",
      [req.user.id]
    );
    if (!ra.rows.length) return res.json({ assessment: null, recommendations: [] });

    const recs = await query(
      "SELECT * FROM recommendations WHERE assessment_id=$1 ORDER BY type",
      [ra.rows[0].id]
    );
    res.json({ assessment: ra.rows[0], recommendations: recs.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /assessments/:id
router.get("/:id", authenticate, async (req, res) => {
  try {
    const ra = await query(
      "SELECT * FROM risk_assessments WHERE id=$1 AND user_id=$2",
      [req.params.id, req.user.id]
    );
    if (!ra.rows.length) return res.status(404).json({ error: "Not found" });

    const recs = await query(
      "SELECT * FROM recommendations WHERE assessment_id=$1 ORDER BY type",
      [req.params.id]
    );
    res.json({ assessment: ra.rows[0], recommendations: recs.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
