-- OncoSense Seed Data
-- Seed: 002_seed_data.sql

-- ─── SEED ADMIN USER (password: Admin@OncoSense2024) ──────────
INSERT INTO users (id, email, phone, password_hash, role, first_name, last_name, is_active, is_verified)
VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'admin@oncosense.health',
    '+254700000001',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMeJfhLm/6m3X.2V4RESnGQrCi', -- Admin@OncoSense2024
    'admin',
    'System',
    'Administrator',
    true,
    true
);

-- ─── DEMO CLINICIAN ───────────────────────────────────────────
INSERT INTO users (id, email, phone, password_hash, role, first_name, last_name, is_active, is_verified)
VALUES (
    'a0000000-0000-0000-0000-000000000002',
    'dr.amina@oncosense.health',
    '+254700000002',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMeJfhLm/6m3X.2V4RESnGQrCi',
    'clinician',
    'Dr. Amina',
    'Hassan',
    true,
    true
);

-- ─── DEMO HEALTH WORKER ────────────────────────────────────────
INSERT INTO users (id, email, phone, password_hash, role, first_name, last_name, is_active, is_verified)
VALUES (
    'a0000000-0000-0000-0000-000000000003',
    'chw.john@oncosense.health',
    '+254700000003',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMeJfhLm/6m3X.2V4RESnGQrCi',
    'health_worker',
    'John',
    'Mwangi',
    true,
    true
);

-- ─── SAMPLE CLINICS (Kenya/East Africa) ───────────────────────
INSERT INTO clinics (name, type, address, country, region, district, latitude, longitude, phone, services, resource_level) VALUES
('Kenyatta National Hospital', 'hospital', 'Hospital Rd, Nairobi', 'Kenya', 'Nairobi', 'Nairobi Central', -1.3006, 36.8076, '+254202726300', ARRAY['cervical_screening','mammography','oncology','pathology'], 'high'),
('Moi Teaching & Referral Hospital', 'hospital', 'Nandi Rd, Eldoret', 'Kenya', 'Uasin Gishu', 'Eldoret', 0.5143, 35.2698, '+254537773000', ARRAY['cervical_screening','oncology','pathology'], 'high'),
('Coast General Hospital', 'hospital', 'Mombasa Rd, Mombasa', 'Kenya', 'Mombasa', 'Mombasa Island', -4.0435, 39.6682, '+254412312191', ARRAY['cervical_screening','mammography','oncology'], 'high'),
('Kisumu County Referral', 'hospital', 'Jomo Kenyatta Ave, Kisumu', 'Kenya', 'Kisumu', 'Kisumu East', -0.1022, 34.7617, '+254572022777', ARRAY['cervical_screening','pathology'], 'medium'),
('Karen Hospital', 'hospital', 'Karen Rd, Nairobi', 'Kenya', 'Nairobi', 'Karen', -1.3166, 36.7173, '+254709876000', ARRAY['cervical_screening','mammography','oncology','pathology','mri'], 'high'),
('Nakuru Level 5 Hospital', 'hospital', 'Nakuru-Eldoret Rd, Nakuru', 'Kenya', 'Nakuru', 'Nakuru Town', -0.3031, 36.0800, '+254512211111', ARRAY['cervical_screening','basic_oncology'], 'medium'),
('Machakos Level 5 Hospital', 'hospital', 'Nairobi Rd, Machakos', 'Kenya', 'Machakos', 'Machakos Town', -1.5177, 37.2634, '+254452021222', ARRAY['cervical_screening'], 'medium'),
('Pumwani Maternity Hospital', 'hospital', 'Eastleigh, Nairobi', 'Kenya', 'Nairobi', 'Pumwani', -1.2741, 36.8519, '+254202119000', ARRAY['cervical_screening','reproductive_health'], 'medium'),
('Mbagathi Hospital', 'hospital', 'Mbagathi Way, Nairobi', 'Kenya', 'Nairobi', 'Langata', -1.3167, 36.7833, '+254202002555', ARRAY['cervical_screening','basic_cancer_screening'], 'medium'),
('Thika Level 5 Hospital', 'hospital', 'Thika-Garissa Rd, Thika', 'Kenya', 'Kiambu', 'Thika', -1.0332, 37.0693, '+254672022222', ARRAY['cervical_screening'], 'low'),
('Gertrudes Children Hospital', 'hospital', 'Muthaiga Rd, Nairobi', 'Kenya', 'Nairobi', 'Muthaiga', -1.2596, 36.8319, '+254203763000', ARRAY['pediatric_oncology'], 'high');

-- ─── HEALTH WORKER RECORD ─────────────────────────────────────
INSERT INTO health_workers (user_id, worker_id, specialization, assigned_regions, max_patients)
VALUES (
    'a0000000-0000-0000-0000-000000000003',
    'CHW-KE-001',
    'Community Health & Cancer Screening',
    ARRAY['Nairobi', 'Kiambu'],
    100
);
