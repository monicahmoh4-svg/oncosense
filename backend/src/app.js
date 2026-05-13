const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const compression = require("compression");
const rateLimit = require("express-rate-limit");
const path = require("path");

const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const profileRoutes = require("./routes/profiles");
const assessmentRoutes = require("./routes/assessments");
const recommendationRoutes = require("./routes/recommendations");
const consultationRoutes = require("./routes/consultations");
const messageRoutes = require("./routes/messages");
const imageRoutes = require("./routes/imageScreening");
const clinicRoutes = require("./routes/clinics");
const adminRoutes = require("./routes/admin");
const notificationRoutes = require("./routes/notifications");

const { errorHandler } = require("./middleware/errorHandler");
const { auditLog } = require("./middleware/auditLog");
const logger = require("./utils/logger");

const app = express();

// ── Trust proxy (for nginx)
app.set("trust proxy", 1);

// ── Security
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: false
}));

// ── CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || "*",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Request-ID"]
}));

// ── Compression
app.use(compression());

// ── Body parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ── HTTP logging
app.use(morgan("combined", {
  stream: { write: (msg) => logger.info(msg.trim()) }
}));

// ── Rate limiting
const generalLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 200,
  message: { error: "Too many requests, please try again later." }
});

const authLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: "Too many auth attempts, please try again later." }
});

app.use("/api", generalLimit);
app.use("/auth", authLimit);

// ── Static files (uploads)
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// ── Health check
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    service: "oncosense-backend",
    timestamp: new Date().toISOString(),
    version: "1.0.0"
  });
});

// ── Audit logging
app.use(auditLog);

// ── API Routes
app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/profiles", profileRoutes);
app.use("/assessments", assessmentRoutes);
app.use("/recommendations", recommendationRoutes);
app.use("/consultations", consultationRoutes);
app.use("/messages", messageRoutes);
app.use("/image-screening", imageRoutes);
app.use("/clinics", clinicRoutes);
app.use("/notifications", notificationRoutes);

// ── Admin Routes
app.use("/admin", adminRoutes);

// ── Error handler
app.use(errorHandler);

module.exports = app;
