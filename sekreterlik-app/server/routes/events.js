const express = require('express');
const router = express.Router();
const EventController = require('../controllers/EventController');

// Get all events
router.get('/', EventController.getAll);

// Get event by ID
router.get('/:id', EventController.getById);

// Create new event
router.post('/', EventController.create);

// Update event
router.put('/:id', EventController.update);

// Archive event
router.put('/:id/archive', EventController.archive);

// Delete event
router.delete('/:id', EventController.delete);

module.exports = router;
