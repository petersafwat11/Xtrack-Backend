const express = require("express");
const authController = require("../controllers/authController");
const transferController = require("../controllers/transferController");
const router = express.Router();

// Apply authentication middleware to all routes
// router.use(authController.protect);

// Routes for /api/commodities
router
  .route("/")
  .get(transferController.getAllTransfer)
  .post(transferController.createTransfer);

// Routes for /api/commodities/:id
router
  .route("/:id")
  .get(transferController.getTransfer)
  .patch(transferController.updateTransfer)
  .delete(transferController.deleteTransfer);

module.exports = router;