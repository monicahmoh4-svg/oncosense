require("dotenv").config();
const app    = require("./app");
const http   = require("http");
const { initSocket }               = require("./services/socketService");
const { connectDB, runMigrations } = require("./config/database");
const logger                       = require("./utils/logger");

const PORT = process.env.PORT || 3001;

async function start() {
  // Start HTTP server FIRST — health check must respond immediately
  const server = http.createServer(app);
  initSocket(server);

  await new Promise((resolve) => {
    server.listen(PORT, "0.0.0.0", () => {
      logger.info(`✅ OncoSense listening on port ${PORT}`);
      logger.info(`   NODE_ENV: ${process.env.NODE_ENV}`);
      logger.info(`   DATABASE_URL set: ${!!process.env.DATABASE_URL}`);
      resolve();
    });
  });

  // Connect to DB with retries — Render DB can take a few seconds
  let connected = false;
  for (let attempt = 1; attempt <= 10; attempt++) {
    try {
      await connectDB();
      logger.info("✅ Database connected");
      connected = true;
      break;
    } catch (err) {
      logger.warn(`DB attempt ${attempt}/10 failed: ${err.message}`);
      if (attempt < 10) await new Promise(r => setTimeout(r, 5000));
    }
  }

  if (connected) {
    try {
      await runMigrations();
    } catch (err) {
      logger.error("Migration error:", err.message);
    }
  } else {
    logger.error("Could not connect to DB after 10 attempts — running in degraded mode");
  }

  process.on("SIGTERM", () => {
    logger.info("SIGTERM — shutting down");
    server.close(() => process.exit(0));
  });
}

start().catch(err => {
  logger.error("Fatal startup error:", err.message);
  // Do NOT exit — HTTP server is already listening
});
