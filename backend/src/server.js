require("dotenv").config();
const app  = require("./app");
const http = require("http");
const { initSocket } = require("./services/socketService");
const { connectDB }  = require("./config/database");
const logger         = require("./utils/logger");

const PORT = process.env.PORT || 3001;

async function start() {
  try {
    await connectDB();
    logger.info("✅ Database connected");

    const server = http.createServer(app);
    initSocket(server);
    logger.info("✅ Socket.IO initialized");

    server.listen(PORT, "0.0.0.0", () => {
      logger.info(`✅ OncoSense Backend running on port ${PORT}`);
    });

    process.on("SIGTERM", () => server.close(() => process.exit(0)));
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
}

start();
