const express = require('express');
const STKController = require('../controllers/STKController');

const router = express.Router();

// Get all STKs
router.get('/', STKController.getAll);

// Create new STK
router.post('/', STKController.create);

// Update STK
router.put('/:id', STKController.update);

// Delete STK
router.delete('/:id', STKController.delete);

module.exports = router;
