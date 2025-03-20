const express = require("express");
const warehouseController = require("../controllers/warehouseController");
const authController = require("../controllers/authController");

const router = express.Router();

// Apply authentication middleware to all routes
// router.use(authController.protect);

// Routes for /api/warehouses
router
  .route("/")
  .get(warehouseController.getAllWarehouses)
  .post(warehouseController.createWarehouse);

// Routes for /api/warehouses/:id
router
  .route("/:id")
  .get(warehouseController.getWarehouse)
  .patch(warehouseController.updateWarehouse)
  .delete(warehouseController.deleteWarehouse);

module.exports = router;