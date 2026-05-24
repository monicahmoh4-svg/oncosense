const logger = require("../utils/logger");

exports.errorHandler = (err, req, res, next) => {
  logger.error({ message: err.message, code: err.code, url: req.url, method: req.method });
  if (err.code === "23505") return res.status(409).json({ error: "Already exists" });
  if (err.code === "23503") return res.status(400).json({ error: "Invalid reference" });
  if (err.code === "42P01") return res.status(503).json({ error: "Database not ready. Please try again." });
  if (err.code === "ECONNREFUSED") return res.status(503).json({ error: "Database connection failed." });
  const status  = err.status || err.statusCode || 500;
  const message = status < 500 ? err.message : "Internal server error";
  return res.status(status).json({ error: message });
};
