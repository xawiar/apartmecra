const express = require('express');
const BallotBoxController = require('../controllers/BallotBoxController');
const router = express.Router();

// GET /api/ballot-boxes - Get all ballot boxes
router.get('/', BallotBoxController.getAll);

// GET /api/ballot-boxes/neighborhood/:neighborhoodId - Get ballot boxes by neighborhood
router.get('/neighborhood/:neighborhoodId', BallotBoxController.getByNeighborhood);

// GET /api/ballot-boxes/village/:villageId - Get ballot boxes by village
router.get('/village/:villageId', BallotBoxController.getByVillage);

// GET /api/ballot-boxes/:id - Get ballot box by ID
router.get('/:id', BallotBoxController.getById);

// POST /api/ballot-boxes - Create new ballot box
router.post('/', BallotBoxController.create);

// PUT /api/ballot-boxes/:id - Update ballot box
router.put('/:id', BallotBoxController.update);

// DELETE /api/ballot-boxes/:id - Delete ballot box
router.delete('/:id', BallotBoxController.delete);

module.exports = router;
