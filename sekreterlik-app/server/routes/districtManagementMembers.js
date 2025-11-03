const express = require('express');
const DistrictManagementMemberController = require('../controllers/DistrictManagementMemberController');
const router = express.Router();

// GET /api/district-management-members - Get all district management members
router.get('/', DistrictManagementMemberController.getAll);

// GET /api/district-management-members/district/:districtId - Get members by district
router.get('/district/:districtId', DistrictManagementMemberController.getByDistrict);

// GET /api/district-management-members/:id - Get member by ID
router.get('/:id', DistrictManagementMemberController.getById);

// POST /api/district-management-members - Create new member
router.post('/', DistrictManagementMemberController.create);

// PUT /api/district-management-members/:id - Update member
router.put('/:id', DistrictManagementMemberController.update);

// DELETE /api/district-management-members/:id - Delete member
router.delete('/:id', DistrictManagementMemberController.delete);

module.exports = router;
