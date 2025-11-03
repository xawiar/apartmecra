const express = require('express');
const router = express.Router();
const DistrictOfficialController = require('../controllers/DistrictOfficialController');

// Get all district officials
router.get('/', DistrictOfficialController.getAll);

// Get officials by district
router.get('/district/:districtId', DistrictOfficialController.getByDistrict);

// Create or update district officials
router.post('/', DistrictOfficialController.createOrUpdate);

// Delete district officials
router.delete('/district/:districtId', DistrictOfficialController.delete);

module.exports = router;
