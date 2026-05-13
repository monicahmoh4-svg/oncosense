const { query } = require("../config/database");
const logger = require("../utils/logger");

// Actions to audit
const AUDIT_METHODS = ["POST", "PUT", "PATCH", "DELETE"];
const SKIP_PATHS = ["/health", "/uploads", "/socket.io"];

exports.auditLog = async (req, res, next) => {
  if (!AUDIT_METHODS.includes(req.method)) return next();
  if (SKIP_PATHS.some(p => req.path.startsWith(p))) return next();

  const originalJson = res.json.bind(res);
  res.json = function(data) {
    // Async audit logging (don't block response)
    if (req.user) {
      const action = `${req.method}:${req.path}`;
      query(
        `INSERT INTO audit_logs (user_id, action, resource_type, ip_address, user_agent)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          req.user.id,
          action,
          req.path.split("/")[1] || "unknown",
          req.ip,
          req.headers["user-agent"]?.substring(0, 200) || null
        ]
      ).catch(err => logger.error("Audit log failed:", err.message));
    }
    return originalJson(data);
  };

  next();
};
