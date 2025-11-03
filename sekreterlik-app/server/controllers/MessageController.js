const Message = require('../models/Message');
const MessageGroup = require('../models/MessageGroup');
const PushNotificationService = require('../services/pushNotificationService');
const PushSubscription = require('../models/PushSubscription');

class MessageController {
  // Send message to group
  static async sendToGroup(req, res) {
    try {
      const { group_id, message, messageType = 'text', filePath } = req.body;
      const senderId = req.user.id;

      if (!group_id || !message) {
        return res.status(400).json({
          success: false,
          message: 'Grup ID ve mesaj gerekli'
        });
      }

      // Check if group exists
      const group = await MessageGroup.getById(group_id);
      if (!group) {
        return res.status(404).json({
          success: false,
          message: 'Grup bulunamadı'
        });
      }

      // Create message
      const messageData = {
        senderId,
        groupId: group_id,
        message,
        messageType,
        filePath
      };

      const newMessage = await Message.create(messageData);

      // Get message with sender info
      const messageWithSender = await Message.getById(newMessage.id);

      // Send push notifications to group members
      try {
        const subscriptions = await PushSubscription.getAll();
        const sender = subscriptions.find(sub => sub.user_id === senderId);
        const senderName = sender ? sender.chairman_name || sender.username : 'Bilinmeyen';

        await PushNotificationService.sendMessageNotification(
          subscriptions.filter(sub => sub.user_id !== senderId),
          senderName,
          message
        );
      } catch (pushError) {
        console.error('Push notification error:', pushError);
        // Don't fail the message send if push notification fails
      }

      res.json({
        success: true,
        message: 'Mesaj gönderildi',
        data: messageWithSender
      });
    } catch (error) {
      console.error('Error sending message to group:', error);
      res.status(500).json({
        success: false,
        message: 'Mesaj gönderilirken hata oluştu'
      });
    }
  }

  // Send message to user
  static async sendToUser(req, res) {
    try {
      const { receiverId, message, messageType = 'text', filePath } = req.body;
      const senderId = req.user.id;

      if (!receiverId || !message) {
        return res.status(400).json({
          success: false,
          message: 'Alıcı ID ve mesaj gerekli'
        });
      }

      // Create message
      const messageData = {
        senderId,
        receiverId,
        message,
        messageType,
        filePath
      };

      const newMessage = await Message.create(messageData);

      // Get message with sender info
      const messageWithSender = await Message.getById(newMessage.id);

      // Send push notification to receiver
      try {
        const subscriptions = await PushSubscription.getByUserId(receiverId);
        const senderSubscriptions = await PushSubscription.getByUserId(senderId);
        const sender = senderSubscriptions[0];
        const senderName = sender ? sender.chairman_name || sender.username : 'Bilinmeyen';

        if (subscriptions.length > 0) {
          await PushNotificationService.sendMessageNotification(
            subscriptions,
            senderName,
            message
          );
        }
      } catch (pushError) {
        console.error('Push notification error:', pushError);
        // Don't fail the message send if push notification fails
      }

      res.json({
        success: true,
        message: 'Mesaj gönderildi',
        data: messageWithSender
      });
    } catch (error) {
      console.error('Error sending message to user:', error);
      res.status(500).json({
        success: false,
        message: 'Mesaj gönderilirken hata oluştu'
      });
    }
  }

  // Get messages from group
  static async getGroupMessages(req, res) {
    try {
      const { groupId } = req.params;
      const { limit = 50, offset = 0 } = req.query;

      const messages = await Message.getByGroupId(groupId, parseInt(limit), parseInt(offset));

      res.json({
        success: true,
        messages
      });
    } catch (error) {
      console.error('Error getting group messages:', error);
      res.status(500).json({
        success: false,
        message: 'Mesajlar alınırken hata oluştu'
      });
    }
  }

  // Get user messages
  static async getUserMessages(req, res) {
    try {
      const userId = req.user.id;
      const { limit = 50, offset = 0 } = req.query;

      const messages = await Message.getByUserId(userId, parseInt(limit), parseInt(offset));

      res.json({
        success: true,
        messages
      });
    } catch (error) {
      console.error('Error getting user messages:', error);
      res.status(500).json({
        success: false,
        message: 'Mesajlar alınırken hata oluştu'
      });
    }
  }

  // Mark message as read
  static async markAsRead(req, res) {
    try {
      const { messageId } = req.params;
      const userId = req.user.id;

      await Message.markAsRead(messageId, userId);

      res.json({
        success: true,
        message: 'Mesaj okundu olarak işaretlendi'
      });
    } catch (error) {
      console.error('Error marking message as read:', error);
      res.status(500).json({
        success: false,
        message: 'Mesaj işaretlenirken hata oluştu'
      });
    }
  }

  // Get unread count
  static async getUnreadCount(req, res) {
    try {
      const userId = req.user.id;
      const count = await Message.getUnreadCount(userId);

      res.json({
        success: true,
        count
      });
    } catch (error) {
      console.error('Error getting unread count:', error);
      res.status(500).json({
        success: false,
        message: 'Okunmamış mesaj sayısı alınırken hata oluştu'
      });
    }
  }

  // Delete message
  static async deleteMessage(req, res) {
    try {
      const { messageId } = req.params;
      const userId = req.user.id;

      const result = await Message.delete(messageId, userId);

      if (result.changes === 0) {
        return res.status(404).json({
          success: false,
          message: 'Mesaj bulunamadı veya silme yetkiniz yok'
        });
      }

      res.json({
        success: true,
        message: 'Mesaj silindi'
      });
    } catch (error) {
      console.error('Error deleting message:', error);
      res.status(500).json({
        success: false,
        message: 'Mesaj silinirken hata oluştu'
      });
    }
  }
}

module.exports = MessageController;
