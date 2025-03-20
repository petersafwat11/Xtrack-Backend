const express = require("express");
const authController = require("../controllers/authController");
const pickController = require("../controllers/pickController");
const router = express.Router();

// Apply authentication middleware to all routes
// router.use(authController.protect);

// Routes for /api/commodities
router
  .route("/")
  .get(pickController.getAllPick)
  .post(pickController.createPick);

// Routes for /api/commodities/:id
router
  .route("/:id")
  .get(pickController.getPick)
  .patch(pickController.updatePick)
  .delete(pickController.deletePick);

module.exports = router;