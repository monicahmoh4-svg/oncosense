const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const { query } = require("../config/database");
const logger = require("../utils/logger");

const JWT_SECRET = process.env.JWT_SECRET || "oncosense_jwt_secret_dev";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";
const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS) || 12;

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, role: user.role, email: user.email },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

exports.register = async (req, res, next) => {
  try {
    const { first_name, last_name, email, phone, password, role = "patient", preferred_language = "en" } = req.body;

    // Must have email or phone
    if (!email && !phone) {
      return res.status(400).json({ error: "Email or phone number required" });
    }

    // Check for existing user
    if (email) {
      const existing = await query("SELECT id FROM users WHERE email = $1", [email]);
      if (existing.rows.length > 0) {
        return res.status(409).json({ error: "Email already registered" });
      }
    }

    if (phone) {
      const existing = await query("SELECT id FROM users WHERE phone = $1", [phone]);
      if (existing.rows.length > 0) {
        return res.status(409).json({ error: "Phone already registered" });
      }
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    // Create user
    const result = await query(
      `INSERT INTO users (id, email, phone, password_hash, role, first_name, last_name, preferred_language, is_active, is_verified)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, false)
       RETURNING id, email, phone, role, first_name, last_name, preferred_language, created_at`,
      [uuidv4(), email || null, phone || null, password_hash, role, first_name, last_name, preferred_language]
    );

    const user = result.rows[0];
    const token = generateToken(user);

    logger.info(`New user registered: ${user.id} (${role})`);

    res.status(201).json({
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
    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { identifier, password } = req.body;

    // Find user by email or phone
    const result = await query(
      `SELECT id, email, phone, password_hash, role, first_name, last_name, 
              preferred_language, is_active, is_verified
       FROM users
       WHERE (email = $1 OR phone = $1) AND is_active = true`,
      [identifier]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const user = result.rows[0];

    // Verify password
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Update last login
    await query("UPDATE users SET last_login = NOW() WHERE id = $1", [user.id]);

    const token = generateToken(user);

    logger.info(`User logged in: ${user.id} (${user.role})`);

    res.json({
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
    next(error);
  }
};

exports.logout = async (req, res) => {
  // JWT is stateless; client should delete token
  // For enhanced security, add token to Redis blacklist
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

    const valid = await bcrypt.compare(current_password, result.rows[0].password_hash);
    if (!valid) {
      return res.status(400).json({ error: "Current password incorrect" });
    }

    const hash = await bcrypt.hash(new_password, BCRYPT_ROUNDS);
    await query("UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2", [hash, req.user.id]);

    res.json({ message: "Password updated successfully" });
  } catch (error) {
    next(error);
  }
};

exports.forgotPassword = async (req, res) => {
  // Placeholder — would send SMS/email with reset code
  res.json({ message: "If the account exists, a reset link has been sent." });
};
