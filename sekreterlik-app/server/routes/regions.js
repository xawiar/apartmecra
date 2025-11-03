const express = require('express');
const RegionController = require('../controllers/RegionController');

const router = express.Router();

// Get all regions
router.get('/', RegionController.getAll);

// Create new region
router.post('/', RegionController.create);

// Update region
router.put('/:id', RegionController.update);

// Delete region
router.delete('/:id', RegionController.delete);

module.exports = router;