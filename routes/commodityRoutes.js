const express = require("express");
const commodityController = require("../controllers/commodityController");
const authController = require("../controllers/authController");

const router = express.Router();

// Apply authentication middleware to all routes
// router.use(authController.protect);

// Routes for /api/commodities
router
  .route("/")
  .get(commodityController.getAllCommodities)
  .post(commodityController.createCommodity);

// Routes for /api/commodities/:id
router
  .route("/:id")
  .get(commodityController.getCommodity)
  .patch(commodityController.updateCommodity)
  .delete(commodityController.deleteCommodity);

module.exports = router;