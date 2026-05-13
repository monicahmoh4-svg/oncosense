// ── errorHandler.js
const logger = require("../utils/logger");

exports.errorHandler = (err, req, res, next) => {
  logger.error({
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    user: req.user?.id
  });

  // PostgreSQL unique violation
  if (err.code === "23505") {
    return res.status(409).json({ error: "Resource already exists" });
  }

  // PostgreSQL foreign key violation
  if (err.code === "23503") {
    return res.status(400).json({ error: "Invalid reference" });
  }

  const status = err.status || err.statusCode || 500;
  const message = status < 500 ? err.message : "Internal server error";

  res.status(status).json({ error: message });
};
