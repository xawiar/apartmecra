const express = require('express');
const BallotBoxObserverController = require('../controllers/BallotBoxObserverController');
const router = express.Router();

// GET /api/ballot-box-observers - Get all observers
router.get('/', BallotBoxObserverController.getAll);

// GET /api/ballot-box-observers/ballot-box/:ballotBoxId - Get observers by ballot box
router.get('/ballot-box/:ballotBoxId', BallotBoxObserverController.getByBallotBox);

// GET /api/ballot-box-observers/:id - Get observer by ID
router.get('/:id', BallotBoxObserverController.getById);

// POST /api/ballot-box-observers - Create new observer
router.post('/', BallotBoxObserverController.create);

// PUT /api/ballot-box-observers/:id - Update observer
router.put('/:id', BallotBoxObserverController.update);

// DELETE /api/ballot-box-observers/:id - Delete observer
router.delete('/:id', BallotBoxObserverController.delete);

module.exports = router;
