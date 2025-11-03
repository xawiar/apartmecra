const express = require('express');
const router = express.Router();
const TownOfficialController = require('../controllers/TownOfficialController');

// Get all town officials
router.get('/', TownOfficialController.getAll);

// Get officials by town
router.get('/town/:townId', TownOfficialController.getByTown);

// Create or update town officials
router.post('/', TownOfficialController.createOrUpdate);

// Delete town officials
router.delete('/town/:townId', TownOfficialController.delete);

module.exports = router;
