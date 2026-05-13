const { Pool } = require("pg");
const logger = require("../utils/logger");

let pool;

const getPool = () => {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
      ssl: process.env.NODE_ENV === "production" && process.env.DATABASE_SSL === "true"
        ? { rejectUnauthorized: false }
        : false
    });

    pool.on("error", (err) => {
      logger.error("PostgreSQL pool error:", err);
    });
  }
  return pool;
};

const connectDB = async () => {
  const client = await getPool().connect();
  try {
    await client.query("SELECT 1");
    logger.info("Database connection verified");
  } finally {
    client.release();
  }
};

const query = async (text, params) => {
  const start = Date.now();
  const pool = getPool();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    if (duration > 500) {
      logger.warn(`Slow query (${duration}ms): ${text.substring(0, 100)}`);
    }
    return result;
  } catch (error) {
    logger.error("Query error:", { text: text.substring(0, 100), error: error.message });
    throw error;
  }
};

const transaction = async (callback) => {
  const pool = getPool();
  const client = await pool.connect();
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
