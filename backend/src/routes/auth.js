const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const authController = require("../controllers/authController");
const { authenticate } = require("../middleware/auth");

const registerValidation = [
  body("first_name").trim().notEmpty().withMessage("First name required"),
  body("last_name").trim().notEmpty().withMessage("Last name required"),
  body("email")
    .optional({ nullable: true, checkFalsy: true })
    .isEmail().withMessage("Invalid email address")
    .normalizeEmail(),
  body("phone")
    .optional({ nullable: true, checkFalsy: true })
    .isString()
    .withMessage("Invalid phone number"),
  body("password")
    .isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
  body("role")
    .optional()
    .isIn(["patient", "health_worker"])
    .withMessage("Invalid role"),
];

const loginValidation = [
  body("identifier").notEmpty().withMessage("Email or phone required"),
  body("password").notEmpty().withMessage("Password required"),
];

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: errors.array()[0].msg,
      details: errors.array()
    });
  }
  next();
};

router.post("/register", registerValidation, validate, authController.register);
router.post("/login", loginValidation, validate, authController.login);
router.post("/logout", authenticate, authController.logout);
router.post("/refresh", authController.refreshToken);
router.get("/me", authenticate, authController.getMe);
router.post("/change-password", authenticate, authController.changePassword);
router.post("/forgot-password", authController.forgotPassword);

module.exports = router;
