const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const authController = require("../controllers/authController");
const { authenticate } = require("../middleware/auth");

// Validation rules
const registerValidation = [
  body("first_name").trim().notEmpty().withMessage("First name required"),
  body("last_name").trim().notEmpty().withMessage("Last name required"),
  body("email").optional().isEmail().normalizeEmail(),
  body("phone").optional().isMobilePhone(),
  body("password")
    .isLength({ min: 8 }).withMessage("Password must be at least 8 characters")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage("Password must contain uppercase, lowercase and number"),
  body("role")
    .optional()
    .isIn(["patient", "health_worker"])
    .withMessage("Invalid role"),
];

const loginValidation = [
  body("identifier").notEmpty().withMessage("Email or phone required"),
  body("password").notEmpty().withMessage("Password required"),
];

// Middleware to check validation result
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: "Validation failed",
      details: errors.array()
    });
  }
  next();
};

// ── Routes
router.post("/register", registerValidation, validate, authController.register);
router.post("/login", loginValidation, validate, authController.login);
router.post("/logout", authenticate, authController.logout);
router.post("/refresh", authController.refreshToken);
router.get("/me", authenticate, authController.getMe);
router.post("/change-password", authenticate, authController.changePassword);
router.post("/forgot-password", authController.forgotPassword);

module.exports = router;
