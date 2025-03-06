const express = require("express");
const usersController = require("../controllers/usersController");
const authController = require("../controllers/authController");

const router = express.Router();

// router.use(authController.restrictTo("Admin"));
router.get("/logout", authController.logout);
router.post("/signup-request", authController.handleSignup);
router.post("/login", authController.login);
router.post("/change-password", authController.changePassword);


router
  .route("/")
  .get(usersController.getAllUsers)
  .post(usersController.createUser);
router
  .route("/:id")
  .get(usersController.getUser)
  .patch(usersController.updateUser)
  .delete(usersController.deleteUser)
  ;

module.exports = router;
