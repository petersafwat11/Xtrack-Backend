const express = require('express');
const router = express.Router();
const trackingController = require('../controllers/trackingController');

router.route('/').post(trackingController.logTracking).get(trackingController.getLogRecords);
// .get(trackingController.getLogRecords)
;

module.exports = router;
