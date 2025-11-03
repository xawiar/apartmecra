const express = require('express');
const router = express.Router();
const VillageRepresentativeController = require('../controllers/VillageRepresentativeController');

// Get all village representatives
router.get('/', VillageRepresentativeController.getAll);

// Get representatives by village
router.get('/village/:villageId', VillageRepresentativeController.getByVillage);

// Create new village representative
router.post('/', VillageRepresentativeController.create);

// Update village representative
router.put('/:id', VillageRepresentativeController.update);

// Delete village representative
router.delete('/:id', VillageRepresentativeController.delete);

module.exports = router;
