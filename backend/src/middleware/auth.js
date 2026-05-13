const jwt = require("jsonwebtoken");
const { query } = require("../config/database");

const JWT_SECRET = process.env.JWT_SECRET || "oncosense_jwt_secret_dev";

exports.authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    // Verify user still active
    const result = await query(
      "SELECT id, role, first_name, last_name, email, phone FROM users WHERE id = $1 AND is_active = true",
      [decoded.id]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "User account not found or deactivated" });
    }

    req.user = result.rows[0];
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Invalid or expired token" });
    }
    next(error);
  }
};

exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: "Access denied",
        required_roles: roles,
        your_role: req.user.role
      });
    }
    next();
  };
};
