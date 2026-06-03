const { Pool } = require("pg");
const fs   = require("fs");
const path = require("path");
const logger = require("../utils/logger");

let pool;

const createPool = async (dbUrl) => {
  try {
    const p = new Pool({
      connectionString: dbUrl,
      ssl: { rejectUnauthorized: false },
      max: 10, idleTimeoutMillis: 30000, connectionTimeoutMillis: 10000,
    });
    const client = await p.connect();
    await client.query("SELECT 1");
    client.release();
    logger.info("DB pool: SSL enabled");
    p.on("error", (err) => logger.error("PG pool error:", err.message));
    return p;
  } catch (sslErr) {
    logger.warn("SSL failed: " + sslErr.message + " — trying without SSL");
  }
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
    throw new Error("DATABASE_URL is not valid");
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

  await pool.query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      filename VARCHAR(255) PRIMARY KEY,
      applied_at TIMESTAMP DEFAULT NOW()
    )
  `).catch(e => logger.warn("_migrations table:", e.message));

  const { rows } = await pool.query("SELECT filename FROM _migrations").catch(() => ({ rows: [] }));
  const done = new Set(rows.map(r => r.filename));

  // Always re-run migrations — all statements use IF NOT EXISTS so idempotent
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

  if (!fs.existsSync(seedDir)) { logger.warn("Seeds dir not found"); return; }

  const seedFiles = fs.readdirSync(seedDir).filter(f => f.endsWith(".sql")).sort();

  for (const file of seedFiles) {
    const key = "seed:" + file;

    // Check if clinics table is empty — if so always re-seed regardless of tracking
    let clinicCount = 0;
    try {
      const cr = await pool.query("SELECT COUNT(*) FROM clinics");
      clinicCount = parseInt(cr.rows[0].count);
    } catch(e) {
      clinicCount = 0;
    }

    const forceReseed  = process.env.FORCE_RESEED === "true";
    const clinicsEmpty = clinicCount < 10;

    if (done.has(key) && !forceReseed && !clinicsEmpty) {
      logger.info("Seed already applied and clinics exist (" + clinicCount + " rows): " + file);
      continue;
    }

    if (clinicsEmpty) {
      logger.info("Clinics table is empty (" + clinicCount + " rows) — forcing seed: " + file);
    } else if (forceReseed) {
      logger.info("FORCE_RESEED=true — re-seeding: " + file);
    } else {
      logger.info("Applying seed: " + file);
    }

    // Remove old tracking so it runs fresh
    await pool.query("DELETE FROM _migrations WHERE filename = $1", [key]).catch(() => {});

    const sql = fs.readFileSync(path.join(seedDir, file), "utf8");
    try {
      await pool.query(sql);
      await pool.query(
        "INSERT INTO _migrations (filename) VALUES ($1) ON CONFLICT DO NOTHING", [key]
      );
      const after = await pool.query("SELECT COUNT(*) FROM clinics");
      logger.info("✅ Seed done: " + file + " — clinics in DB: " + after.rows[0].count);
    } catch (err) {
      logger.warn("Seed warning: " + file + " — " + err.message);
      await pool.query(
        "INSERT INTO _migrations (filename) VALUES ($1) ON CONFLICT DO NOTHING", [key]
      ).catch(() => {});
    }
  }

  logger.info("✅ All migrations complete");
};

module.exports = { getPool, connectDB, query, transaction, runMigrations };
