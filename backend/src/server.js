require("dotenv").config();
const app    = require("./app");
const http   = require("http");
const { initSocket }               = require("./services/socketService");
const { connectDB, runMigrations } = require("./config/database");
const logger                       = require("./utils/logger");

const PORT = process.env.PORT || 3001;

async function start() {
  const server = http.createServer(app);
  initSocket(server);

  await new Promise((resolve) => {
    server.listen(PORT, "0.0.0.0", () => {
      logger.info(`✅ OncoSense on port ${PORT} | NODE_ENV=${process.env.NODE_ENV}`);
      logger.info(`   DATABASE_URL set: ${!!process.env.DATABASE_URL}`);
      resolve();
    });
  });

  for (let i = 1; i <= 10; i++) {
    try {
      await connectDB();
      logger.info("✅ Database connected");
      await runMigrations();
      break;
    } catch (err) {
      logger.warn(`DB attempt ${i}/10: ${err.message}`);
      if (i < 10) await new Promise(r => setTimeout(r, 5000));
      else logger.error("DB unavailable — degraded mode");
    }
  }

  process.on("SIGTERM", () => server.close(() => process.exit(0)));
}

start().catch(err => {
  logger.error("Fatal:", err.message);
});
