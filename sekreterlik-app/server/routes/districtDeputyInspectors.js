const express = require('express');
const DistrictController = require('../controllers/DistrictController');

const router = express.Router();

// Get all district deputy inspectors
router.get('/', DistrictController.getAllDeputyInspectors);

module.exports = router;
