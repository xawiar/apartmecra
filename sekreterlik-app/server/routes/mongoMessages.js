const express = require('express');
const router = express.Router();
const MongoMessageController = require('../controllers/MongoMessageController');
const MongoMessageGroupController = require('../controllers/MongoMessageGroupController');
const { authenticateToken } = require('../middleware/auth');

// Message routes
router.post('/send-to-group', authenticateToken, MongoMessageController.sendToGroup);
router.post('/send-to-user', authenticateToken, MongoMessageController.sendToUser);
router.get('/group/:groupId', authenticateToken, MongoMessageController.getGroupMessages);
router.get('/user', authenticateToken, MongoMessageController.getUserMessages);
router.put('/:messageId/read', authenticateToken, MongoMessageController.markAsRead);
router.get('/unread-count', authenticateToken, MongoMessageController.getUnreadCount);
router.delete('/:messageId', authenticateToken, MongoMessageController.deleteMessage);

// Message group routes
router.post('/groups', authenticateToken, MongoMessageGroupController.create);
router.get('/groups', authenticateToken, MongoMessageGroupController.getAll);
router.get('/groups/:id', authenticateToken, MongoMessageGroupController.getById);
router.put('/groups/:id', authenticateToken, MongoMessageGroupController.update);
router.delete('/groups/:id', authenticateToken, MongoMessageGroupController.delete);
router.get('/groups/general/get-or-create', authenticateToken, MongoMessageGroupController.getOrCreateGeneral);

module.exports = router;
