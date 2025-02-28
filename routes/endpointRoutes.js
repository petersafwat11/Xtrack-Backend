const express = require('express');
const endpointController = require('../controllers/endpointController');

const router = express.Router();

router
    .route('/')
    .get(endpointController.getAllEndpoints)
    .post(endpointController.createEndpoint);
router.patch('/update', endpointController.updateEndpoint);

// router.route('/:id').get(endpointController.getEndpoint)
// .delete(endpointController.deleteEndpoint)
;
module.exports = router;
