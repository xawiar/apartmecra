const express = require('express');
const TownManagementMemberController = require('../controllers/TownManagementMemberController');
const router = express.Router();

// GET /api/town-management-members - Get all town management members
router.get('/', TownManagementMemberController.getAll);

// GET /api/town-management-members/town/:townId - Get members by town
router.get('/town/:townId', TownManagementMemberController.getByTown);

// GET /api/town-management-members/:id - Get member by ID
router.get('/:id', TownManagementMemberController.getById);

// POST /api/town-management-members - Create new member
router.post('/', TownManagementMemberController.create);

// PUT /api/town-management-members/:id - Update member
router.put('/:id', TownManagementMemberController.update);

// DELETE /api/town-management-members/:id - Delete member
router.delete('/:id', TownManagementMemberController.delete);

module.exports = router;
