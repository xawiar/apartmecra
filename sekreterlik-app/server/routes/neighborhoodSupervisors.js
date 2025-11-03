const express = require('express');
const router = express.Router();
const NeighborhoodSupervisorController = require('../controllers/NeighborhoodSupervisorController');

// Get all neighborhood supervisors
router.get('/', NeighborhoodSupervisorController.getAll);

// Get supervisors by neighborhood
router.get('/neighborhood/:neighborhoodId', NeighborhoodSupervisorController.getByNeighborhood);

// Create new neighborhood supervisor
router.post('/', NeighborhoodSupervisorController.create);

// Update neighborhood supervisor
router.put('/:id', NeighborhoodSupervisorController.update);

// Delete neighborhood supervisor
router.delete('/:id', NeighborhoodSupervisorController.delete);

module.exports = router;
