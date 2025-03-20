const express = require("express");
const authController = require("../controllers/authController");
const inventoryHeaderController = require("../controllers/InventoryHeaderController");
const router = express.Router();

// Apply authentication middleware to all routes
// router.use(authController.protect);

// Routes for /api/commodities
router
  .route("/")
  .get(inventoryHeaderController.getAllInOrder)
  .post(inventoryHeaderController.createInOrder);

// Routes for /api/commodities/:id
router
  .route("/:id")
  .get(inventoryHeaderController.getInOrder)
  .patch(inventoryHeaderController.updateInOrder)
  .delete(inventoryHeaderController.deleteInOrder);

module.exports = router;