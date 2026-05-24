const bcrypt = require("bcrypt");
const jwt    = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const { query } = require("../config/database");
const logger = require("../utils/logger");

const JWT_SECRET     = process.env.JWT_SECRET     || "oncosense_dev_secret";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";
const BCRYPT_ROUNDS  = parseInt(process.env.BCRYPT_ROUNDS) || 10;

const generateToken = (user) =>
  jwt.sign(
    { id: user.id, role: user.role, email: user.email },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

exports.register = async (req, res) => {
  try {
    // Check DB is available first
    if (!process.env.DATABASE_URL) {
      return res.status(503).json({
        error: "Database not configured. Please contact the administrator."
      });
    }

    const { first_name, last_name, password, role = "patient", preferred_language = "en" } = req.body;
    const email = req.body.email && String(req.body.email).trim() ? String(req.body.email).trim().toLowerCase() : null;
    const phone = req.body.phone && String(req.body.phone).trim() ? String(req.body.phone).trim() : null;

    if (!first_name || !String(first_name).trim()) return res.status(400).json({ error: "First name is required" });
    if (!last_name  || !String(last_name).trim())  return res.status(400).json({ error: "Last name is required" });
    if (!password   || String(password).length < 6) return res.status(400).json({ error: "Password must be at least 6 characters" });
    if (!email && !phone) return res.status(400).json({ error: "Email or phone number is required" });

    if (email) {
      const ex = await query("SELECT id FROM users WHERE email = $1", [email]);
      if (ex.rows.length) return res.status(409).json({ error: "Email already registered" });
    }
    if (phone) {
      const ex = await query("SELECT id FROM users WHERE phone = $1", [phone]);
      if (ex.rows.length) return res.status(409).json({ error: "Phone already registered" });
    }

    const hash   = await bcrypt.hash(String(password), BCRYPT_ROUNDS);
    const result = await query(
      `INSERT INTO users (id, email, phone, password_hash, role, first_name, last_name, preferred_language, is_active, is_verified)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,true,false)
       RETURNING id, email, phone, role, first_name, last_name, preferred_language`,
      [uuidv4(), email, phone, hash, role, String(first_name).trim(), String(last_name).trim(), preferred_language]
    );

    const user  = result.rows[0];
    const token = generateToken(user);
    logger.info(`Registered: ${user.id} (${role})`);

    return res.status(201).json({
      message: "Account created successfully",
      user: {
        id: user.id, email: user.email, phone: user.phone, role: user.role,
        first_name: user.first_name, last_name: user.last_name,
        preferred_language: user.preferred_language
      },
      token
    });
  } catch (err) {
    logger.error("Register error:", err.message, "code:", err.code);
    if (err.code === "23505")  return res.status(409).json({ error: "Account already exists with that email or phone" });
    if (err.code === "42P01")  return res.status(503).json({ error: "Database tables not ready. Please wait 30 seconds and try again." });
    if (err.code === "ENOTFOUND" || err.message.includes("ENOTFOUND")) {
      return res.status(503).json({ error: "Cannot reach database. Please check DATABASE_URL is correctly set in Render environment variables." });
    }
    if (err.message.includes("DATABASE_URL")) {
      return res.status(503).json({ error: err.message });
    }
    return res.status(500).json({ error: "Registration failed: " + err.message });
  }
};

exports.login = async (req, res) => {
  try {
    if (!process.env.DATABASE_URL) {
      return res.status(503).json({
        error: "Database not configured. Please contact the administrator."
      });
    }

    const { identifier, password } = req.body;
    if (!identifier || !password) return res.status(400).json({ error: "Email/phone and password are required" });

    const id = String(identifier).trim();

    let result = await query(
      `SELECT id, email, phone, password_hash, role, first_name, last_name, preferred_language, is_active
       FROM users WHERE email = $1 AND is_active = true`,
      [id.toLowerCase()]
    );

    if (!result.rows.length) {
      result = await query(
        `SELECT id, email, phone, password_hash, role, first_name, last_name, preferred_language, is_active
         FROM users WHERE phone = $1 AND is_active = true`,
        [id]
      );
    }

    if (!result.rows.length) return res.status(401).json({ error: "Invalid email/phone or password" });

    const user  = result.rows[0];
    const valid = await bcrypt.compare(String(password), user.password_hash);
    if (!valid) return res.status(401).json({ error: "Invalid email/phone or password" });

    await query("UPDATE users SET last_login = NOW() WHERE id = $1", [user.id]).catch(() => {});

    const token = generateToken(user);
    logger.info(`Login: ${user.id} (${user.role})`);

    return res.json({
      message: "Login successful",
      user: {
        id: user.id, email: user.email, phone: user.phone, role: user.role,
        first_name: user.first_name, last_name: user.last_name,
        preferred_language: user.preferred_language
      },
      token
    });
  } catch (err) {
    logger.error("Login error:", err.message, "code:", err.code);
    if (err.code === "42P01") return res.status(503).json({ error: "Database tables not ready. Please wait 30 seconds and try again." });
    if (err.code === "ENOTFOUND" || err.message.includes("ENOTFOUND")) {
      return res.status(503).json({ error: "Cannot reach database. Please check DATABASE_URL is correctly set in Render environment variables." });
    }
    if (err.message.includes("DATABASE_URL")) {
      return res.status(503).json({ error: err.message });
    }
    return res.status(500).json({ error: "Login failed: " + err.message });
  }
};

exports.logout = (req, res) => res.json({ message: "Logged out successfully" });

exports.refreshToken = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: "Token required" });
    const decoded = jwt.verify(token, JWT_SECRET);
    const result  = await query(
      "SELECT id, email, phone, role, first_name, last_name FROM users WHERE id = $1 AND is_active = true",
      [decoded.id]
    );
    if (!result.rows.length) return res.status(401).json({ error: "User not found" });
    return res.json({ token: generateToken(result.rows[0]) });
  } catch (err) {
    if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Invalid or expired token" });
    }
    return res.status(500).json({ error: err.message });
  }
};

exports.getMe = async (req, res) => {
  try {
    const result = await query(
      `SELECT u.id, u.email, u.phone, u.role, u.first_name, u.last_name,
              u.preferred_language, u.is_verified, u.last_login, u.created_at,
              hp.profile_completed
       FROM users u
       LEFT JOIN health_profiles hp ON hp.user_id = u.id
       WHERE u.id = $1`,
      [req.user.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: "User not found" });
    return res.json({ user: result.rows[0] });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { current_password, new_password } = req.body;
    const result = await query("SELECT password_hash FROM users WHERE id = $1", [req.user.id]);
    if (!result.rows.length) return res.status(404).json({ error: "User not found" });
    const valid = await bcrypt.compare(String(current_password), result.rows[0].password_hash);
    if (!valid) return res.status(400).json({ error: "Current password incorrect" });
    const hash = await bcrypt.hash(String(new_password), BCRYPT_ROUNDS);
    await query("UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2", [hash, req.user.id]);
    return res.json({ message: "Password updated successfully" });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.forgotPassword = (req, res) =>
  res.json({ message: "If the account exists, a reset link has been sent." });
