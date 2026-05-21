const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const { query } = require("../config/database");
const logger = require("../utils/logger");

const JWT_SECRET = process.env.JWT_SECRET || "oncosense_jwt_secret_dev";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";
const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS) || 10;

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, role: user.role, email: user.email },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

exports.register = async (req, res, next) => {
  try {
    const {
      first_name, last_name, email, phone,
      password, role = "patient", preferred_language = "en"
    } = req.body;

    const cleanEmail = email && email.trim() !== "" ? email.trim().toLowerCase() : null;
    const cleanPhone = phone && phone.trim() !== "" ? phone.trim() : null;

    if (!cleanEmail && !cleanPhone) {
      return res.status(400).json({ error: "Email or phone number required" });
    }

    // Check duplicates
    if (cleanEmail) {
      const existing = await query(
        "SELECT id FROM users WHERE email = $1", [cleanEmail]
      );
      if (existing.rows.length > 0) {
        return res.status(409).json({ error: "Email already registered" });
      }
    }

    if (cleanPhone) {
      const existing = await query(
        "SELECT id FROM users WHERE phone = $1", [cleanPhone]
      );
      if (existing.rows.length > 0) {
        return res.status(409).json({ error: "Phone number already registered" });
      }
    }

    const password_hash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    const result = await query(
      `INSERT INTO users
         (id, email, phone, password_hash, role, first_name, last_name, preferred_language, is_active, is_verified)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,true,false)
       RETURNING id, email, phone, role, first_name, last_name, preferred_language, created_at`,
      [uuidv4(), cleanEmail, cleanPhone, password_hash, role, first_name.trim(), last_name.trim(), preferred_language]
    );

    const user = result.rows[0];
    const token = generateToken(user);

    logger.info(`New user registered: ${user.id} (${role})`);

    return res.status(201).json({
      message: "Account created successfully",
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        role: user.role,
        first_name: user.first_name,
        last_name: user.last_name,
        preferred_language: user.preferred_language
      },
      token
    });
  } catch (error) {
    logger.error("Register error:", error.message);
    if (error.code === "23505") {
      return res.status(409).json({ error: "Account already exists with that email or phone" });
    }
    if (error.message && error.message.includes("relation") && error.message.includes("does not exist")) {
      return res.status(503).json({ error: "Database not ready yet. Please try again in a moment." });
    }
    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { identifier, password } = req.body;

    const cleanIdentifier = identifier.trim();

    // Search by email OR phone separately to avoid type errors
    let result = await query(
      `SELECT id, email, phone, password_hash, role, first_name, last_name,
              preferred_language, is_active, is_verified
       FROM users
       WHERE email = $1 AND is_active = true`,
      [cleanIdentifier.toLowerCase()]
    );

    // If not found by email, try phone
    if (result.rows.length === 0) {
      result = await query(
        `SELECT id, email, phone, password_hash, role, first_name, last_name,
                preferred_language, is_active, is_verified
         FROM users
         WHERE phone = $1 AND is_active = true`,
        [cleanIdentifier]
      );
    }

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Invalid email/phone or password" });
    }

    const user = result.rows[0];

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: "Invalid email/phone or password" });
    }

    await query("UPDATE users SET last_login = NOW() WHERE id = $1", [user.id]);

    const token = generateToken(user);

    logger.info(`User logged in: ${user.id} (${user.role})`);

    return res.json({
      message: "Login successful",
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        role: user.role,
        first_name: user.first_name,
        last_name: user.last_name,
        preferred_language: user.preferred_language
      },
      token
    });
  } catch (error) {
    logger.error("Login error:", error.message);
    if (error.message && error.message.includes("relation") && error.message.includes("does not exist")) {
      return res.status(503).json({ error: "Database not ready yet. Please try again in a moment." });
    }
    next(error);
  }
};

exports.logout = async (req, res) => {
  res.json({ message: "Logged out successfully" });
};

exports.refreshToken = async (req, res, next) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: "Token required" });

    const decoded = jwt.verify(token, JWT_SECRET);
    const result = await query(
      "SELECT id, email, phone, role, first_name, last_name FROM users WHERE id = $1 AND is_active = true",
      [decoded.id]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "User not found" });
    }

    const newToken = generateToken(result.rows[0]);
    res.json({ token: newToken });
  } catch (error) {
    if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Invalid or expired token" });
    }
    next(error);
  }
};

exports.getMe = async (req, res, next) => {
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

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ user: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

exports.changePassword = async (req, res, next) => {
  try {
    const { current_password, new_password } = req.body;

    const result = await query(
      "SELECT password_hash FROM users WHERE id = $1",
      [req.user.id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: "User not found" });
    }

    const valid = await bcrypt.compare(current_password, result.rows[0].password_hash);
    if (!valid) {
      return res.status(400).json({ error: "Current password incorrect" });
    }

    const hash = await bcrypt.hash(new_password, BCRYPT_ROUNDS);
    await query(
      "UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2",
      [hash, req.user.id]
    );

    res.json({ message: "Password updated successfully" });
  } catch (error) {
    next(error);
  }
};

exports.forgotPassword = async (req, res) => {
  res.json({ message: "If the account exists, a reset link has been sent." });
};
