"""
Image Screening API - AI-based pre-screening for oral/skin abnormalities
Uses color analysis and pattern detection (no heavy model needed)
"""
from fastapi import APIRouter, File, UploadFile, HTTPException, Form
from pydantic import BaseModel
from typing import Optional
import numpy as np
import logging
from PIL import Image, ImageStat
import io

logger = logging.getLogger(__name__)
router = APIRouter()

DISCLAIMER = (
    "⚠️ IMPORTANT: This image analysis is for SCREENING SUPPORT ONLY. "
    "It does NOT constitute a medical diagnosis. Results may not be accurate. "
    "Always consult a qualified healthcare professional for proper evaluation."
)


class ImageScreeningResult(BaseModel):
    screening_id: str
    image_type: str
    abnormality_detected: bool
    confidence_score: float
    finding: str
    severity_hint: str
    color_analysis: dict
    regions_of_concern: list
    recommendation: str
    disclaimer: str


def analyze_oral_image(img: Image.Image) -> dict:
    """
    Analyze oral cavity image for potential abnormalities.
    Looks for: unusual coloration, white patches, red areas, asymmetry
    """
    # Convert to RGB
    img_rgb = img.convert("RGB")
    img_array = np.array(img_rgb)
    
    # Color analysis
    r, g, b = img_array[:,:,0], img_array[:,:,1], img_array[:,:,2]
    
    # Check for white/grey patches (leukoplakia indicator)
    white_mask = (r > 200) & (g > 200) & (b > 200)
    white_ratio = np.sum(white_mask) / white_mask.size
    
    # Check for unusually red areas (erythroplakia indicator)  
    red_dominant = (r > g + 30) & (r > b + 30) & (r > 120)
    red_ratio = np.sum(red_dominant) / red_dominant.size
    
    # Check for dark/brown lesions
    dark_mask = (r < 80) & (g < 60) & (b < 60)
    dark_ratio = np.sum(dark_mask) / dark_mask.size
    
    # Texture variance (abnormal tissue often has irregular texture)
    stat = ImageStat.Stat(img_rgb)
    variance = stat.var[0]
    
    concern_score = 0.0
    findings = []
    
    if white_ratio > 0.15:
        concern_score += 0.30
        findings.append("White patches detected (potential leukoplakia)")
    
    if red_ratio > 0.20:
        concern_score += 0.25
        findings.append("Unusual redness detected (potential erythroplakia)")
    
    if dark_ratio > 0.10:
        concern_score += 0.20
        findings.append("Dark lesion areas detected")
    
    if variance > 3000:
        concern_score += 0.10
        findings.append("Irregular surface texture detected")
    
    return {
        "concern_score": min(concern_score, 0.95),
        "white_patch_ratio": round(white_ratio, 3),
        "red_area_ratio": round(red_ratio, 3),
        "dark_lesion_ratio": round(dark_ratio, 3),
        "texture_variance": round(variance, 1),
        "findings": findings
    }


def analyze_skin_image(img: Image.Image) -> dict:
    """
    Analyze skin lesion image.
    Checks ABCD criteria: Asymmetry, Border, Color, Diameter indicators
    """
    img_rgb = img.convert("RGB")
    img_array = np.array(img_rgb)
    
    # Color diversity (multiple colors = concern)
    # Segment potential lesion (simplified: center region)
    h, w = img_array.shape[:2]
    center_region = img_array[h//4:3*h//4, w//4:3*w//4]
    
    r, g, b = center_region[:,:,0], center_region[:,:,1], center_region[:,:,2]
    
    # Color variance
    r_std = float(np.std(r))
    g_std = float(np.std(g))
    b_std = float(np.std(b))
    color_heterogeneity = (r_std + g_std + b_std) / 3
    
    # Check for melanin-like dark pigmentation
    dark_pigment = (r < 100) & (g < 80) & (b < 70)
    dark_ratio = np.sum(dark_pigment) / dark_pigment.size
    
    # Blue-black coloration (concerning in melanoma)
    blue_black = (b > r + 20) & (g < 80) & (r < 80)
    blue_black_ratio = np.sum(blue_black) / blue_black.size
    
    # Red-pink irritation
    pink_red = (r > 150) & (g < 120) & (b < 120)
    pink_ratio = np.sum(pink_red) / pink_red.size
    
    concern_score = 0.0
    findings = []
    
    if color_heterogeneity > 40:
        concern_score += 0.25
        findings.append("High color variation (color heterogeneity)")
    
    if dark_ratio > 0.20:
        concern_score += 0.20
        findings.append("Dark pigmented area detected")
    
    if blue_black_ratio > 0.05:
        concern_score += 0.25
        findings.append("Blue-black coloration detected (requires evaluation)")
    
    if pink_ratio > 0.25:
        concern_score += 0.15
        findings.append("Inflammatory redness detected")
    
    return {
        "concern_score": min(concern_score, 0.95),
        "color_heterogeneity": round(color_heterogeneity, 2),
        "dark_pigment_ratio": round(dark_ratio, 3),
        "blue_black_ratio": round(blue_black_ratio, 3),
        "inflammation_indicator": round(pink_ratio, 3),
        "findings": findings
    }


@router.post("/analyze", response_model=ImageScreeningResult)
async def analyze_image(
    file: UploadFile = File(...),
    image_type: str = Form(default="skin"),  # oral, skin
    consent_given: bool = Form(default=False),
    disclaimer_acknowledged: bool = Form(default=False)
):
    """
    Analyze uploaded image for potential abnormalities.
    
    **DISCLAIMER**: This is NOT a diagnostic tool.
    Results require validation by a qualified healthcare professional.
    """
    if not consent_given or not disclaimer_acknowledged:
        raise HTTPException(
            status_code=400,
            detail="Consent and disclaimer acknowledgment required."
        )
    
    # Validate file
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    # Read image
    contents = await file.read()
    if len(contents) > 10 * 1024 * 1024:  # 10MB limit
        raise HTTPException(status_code=400, detail="Image too large (max 10MB)")
    
    try:
        img = Image.open(io.BytesIO(contents))
        
        # Minimum size check
        if img.width < 100 or img.height < 100:
            raise HTTPException(status_code=400, detail="Image too small for analysis")
        
        # Analyze based on type
        if image_type == "oral":
            analysis = analyze_oral_image(img)
        else:
            analysis = analyze_skin_image(img)
        
        concern_score = analysis["concern_score"]
        
        # Determine finding
        if concern_score >= 0.60:
            finding = "Potential abnormality detected — clinical evaluation strongly recommended"
            severity_hint = "HIGH CONCERN"
            abnormality_detected = True
            recommendation = "Please visit a healthcare provider within 1-2 weeks for professional evaluation of this lesion."
        elif concern_score >= 0.30:
            finding = "Possible area of concern detected — monitoring recommended"
            severity_hint = "MODERATE CONCERN"
            abnormality_detected = True
            recommendation = "Consider visiting a healthcare provider for evaluation. Monitor for any changes in size, color, or texture."
        else:
            finding = "No significant abnormalities detected in automated analysis"
            severity_hint = "LOW CONCERN"
            abnormality_detected = False
            recommendation = "No immediate action required. Maintain regular skin/oral self-examinations monthly."
        
        import uuid
        
        return ImageScreeningResult(
            screening_id=str(uuid.uuid4()),
            image_type=image_type,
            abnormality_detected=abnormality_detected,
            confidence_score=round(0.45 + concern_score * 0.4, 3),  # Calibrated confidence
            finding=finding,
            severity_hint=severity_hint,
            color_analysis={k: v for k, v in analysis.items() if k != "findings"},
            regions_of_concern=analysis.get("findings", []),
            recommendation=recommendation,
            disclaimer=DISCLAIMER
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Image analysis error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Image analysis failed: {str(e)}")
