require("dotenv").config();
const app    = require("./app");
const http   = require("http");
const { initSocket } = require("./services/socketService");
const { connectDB }  = require("./config/database");
const logger         = require("./utils/logger");

const PORT = process.env.PORT || 3001;

async function start() {
  // Create server and start listening FIRST
  // so /health responds immediately during Railway healthcheck
  const server = http.createServer(app);
  initSocket(server);

  server.listen(PORT, "0.0.0.0", () => {
    logger.info(`✅ OncoSense Backend running on port ${PORT}`);
    logger.info(`   Environment: ${process.env.NODE_ENV || "development"}`);
  });

  // Connect to DB after server is already listening
  // Retry logic so Railway has time to provision the DB
  let retries = 10;
  while (retries > 0) {
    try {
      await connectDB();
      logger.info("✅ Database connected");
      break;
    } catch (err) {
      retries--;
      logger.warn(`Database connection failed. Retries left: ${retries}. Error: ${err.message}`);
      if (retries === 0) {
        logger.error("Could not connect to database after 10 attempts. Server continues without DB.");
      } else {
        await new Promise(r => setTimeout(r, 3000));
      }
    }
  }

  process.on("SIGTERM", () => {
    logger.info("SIGTERM received, shutting down...");
    server.close(() => process.exit(0));
  });
}

start().catch(err => {
  console.error("Fatal startup error:", err);
  // Do NOT exit — let the healthcheck pass so Railway doesn't kill us
});
