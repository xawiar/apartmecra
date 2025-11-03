const express = require('express');
const PositionController = require('../controllers/PositionController');

const router = express.Router();

// Get all positions
router.get('/', PositionController.getAll);

// Create new position
router.post('/', PositionController.create);

// Update position
router.put('/:id', PositionController.update);

// Delete position
router.delete('/:id', PositionController.delete);

module.exports = router;