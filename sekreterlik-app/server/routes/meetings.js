const express = require('express');
const MeetingController = require('../controllers/MeetingController');

const router = express.Router();

// Get all meetings
router.get('/', MeetingController.getAll);

// Create new meeting
router.post('/', MeetingController.create);

// Update meeting
router.put('/:id', MeetingController.update);

// Archive meeting
router.delete('/:id/archive', MeetingController.archive);

// Get meeting by ID
router.get('/:id', MeetingController.getById);

// Update attendance
router.put('/:id/attendance', MeetingController.updateAttendance);

// Update excuse
router.put('/:id/excuse', MeetingController.updateExcuse);

// Archive all meetings (completely new endpoint)
router.post('/bulk-archive', MeetingController.archiveAll);

module.exports = router;