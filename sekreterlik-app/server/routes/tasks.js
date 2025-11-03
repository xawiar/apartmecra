const express = require('express');
const TaskController = require('../controllers/TaskController');

const router = express.Router();

// Get all tasks
router.get('/', TaskController.getAll);

// Create new task
router.post('/', TaskController.create);

// Update task
router.put('/:id', TaskController.update);

// Archive task
router.delete('/:id/archive', TaskController.archive);

// Delete task
router.delete('/:id', TaskController.delete);

// Get task by ID
router.get('/:id', TaskController.getById);

// Archive all tasks (completely new endpoint)
router.post('/bulk-archive', TaskController.archiveAll);

module.exports = router;