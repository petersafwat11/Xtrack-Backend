const express = require("express");
const authController = require("../controllers/authController");
const feedbackController = require("../controllers/feedbackController");
const router = express.Router();

// Apply authentication middleware to all routes
// router.use(authController.protect);

// Routes for /api/commodities
router
  .route("/")
  // .get(stockTakeController.getAllStockTake)
  .post(feedbackController.createFeedback);

// Routes for /api/commodities/:id
// router
//   .route("/:id")
//   .get(stockTakeController.getStockTake)
//   .patch(stockTakeController.updateStockTake)
//   .delete(stockTakeController.deleteStockTake);

module.exports = router;