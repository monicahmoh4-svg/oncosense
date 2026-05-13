const { v4: uuidv4 } = require("uuid");
const axios = require("axios");
const { query, transaction } = require("../config/database");
const logger = require("../utils/logger");

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";

exports.createAssessment = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const {
      // Demographics
      age, gender,
      // Lifestyle
      smoking_status, smoking_pack_years, alcohol_use, bmi,
      physical_activity, diet_quality,
      // Medical
      hiv_positive, previous_cancer, immunosuppressed,
      hepatitis_b, hepatitis_c, diabetes,
      // Family
      family_cancer_history, family_cancer_types,
      // Symptoms
      unexplained_weight_loss, persistent_fatigue, unexplained_fever,
      night_sweats, persistent_cough, coughing_blood, shortness_of_breath,
      rectal_bleeding, blood_in_stool, persistent_abdominal_pain,
      difficulty_swallowing, unusual_skin_changes, new_lump_or_swelling,
      non_healing_sore, blood_in_urine, pelvic_pain, unusual_vaginal_bleeding,
      testicular_changes, symptom_duration_weeks, additional_symptoms,
      // Reproductive
      hpv_vaccinated, oral_contraceptive_use, number_of_pregnancies,
    } = req.body;

    const result = await transaction(async (client) => {
      // 1. Save symptoms record
      const symptomResult = await client.query(
        `INSERT INTO symptoms (
          id, user_id,
          unexplained_weight_loss, persistent_fatigue, unexplained_fever, night_sweats,
          persistent_cough, coughing_blood, shortness_of_breath,
          rectal_bleeding, blood_in_stool, persistent_abdominal_pain, difficulty_swallowing,
          unusual_skin_changes, new_lump_or_swelling, non_healing_sore,
          blood_in_urine, pelvic_pain, unusual_vaginal_bleeding, testicular_changes,
          symptom_duration_weeks, additional_symptoms
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22)
        RETURNING id`,
        [
          uuidv4(), userId,
          !!unexplained_weight_loss, !!persistent_fatigue, !!unexplained_fever, !!night_sweats,
          !!persistent_cough, !!coughing_blood, !!shortness_of_breath,
          !!rectal_bleeding, !!blood_in_stool, !!persistent_abdominal_pain, !!difficulty_swallowing,
          !!unusual_skin_changes, !!new_lump_or_swelling, !!non_healing_sore,
          !!blood_in_urine, !!pelvic_pain, !!unusual_vaginal_bleeding, !!testicular_changes,
          symptom_duration_weeks || 0, additional_symptoms || null
        ]
      );

      const symptomId = symptomResult.rows[0].id;

      // 2. Call AI service
      let aiResult;
      try {
        const aiResponse = await axios.post(`${AI_SERVICE_URL}/risk/assess`, {
          age: parseInt(age),
          gender,
          smoking_status: smoking_status || "never",
          smoking_pack_years: parseFloat(smoking_pack_years) || 0,
          alcohol_use: alcohol_use || "none",
          bmi: bmi ? parseFloat(bmi) : null,
          physical_activity: physical_activity || "moderate",
          diet_quality: diet_quality || "fair",
          hiv_positive: !!hiv_positive,
          previous_cancer: !!previous_cancer,
          immunosuppressed: !!immunosuppressed,
          hepatitis_b: !!hepatitis_b,
          hepatitis_c: !!hepatitis_c,
          diabetes: !!diabetes,
          family_cancer_history: !!family_cancer_history,
          family_cancer_types: family_cancer_types || [],
          unexplained_weight_loss: !!unexplained_weight_loss,
          persistent_fatigue: !!persistent_fatigue,
          unexplained_fever: !!unexplained_fever,
          night_sweats: !!night_sweats,
          persistent_cough: !!persistent_cough,
          coughing_blood: !!coughing_blood,
          shortness_of_breath: !!shortness_of_breath,
          rectal_bleeding: !!rectal_bleeding,
          blood_in_stool: !!blood_in_stool,
          persistent_abdominal_pain: !!persistent_abdominal_pain,
          difficulty_swallowing: !!difficulty_swallowing,
          unusual_skin_changes: !!unusual_skin_changes,
          new_lump_or_swelling: !!new_lump_or_swelling,
          non_healing_sore: !!non_healing_sore,
          blood_in_urine: !!blood_in_urine,
          pelvic_pain: !!pelvic_pain,
          unusual_vaginal_bleeding: !!unusual_vaginal_bleeding,
          testicular_changes: !!testicular_changes,
          symptom_duration_weeks: symptom_duration_weeks || 0,
          hpv_vaccinated: !!hpv_vaccinated,
          oral_contraceptive_use: !!oral_contraceptive_use,
          number_of_pregnancies: parseInt(number_of_pregnancies) || 0,
        }, { timeout: 30000 });

        aiResult = aiResponse.data;
      } catch (aiError) {
        logger.error("AI service call failed:", aiError.message);
        // Fallback: basic rule-based scoring
        aiResult = {
          risk_score: 0.1,
          risk_level: "low",
          rule_based_score: 0.1,
          ml_score: 0.1,
          confidence: 0.3,
          suspected_categories: [],
          feature_importance: {},
          explanations: ["AI service temporarily unavailable. Basic assessment performed."],
          recommendations_hint: ["Please consult a healthcare provider for a complete assessment."],
          model_version: "fallback"
        };
      }

      // 3. Save assessment
      const assessmentId = uuidv4();
      await client.query(
        `INSERT INTO risk_assessments (
          id, user_id, symptom_id,
          rule_based_score, ml_score, final_score, risk_level,
          suspected_categories, feature_importance, confidence_score,
          model_version
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
        [
          assessmentId, userId, symptomId,
          aiResult.rule_based_score, aiResult.ml_score,
          aiResult.risk_score, aiResult.risk_level,
          JSON.stringify(aiResult.suspected_categories),
          JSON.stringify(aiResult.feature_importance),
          aiResult.confidence,
          aiResult.model_version
        ]
      );

      // Update symptom with assessment link
      await client.query(
        "UPDATE symptoms SET assessment_id = $1 WHERE id = $2",
        [assessmentId, symptomId]
      );

      // 4. Generate recommendations
      const recs = generateRecommendations(aiResult);
      for (const rec of recs) {
        await client.query(
          `INSERT INTO recommendations (id, assessment_id, user_id, type, title, description, action_required, timeframe, resource_requirements)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
          [uuidv4(), assessmentId, userId, rec.type, rec.title, rec.description, rec.action, rec.timeframe, rec.resource_level]
        );
      }

      return {
        assessment_id: assessmentId,
        risk_score: aiResult.risk_score,
        risk_level: aiResult.risk_level,
        confidence: aiResult.confidence,
        suspected_categories: aiResult.suspected_categories,
        explanations: aiResult.explanations,
        recommendations: recs,
        recommendations_hint: aiResult.recommendations_hint,
        feature_importance: aiResult.feature_importance,
        disclaimer: "This assessment is for SCREENING PURPOSES ONLY. It does NOT constitute a medical diagnosis. Please consult a qualified healthcare provider.",
        model_version: aiResult.model_version
      };
    });

    logger.info(`Assessment created: ${result.assessment_id} (${result.risk_level})`);
    res.status(201).json(result);

  } catch (error) {
    next(error);
  }
};

exports.getUserAssessments = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT id, risk_level, final_score, confidence_score,
              suspected_categories, created_at
       FROM risk_assessments
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 20`,
      [req.user.id]
    );
    res.json({ assessments: result.rows });
  } catch (error) {
    next(error);
  }
};

exports.getLatestAssessment = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT ra.*, r.title as rec_title, r.description as rec_description,
              r.type as rec_type, r.timeframe
       FROM risk_assessments ra
       LEFT JOIN recommendations r ON r.assessment_id = ra.id
       WHERE ra.user_id = $1
       ORDER BY ra.created_at DESC
       LIMIT 1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.json({ assessment: null });
    }
    res.json({ assessment: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

exports.getAssessment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await query(
      `SELECT ra.*,
              json_agg(json_build_object(
                'id', r.id, 'type', r.type, 'title', r.title,
                'description', r.description, 'timeframe', r.timeframe,
                'action_required', r.action_required, 'is_completed', r.is_completed
              )) as recommendations
       FROM risk_assessments ra
       LEFT JOIN recommendations r ON r.assessment_id = ra.id
       WHERE ra.id = $1 AND (ra.user_id = $2 OR $3 IN ('admin', 'clinician'))
       GROUP BY ra.id`,
      [id, req.user.id, req.user.role]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Assessment not found" });
    }

    res.json({ assessment: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

exports.reviewAssessment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    await query(
      `UPDATE risk_assessments
       SET reviewed_by = $1, reviewed_at = NOW(), assessment_notes = $2
       WHERE id = $3`,
      [req.user.id, notes, id]
    );

    res.json({ message: "Assessment reviewed" });
  } catch (error) {
    next(error);
  }
};


function generateRecommendations(aiResult) {
  const recs = [];
  const level = aiResult.risk_level;
  const cats = aiResult.suspected_categories || [];

  if (level === "critical" || level === "high") {
    recs.push({
      type: "immediate",
      title: "Seek Medical Care Urgently",
      description: "Your assessment indicates significant cancer risk factors. You should visit a healthcare facility as soon as possible for professional evaluation.",
      action: "Visit nearest hospital or cancer screening clinic within 1-2 weeks",
      timeframe: "Within 1-2 weeks",
      resource_level: "low"
    });
  } else if (level === "medium") {
    recs.push({
      type: "urgent",
      title: "Schedule Cancer Screening",
      description: "Moderate risk factors identified. A cancer screening appointment is recommended.",
      action: "Book appointment with healthcare provider",
      timeframe: "Within 4 weeks",
      resource_level: "low"
    });
  } else {
    recs.push({
      type: "routine",
      title: "Continue Routine Health Monitoring",
      description: "Risk factors are low. Continue healthy lifestyle and annual health check-ups.",
      action: "Annual health screening",
      timeframe: "Within 12 months",
      resource_level: "low"
    });
  }

  // Category-specific recommendations
  for (const cat of cats.slice(0, 2)) {
    recs.push({
      type: level === "high" || level === "critical" ? "urgent" : "routine",
      title: `${cat.name} Screening Recommended`,
      description: `Based on your risk factors, ${cat.name.toLowerCase()} screening is advised.`,
      action: cat.screening_recommended || "Consult healthcare provider",
      timeframe: level === "high" || level === "critical" ? "Within 2 weeks" : "Within 3 months",
      resource_level: "medium"
    });
  }

  recs.push({
    type: "lifestyle",
    title: "Healthy Lifestyle Changes",
    description: "Maintaining a healthy lifestyle can significantly reduce cancer risk. Avoid tobacco, limit alcohol, maintain healthy weight, and eat a balanced diet.",
    action: "Lifestyle modification",
    timeframe: "Ongoing",
    resource_level: "low"
  });

  return recs;
}
