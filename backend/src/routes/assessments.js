const express = require("express");
const router = express.Router();
const { authenticate, authorize } = require("../middleware/auth");
const assessmentController = require("../controllers/assessmentController");

router.post("/", authenticate, assessmentController.createAssessment);
router.get("/", authenticate, assessmentController.getUserAssessments);
router.get("/latest", authenticate, assessmentController.getLatestAssessment);
router.get("/:id", authenticate, assessmentController.getAssessment);
router.patch("/:id/review", authenticate, authorize("clinician", "admin"), assessmentController.reviewAssessment);

module.exports = router;
