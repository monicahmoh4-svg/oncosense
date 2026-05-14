const { Pool } = require("pg");
const logger = require("../utils/logger");

let pool;

const getPool = () => {
  if (!pool) {
    const config = {
      connectionString: process.env.DATABASE_URL,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    };

    // Railway PostgreSQL always needs SSL with self-signed cert
    if (process.env.DATABASE_URL && process.env.DATABASE_URL.includes("railway")) {
      config.ssl = { rejectUnauthorized: false };
    } else if (process.env.NODE_ENV === "production") {
      config.ssl = { rejectUnauthorized: false };
    }

    pool = new Pool(config);

    pool.on("error", (err) => {
      logger.error("PostgreSQL pool error:", err.message);
    });
  }
  return pool;
};

const connectDB = async () => {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is not set");
  }
  const client = await getPool().connect();
  try {
    await client.query("SELECT 1");
    logger.info("Database connection verified");
  } finally {
    client.release();
  }
};

const query = async (text, params) => {
  if (!process.env.DATABASE_URL) {
    throw new Error("Database not configured");
  }
  const start = Date.now();
  try {
    const result = await getPool().query(text, params);
    const duration = Date.now() - start;
    if (duration > 500) {
      logger.warn(`Slow query (${duration}ms): ${text.substring(0, 80)}`);
    }
    return result;
  } catch (error) {
    logger.error("Query error:", { text: text.substring(0, 80), error: error.message });
    throw error;
  }
};

const transaction = async (callback) => {
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    const result = await callback(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

module.exports = { getPool, connectDB, query, transaction };
