const express = require('express');
const TownController = require('../controllers/TownController');

const router = express.Router();

// Get all town deputy inspectors
router.get('/', TownController.getAllDeputyInspectors);

module.exports = router;
