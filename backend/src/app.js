require("dotenv").config();
const express  = require("express");
const cors     = require("cors");
const helmet   = require("helmet");
const morgan   = require("morgan");
const compression = require("compression");
const rateLimit   = require("express-rate-limit");
const path        = require("path");

const authRoutes          = require("./routes/auth");
const userRoutes          = require("./routes/users");
const profileRoutes       = require("./routes/profiles");
const assessmentRoutes    = require("./routes/assessments");
const recommendationRoutes= require("./routes/recommendations");
const consultationRoutes  = require("./routes/consultations");
const messageRoutes       = require("./routes/messages");
const imageRoutes         = require("./routes/imageScreening");
const clinicRoutes        = require("./routes/clinics");
const adminRoutes         = require("./routes/admin");
const notificationRoutes  = require("./routes/notifications");
const aiChatRoutes        = require("./routes/aiChat");

const { errorHandler } = require("./middleware/errorHandler");
const { auditLog }     = require("./middleware/auditLog");
const logger           = require("./utils/logger");

const app = express();

app.set("trust proxy", 1);

app.use(helmet({ crossOriginEmbedderPolicy: false, contentSecurityPolicy: false }));

app.use(cors({
  origin: "*",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Request-ID"]
}));

app.use(compression());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(morgan("combined", { stream: { write: (msg) => logger.info(msg.trim()) } }));

const generalLimit = rateLimit({
  windowMs: 15 * 60 * 1000, max: 300,
  message: { error: "Too many requests, please try again later." },
  standardHeaders: true, legacyHeaders: false
});
const authLimit = rateLimit({
  windowMs: 15 * 60 * 1000, max: 30,
  message: { error: "Too many auth attempts, please try again later." },
  standardHeaders: true, legacyHeaders: false
});

app.use(generalLimit);
app.use("/auth", authLimit);

app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Health check — must respond instantly, no DB needed
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    service: "oncosense-backend",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    db: !!process.env.DATABASE_URL ? "configured" : "not configured"
  });
});

// Root path also returns healthy (Railway sometimes checks /)
app.get("/", (req, res) => {
  res.status(200).json({ status: "ok", service: "OncoSense API" });
});

app.use(auditLog);

app.use("/auth",            authRoutes);
app.use("/users",           userRoutes);
app.use("/profiles",        profileRoutes);
app.use("/assessments",     assessmentRoutes);
app.use("/recommendations", recommendationRoutes);
app.use("/consultations",   consultationRoutes);
app.use("/messages",        messageRoutes);
app.use("/image-screening", imageRoutes);
app.use("/clinics",         clinicRoutes);
app.use("/notifications",   notificationRoutes);
app.use("/admin",           adminRoutes);
app.use("/ai-chat",         aiChatRoutes);

app.use(errorHandler);

module.exports = app;
