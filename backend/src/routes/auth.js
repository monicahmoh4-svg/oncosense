const express = require("express");
const router  = express.Router();
const authController = require("../controllers/authController");
const { authenticate } = require("../middleware/auth");

// No express-validator — all validation is done inside the controller
// This removes all false "Validation failed" errors from isMobilePhone() etc.

router.post("/register",        authController.register);
router.post("/login",           authController.login);
router.post("/logout",          authenticate, authController.logout);
router.post("/refresh",         authController.refreshToken);
router.get("/me",               authenticate, authController.getMe);
router.post("/change-password", authenticate, authController.changePassword);
router.post("/forgot-password", authController.forgotPassword);

module.exports = router;
