const express = require('express');
const MosqueController = require('../controllers/MosqueController');

const router = express.Router();

// Get all mosques
router.get('/', MosqueController.getAll);

// Get mosques by district
router.get('/district/:districtId', MosqueController.getByDistrict);

// Create new mosque
router.post('/', MosqueController.create);

// Update mosque
router.put('/:id', MosqueController.update);

// Delete mosque
router.delete('/:id', MosqueController.delete);

module.exports = router;
