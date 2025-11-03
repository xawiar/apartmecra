const express = require('express');
const router = express.Router();
const VillageSupervisorController = require('../controllers/VillageSupervisorController');

// Get all village supervisors
router.get('/', VillageSupervisorController.getAll);

// Get supervisors by village
router.get('/village/:villageId', VillageSupervisorController.getByVillage);

// Create new village supervisor
router.post('/', VillageSupervisorController.create);

// Update village supervisor
router.put('/:id', VillageSupervisorController.update);

// Delete village supervisor
router.delete('/:id', VillageSupervisorController.delete);

module.exports = router;
