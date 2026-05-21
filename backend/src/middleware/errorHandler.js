const logger = require("../utils/logger");

exports.errorHandler = (err, req, res, next) => {
  logger.error({
    message: err.message,
    code: err.code,
    url: req.url,
    method: req.method,
    user: req.user?.id
  });

  // PostgreSQL unique violation
  if (err.code === "23505") {
    return res.status(409).json({ error: "Account already exists" });
  }

  // PostgreSQL foreign key violation
  if (err.code === "23503") {
    return res.status(400).json({ error: "Invalid reference" });
  }

  // PostgreSQL undefined table (migrations not run yet)
  if (err.code === "42P01") {
    return res.status(503).json({ error: "Database not ready. Please try again in a moment." });
  }

  // PostgreSQL connection error
  if (err.code === "ECONNREFUSED" || err.code === "ENOTFOUND") {
    return res.status(503).json({ error: "Database connection failed. Please try again." });
  }

  const status = err.status || err.statusCode || 500;
  const message = status < 500 ? err.message : "Internal server error";

  res.status(status).json({ error: message });
};
