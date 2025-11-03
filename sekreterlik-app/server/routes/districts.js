const express = require('express');
const DistrictController = require('../controllers/DistrictController');

const router = express.Router();

// Get all districts
router.get('/', DistrictController.getAll);

// Create new district
router.post('/', DistrictController.create);

// Update district
router.put('/:id', DistrictController.update);

// Delete district
router.delete('/:id', DistrictController.delete);

// Create or update district officials
router.post('/officials', DistrictController.createOrUpdateDistrictOfficials);

// Get district deputy inspectors
router.get('/:id/deputy-inspectors', DistrictController.getDeputyInspectors);

module.exports = router;
