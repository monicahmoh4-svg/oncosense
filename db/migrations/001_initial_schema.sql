-- OncoSense Database Schema
-- Migration: 001_initial_schema.sql

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── ENUM TYPES ──────────────────────────────────────────────
CREATE TYPE user_role AS ENUM ('patient', 'health_worker', 'clinician', 'admin');
CREATE TYPE risk_level AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE consultation_status AS ENUM ('pending', 'active', 'completed', 'cancelled');
CREATE TYPE recommendation_type AS ENUM ('immediate', 'urgent', 'routine', 'lifestyle', 'monitoring');
CREATE TYPE gender_type AS ENUM ('male', 'female', 'other', 'prefer_not_to_say');
CREATE TYPE screening_status AS ENUM ('pending', 'reviewed', 'flagged', 'cleared');
CREATE TYPE notification_type AS ENUM ('sms', 'email', 'in_app', 'whatsapp');

-- ─── USERS ───────────────────────────────────────────────────
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(20) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'patient',
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    preferred_language VARCHAR(10) DEFAULT 'en',
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_role ON users(role);

-- ─── HEALTH PROFILES ─────────────────────────────────────────
CREATE TABLE health_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date_of_birth DATE,
    gender gender_type,
    country VARCHAR(100),
    region VARCHAR(100),
    district VARCHAR(100),
    
    -- Lifestyle
    smoking_status VARCHAR(20), -- never, former, current
    smoking_pack_years DECIMAL(5,2),
    alcohol_use VARCHAR(20),     -- none, occasional, moderate, heavy
    physical_activity VARCHAR(20), -- sedentary, light, moderate, active
    bmi DECIMAL(5,2),
    diet_quality VARCHAR(20),    -- poor, fair, good
    
    -- Medical history
    hiv_status VARCHAR(20),
    diabetes BOOLEAN DEFAULT false,
    hypertension BOOLEAN DEFAULT false,
    previous_cancer BOOLEAN DEFAULT false,
    previous_cancer_type VARCHAR(200),
    immunosuppressed BOOLEAN DEFAULT false,
    
    -- Reproductive (female)
    number_of_pregnancies INTEGER,
    breastfeeding_history BOOLEAN,
    age_first_menstruation INTEGER,
    menopause_status VARCHAR(20),
    hpv_vaccinated BOOLEAN,
    oral_contraceptive_use BOOLEAN,
    
    -- Family history
    family_cancer_history BOOLEAN DEFAULT false,
    family_cancer_types TEXT[], -- array of cancer types
    family_cancer_relations TEXT[], -- first_degree, second_degree
    
    profile_completed BOOLEAN DEFAULT false,
    last_updated TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_health_profiles_user ON health_profiles(user_id);
CREATE INDEX idx_health_profiles_region ON health_profiles(country, region);

-- ─── SYMPTOMS ────────────────────────────────────────────────
CREATE TABLE symptoms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    assessment_id UUID, -- linked to risk assessment
    
    -- Structured symptoms
    unexplained_weight_loss BOOLEAN DEFAULT false,
    persistent_fatigue BOOLEAN DEFAULT false,
    unexplained_fever BOOLEAN DEFAULT false,
    night_sweats BOOLEAN DEFAULT false,
    
    -- Respiratory
    persistent_cough BOOLEAN DEFAULT false,
    coughing_blood BOOLEAN DEFAULT false,
    shortness_of_breath BOOLEAN DEFAULT false,
    
    -- GI
    rectal_bleeding BOOLEAN DEFAULT false,
    blood_in_stool BOOLEAN DEFAULT false,
    persistent_abdominal_pain BOOLEAN DEFAULT false,
    difficulty_swallowing BOOLEAN DEFAULT false,
    
    -- Skin/External
    unusual_skin_changes BOOLEAN DEFAULT false,
    new_lump_or_swelling BOOLEAN DEFAULT false,
    non_healing_sore BOOLEAN DEFAULT false,
    
    -- Urinary/Reproductive
    blood_in_urine BOOLEAN DEFAULT false,
    pelvic_pain BOOLEAN DEFAULT false,
    unusual_vaginal_bleeding BOOLEAN DEFAULT false,
    testicular_changes BOOLEAN DEFAULT false,
    
    -- Head
    persistent_headache BOOLEAN DEFAULT false,
    vision_changes BOOLEAN DEFAULT false,
    
    -- Duration
    symptom_duration_weeks INTEGER,
    
    -- Free text
    additional_symptoms TEXT,
    
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_symptoms_user ON symptoms(user_id);

-- ─── RISK ASSESSMENTS ────────────────────────────────────────
CREATE TABLE risk_assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    symptom_id UUID REFERENCES symptoms(id),
    
    -- Scores
    rule_based_score DECIMAL(4,3),
    ml_score DECIMAL(4,3),
    final_score DECIMAL(4,3) NOT NULL,
    risk_level risk_level NOT NULL,
    
    -- AI outputs
    suspected_categories JSONB DEFAULT '[]', -- [{type, confidence, reason}]
    feature_importance JSONB DEFAULT '{}',    -- explainability
    confidence_score DECIMAL(4,3),
    
    -- Metadata
    model_version VARCHAR(50),
    assessment_notes TEXT,
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_assessments_user ON risk_assessments(user_id);
CREATE INDEX idx_assessments_risk_level ON risk_assessments(risk_level);
CREATE INDEX idx_assessments_created ON risk_assessments(created_at);

-- ─── RECOMMENDATIONS ─────────────────────────────────────────
CREATE TABLE recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assessment_id UUID NOT NULL REFERENCES risk_assessments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    
    type recommendation_type NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    action_required VARCHAR(255),
    timeframe VARCHAR(100), -- "within 1 week", "within 3 months"
    
    resource_requirements VARCHAR(50), -- low, medium, high
    is_region_specific BOOLEAN DEFAULT false,
    region_context JSONB,
    
    is_completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_recommendations_assessment ON recommendations(assessment_id);
CREATE INDEX idx_recommendations_user ON recommendations(user_id);

-- ─── CONSULTATIONS ───────────────────────────────────────────
CREATE TABLE consultations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES users(id),
    clinician_id UUID REFERENCES users(id),
    health_worker_id UUID REFERENCES users(id),
    assessment_id UUID REFERENCES risk_assessments(id),
    
    status consultation_status DEFAULT 'pending',
    consultation_type VARCHAR(20) DEFAULT 'chat', -- chat, video
    
    -- Scheduling
    scheduled_at TIMESTAMP,
    started_at TIMESTAMP,
    ended_at TIMESTAMP,
    duration_minutes INTEGER,
    
    -- Notes
    chief_complaint TEXT,
    clinical_notes TEXT,
    diagnosis_notes TEXT,
    follow_up_required BOOLEAN DEFAULT false,
    follow_up_date DATE,
    
    webrtc_room_id VARCHAR(255),
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_consultations_patient ON consultations(patient_id);
CREATE INDEX idx_consultations_clinician ON consultations(clinician_id);
CREATE INDEX idx_consultations_status ON consultations(status);

-- ─── MESSAGES ────────────────────────────────────────────────
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    consultation_id UUID NOT NULL REFERENCES consultations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id),
    
    content TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'text', -- text, file, image, system
    file_url VARCHAR(500),
    
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_messages_consultation ON messages(consultation_id);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_created ON messages(created_at);

-- ─── IMAGE SCREENINGS ─────────────────────────────────────────
CREATE TABLE image_screenings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    assessment_id UUID REFERENCES risk_assessments(id),
    
    image_url VARCHAR(500) NOT NULL,
    image_type VARCHAR(50), -- oral, skin, other
    
    -- AI Results
    status screening_status DEFAULT 'pending',
    ai_result JSONB,           -- {finding, confidence, regions[]}
    abnormality_detected BOOLEAN,
    confidence_score DECIMAL(4,3),
    ai_notes TEXT,
    
    -- Human review
    reviewed_by UUID REFERENCES users(id),
    reviewer_notes TEXT,
    reviewed_at TIMESTAMP,
    
    -- Compliance
    consent_given BOOLEAN DEFAULT false,
    disclaimer_acknowledged BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_image_screenings_user ON image_screenings(user_id);

-- ─── CLINICS ─────────────────────────────────────────────────
CREATE TABLE clinics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100),         -- hospital, clinic, health_center, mobile_unit
    address TEXT,
    country VARCHAR(100),
    region VARCHAR(100),
    district VARCHAR(100),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    phone VARCHAR(20),
    services TEXT[],           -- cervical_screening, mammography, etc.
    operating_hours JSONB,
    is_active BOOLEAN DEFAULT true,
    resource_level VARCHAR(20), -- low, medium, high
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_clinics_location ON clinics(country, region);
CREATE INDEX idx_clinics_coords ON clinics(latitude, longitude);

-- ─── HEALTH WORKERS ──────────────────────────────────────────
CREATE TABLE health_workers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    clinic_id UUID REFERENCES clinics(id),
    worker_id VARCHAR(50) UNIQUE,
    specialization VARCHAR(200),
    certification_level VARCHAR(100),
    assigned_regions TEXT[],
    max_patients INTEGER DEFAULT 50,
    current_patient_count INTEGER DEFAULT 0,
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ─── NOTIFICATIONS ────────────────────────────────────────────
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    type notification_type DEFAULT 'in_app',
    title VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    data JSONB,
    is_read BOOLEAN DEFAULT false,
    sent_at TIMESTAMP,
    read_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(user_id, is_read);

-- ─── AUDIT LOGS ───────────────────────────────────────────────
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100),
    resource_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at);

-- ─── TRIGGERS for updated_at ──────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_consultations_updated_at BEFORE UPDATE ON consultations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
