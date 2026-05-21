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
    // Enable SSL for all production hosts (Render, Railway, Supabase, etc.)
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
    return await getPool().query(text, params);
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

const runMigrations = async () => {
  // __dirname = backend/src/config
  // On Render: /opt/render/project/src/backend/src/config
  // repo root  = 3 levels up
  const repoRoot = path.resolve(__dirname, "..", "..", "..");
  const migDir   = path.join(repoRoot, "db", "migrations");
  const seedDir  = path.join(repoRoot, "db", "seeds");

  logger.info(`repoRoot: ${repoRoot}`);
  logger.info(`migDir: ${migDir} — exists: ${fs.existsSync(migDir)}`);

  if (!fs.existsSync(migDir)) {
    logger.warn("Migrations directory not found — skipping");
    return;
  }

  // Create migration tracking table
  await getPool().query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      filename VARCHAR(255) PRIMARY KEY,
      applied_at TIMESTAMP DEFAULT NOW()
    )
  `).catch(e => logger.warn("_migrations table:", e.message));

  const { rows: appliedRows } = await getPool()
    .query("SELECT filename FROM _migrations")
    .catch(() => ({ rows: [] }));
  const done = new Set(appliedRows.map(r => r.filename));

  // Run migration files
  const migFiles = fs.readdirSync(migDir).filter(f => f.endsWith(".sql")).sort();

  for (const file of migFiles) {
    if (done.has(file)) {
      logger.info(`Already applied: ${file}`);
      continue;
    }
    logger.info(`Applying: ${file}`);
    const sql = fs.readFileSync(path.join(migDir, file), "utf8");
    try {
      await getPool().query(sql);
      await getPool().query(
        "INSERT INTO _migrations (filename) VALUES ($1) ON CONFLICT DO NOTHING",
        [file]
      );
      logger.info(`✅ Done: ${file}`);
    } catch (err) {
      logger.error(`Migration failed: ${file} — ${err.message}`);
    }
  }

  // Run seed files
  if (fs.existsSync(seedDir)) {
    const seedFiles = fs.readdirSync(seedDir).filter(f => f.endsWith(".sql")).sort();
    for (const file of seedFiles) {
      const key = `seed:${file}`;
      if (done.has(key)) {
        logger.info(`Seed already applied: ${file}`);
        continue;
      }
      logger.info(`Seeding: ${file}`);
      const sql = fs.readFileSync(path.join(seedDir, file), "utf8");
      try {
        await getPool().query(sql);
        await getPool().query(
          "INSERT INTO _migrations (filename) VALUES ($1) ON CONFLICT DO NOTHING",
          [key]
        );
        logger.info(`✅ Seed done: ${file}`);
      } catch (err) {
        logger.warn(`Seed warning: ${file} — ${err.message}`);
        await getPool().query(
          "INSERT INTO _migrations (filename) VALUES ($1) ON CONFLICT DO NOTHING",
          [key]
        ).catch(() => {});
      }
    }
  }

  logger.info("✅ All migrations complete");
};

module.exports = { getPool, connectDB, query, transaction, runMigrations };
