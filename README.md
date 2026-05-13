# 🏥 OncoSense — Early Cancer Detection Platform

> AI-powered cancer risk screening for underserved and low-resource communities.

**⚠️ DISCLAIMER: This system is for SCREENING SUPPORT ONLY. It does NOT provide medical diagnosis. Always consult a qualified healthcare professional.**

---

## 🌍 Overview

OncoSense is a production-ready fullstack health platform designed to improve early cancer detection in low-resource settings across sub-Saharan Africa and beyond. It combines rule-based clinical logic with machine learning, telemedicine, and an AI voice assistant — all deployable with a single command.

---

## ✨ Key Features

| Feature | Description |
|---|---|
| 🧠 AI Risk Assessment | Hybrid rule-based + logistic regression engine for 8 cancer types |
| 🎙️ AI Voice Assistant | Talk to the AI consultant via microphone (Web Speech API) |
| 📊 Risk Explanations | SHAP-style feature importance — understand WHY a risk was flagged |
| 📹 Telemedicine | WebRTC video + Socket.IO chat between patients and clinicians |
| 📷 Image Pre-screening | AI-assisted oral/skin lesion analysis |
| 🗺️ Clinic Finder | 11+ pre-seeded Kenyan screening facilities |
| 📴 Offline-First | IndexedDB queuing, syncs when back online |
| 🌐 Multi-language | English, Kiswahili, Français |
| 🛡️ Admin Panel | Full analytics, user management, high-risk tracking |
| 🔒 HIPAA-aligned | Encrypted data, audit logs, consent flows |

---

## 🚀 Quick Start (One Command)

### Prerequisites
- Docker ≥ 24.0
- Docker Compose ≥ 2.0
- 4GB RAM

```bash
# Clone the project
git clone <repo> oncosense && cd oncosense

# (Optional) Add your Google Gemini API key for full AI assistant
echo "GEMINI_API_KEY=your_key_here" > .env

# Start everything
docker compose up --build

# Visit the app
open http://localhost
```

**That's it.** All services start automatically.

---

## 🔑 Demo Credentials

| Role | Email | Password |
|---|---|---|
| Admin | admin@oncosense.health | Admin@OncoSense2024 |
| Clinician | dr.amina@oncosense.health | Admin@OncoSense2024 |
| Health Worker | chw.john@oncosense.health | Admin@OncoSense2024 |

---

## 🗺️ URL Map

| URL | Description |
|---|---|
| `http://localhost` | Patient-facing app |
| `http://localhost/admin` | Admin / clinician panel |
| `http://localhost/api/health` | Backend health check |
| `http://localhost/ai/docs` | AI Service API docs (FastAPI) |
| `http://localhost/ai/health` | AI Service health check |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────┐
│              NGINX API Gateway :80               │
└──┬─────────┬──────────┬──────────────────────────┘
   │         │          │
┌──▼──┐  ┌──▼──┐   ┌───▼────┐
│React│  │Node │   │FastAPI │
│:5173│  │:3001│   │AI :8000│
└─────┘  └──┬──┘   └────────┘
             │
      ┌──────┴──────┐
      │  PostgreSQL  │  Redis
      │    :5432    │  :6379
      └─────────────┘
```

### Services

| Service | Tech | Port | Purpose |
|---|---|---|---|
| Frontend | React + Vite + Tailwind | 5173→80 | Patient & admin UI |
| Backend | Node.js + Express | 3001 | REST API + WebSockets |
| AI Service | Python + FastAPI | 8000 | Risk scoring + image analysis |
| Database | PostgreSQL 15 | 5432 | Primary data store |
| Cache | Redis 7 | 6379 | Sessions, rate limiting |
| Gateway | Nginx | 80 | Routing, rate limiting, TLS |

---

## 🧠 AI Risk Engine

### Hybrid Approach

```
INPUT → Rule Engine → ML Layer → Combined Score → Risk Level
         (clinical    (logistic                    Low / Medium
          guidelines)  regression)                 High / Critical
```

### Cancer Types Assessed
- Cervical · Breast · Lung · Colorectal
- Oral · Prostate · Liver · Esophageal

### Risk Score Formula
```
final_score = 0.65 × ml_score + 0.35 × rule_score
risk_level  = low (<0.25) | medium (0.25-0.5) | high (0.5-0.75) | critical (>0.75)
```

### Key Risk Rules (examples)
```python
IF smoker + cough + weight_loss     → +lung cancer score
IF female + unvaccinated + HIV      → +cervical cancer score
IF rectal_bleeding + age > 50       → +colorectal cancer score
IF hepatitis_b OR hepatitis_c       → +liver cancer score
IF non_healing_sore + alcohol       → +oral cancer score
```

---

## 🎙️ AI Voice Consultant

The AI Assistant supports **full duplex voice interaction**:

1. **Speech-to-Text**: Web Speech API (Chrome/Edge/Safari)
2. **AI Response**: Claude Sonnet via Google Gemini API (backend proxy)
3. **Text-to-Speech**: Web Speech Synthesis API (built-in browser)

### Voice Features
- 🎙️ Click microphone → speak → AI transcribes in real time
- 🔊 AI responses are automatically spoken aloud
- ⚙️ Choose voice style: Calm / Warm / Precise
- 🔇 Toggle voice output on/off
- 🔄 Replay last AI response
- Suggested starter questions
- Full conversation history

### Setup (API Key)
```bash
# 1. Get a free key at https://aistudio.google.com/app/apikey
# 2. Add to your .env file
GEMINI_API_KEY=AIza...

# Or pass via docker-compose
echo "GEMINI_API_KEY=AIza..." > .env
docker compose up
```

The backend proxies requests to Anthropic — your API key stays server-side and never reaches the browser.

---

## 📡 API Reference

### Authentication
```
POST /api/auth/register   — Create account
POST /api/auth/login      — Login → JWT
GET  /api/auth/me         — Current user
POST /api/auth/logout     — Logout
```

### Risk Assessment
```
POST /api/assessments      — Submit intake → AI assessment
GET  /api/assessments      — User's assessments
GET  /api/assessments/latest
GET  /api/assessments/:id
```

### Profiles
```
GET  /api/profiles/me
PUT  /api/profiles/me
```

### AI Chat (via backend proxy)
```
POST /api/ai-chat/chat     — Send message to Claude
  Body: { messages: [{role, content}] }
```

### AI Service (direct)
```
POST /ai/risk/assess       — Risk assessment
POST /ai/image/analyze     — Image pre-screening
GET  /ai/risk/model-info   — Model metadata
```

### Admin
```
GET  /api/admin/dashboard          — Stats overview
GET  /api/admin/users              — User list
GET  /api/admin/high-risk-users    — High-risk patients
GET  /api/admin/assessments        — All assessments
GET  /api/admin/analytics/cancer-types
PATCH /api/admin/users/:id/toggle  — Activate/deactivate
```

---

## 🗃️ Database Schema

12 tables:
`users` · `health_profiles` · `symptoms` · `risk_assessments` · `recommendations` · `consultations` · `messages` · `image_screenings` · `clinics` · `health_workers` · `notifications` · `audit_logs`

---

## 📁 Project Structure

```
oncosense/
├── frontend/              # React 18 + Vite + Tailwind
│   └── src/
│       ├── pages/         # Landing, Login, Register, Dashboard,
│       │                    HealthIntake, RiskResults, AIConsultant,
│       │                    Consultations, ConsultationRoom, Clinics,
│       │                    ImageScreening, Profile
│       ├── pages/admin/   # AdminDashboard, Users, Assessments, Analytics
│       ├── components/    # AppLayout, AdminLayout
│       ├── store/         # Zustand auth store
│       ├── services/      # Axios API service
│       ├── offline/       # Dexie IndexedDB offline queue
│       └── i18n/          # en/sw/fr translations
├── backend/               # Node.js + Express
│   └── src/
│       ├── routes/        # auth, users, profiles, assessments,
│       │                    consultations, messages, clinics,
│       │                    imageScreening, notifications, admin, aiChat
│       ├── controllers/   # authController, assessmentController
│       ├── middleware/     # auth (JWT), errorHandler, auditLog
│       ├── config/        # database (pg pool)
│       └── services/      # socketService (Socket.IO + WebRTC signaling)
├── ai-service/            # Python 3.11 + FastAPI
│   └── app/
│       ├── engines/       # risk_engine.py (rule + ML hybrid)
│       ├── routers/       # risk.py, image_screening.py, health.py
│       └── models/        # trained model artifacts
├── db/
│   ├── migrations/        # 001_initial_schema.sql
│   └── seeds/             # 002_seed_data.sql
├── nginx/                 # nginx.conf (API gateway)
├── docker-compose.yml     # One-command startup
└── README.md
```

---

## 🔒 Security

- **JWT authentication** on all protected routes
- **bcrypt** password hashing (12 rounds)
- **Rate limiting**: 200 req/15min general, 20 req/15min auth
- **Audit logging**: All mutating actions logged with user/IP
- **Consent flows**: Image screening requires explicit consent
- **GEMINI_API_KEY**: Server-side only, never exposed to browser
- **Data minimization**: Only clinically relevant data stored
- **Helmet.js**: Security headers on all responses
- **Input validation**: express-validator on all endpoints

---

## 🌐 Offline Support

1. Health assessments queue to IndexedDB when offline
2. Auto-sync on reconnection (`window.online` event)
3. Clinics cached locally after first load
4. Visual offline indicator in sidebar

---

## 📱 Accessibility & Low-Resource Design

- Icons + minimal text for low-literacy users
- Large tap targets (min 44px)
- Step-by-step guided assessment (5 steps)
- Offline-first operation
- Language toggle (EN/SW/FR) persistent in localStorage
- Optimized bundle size for low bandwidth

---

## 🛠️ Development

```bash
# Backend dev
cd backend && npm install && npm run dev

# Frontend dev
cd frontend && npm install && npm run dev

# AI service dev
cd ai-service && pip install -r requirements.txt
python -c "from app.engines.risk_engine import train_and_save_model; train_and_save_model()"
uvicorn app.main:app --reload --port 8000

# Database (needs postgres running)
psql $DATABASE_URL < db/migrations/001_initial_schema.sql
psql $DATABASE_URL < db/seeds/002_seed_data.sql
```

---

## 🌍 Deployment

### Environment Variables

```bash
# Backend
NODE_ENV=production
JWT_SECRET=<strong-random-secret>
DATABASE_URL=postgresql://user:pass@host:5432/oncosense
REDIS_URL=redis://host:6379
AI_SERVICE_URL=http://ai-service:8000
GEMINI_API_KEY=AIza...   # For AI assistant
BCRYPT_ROUNDS=12

# Frontend (build args)
VITE_API_URL=/api
VITE_AI_URL=/ai
VITE_SOCKET_URL=/
```

### Production Checklist
- [ ] Change all default passwords
- [ ] Set strong `JWT_SECRET`
- [ ] Add `GEMINI_API_KEY`
- [ ] Configure TLS/HTTPS in nginx
- [ ] Set up database backups
- [ ] Configure proper CORS origins
- [ ] Enable PostgreSQL SSL

---

## 📋 Roadmap / Bonus Features

- [ ] SMS integration (Africa's Talking / Twilio)
- [ ] WhatsApp Bot (Twilio WhatsApp API)
- [ ] GPS-based clinic suggestions (Google Maps API)
- [ ] Push notifications (Web Push)
- [ ] Community health worker mobile app
- [ ] FHIR-compliant data export
- [ ] Swahili AI voice (custom TTS)
- [ ] Federated learning for model improvement

---

## ⚖️ License & Ethics

OncoSense is built for humanitarian purposes. All AI outputs include mandatory disclaimers. The system:
- **Does not diagnose** — only screens and stratifies risk
- **Does not replace doctors** — provides a pathway to care
- **Protects privacy** — minimal data collection, encrypted storage
- **Is transparent** — explains every risk score

---

*Built with ❤️ for communities where early detection can save lives.*
