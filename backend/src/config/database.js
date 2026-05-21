const { Pool } = require("pg");
const fs   = require("fs");
const path = require("path");
const logger = require("../utils/logger");

let pool;

const getPool = () => {
  if (!pool) {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL is not set");
    }

    const config = {
      connectionString: process.env.DATABASE_URL,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 15000,
    };

    // Enable SSL for all production environments (Render, Railway, etc.)
    // Render PostgreSQL requires SSL — rejectUnauthorized:false for self-signed certs
    if (process.env.NODE_ENV === "production") {
      config.ssl = { rejectUnauthorized: false };
    }

    pool = new Pool(config);
    pool.on("error", (err) => logger.error("PG pool error:", err.message));
  }
  return pool;
};

const connectDB = async () => {
  const client = await getPool().connect();
  try {
    await client.query("SELECT 1");
    logger.info("Database ping successful");
  } finally {
    client.release();
  }
};

const query = async (text, params) => {
  const start = Date.now();
  try {
    const result = await getPool().query(text, params);
    const ms = Date.now() - start;
    if (ms > 500) logger.warn(`Slow query (${ms}ms): ${text.substring(0, 80)}`);
    return result;
  } catch (err) {
    logger.error("Query error:", { sql: text.substring(0, 80), error: err.message, code: err.code });
    throw err;
  }
};

const transaction = async (callback) => {
  const client = await getPool().connect();
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

// Split SQL into individual statements and run each one separately
// This prevents one failing statement from aborting the whole migration
const runSqlStatements = async (sql) => {
  // Split on semicolons but ignore those inside strings/functions
  const statements = sql
    .split(/;[\s]*(?=(?:[^']*'[^']*')*[^']*$)/gm)
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith("--"));

  for (const stmt of statements) {
    try {
      await getPool().query(stmt);
    } catch (err) {
      // Skip "already exists" errors — makes migrations idempotent
      if (
        err.message.includes("already exists") ||
        err.code === "42710" ||  // duplicate_object
        err.code === "42P07" ||  // duplicate_table
        err.code === "42701"     // duplicate_column
      ) {
        // Expected — skip silently
      } else {
        logger.warn(`SQL statement warning: ${err.message} | stmt: ${stmt.substring(0, 60)}`);
      }
    }
  }
};

const runMigrations = async () => {
  // Resolve path from repo root regardless of where Node is invoked from
  // On Render: /opt/render/project/src/db/migrations
  // __dirname = /opt/render/project/src/backend/src/config
  const repoRoot = path.resolve(__dirname, "..", "..", "..");
  const migDir   = path.join(repoRoot, "db", "migrations");
  const seedDir  = path.join(repoRoot, "db", "seeds");

  logger.info(`Migrations dir: ${migDir}`);
  logger.info(`Migrations dir exists: ${fs.existsSync(migDir)}`);

  if (!fs.existsSync(migDir)) {
    logger.warn("Migrations directory not found — skipping auto-migration");
    return;
  }

  // Create tracking table
  try {
    await getPool().query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        filename VARCHAR(255) PRIMARY KEY,
        applied_at TIMESTAMP DEFAULT NOW()
      )
    `);
  } catch (err) {
    logger.warn("Could not create _migrations table:", err.message);
    return;
  }

  const applied = await getPool().query("SELECT filename FROM _migrations");
  const done = new Set(applied.rows.map(r => r.filename));

  // Run migration files
  const migFiles = fs.readdirSync(migDir)
    .filter(f => f.endsWith(".sql"))
    .sort();

  for (const file of migFiles) {
    if (done.has(file)) {
      logger.info(`Migration already applied: ${file}`);
      continue;
    }
    try {
      logger.info(`Applying migration: ${file}`);
      const sql = fs.readFileSync(path.join(migDir, file), "utf8");
      await runSqlStatements(sql);
      await getPool().query(
        "INSERT INTO _migrations (filename) VALUES ($1) ON CONFLICT DO NOTHING",
        [file]
      );
      logger.info(`✅ Migration applied: ${file}`);
    } catch (err) {
      logger.error(`Migration failed: ${file} — ${err.message}`);
    }
  }

  // Run seed files
  if (fs.existsSync(seedDir)) {
    const seedFiles = fs.readdirSync(seedDir)
      .filter(f => f.endsWith(".sql"))
      .sort();

    for (const file of seedFiles) {
      const key = `seed:${file}`;
      if (done.has(key)) {
        logger.info(`Seed already applied: ${file}`);
        continue;
      }
      try {
        logger.info(`Applying seed: ${file}`);
        const sql = fs.readFileSync(path.join(seedDir, file), "utf8");
        await runSqlStatements(sql);
        await getPool().query(
          "INSERT INTO _migrations (filename) VALUES ($1) ON CONFLICT DO NOTHING",
          [key]
        );
        logger.info(`✅ Seed applied: ${file}`);
      } catch (err) {
        logger.warn(`Seed warning: ${file} — ${err.message}`);
      }
    }
  }

  logger.info("✅ All migrations complete");
};

module.exports = { getPool, connectDB, query, transaction, runMigrations };
