const express = require("express");
const sortingController = require("../controllers/sortingController");
const authController = require("../controllers/authController");

const router = express.Router();

// Apply authentication middleware to all routes
// router.use(authController.protect);

// Routes for /api/commodities
router
  .route("/")
  .get(sortingController.getAllSorting)
  .post(sortingController.createSorting);

// Routes for /api/commodities/:id
router
  .route("/:id")
  .get(sortingController.getSorting)
  .patch(sortingController.updateSorting)
  .delete(sortingController.deleteSorting);

module.exports = router;