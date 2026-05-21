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

    // Always enable SSL in production — works for Render, Railway, Supabase, etc.
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
    logger.info("Database ping OK");
  } finally {
    client.release();
  }
};

const query = async (text, params) => {
  try {
    const result = await getPool().query(text, params);
    return result;
  } catch (err) {
    logger.error("Query error:", { sql: text.substring(0, 100), error: err.message, code: err.code });
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

// Execute each SQL statement individually so one failure doesn't abort everything
const execStatement = async (stmt) => {
  const s = stmt.trim();
  if (!s || s.startsWith("--")) return;
  try {
    await getPool().query(s);
  } catch (err) {
    const ignorable = [
      "already exists",
      "duplicate",
      "42710", // duplicate_object
      "42P07", // duplicate_table
      "42701", // duplicate_column
      "42P06", // duplicate_schema
    ];
    const isIgnorable = ignorable.some(i =>
      err.message.toLowerCase().includes(i) || err.code === i
    );
    if (!isIgnorable) {
      logger.warn(`SQL warning [${err.code}]: ${err.message} — stmt: ${s.substring(0, 80)}`);
    }
  }
};

const runMigrations = async () => {
  // __dirname = backend/src/config
  // repo root = three levels up
  const repoRoot = path.resolve(__dirname, "..", "..", "..");
  const migDir   = path.join(repoRoot, "db", "migrations");
  const seedDir  = path.join(repoRoot, "db", "seeds");

  logger.info(`Repo root: ${repoRoot}`);
  logger.info(`Migrations dir: ${migDir} — exists: ${fs.existsSync(migDir)}`);

  if (!fs.existsSync(migDir)) {
    logger.warn("Migrations dir not found — skipping");
    return;
  }

  // Create tracking table first
  await getPool().query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      filename VARCHAR(255) PRIMARY KEY,
      applied_at TIMESTAMP DEFAULT NOW()
    )
  `).catch(e => logger.warn("_migrations table:", e.message));

  const applied = await getPool().query("SELECT filename FROM _migrations").catch(() => ({ rows: [] }));
  const done = new Set(applied.rows.map(r => r.filename));

  const migFiles = fs.existsSync(migDir)
    ? fs.readdirSync(migDir).filter(f => f.endsWith(".sql")).sort()
    : [];

  for (const file of migFiles) {
    if (done.has(file)) { logger.info(`Already applied: ${file}`); continue; }
    logger.info(`Applying migration: ${file}`);
    const sql = fs.readFileSync(path.join(migDir, file), "utf8");
    // Split on semicolons and run each statement individually
    const statements = sql.split(";").map(s => s.trim()).filter(s => s.length > 3);
    for (const stmt of statements) await execStatement(stmt);
    await getPool().query(
      "INSERT INTO _migrations (filename) VALUES ($1) ON CONFLICT DO NOTHING", [file]
    ).catch(() => {});
    logger.info(`✅ Migration done: ${file}`);
  }

  const seedFiles = fs.existsSync(seedDir)
    ? fs.readdirSync(seedDir).filter(f => f.endsWith(".sql")).sort()
    : [];

  for (const file of seedFiles) {
    const key = `seed:${file}`;
    if (done.has(key)) { logger.info(`Seed already applied: ${file}`); continue; }
    logger.info(`Applying seed: ${file}`);
    const sql = fs.readFileSync(path.join(seedDir, file), "utf8");
    const statements = sql.split(";").map(s => s.trim()).filter(s => s.length > 3);
    for (const stmt of statements) await execStatement(stmt);
    await getPool().query(
      "INSERT INTO _migrations (filename) VALUES ($1) ON CONFLICT DO NOTHING", [key]
    ).catch(() => {});
    logger.info(`✅ Seed done: ${file}`);
  }

  logger.info("✅ All migrations complete");
};

module.exports = { getPool, connectDB, query, transaction, runMigrations };
