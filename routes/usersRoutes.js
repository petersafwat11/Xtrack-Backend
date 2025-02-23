const express = require("express");
const usersController = require("../controllers/usersController");
const authController = require("../controllers/authController");

const router = express.Router();

// router.use(authController.restrictTo("Admin"));
// router.post("/login", authController.login);
// router.post("/signup", authController.signup);
router.patch("/extend-validity", authController.updateUserValidDate);
router.get("/logout", authController.logout);
router.post("/signup-request", authController.handleSignup);
router.post("/login", authController.login);
router.post("/change-password", authController.changePassword);

// Only allow in development
if (process.env.NODE_ENV === "development") {
  router.post("/create-test-user", authController.createTestUser);
}

router
  .route("/")
  .get(usersController.getAllUsers)
  .post(usersController.createUser);
router
  .route("/:id")
  .get(usersController.getUser)
  .patch(usersController.updateUser);

module.exports = router;
