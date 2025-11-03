const express = require('express');
const multer = require('multer');
const MemberController = require('../controllers/MemberController');

// Set up multer for file uploads - support both single and multiple file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

const router = express.Router();

console.log('Members router initialized');

// IMPORTANT: Specific routes must be defined BEFORE parameterized routes
// Test endpoint
router.get('/test-import', (req, res) => {
  console.log('GET /test-import route called');
  res.json({ message: 'Test import endpoint working' });
});

// Import members from Excel
router.post('/import', upload.single('file'), (req, res) => {
  console.log('POST /import route called');
  console.log('Request headers:', req.headers);
  console.log('Request body:', req.body);
  console.log('Request file:', req.file);
  console.log('Request files:', req.files);
  MemberController.importFromExcel(req, res);
});

// Export members to Excel
router.get('/export', (req, res) => {
  console.log('GET /export route called');
  MemberController.exportToExcel(req, res);
});

// Upload member photo
router.post('/upload-photo', upload.single('photo'), (req, res) => {
  console.log('POST /upload-photo route called');
  MemberController.uploadPhoto(req, res);
});

// Archive all members (completely new endpoint)
router.post('/bulk-archive', (req, res) => {
  console.log('POST /bulk-archive route called');
  MemberController.bulkArchive(req, res);
});

// Get all members
router.get('/', (req, res) => {
  console.log('GET / route called');
  MemberController.getAll(req, res);
});

// Get member by ID (must be defined AFTER specific routes)
router.get('/:id', (req, res) => {
  console.log('GET /:id route called with id:', req.params.id);
  MemberController.getById(req, res);
});

// Create new member
router.post('/', (req, res) => {
  console.log('POST / route called');
  MemberController.create(req, res);
});

// Update member
router.put('/:id', (req, res) => {
  console.log('PUT /:id route called with id:', req.params.id);
  MemberController.update(req, res);
});

// Archive member
router.delete('/:id/archive', (req, res) => {
  console.log('DELETE /:id/archive route called with id:', req.params.id);
  MemberController.archive(req, res);
});

// Restore archived member
router.post('/:id/restore', (req, res) => {
  console.log('POST /:id/restore route called with id:', req.params.id);
  MemberController.restore(req, res);
});

module.exports = router;