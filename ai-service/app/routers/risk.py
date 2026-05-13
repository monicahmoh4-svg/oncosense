"""
Risk Assessment API endpoints
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, List
import logging

from app.engines.risk_engine import RiskInput, get_risk_engine

logger = logging.getLogger(__name__)
router = APIRouter()


class RiskAssessmentRequest(BaseModel):
    # Demographics
    age: int = Field(..., ge=0, le=120)
    gender: str = Field(..., pattern="^(male|female|other|prefer_not_to_say)$")
    
    # Lifestyle
    smoking_status: str = Field("never", pattern="^(never|former|current)$")
    smoking_pack_years: float = Field(0, ge=0)
    alcohol_use: str = Field("none", pattern="^(none|occasional|moderate|heavy)$")
    bmi: Optional[float] = Field(None, ge=10, le=70)
    physical_activity: str = Field("moderate")
    diet_quality: str = Field("fair")
    
    # Medical
    hiv_positive: bool = False
    previous_cancer: bool = False
    immunosuppressed: bool = False
    hepatitis_b: bool = False
    hepatitis_c: bool = False
    diabetes: bool = False
    
    # Family history
    family_cancer_history: bool = False
    family_cancer_types: List[str] = Field(default_factory=list)
    
    # Symptoms
    unexplained_weight_loss: bool = False
    persistent_fatigue: bool = False
    unexplained_fever: bool = False
    night_sweats: bool = False
    persistent_cough: bool = False
    coughing_blood: bool = False
    shortness_of_breath: bool = False
    rectal_bleeding: bool = False
    blood_in_stool: bool = False
    persistent_abdominal_pain: bool = False
    difficulty_swallowing: bool = False
    unusual_skin_changes: bool = False
    new_lump_or_swelling: bool = False
    non_healing_sore: bool = False
    blood_in_urine: bool = False
    pelvic_pain: bool = False
    unusual_vaginal_bleeding: bool = False
    testicular_changes: bool = False
    symptom_duration_weeks: int = Field(0, ge=0)
    
    # Reproductive
    hpv_vaccinated: bool = False
    oral_contraceptive_use: bool = False
    number_of_pregnancies: int = Field(0, ge=0)


class RiskAssessmentResponse(BaseModel):
    risk_score: float
    risk_level: str
    rule_based_score: float
    ml_score: float
    confidence: float
    suspected_categories: list
    feature_importance: dict
    explanations: list
    recommendations_hint: list
    model_version: str
    disclaimer: str


@router.post("/assess", response_model=RiskAssessmentResponse)
async def assess_risk(request: RiskAssessmentRequest):
    """
    Perform cancer risk assessment.
    
    This endpoint uses a hybrid rule-based + ML model to assess cancer risk.
    
    **IMPORTANT DISCLAIMER**: This assessment is for SCREENING PURPOSES ONLY
    and does NOT constitute a medical diagnosis.
    """
    try:
        engine = get_risk_engine()
        
        # Convert request to RiskInput
        risk_input = RiskInput(
            age=request.age,
            gender=request.gender,
            smoking_status=request.smoking_status,
            smoking_pack_years=request.smoking_pack_years,
            alcohol_use=request.alcohol_use,
            bmi=request.bmi,
            physical_activity=request.physical_activity,
            diet_quality=request.diet_quality,
            hiv_positive=request.hiv_positive,
            previous_cancer=request.previous_cancer,
            immunosuppressed=request.immunosuppressed,
            hepatitis_b=request.hepatitis_b,
            hepatitis_c=request.hepatitis_c,
            diabetes=request.diabetes,
            family_cancer_history=request.family_cancer_history,
            family_cancer_types=request.family_cancer_types,
            unexplained_weight_loss=request.unexplained_weight_loss,
            persistent_fatigue=request.persistent_fatigue,
            unexplained_fever=request.unexplained_fever,
            night_sweats=request.night_sweats,
            persistent_cough=request.persistent_cough,
            coughing_blood=request.coughing_blood,
            shortness_of_breath=request.shortness_of_breath,
            rectal_bleeding=request.rectal_bleeding,
            blood_in_stool=request.blood_in_stool,
            persistent_abdominal_pain=request.persistent_abdominal_pain,
            difficulty_swallowing=request.difficulty_swallowing,
            unusual_skin_changes=request.unusual_skin_changes,
            new_lump_or_swelling=request.new_lump_or_swelling,
            non_healing_sore=request.non_healing_sore,
            blood_in_urine=request.blood_in_urine,
            pelvic_pain=request.pelvic_pain,
            unusual_vaginal_bleeding=request.unusual_vaginal_bleeding,
            testicular_changes=request.testicular_changes,
            symptom_duration_weeks=request.symptom_duration_weeks,
            hpv_vaccinated=request.hpv_vaccinated,
            oral_contraceptive_use=request.oral_contraceptive_use,
            number_of_pregnancies=request.number_of_pregnancies,
        )
        
        result = engine.assess(risk_input)
        
        return RiskAssessmentResponse(
            risk_score=result.risk_score,
            risk_level=result.risk_level,
            rule_based_score=result.rule_based_score,
            ml_score=result.ml_score,
            confidence=result.confidence,
            suspected_categories=result.suspected_categories,
            feature_importance=result.feature_importance,
            explanations=result.explanations,
            recommendations_hint=result.recommendations_hint,
            model_version=result.model_version,
            disclaimer=result.disclaimer
        )
    
    except Exception as e:
        logger.error(f"Risk assessment error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Assessment failed: {str(e)}")


@router.get("/model-info")
async def get_model_info():
    """Get information about the currently loaded risk model"""
    engine = get_risk_engine()
    return {
        "model_version": engine.model_version,
        "ml_model_loaded": engine.ml_engine.model is not None,
        "approach": "Hybrid Rule-Based + Logistic Regression",
        "cancer_categories_tracked": list(engine.rule_engine.__class__.__name__),
        "disclaimer": "Model trained on synthetic data. For screening support only."
    }
