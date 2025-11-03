const express = require('express');
const ArchiveController = require('../controllers/ArchiveController');

const router = express.Router();

// Document routes
router.get('/documents', ArchiveController.getDocuments);
router.post('/documents', ArchiveController.uploadDocument, ArchiveController.uploadDocumentHandler);
router.get('/documents/:id/download', ArchiveController.downloadDocument);
router.delete('/documents/:id', ArchiveController.deleteDocument);

// Clear archived data routes (place BEFORE dynamic :id routes to avoid matching issues)
router.delete('/members/clear', ArchiveController.clearArchivedMembers);
router.delete('/meetings/clear', ArchiveController.clearArchivedMeetings);
router.delete('/documents/clear', ArchiveController.clearDocuments);
router.delete('/events/clear', ArchiveController.clearArchivedEvents);

// Individual archived item deletion routes
router.delete('/members/:id', ArchiveController.deleteArchivedMember);
router.delete('/meetings/:id', ArchiveController.deleteArchivedMeeting);

module.exports = router;