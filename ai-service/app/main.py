"""
OncoSense AI Service
FastAPI application for cancer risk assessment
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
import logging

from app.routers import risk, image_screening, health

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="OncoSense AI Service",
    description="AI-powered cancer risk assessment engine",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(health.router, tags=["Health"])
app.include_router(risk.router, prefix="/risk", tags=["Risk Assessment"])
app.include_router(image_screening.router, prefix="/image", tags=["Image Screening"])


@app.on_event("startup")
async def startup_event():
    logger.info("OncoSense AI Service starting up...")
    # Ensure model is loaded
    from app.engines.risk_engine import get_risk_engine
    engine = get_risk_engine()
    logger.info(f"Risk engine loaded: version {engine.model_version}")


@app.get("/")
async def root():
    return {
        "service": "OncoSense AI",
        "version": "1.0.0",
        "status": "operational",
        "disclaimer": "This system does not provide medical diagnosis."
    }
