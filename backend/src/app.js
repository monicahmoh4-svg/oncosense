require("dotenv").config();
const express     = require("express");
const cors        = require("cors");
const helmet      = require("helmet");
const morgan      = require("morgan");
const compression = require("compression");
const rateLimit   = require("express-rate-limit");
const path        = require("path");
const fs          = require("fs");

const authRoutes           = require("./routes/auth");
const userRoutes           = require("./routes/users");
const profileRoutes        = require("./routes/profiles");
const assessmentRoutes     = require("./routes/assessments");
const recommendationRoutes = require("./routes/recommendations");
const consultationRoutes   = require("./routes/consultations");
const messageRoutes        = require("./routes/messages");
const imageRoutes          = require("./routes/imageScreening");
const clinicRoutes         = require("./routes/clinics");
const adminAPIRoutes       = require("./routes/admin");
const notificationRoutes   = require("./routes/notifications");
const aiChatRoutes         = require("./routes/aiChat");

const { errorHandler } = require("./middleware/errorHandler");
const { auditLog }     = require("./middleware/auditLog");
const logger           = require("./utils/logger");

const app = express();

app.set("trust proxy", 1);

app.use(helmet({ crossOriginEmbedderPolicy: false, contentSecurityPolicy: false }));
app.use(cors({
  origin: "*",
  credentials: true,
  methods: ["GET","POST","PUT","DELETE","PATCH","OPTIONS"],
  allowedHeaders: ["Content-Type","Authorization","X-Request-ID"]
}));
app.use(compression());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(morgan("combined", { stream: { write: (msg) => logger.info(msg.trim()) } }));

const apiLimit = rateLimit({
  windowMs: 15 * 60 * 1000, max: 300,
  message: { error: "Too many requests." },
  standardHeaders: true, legacyHeaders: false
});
const authLimit = rateLimit({
  windowMs: 15 * 60 * 1000, max: 30,
  message: { error: "Too many auth attempts." },
  standardHeaders: true, legacyHeaders: false
});

// ── Health check — always responds instantly, no DB required
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    service: "oncosense",
    timestamp: new Date().toISOString(),
    version: "1.0.0"
  });
});

// ── Uploaded files
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// ── Rate limiting on API
app.use("/api", apiLimit);
app.use("/api/auth", authLimit);

// ── All API routes — strictly under /api/* prefix
app.use("/api/auth",            authRoutes);
app.use("/api/users",           userRoutes);
app.use("/api/profiles",        profileRoutes);
app.use("/api/assessments",     assessmentRoutes);
app.use("/api/recommendations", recommendationRoutes);
app.use("/api/consultations",   consultationRoutes);
app.use("/api/messages",        messageRoutes);
app.use("/api/image-screening", imageRoutes);
app.use("/api/clinics",         clinicRoutes);
app.use("/api/notifications",   notificationRoutes);
app.use("/api/admin",           adminAPIRoutes);
app.use("/api/ai-chat",         aiChatRoutes);

// ── Legacy unprefixed paths kept for Socket.IO auth compatibility only
app.use("/auth",            authRoutes);
app.use("/ai-chat",         aiChatRoutes);

// ── API error handler (only for /api routes)
app.use("/api", errorHandler);

// ── Serve the built React SPA
// backend/public is populated by scripts/copy-frontend.js during the build phase
const publicDir = path.resolve(__dirname, "..", "public");
const indexHtml = path.join(publicDir, "index.html");

logger.info(`Serving frontend from: ${publicDir}`);
logger.info(`index.html exists: ${fs.existsSync(indexHtml)}`);

// Serve static assets (JS/CSS/images) with long-term caching
app.use(express.static(publicDir, {
  maxAge: "1y",
  etag: true,
  index: false  // do NOT auto-serve index.html — we handle that below
}));

// SPA fallback — every non-API, non-asset request serves index.html
// This is what makes /dashboard, /admin, /login, /register all work
app.get("*", (req, res) => {
  if (fs.existsSync(indexHtml)) {
    res.sendFile(indexHtml);
  } else {
    // Frontend not built yet — show a clear error instead of JSON
    res.status(200).send(`<!DOCTYPE html>
<html>
  <head><title>OncoSense</title></head>
  <body style="font-family:sans-serif;padding:48px;background:#f0fdf8;color:#0d4d3c">
    <h1>🏥 OncoSense</h1>
    <p>Frontend build not found. The build step may have failed.</p>
    <p>Expected location: <code>${indexHtml}</code></p>
    <p>API is healthy: <a href="/health">/health</a></p>
  </body>
</html>`);
  }
});

// ── Global error handler
app.use(errorHandler);

module.exports = app;
