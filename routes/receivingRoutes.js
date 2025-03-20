const express = require("express");
const receivingController = require("../controllers/receivingController");
const authController = require("../controllers/authController");

const router = express.Router();

// Apply authentication middleware to all routes
// router.use(authController.protect);

// Routes for /api/commodities
router
  .route("/")
  .get(receivingController.getAllReceiving)
  .post(receivingController.createReceiving);

// Routes for /api/commodities/:id
router
  .route("/:id")
  .get(receivingController.getReceiving)
  .patch(receivingController.updateReceiving)
  .delete(receivingController.deleteReceiving);

module.exports = router;