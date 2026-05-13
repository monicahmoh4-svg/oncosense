"""
OncoSense Hybrid Risk Scoring Engine
Combines rule-based logic with ML (Logistic Regression)
for cancer risk stratification.

DISCLAIMER: This engine is for RISK STRATIFICATION only.
It does NOT provide medical diagnosis.
"""
import numpy as np
import pandas as pd
import joblib
import logging
import os
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report

logger = logging.getLogger(__name__)

MODEL_PATH = os.path.join(os.path.dirname(__file__), "../models/risk_model.joblib")
MODEL_VERSION = "1.0.0"

# ─── Risk Categories ─────────────────────────────────────────────
CANCER_CATEGORIES = {
    "cervical": {
        "name": "Cervical Cancer",
        "risk_factors": ["female", "hpv_unvaccinated", "multiple_partners", "smoking", "hiv"],
        "screening": "Pap smear / VIA / HPV test",
        "icd_hint": "C53"
    },
    "lung": {
        "name": "Lung Cancer",
        "risk_factors": ["smoking", "persistent_cough", "hemoptysis", "weight_loss", "age_50plus"],
        "screening": "Low-dose CT scan",
        "icd_hint": "C34"
    },
    "breast": {
        "name": "Breast Cancer",
        "risk_factors": ["female", "family_breast", "age_40plus", "obesity", "nulliparous"],
        "screening": "Mammography / Clinical breast exam",
        "icd_hint": "C50"
    },
    "colorectal": {
        "name": "Colorectal Cancer",
        "risk_factors": ["rectal_bleeding", "age_50plus", "family_colorectal", "sedentary", "obesity"],
        "screening": "FOBT / Colonoscopy",
        "icd_hint": "C18"
    },
    "oral": {
        "name": "Oral Cancer",
        "risk_factors": ["smoking", "alcohol", "non_healing_sore", "tobacco_chewing", "hpv"],
        "screening": "Oral examination",
        "icd_hint": "C00-C14"
    },
    "prostate": {
        "name": "Prostate Cancer",
        "risk_factors": ["male", "age_50plus", "family_prostate", "african_ancestry"],
        "screening": "PSA test / DRE",
        "icd_hint": "C61"
    },
    "liver": {
        "name": "Liver Cancer",
        "risk_factors": ["hepatitis_b", "hepatitis_c", "alcohol", "cirrhosis", "aflatoxin"],
        "screening": "AFP + Ultrasound",
        "icd_hint": "C22"
    },
    "esophageal": {
        "name": "Esophageal Cancer",
        "risk_factors": ["difficulty_swallowing", "smoking", "alcohol", "weight_loss", "age_50plus"],
        "screening": "Endoscopy",
        "icd_hint": "C15"
    }
}


@dataclass
class RiskInput:
    """Standardized input for risk assessment"""
    # Demographics
    age: int
    gender: str  # male, female, other
    
    # Lifestyle
    smoking_status: str = "never"  # never, former, current
    smoking_pack_years: float = 0
    alcohol_use: str = "none"  # none, occasional, moderate, heavy
    bmi: Optional[float] = None
    physical_activity: str = "moderate"
    diet_quality: str = "fair"
    
    # Medical history
    hiv_positive: bool = False
    previous_cancer: bool = False
    immunosuppressed: bool = False
    hepatitis_b: bool = False
    hepatitis_c: bool = False
    diabetes: bool = False
    
    # Family history
    family_cancer_history: bool = False
    family_cancer_types: List[str] = None
    
    # Symptoms (structured)
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
    symptom_duration_weeks: int = 0
    
    # Reproductive (female)
    hpv_vaccinated: bool = False
    oral_contraceptive_use: bool = False
    number_of_pregnancies: int = 0
    
    def __post_init__(self):
        if self.family_cancer_types is None:
            self.family_cancer_types = []


@dataclass
class RiskOutput:
    """Standardized risk assessment output"""
    risk_score: float          # 0-1
    risk_level: str            # low, medium, high, critical
    rule_based_score: float
    ml_score: float
    confidence: float
    suspected_categories: List[Dict]
    feature_importance: Dict[str, float]
    explanations: List[str]
    recommendations_hint: List[str]
    model_version: str
    disclaimer: str = "This assessment is for SCREENING PURPOSES ONLY and does NOT constitute a medical diagnosis. Please consult a qualified healthcare provider."


class RuleBasedEngine:
    """
    Evidence-based rule engine for cancer risk boosting.
    Rules derived from WHO/IARC cancer screening guidelines.
    """
    
    def evaluate(self, inp: RiskInput) -> Tuple[float, Dict[str, float], List[str]]:
        """
        Returns (boost_score, category_scores, explanations)
        boost_score: additional risk added by rules (0-0.5)
        """
        boosts = {}
        explanations = []
        category_scores = {k: 0.0 for k in CANCER_CATEGORIES}

        # ── LUNG CANCER RULES ──────────────────────────────────
        if inp.smoking_status == "current":
            lung_boost = 0.20 + min(inp.smoking_pack_years * 0.005, 0.15)
            category_scores["lung"] += lung_boost
            boosts["current_smoker"] = lung_boost
            explanations.append(f"Active smoker (pack-years: {inp.smoking_pack_years:.1f}) significantly elevates lung cancer risk.")
        
        if inp.smoking_status == "former":
            category_scores["lung"] += 0.10
            boosts["former_smoker"] = 0.10
            explanations.append("Former smoking history is a persistent lung cancer risk factor.")
        
        if inp.persistent_cough and inp.smoking_status in ["current", "former"]:
            category_scores["lung"] += 0.15
            boosts["smoker_cough"] = 0.15
            explanations.append("Persistent cough in a smoker is a key lung cancer warning sign.")
        
        if inp.coughing_blood:
            category_scores["lung"] += 0.20
            boosts["hemoptysis"] = 0.20
            explanations.append("Coughing up blood (hemoptysis) requires immediate medical evaluation.")

        # ── CERVICAL CANCER RULES ─────────────────────────────
        if inp.gender == "female":
            if not inp.hpv_vaccinated and inp.age >= 25:
                category_scores["cervical"] += 0.15
                boosts["unvaccinated_hpv"] = 0.15
                explanations.append("Unvaccinated against HPV increases cervical cancer risk.")
            
            if inp.hiv_positive:
                category_scores["cervical"] += 0.20
                boosts["hiv_cervical"] = 0.20
                explanations.append("HIV-positive individuals have significantly higher cervical cancer risk.")
            
            if inp.unusual_vaginal_bleeding and inp.age >= 30:
                category_scores["cervical"] += 0.18
                boosts["vaginal_bleeding"] = 0.18
                explanations.append("Unusual vaginal bleeding in women 30+ warrants cervical cancer screening.")
            
            if inp.pelvic_pain:
                category_scores["cervical"] += 0.10
                explanations.append("Pelvic pain can be associated with cervical abnormalities.")

        # ── BREAST CANCER RULES ────────────────────────────────
        if inp.gender == "female":
            if inp.age >= 40:
                category_scores["breast"] += 0.08
            if inp.age >= 50:
                category_scores["breast"] += 0.05
            
            if inp.family_cancer_history and any(
                t in ["breast", "ovarian", "brca"] for t in inp.family_cancer_types
            ):
                category_scores["breast"] += 0.25
                boosts["family_breast"] = 0.25
                explanations.append("Family history of breast/ovarian cancer substantially increases breast cancer risk.")
            
            if inp.new_lump_or_swelling:
                category_scores["breast"] += 0.15
                boosts["breast_lump"] = 0.15
                explanations.append("New lump or swelling in chest area requires immediate clinical breast examination.")

        # ── COLORECTAL CANCER RULES ────────────────────────────
        if inp.rectal_bleeding or inp.blood_in_stool:
            category_scores["colorectal"] += 0.20
            boosts["rectal_bleeding"] = 0.20
            explanations.append("Blood in stool or rectal bleeding requires colorectal cancer screening.")
        
        if inp.age >= 50:
            category_scores["colorectal"] += 0.10
            explanations.append("Age 50+ is a key risk threshold for colorectal cancer.")
        
        if inp.family_cancer_history and "colorectal" in inp.family_cancer_types:
            category_scores["colorectal"] += 0.20
            boosts["family_colorectal"] = 0.20
            explanations.append("Family history of colorectal cancer doubles personal risk.")

        # ── ORAL CANCER RULES ──────────────────────────────────
        if inp.non_healing_sore:
            category_scores["oral"] += 0.20
            boosts["non_healing_sore"] = 0.20
            explanations.append("Non-healing sore or ulcer in mouth/skin is a significant cancer warning sign.")
        
        if inp.smoking_status == "current" and inp.alcohol_use in ["moderate", "heavy"]:
            category_scores["oral"] += 0.15
            boosts["smoke_alcohol"] = 0.15
            explanations.append("Combined smoking and heavy alcohol use significantly increases oral and esophageal cancer risk.")

        # ── LIVER CANCER RULES ─────────────────────────────────
        if inp.hepatitis_b or inp.hepatitis_c:
            category_scores["liver"] += 0.25
            boosts["viral_hepatitis"] = 0.25
            explanations.append("Viral hepatitis (B or C) is the leading risk factor for liver cancer.")

        # ── ESOPHAGEAL CANCER RULES ────────────────────────────
        if inp.difficulty_swallowing:
            category_scores["esophageal"] += 0.20
            boosts["dysphagia"] = 0.20
            explanations.append("Difficulty swallowing is an important warning sign for esophageal cancer.")

        # ── SYSTEMIC RULES ─────────────────────────────────────
        if inp.unexplained_weight_loss:
            # General cancer indicator
            for cat in category_scores:
                category_scores[cat] += 0.08
            boosts["weight_loss"] = 0.08
            explanations.append("Unexplained weight loss (>5% body weight) is a general cancer warning sign.")
        
        if inp.symptom_duration_weeks >= 4:
            # Persistent symptoms are more concerning
            for cat in category_scores:
                category_scores[cat] *= 1.15
            explanations.append(f"Symptoms lasting {inp.symptom_duration_weeks} weeks or more require medical evaluation.")
        
        if inp.previous_cancer:
            # Higher risk of second primary
            for cat in category_scores:
                category_scores[cat] += 0.10
            explanations.append("History of previous cancer increases risk of second primary malignancy.")

        # Normalize category scores
        for cat in category_scores:
            category_scores[cat] = min(category_scores[cat], 1.0)

        # Overall boost = max category score contribution
        overall_boost = min(max(boosts.values()) if boosts else 0, 0.40)
        
        return overall_boost, category_scores, explanations


class MLRiskEngine:
    """
    Logistic Regression based ML risk scoring.
    Trained on synthetically generated representative data.
    """
    
    def __init__(self):
        self.model = None
        self.feature_names = []
    
    def _extract_features(self, inp: RiskInput) -> np.ndarray:
        """Convert RiskInput to feature vector"""
        features = {
            # Demographics
            "age_normalized": min(inp.age / 80.0, 1.0),
            "age_50plus": 1.0 if inp.age >= 50 else 0.0,
            "age_40plus": 1.0 if inp.age >= 40 else 0.0,
            "is_female": 1.0 if inp.gender == "female" else 0.0,
            
            # Lifestyle
            "current_smoker": 1.0 if inp.smoking_status == "current" else 0.0,
            "former_smoker": 1.0 if inp.smoking_status == "former" else 0.0,
            "pack_years_normalized": min(inp.smoking_pack_years / 40.0, 1.0),
            "heavy_alcohol": 1.0 if inp.alcohol_use == "heavy" else 0.0,
            "moderate_alcohol": 1.0 if inp.alcohol_use == "moderate" else 0.0,
            "sedentary": 1.0 if inp.physical_activity == "sedentary" else 0.0,
            "poor_diet": 1.0 if inp.diet_quality == "poor" else 0.0,
            "bmi_obese": 1.0 if (inp.bmi and inp.bmi >= 30) else 0.0,
            "bmi_overweight": 1.0 if (inp.bmi and 25 <= inp.bmi < 30) else 0.0,
            
            # Medical
            "hiv_positive": float(inp.hiv_positive),
            "previous_cancer": float(inp.previous_cancer),
            "immunosuppressed": float(inp.immunosuppressed),
            "hepatitis_b": float(inp.hepatitis_b),
            "hepatitis_c": float(inp.hepatitis_c),
            "diabetes": float(inp.diabetes),
            "family_history": float(inp.family_cancer_history),
            
            # Symptoms
            "weight_loss": float(inp.unexplained_weight_loss),
            "fatigue": float(inp.persistent_fatigue),
            "fever": float(inp.unexplained_fever),
            "night_sweats": float(inp.night_sweats),
            "persistent_cough": float(inp.persistent_cough),
            "coughing_blood": float(inp.coughing_blood),
            "rectal_bleeding": float(inp.rectal_bleeding),
            "blood_stool": float(inp.blood_in_stool),
            "dysphagia": float(inp.difficulty_swallowing),
            "new_lump": float(inp.new_lump_or_swelling),
            "non_healing_sore": float(inp.non_healing_sore),
            "blood_urine": float(inp.blood_in_urine),
            "vaginal_bleeding": float(inp.unusual_vaginal_bleeding),
            "pelvic_pain": float(inp.pelvic_pain),
            "skin_changes": float(inp.unusual_skin_changes),
            
            # Duration
            "symptom_4weeks": 1.0 if inp.symptom_duration_weeks >= 4 else 0.0,
            "symptom_8weeks": 1.0 if inp.symptom_duration_weeks >= 8 else 0.0,
            
            # Composite
            "smoker_with_respiratory": float(
                inp.smoking_status in ["current", "former"] and 
                (inp.persistent_cough or inp.coughing_blood or inp.shortness_of_breath)
            ),
            "female_reproductive_concerns": float(
                inp.gender == "female" and 
                (inp.unusual_vaginal_bleeding or inp.pelvic_pain)
            ),
            "gi_concerns": float(
                inp.rectal_bleeding or inp.blood_in_stool or inp.persistent_abdominal_pain
            ),
        }
        
        self.feature_names = list(features.keys())
        return np.array(list(features.values()))
    
    def predict(self, inp: RiskInput) -> Tuple[float, Dict[str, float]]:
        """Returns (ml_score, feature_importance)"""
        if self.model is None:
            return 0.5, {}
        
        features = self._extract_features(inp)
        prob = self.model.predict_proba(features.reshape(1, -1))[0][1]
        
        # Feature importance (coefficient-based)
        try:
            lr = self.model.named_steps.get("lr") or self.model.named_steps.get("logisticregression")
            if lr:
                coefs = np.abs(lr.coef_[0])
                importance = dict(zip(self.feature_names, (coefs * features).tolist()))
            else:
                importance = {}
        except Exception:
            importance = {}
        
        return float(prob), importance
    
    def load(self, path: str):
        if os.path.exists(path):
            self.model = joblib.load(path)
            logger.info(f"ML model loaded from {path}")
        else:
            logger.warning("No trained model found. Using rule-based only.")


class OncoSenseRiskEngine:
    """
    Main hybrid risk engine combining rules + ML.
    """
    
    def __init__(self):
        self.rule_engine = RuleBasedEngine()
        self.ml_engine = MLRiskEngine()
        self.model_version = MODEL_VERSION
        self._load()
    
    def _load(self):
        self.ml_engine.load(MODEL_PATH)
    
    def assess(self, inp: RiskInput) -> RiskOutput:
        """
        Perform full risk assessment.
        Returns RiskOutput with scores, categories, and explanations.
        """
        # ── Rule-based scoring
        rule_boost, category_scores, explanations = self.rule_engine.evaluate(inp)
        
        # ── ML scoring
        ml_score, feature_importance = self.ml_engine.predict(inp)
        
        # ── Combine scores (70% ML + 30% rules if model available, else 100% rules)
        if self.ml_engine.model is not None:
            # Combine: ML score + rule boost
            rule_based_score = min(rule_boost + 0.15, 0.8)  # base + boost
            final_score = 0.65 * ml_score + 0.35 * rule_based_score
        else:
            rule_based_score = min(rule_boost + 0.20, 0.9)
            ml_score = rule_based_score * 0.9  # fallback
            final_score = rule_based_score
        
        # Clamp
        final_score = max(0.01, min(final_score, 0.99))
        
        # ── Risk level
        if final_score < 0.25:
            risk_level = "low"
        elif final_score < 0.50:
            risk_level = "medium"
        elif final_score < 0.75:
            risk_level = "high"
        else:
            risk_level = "critical"
        
        # ── Top suspected categories
        sorted_cats = sorted(
            [(k, v) for k, v in category_scores.items() if v > 0.05],
            key=lambda x: x[1],
            reverse=True
        )[:3]
        
        suspected_categories = []
        for cat_key, cat_score in sorted_cats:
            cat_info = CANCER_CATEGORIES[cat_key]
            suspected_categories.append({
                "type": cat_key,
                "name": cat_info["name"],
                "concern_score": round(min(cat_score, 1.0), 3),
                "screening_recommended": cat_info["screening"],
                "note": "Elevated concern — professional screening recommended"
            })
        
        # ── Confidence
        # Higher confidence when more features are present
        n_symptoms = sum([
            inp.persistent_cough, inp.coughing_blood, inp.rectal_bleeding,
            inp.blood_in_stool, inp.unexplained_weight_loss, inp.new_lump_or_swelling,
            inp.non_healing_sore, inp.difficulty_swallowing, inp.unusual_vaginal_bleeding,
            inp.blood_in_urine
        ])
        confidence = min(0.50 + (n_symptoms * 0.05) + (0.10 if inp.age > 40 else 0), 0.92)
        
        # ── Recommendation hints
        recs = _generate_recommendation_hints(risk_level, suspected_categories, inp)
        
        # Clean up feature importance
        clean_importance = {
            k: round(v, 4) for k, v in sorted(
                feature_importance.items(), key=lambda x: x[1], reverse=True
            )[:10]
        } if feature_importance else {}
        
        return RiskOutput(
            risk_score=round(final_score, 4),
            risk_level=risk_level,
            rule_based_score=round(rule_based_score, 4),
            ml_score=round(ml_score, 4),
            confidence=round(confidence, 4),
            suspected_categories=suspected_categories,
            feature_importance=clean_importance,
            explanations=explanations[:8],
            recommendations_hint=recs,
            model_version=self.model_version
        )


def _generate_recommendation_hints(
    risk_level: str,
    categories: List[Dict],
    inp: RiskInput
) -> List[str]:
    """Generate human-readable recommendation hints"""
    recs = []
    
    if risk_level == "critical":
        recs.append("⚠️ SEEK MEDICAL CARE IMMEDIATELY — within 24-48 hours")
    elif risk_level == "high":
        recs.append("🔴 Visit a healthcare facility within 1-2 weeks")
    elif risk_level == "medium":
        recs.append("🟡 Schedule a cancer screening appointment within 1 month")
    else:
        recs.append("🟢 Continue routine health monitoring. Annual check-ups recommended.")
    
    for cat in categories[:2]:
        recs.append(f"Consider {cat['screening_recommended']} for {cat['name']} screening")
    
    if inp.gender == "female" and inp.age >= 25:
        recs.append("Regular cervical screening (Pap smear or VIA) is recommended for women 25-65")
    
    if inp.gender == "female" and inp.age >= 40:
        recs.append("Clinical breast examination and mammography recommended from age 40")
    
    if inp.age >= 50:
        recs.append("Colorectal cancer screening (FOBT) recommended from age 50")
    
    if inp.smoking_status in ["current", "former"]:
        recs.append("Smoking cessation support is available — quitting reduces cancer risk significantly")
    
    return recs[:6]


def generate_synthetic_training_data(n_samples: int = 5000) -> Tuple[np.ndarray, np.ndarray]:
    """
    Generate synthetic training data based on epidemiological risk patterns.
    In production, replace with real validated clinical data.
    """
    np.random.seed(42)
    
    data = []
    labels = []
    
    for _ in range(n_samples):
        # Base demographics
        age = np.random.randint(18, 80)
        gender = np.random.choice(["male", "female"], p=[0.48, 0.52])
        smoking = np.random.choice(["never", "former", "current"], p=[0.55, 0.25, 0.20])
        alcohol = np.random.choice(["none", "occasional", "moderate", "heavy"], p=[0.4, 0.3, 0.2, 0.1])
        
        pack_years = np.random.exponential(10) if smoking != "never" else 0
        bmi = np.random.normal(24, 5)
        hiv = np.random.random() < 0.03  # 3% prevalence (East Africa)
        hep_b = np.random.random() < 0.05  # 5% prevalence
        family_hx = np.random.random() < 0.15
        
        # Simulate symptom presence (correlated with risk)
        base_risk = (
            (age / 80) * 0.3 +
            (0.25 if smoking == "current" else 0.1 if smoking == "former" else 0) +
            (0.15 if hiv else 0) +
            (0.15 if family_hx else 0) +
            (0.1 if hep_b else 0) +
            (0.05 if alcohol == "heavy" else 0)
        )
        base_risk = min(base_risk, 0.95)
        
        cough = np.random.random() < (0.3 if smoking == "current" else 0.05)
        weight_loss = np.random.random() < (base_risk * 0.4)
        rectal_bleeding = np.random.random() < (0.1 if age > 50 else 0.02)
        new_lump = np.random.random() < (base_risk * 0.2)
        
        # Feature vector
        features = [
            age / 80, 1 if age >= 50 else 0, 1 if age >= 40 else 0,
            1 if gender == "female" else 0,
            1 if smoking == "current" else 0, 1 if smoking == "former" else 0,
            pack_years / 40, 1 if alcohol == "heavy" else 0, 1 if alcohol == "moderate" else 0,
            0, 0, 1 if bmi >= 30 else 0, 1 if 25 <= bmi < 30 else 0,
            float(hiv), 0, 0, float(hep_b), 0, 0, float(family_hx),
            float(weight_loss), float(np.random.random() < base_risk * 0.3), 0, 0,
            float(cough), float(np.random.random() < base_risk * 0.1), 0,
            float(rectal_bleeding), float(rectal_bleeding), 0, 0,
            float(new_lump), float(np.random.random() < base_risk * 0.05), 0, 0, 0,
            0, 0, 0,
            float(smoking != "never" and cough), 0, float(rectal_bleeding)
        ]
        
        # Label based on adjusted risk
        final_risk = base_risk + (0.15 if weight_loss else 0) + (0.1 if new_lump else 0)
        label = 1 if final_risk > 0.35 else 0
        
        data.append(features)
        labels.append(label)
    
    return np.array(data), np.array(labels)


def train_and_save_model():
    """Train the logistic regression model and save it"""
    logger.info("Training OncoSense risk model...")
    
    X, y = generate_synthetic_training_data(8000)
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    model = Pipeline([
        ('scaler', StandardScaler()),
        ('lr', LogisticRegression(
            C=1.0,
            class_weight='balanced',
            max_iter=1000,
            random_state=42
        ))
    ])
    
    model.fit(X_train, y_train)
    
    # Evaluate
    y_pred = model.predict(X_test)
    report = classification_report(y_test, y_pred)
    logger.info(f"Model performance:\n{report}")
    
    # Save
    os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
    joblib.dump(model, MODEL_PATH)
    logger.info(f"Model saved to {MODEL_PATH}")
    
    return model


# Singleton
_engine_instance: Optional[OncoSenseRiskEngine] = None


def get_risk_engine() -> OncoSenseRiskEngine:
    global _engine_instance
    if _engine_instance is None:
        _engine_instance = OncoSenseRiskEngine()
    return _engine_instance


if __name__ == "__main__":
    train_and_save_model()
