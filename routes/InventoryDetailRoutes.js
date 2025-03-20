const express = require("express");
const authController = require("../controllers/authController");
const inventoryDetailController = require("../controllers/inventoryDetailController");
const router = express.Router();

// Apply authentication middleware to all routes
// router.use(authController.protect);

// Routes for /api/commodities
router
  .route("/")
  .get(inventoryDetailController.getAllInventoryDetail)
  .post(inventoryDetailController.createInventoryDetail);

// Routes for /api/commodities/:id
router
  .route("/:id")
  .get(inventoryDetailController.getInventoryDetail)
  .patch(inventoryDetailController.updateInventoryDetail)
  .delete(inventoryDetailController.deleteInventoryDetail);

module.exports = router;