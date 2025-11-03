const express = require('express');
const NeighborhoodController = require('../controllers/NeighborhoodController');

const router = express.Router();

// Get all neighborhoods
router.get('/', NeighborhoodController.getAll);

// Get neighborhoods by district
router.get('/district/:districtId', NeighborhoodController.getByDistrict);

// Create new neighborhood
router.post('/', NeighborhoodController.create);

// Update neighborhood
router.put('/:id', NeighborhoodController.update);

// Delete neighborhood
router.delete('/:id', NeighborhoodController.delete);

module.exports = router;
