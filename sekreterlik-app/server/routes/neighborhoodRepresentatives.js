const express = require('express');
const router = express.Router();
const NeighborhoodRepresentativeController = require('../controllers/NeighborhoodRepresentativeController');

// Get all neighborhood representatives
router.get('/', NeighborhoodRepresentativeController.getAll);

// Get representatives by neighborhood
router.get('/neighborhood/:neighborhoodId', NeighborhoodRepresentativeController.getByNeighborhood);

// Create new neighborhood representative
router.post('/', NeighborhoodRepresentativeController.create);

// Update neighborhood representative
router.put('/:id', NeighborhoodRepresentativeController.update);

// Delete neighborhood representative
router.delete('/:id', NeighborhoodRepresentativeController.delete);

module.exports = router;
