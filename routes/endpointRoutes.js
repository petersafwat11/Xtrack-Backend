const express = require("express");
const endpointController = require("../controllers/endpointController");

const router = express.Router();

router
  .route("/")
  .get(endpointController.getAllEndpoints)
  .post(endpointController.createEndpoint);

router
  .route("/:id")
  .get(endpointController.getEndpoint)
  .patch(endpointController.updateEndpoint);
module.exports = router;
