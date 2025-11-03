const express = require('express');
const router = express.Router();
const MessageController = require('../controllers/MessageController');
const MessageGroupController = require('../controllers/MessageGroupController');
const { authenticateToken } = require('../middleware/auth');

// Message routes
router.post('/send-to-group', authenticateToken, MessageController.sendToGroup);
router.post('/send-to-user', authenticateToken, MessageController.sendToUser);
router.get('/group/:groupId', authenticateToken, MessageController.getGroupMessages);
router.get('/user', authenticateToken, MessageController.getUserMessages);
router.put('/:messageId/read', authenticateToken, MessageController.markAsRead);
router.get('/unread-count', authenticateToken, MessageController.getUnreadCount);
router.delete('/:messageId', authenticateToken, MessageController.deleteMessage);

// Message group routes
router.post('/groups', authenticateToken, MessageGroupController.create);
router.get('/groups', authenticateToken, MessageGroupController.getAll);
router.get('/groups/:id', authenticateToken, MessageGroupController.getById);
router.put('/groups/:id', authenticateToken, MessageGroupController.update);
router.delete('/groups/:id', authenticateToken, MessageGroupController.delete);
router.get('/groups/general/get-or-create', authenticateToken, MessageGroupController.getOrCreateGeneral);

module.exports = router;
