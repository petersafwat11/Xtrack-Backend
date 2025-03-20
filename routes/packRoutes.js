const express = require("express");
const authController = require("../controllers/authController");
const packController = require("../controllers/packController");
const router = express.Router();

// Apply authentication middleware to all routes
// router.use(authController.protect);

// Routes for /api/commodities
router
  .route("/")
  .get(packController.getAllPack)
  .post(packController.createPack);

// Routes for /api/commodities/:id
router
  .route("/:id")
  .get(packController.getPack)
  .patch(packController.updatePack)
  .delete(packController.deletePack);

module.exports = router;