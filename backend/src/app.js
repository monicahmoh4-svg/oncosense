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

// Health check
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "healthy", service: "oncosense",
    timestamp: new Date().toISOString(), version: "1.0.0"
  });
});

// DB diagnostic — visit /debug-db to see connection status
app.get("/debug-db", async (req, res) => {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    return res.json({ error: "DATABASE_URL is NOT set in environment variables" });
  }

  let info = {};
  try {
    const u = new URL(dbUrl);
    info = {
      hostname: u.hostname,
      port: u.port || "5432",
      database: u.pathname,
      username: u.username,
      hasPassword: !!u.password,
      urlLength: dbUrl.length,
    };
  } catch (e) {
    return res.json({ error: "DATABASE_URL is not a valid URL", raw: dbUrl.substring(0, 50) });
  }

  // Test with SSL
  try {
    const { Pool } = require("pg");
    const p = new Pool({ connectionString: dbUrl, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 8000 });
    const c = await p.connect();
    await c.query("SELECT 1");
    c.release();
    await p.end();
    return res.json({ ...info, result: "SUCCESS with SSL — use External URL" });
  } catch (e1) {
    // Test without SSL
    try {
      const { Pool } = require("pg");
      const p = new Pool({ connectionString: dbUrl, ssl: false, connectionTimeoutMillis: 8000 });
      const c = await p.connect();
      await c.query("SELECT 1");
      c.release();
      await p.end();
      return res.json({ ...info, result: "SUCCESS without SSL — use Internal URL" });
    } catch (e2) {
      return res.json({
        ...info,
        result: "FAILED",
        sslError: e1.message,
        noSslError: e2.message
      });
    }
  }
});

app.use("/uploads", express.static(path.join(__dirname, "../uploads")));
app.use("/api",      apiLimit);
app.use("/api/auth", authLimit);

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

app.use("/auth",    authRoutes);
app.use("/ai-chat", aiChatRoutes);

app.use("/api", errorHandler);

const publicDir = path.resolve(__dirname, "..", "public");
const indexHtml = path.join(publicDir, "index.html");

logger.info(`publicDir: ${publicDir}`);
logger.info(`indexHtml exists: ${fs.existsSync(indexHtml)}`);

app.use(express.static(publicDir, { maxAge: "1y", etag: true, index: false }));

app.get("*", (req, res) => {
  if (fs.existsSync(indexHtml)) return res.sendFile(indexHtml);
  res.status(503).send(`
    <!DOCTYPE html><html><head><title>OncoSense</title>
    <style>body{font-family:sans-serif;padding:40px;background:#f0fdf8;color:#0d4d3c}</style>
    </head><body>
    <h1>🏥 OncoSense</h1>
    <p>Frontend not found at: <code>${indexHtml}</code></p>
    <p><a href="/health">API health</a> | <a href="/debug-db">DB debug</a></p>
    </body></html>
  `);
});

app.use(errorHandler);

module.exports = app;
