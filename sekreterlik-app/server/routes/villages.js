const express = require('express');
const VillageController = require('../controllers/VillageController');

const router = express.Router();

// Get all villages
router.get('/', VillageController.getAll);

// Get villages by district
router.get('/district/:districtId', VillageController.getByDistrict);

// Create new village
router.post('/', VillageController.create);

// Update village
router.put('/:id', VillageController.update);

// Delete village
router.delete('/:id', VillageController.delete);

module.exports = router;
