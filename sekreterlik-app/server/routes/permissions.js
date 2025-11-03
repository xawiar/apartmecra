const express = require('express');
const router = express.Router();
const PermissionController = require('../controllers/PermissionController');

router.get('/', PermissionController.getAll);
router.get('/:position', PermissionController.getByPosition);
router.post('/:position', PermissionController.setForPosition);

module.exports = router;


