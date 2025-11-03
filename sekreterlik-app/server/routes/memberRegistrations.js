const express = require('express');
const memberRegistrationController = require('../controllers/memberRegistrationController');

const router = express.Router();

router.get('/', memberRegistrationController.getAll);
router.post('/', memberRegistrationController.create);
router.put('/:id', memberRegistrationController.update);
router.delete('/:id', memberRegistrationController.delete);

module.exports = router;