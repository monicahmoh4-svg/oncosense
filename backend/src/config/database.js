const { Pool } = require("pg");
const fs   = require("fs");
const path = require("path");
const logger = require("../utils/logger");

let pool;

const createPool = async (dbUrl) => {
  // Try SSL first (Render external URLs, Neon, Supabase)
  try {
    const p = new Pool({
      connectionString: dbUrl,
      ssl: { rejectUnauthorized: false },
      max: 10, idleTimeoutMillis: 30000, connectionTimeoutMillis: 10000,
    });
    const client = await p.connect();
    await client.query("SELECT 1");
    client.release();
    logger.info("DB pool: SSL");
    p.on("error", (err) => logger.error("PG pool error:", err.message));
    return p;
  } catch (sslErr) {
    logger.warn("SSL failed: " + sslErr.message + " — trying without SSL");
  }

  // Try without SSL (Render internal URLs)
  try {
    const p = new Pool({
      connectionString: dbUrl,
      ssl: false,
      max: 10, idleTimeoutMillis: 30000, connectionTimeoutMillis: 10000,
    });
    const client = await p.connect();
    await client.query("SELECT 1");
    client.release();
    logger.info("DB pool: no SSL");
    p.on("error", (err) => logger.error("PG pool error:", err.message));
    return p;
  } catch (noSslErr) {
    throw new Error("DB connection failed both ways. Error: " + noSslErr.message);
  }
};

const getPool = () => {
  if (!pool) throw new Error("Database not initialised");
  return pool;
};

const connectDB = async () => {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) throw new Error("DATABASE_URL is not set");
  try {
    const u = new URL(dbUrl);
    logger.info("DB connecting to: " + u.hostname + u.pathname);
  } catch {
    throw new Error("DATABASE_URL is not valid: " + dbUrl.substring(0, 40));
  }
  pool = await createPool(dbUrl);
  logger.info("✅ Database connected");
};

const query = async (text, params) => {
  if (!pool) throw new Error("Database not connected");
  try {
    return await pool.query(text, params);
  } catch (err) {
    logger.error("Query error:", { sql: text.substring(0, 100), error: err.message, code: err.code });
    throw err;
  }
};

const transaction = async (callback) => {
  if (!pool) throw new Error("Database not connected");
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await callback(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

const runMigrations = async () => {
  const repoRoot = path.resolve(__dirname, "..", "..", "..");
  const migDir   = path.join(repoRoot, "db", "migrations");
  const seedDir  = path.join(repoRoot, "db", "seeds");

  logger.info("repoRoot: " + repoRoot);
  logger.info("migDir: " + migDir + " exists=" + fs.existsSync(migDir));

  if (!fs.existsSync(migDir)) { logger.warn("Migrations dir not found"); return; }

  // Tracking table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      filename VARCHAR(255) PRIMARY KEY,
      applied_at TIMESTAMP DEFAULT NOW()
    )
  `).catch(e => logger.warn("_migrations table:", e.message));

  const { rows } = await pool.query("SELECT filename FROM _migrations").catch(() => ({ rows: [] }));
  const done = new Set(rows.map(r => r.filename));

  // Always re-run migration 001 to apply any new ALTER TABLE statements safely
  // The migration uses IF NOT EXISTS everywhere so it is idempotent
  const migFiles = fs.readdirSync(migDir).filter(f => f.endsWith(".sql")).sort();
  for (const file of migFiles) {
    logger.info("Applying migration: " + file);
    const sql = fs.readFileSync(path.join(migDir, file), "utf8");
    try {
      await pool.query(sql);
      await pool.query(
        "INSERT INTO _migrations (filename) VALUES ($1) ON CONFLICT DO NOTHING", [file]
      );
      logger.info("✅ Migration: " + file);
    } catch (err) {
      logger.error("Migration failed: " + file + " — " + err.message);
    }
  }

  // Seeds — force re-run if FORCE_RESEED=true
  const forceReseed = process.env.FORCE_RESEED === "true";

  if (fs.existsSync(seedDir)) {
    const seedFiles = fs.readdirSync(seedDir).filter(f => f.endsWith(".sql")).sort();
    for (const file of seedFiles) {
      const key = "seed:" + file;
      if (done.has(key) && !forceReseed) {
        logger.info("Seed already applied: " + file);
        continue;
      }
      if (forceReseed) {
        await pool.query("DELETE FROM _migrations WHERE filename = $1", [key]).catch(() => {});
        logger.info("Force re-seeding: " + file);
      } else {
        logger.info("Seeding: " + file);
      }
      const sql = fs.readFileSync(path.join(seedDir, file), "utf8");
      try {
        await pool.query(sql);
        await pool.query(
          "INSERT INTO _migrations (filename) VALUES ($1) ON CONFLICT DO NOTHING", [key]
        );
        logger.info("✅ Seed: " + file);
      } catch (err) {
        logger.warn("Seed warning: " + file + " — " + err.message);
        await pool.query(
          "INSERT INTO _migrations (filename) VALUES ($1) ON CONFLICT DO NOTHING", [key]
        ).catch(() => {});
      }
    }
  }

  logger.info("✅ All migrations done");
};

module.exports = { getPool, connectDB, query, transaction, runMigrations };
