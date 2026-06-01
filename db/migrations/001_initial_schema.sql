-- OncoSense Database Schema v2
-- Uses gen_random_uuid() built into PostgreSQL 13+

DO $$ BEGIN CREATE TYPE user_role AS ENUM ('patient','health_worker','clinician','admin'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE risk_level AS ENUM ('low','medium','high','critical'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE consultation_status AS ENUM ('pending','active','completed','cancelled'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE recommendation_type AS ENUM ('immediate','urgent','routine','lifestyle','monitoring'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE gender_type AS ENUM ('male','female','other','prefer_not_to_say'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE screening_status AS ENUM ('pending','reviewed','flagged','cleared'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE notification_type AS ENUM ('sms','email','in_app','whatsapp'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_role  ON users(role);

CREATE TABLE IF NOT EXISTS health_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date_of_birth DATE, gender gender_type, country VARCHAR(100),
  region VARCHAR(100), district VARCHAR(100),
  smoking_status VARCHAR(20), smoking_pack_years DECIMAL(5,2),
  alcohol_use VARCHAR(20), physical_activity VARCHAR(20),
  bmi DECIMAL(5,2), diet_quality VARCHAR(20), hiv_status VARCHAR(20),
  diabetes BOOLEAN DEFAULT false, hypertension BOOLEAN DEFAULT false,
  previous_cancer BOOLEAN DEFAULT false, previous_cancer_type VARCHAR(200),
  immunosuppressed BOOLEAN DEFAULT false, number_of_pregnancies INTEGER,
  breastfeeding_history BOOLEAN, age_first_menstruation INTEGER,
  menopause_status VARCHAR(20), hpv_vaccinated BOOLEAN,
  oral_contraceptive_use BOOLEAN, family_cancer_history BOOLEAN DEFAULT false,
  family_cancer_types TEXT[], family_cancer_relations TEXT[],
  profile_completed BOOLEAN DEFAULT false,
  last_updated TIMESTAMP DEFAULT NOW(), created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_health_profiles_user ON health_profiles(user_id);

CREATE TABLE IF NOT EXISTS symptoms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assessment_id UUID,
  unexplained_weight_loss BOOLEAN DEFAULT false,
  persistent_fatigue BOOLEAN DEFAULT false,
  unexplained_fever BOOLEAN DEFAULT false,
  night_sweats BOOLEAN DEFAULT false,
  persistent_cough BOOLEAN DEFAULT false,
  coughing_blood BOOLEAN DEFAULT false,
  shortness_of_breath BOOLEAN DEFAULT false,
  rectal_bleeding BOOLEAN DEFAULT false,
  blood_in_stool BOOLEAN DEFAULT false,
  persistent_abdominal_pain BOOLEAN DEFAULT false,
  difficulty_swallowing BOOLEAN DEFAULT false,
  unusual_skin_changes BOOLEAN DEFAULT false,
  new_lump_or_swelling BOOLEAN DEFAULT false,
  non_healing_sore BOOLEAN DEFAULT false,
  blood_in_urine BOOLEAN DEFAULT false,
  pelvic_pain BOOLEAN DEFAULT false,
  unusual_vaginal_bleeding BOOLEAN DEFAULT false,
  testicular_changes BOOLEAN DEFAULT false,
  persistent_headache BOOLEAN DEFAULT false,
  vision_changes BOOLEAN DEFAULT false,
  symptom_duration_weeks INTEGER, additional_symptoms TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_symptoms_user ON symptoms(user_id);

CREATE TABLE IF NOT EXISTS risk_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  symptom_id UUID REFERENCES symptoms(id),
  rule_based_score DECIMAL(4,3), ml_score DECIMAL(4,3),
  final_score DECIMAL(4,3) NOT NULL, risk_level risk_level NOT NULL,
  suspected_categories JSONB DEFAULT '[]',
  feature_importance JSONB DEFAULT '{}',
  confidence_score DECIMAL(4,3), model_version VARCHAR(50),
  assessment_notes TEXT, reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMP, created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_assessments_user       ON risk_assessments(user_id);
CREATE INDEX IF NOT EXISTS idx_assessments_risk_level ON risk_assessments(risk_level);
CREATE INDEX IF NOT EXISTS idx_assessments_created    ON risk_assessments(created_at);

CREATE TABLE IF NOT EXISTS recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL REFERENCES risk_assessments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  type recommendation_type NOT NULL,
  title VARCHAR(255) NOT NULL, description TEXT NOT NULL,
  action_required VARCHAR(255), timeframe VARCHAR(100),
  resource_requirements VARCHAR(50),
  is_region_specific BOOLEAN DEFAULT false, region_context JSONB,
  is_completed BOOLEAN DEFAULT false, completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS consultations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES users(id),
  clinician_id UUID REFERENCES users(id),
  health_worker_id UUID REFERENCES users(id),
  assessment_id UUID REFERENCES risk_assessments(id),
  status consultation_status DEFAULT 'pending',
  consultation_type VARCHAR(20) DEFAULT 'chat',
  scheduled_at TIMESTAMP, started_at TIMESTAMP, ended_at TIMESTAMP,
  duration_minutes INTEGER, chief_complaint TEXT,
  clinical_notes TEXT, diagnosis_notes TEXT,
  follow_up_required BOOLEAN DEFAULT false, follow_up_date DATE,
  webrtc_room_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_consultations_patient   ON consultations(patient_id);
CREATE INDEX IF NOT EXISTS idx_consultations_clinician ON consultations(clinician_id);
CREATE INDEX IF NOT EXISTS idx_consultations_status    ON consultations(status);

CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consultation_id UUID NOT NULL REFERENCES consultations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id),
  content TEXT NOT NULL,
  message_type VARCHAR(20) DEFAULT 'text',
  file_url VARCHAR(500), is_read BOOLEAN DEFAULT false, read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_messages_consultation ON messages(consultation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender       ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created      ON messages(created_at);

CREATE TABLE IF NOT EXISTS image_screenings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  assessment_id UUID REFERENCES risk_assessments(id),
  image_url VARCHAR(500) NOT NULL, image_type VARCHAR(50),
  status screening_status DEFAULT 'pending',
  ai_result JSONB, abnormality_detected BOOLEAN,
  confidence_score DECIMAL(4,3), ai_notes TEXT,
  reviewed_by UUID REFERENCES users(id), reviewer_notes TEXT,
  reviewed_at TIMESTAMP, consent_given BOOLEAN DEFAULT false,
  disclaimer_acknowledged BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS clinics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(100),
  address TEXT,
  country VARCHAR(100),
  region VARCHAR(100),
  district VARCHAR(100),
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  phone VARCHAR(20),
  email VARCHAR(255),
  website VARCHAR(500),
  services TEXT[],
  insurance_accepted TEXT[],
  operating_hours JSONB,
  is_active BOOLEAN DEFAULT true,
  resource_level VARCHAR(20),
  ownership VARCHAR(20) DEFAULT 'public',
  bed_capacity INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_clinics_location ON clinics(country, region);
CREATE INDEX IF NOT EXISTS idx_clinics_coords   ON clinics(latitude, longitude);

CREATE TABLE IF NOT EXISTS health_workers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  clinic_id UUID REFERENCES clinics(id),
  worker_id VARCHAR(50) UNIQUE,
  specialization VARCHAR(200), certification_level VARCHAR(100),
  assigned_regions TEXT[], max_patients INTEGER DEFAULT 50,
  current_patient_count INTEGER DEFAULT 0,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  type notification_type DEFAULT 'in_app',
  title VARCHAR(255) NOT NULL, body TEXT NOT NULL, data JSONB,
  is_read BOOLEAN DEFAULT false, sent_at TIMESTAMP, read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(user_id, is_read);

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id), action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(100), resource_id UUID,
  old_values JSONB, new_values JSONB,
  ip_address INET, user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user    ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action  ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at);

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TRIGGER update_consultations_updated_at BEFORE UPDATE ON consultations FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
