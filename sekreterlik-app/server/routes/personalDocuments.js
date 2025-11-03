const express = require('express');
const router = express.Router();
const PersonalDocumentController = require('../controllers/PersonalDocumentController');

// Get document types
router.get('/document-types', PersonalDocumentController.getDocumentTypes);

// Get documents by member ID
router.get('/member/:memberId', PersonalDocumentController.getByMemberId);

// Upload document for member
router.post('/member/:memberId', PersonalDocumentController.uploadMiddleware(), PersonalDocumentController.create);

// Download document
router.get('/download/:id', PersonalDocumentController.download);

// Delete document
router.delete('/:id', PersonalDocumentController.delete);

module.exports = router;
