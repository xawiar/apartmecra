const express = require('express');
const router = express.Router();
const VisitController = require('../controllers/VisitController');

// Increment visit count for a location
router.post('/increment/:locationType/:locationId', async (req, res) => {
  try {
    const { locationType, locationId } = req.params;
    const result = await VisitController.incrementVisit(locationType, locationId);
    res.json(result);
  } catch (error) {
    console.error('Error incrementing visit:', error);
    res.status(500).json({ error: 'Failed to increment visit count' });
  }
});

// Get visit count for a location
router.get('/count/:locationType/:locationId', async (req, res) => {
  try {
    const { locationType, locationId } = req.params;
    const visitCount = await VisitController.getVisitCount(locationType, locationId);
    res.json({ visitCount });
  } catch (error) {
    console.error('Error getting visit count:', error);
    res.status(500).json({ error: 'Failed to get visit count' });
  }
});

// Get all visit counts for a location type
router.get('/counts/:locationType', async (req, res) => {
  try {
    const { locationType } = req.params;
    const visits = await VisitController.getAllVisitCounts(locationType);
    res.json(visits);
  } catch (error) {
    console.error('Error getting all visit counts:', error);
    res.status(500).json({ error: 'Failed to get visit counts' });
  }
});

// Reset visit count for a location
router.post('/reset/:locationType/:locationId', async (req, res) => {
  try {
    const { locationType, locationId } = req.params;
    const result = await VisitController.resetVisitCount(locationType, locationId);
    res.json(result);
  } catch (error) {
    console.error('Error resetting visit count:', error);
    res.status(500).json({ error: 'Failed to reset visit count' });
  }
});

// Process event locations and increment visit counts
router.post('/process-event', async (req, res) => {
  try {
    const { eventId, selectedLocationTypes, selectedLocations } = req.body;
    const results = await VisitController.processEventLocations(eventId, selectedLocationTypes, selectedLocations);
    res.json({ success: true, results });
  } catch (error) {
    console.error('Error processing event locations:', error);
    res.status(500).json({ error: 'Failed to process event locations' });
  }
});

// Recalculate all visit counts based on existing events
router.post('/recalculate-all', async (req, res) => {
  try {
    const result = await VisitController.recalculateAllVisitCounts();
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('Error recalculating visit counts:', error);
    res.status(500).json({ error: 'Failed to recalculate visit counts', message: error.message });
  }
});

module.exports = router;
