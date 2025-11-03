const express = require('express');
const EventCategoryController = require('../controllers/EventCategoryController');

const router = express.Router();

// Get all event categories
router.get('/', EventCategoryController.getAll);

// Create new event category
router.post('/', EventCategoryController.create);

// Update event category
router.put('/:id', EventCategoryController.update);

// Delete event category
router.delete('/:id', EventCategoryController.delete);

module.exports = router;
