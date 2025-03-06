const express = require("express");
const trackingController = require("../controllers/trackingController");

const router = express.Router();

// Protect all routes after this middleware
// router.use(protect);

router.post("/", trackingController.logTracking);
router.get("/", trackingController.getLogRecords);
router.get("/export", trackingController.exportLogsToExcel);

// Dashboard routes
router.get("/totals", trackingController.getTotals);
router.get("/dashboard", trackingController.getDashboardData);
router.get("/:trackingNumber", trackingController.getTrackingData);

module.exports = router;
