const express = require('express');
const TownController = require('../controllers/TownController');

const router = express.Router();

// Get all towns
router.get('/', TownController.getAll);

// Get all town deputy inspectors (must come before /:id routes to avoid conflict)
router.get('/deputy-inspectors/all', TownController.getAllDeputyInspectors);

// Get towns by district (must come before /:id to avoid route conflict)
router.get('/district/:districtId', TownController.getByDistrict);

// Get town deputy inspectors
router.get('/:id/deputy-inspectors', TownController.getDeputyInspectors);

// Get town by ID
router.get('/:id', TownController.getById);

// Create new town
router.post('/', TownController.create);

// Update town
router.put('/:id', TownController.update);

// Delete town
router.delete('/:id', TownController.delete);

// Create or update town officials
router.post('/officials', TownController.createOrUpdateTownOfficials);

module.exports = router;
