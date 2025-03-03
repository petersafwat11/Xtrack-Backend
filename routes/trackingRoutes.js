const express = require('express');
const router = express.Router();
const trackingController = require('../controllers/trackingController');

router.route('/').post(trackingController.logTracking).get(trackingController.getLogRecords);
router.route('/export').get(trackingController.exportLogsToExcel);
router.route('/:trackingNumber').get(trackingController.getTrackingData);

module.exports = router;
