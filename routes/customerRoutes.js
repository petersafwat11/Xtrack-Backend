const express = require("express");
const customerController = require("../controllers/customerController");
const authController = require("../controllers/authController");

const router = express.Router();

// Apply authentication middleware to all routes
// router.use(authController.protect);

// Routes for /api/warehouses
router.get("/customer_code", customerController.getCustomerCode);
router
  .route("/")
  .get(customerController.getCustomers)
  .post(customerController.createCustomer);

// Routes for /api/warehouses/:id
router
  .route("/:id")
  .get(customerController.getCustomer)
  .patch(customerController.updateCustomer)
  .delete(customerController.deleteCustomer);

module.exports = router;