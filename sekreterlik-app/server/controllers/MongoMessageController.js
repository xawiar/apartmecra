const MongoMessage = require('../models/MongoMessage');
const MongoMessageGroup = require('../models/MongoMessageGroup');

class MongoMessageController {
  // Send message to group
  static async sendToGroup(req, res) {
    try {
      const { group_id, message, messageType = 'text', filePath } = req.body;
      const senderId = 4; // Use a real user ID from member_users table
      
      console.log('sendToGroup called with senderId:', senderId);

      if (!group_id || !message) {
        return res.status(400).json({
          success: false,
          message: 'Grup ID ve mesaj gerekli'
        });
      }

      // Check if group exists
      const group = await MongoMessageGroup.getById(group_id);
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

      const newMessage = await MongoMessage.create(messageData);

      // Get sender info from member_users table
      const db = require('../config/database');
      const senderInfo = await new Promise((resolve, reject) => {
        db.get(
          `SELECT mu.chairman_name as name, mu.username FROM member_users mu WHERE mu.id = ?`,
          [senderId],
          (err, row) => {
            if (err) reject(err);
            else resolve(row);
          }
        );
      });

      // Get message with sender info
      const messageWithSender = await MongoMessage.getById(newMessage.id);
      messageWithSender.sender_name = senderInfo?.name || 'Bilinmeyen Kullanıcı';

      res.json({
        success: true,
        message: 'Mesaj başarıyla gönderildi',
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

      const messageData = {
        senderId,
        receiverId,
        message,
        messageType,
        filePath
      };

      const newMessage = await MongoMessage.create(messageData);

      // Get sender info from member_users table
      const db = require('../config/database');
      const senderInfo = await new Promise((resolve, reject) => {
        db.get(
          `SELECT mu.chairman_name as name, mu.username FROM member_users mu WHERE mu.id = ?`,
          [senderId],
          (err, row) => {
            if (err) reject(err);
            else resolve(row);
          }
        );
      });

      const messageWithSender = {
        ...newMessage,
        sender_name: senderInfo?.name || 'Bilinmeyen Kullanıcı'
      };

      res.json({
        success: true,
        message: 'Mesaj başarıyla gönderildi',
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

  // Get group messages
  static async getGroupMessages(req, res) {
    try {
      const { groupId } = req.params;

      const messages = await MongoMessage.getGroupMessages(groupId);

      // Add sender names to messages
      const db = require('../config/database');
      const messagesWithSenders = await Promise.all(
        messages.map(async (message) => {
          try {
            console.log(`Looking for senderId: ${message.senderId}`);
            const senderInfo = await new Promise((resolve, reject) => {
              db.get(
                `SELECT mu.chairman_name as name, mu.username FROM member_users mu WHERE mu.id = ?`,
                [message.senderId],
                (err, row) => {
                  if (err) {
                    console.error('SQL Error:', err);
                    reject(err);
                  } else {
                    console.log(`Found sender info for ID ${message.senderId}:`, row);
                    resolve(row);
                  }
                }
              );
            });
            return {
              ...message,
              sender_name: senderInfo?.name || 'Bilinmeyen Kullanıcı'
            };
          } catch (error) {
            console.error('Error getting sender info:', error);
            return {
              ...message,
              sender_name: 'Bilinmeyen Kullanıcı'
            };
          }
        })
      );

      res.json({
        success: true,
        messages: messagesWithSenders
      });
    } catch (error) {
      console.error('Error getting group messages:', error);
      res.status(500).json({
        success: false,
        message: 'Mesajlar getirilirken hata oluştu'
      });
    }
  }

  // Get user messages
  static async getUserMessages(req, res) {
    try {
      const userId = req.user.id;

      const messages = await MongoMessage.getUserMessages(userId);

      // Add sender names to messages
      const db = require('../config/database');
      const messagesWithSenders = await Promise.all(
        messages.map(async (message) => {
          try {
            const senderInfo = await new Promise((resolve, reject) => {
              db.get(
                `SELECT mu.chairman_name as name, mu.username FROM member_users mu WHERE mu.id = ?`,
                [message.senderId],
                (err, row) => {
                  if (err) reject(err);
                  else resolve(row);
                }
              );
            });
            return {
              ...message,
              sender_name: senderInfo?.name || 'Bilinmeyen Kullanıcı'
            };
          } catch (error) {
            console.error('Error getting sender info:', error);
            return {
              ...message,
              sender_name: 'Bilinmeyen Kullanıcı'
            };
          }
        })
      );

      res.json({
        success: true,
        messages: messagesWithSenders
      });
    } catch (error) {
      console.error('Error getting user messages:', error);
      res.status(500).json({
        success: false,
        message: 'Mesajlar getirilirken hata oluştu'
      });
    }
  }

  // Mark message as read
  static async markAsRead(req, res) {
    try {
      const { messageId } = req.params;

      const success = await MongoMessage.markAsRead(messageId);

      if (success) {
        res.json({
          success: true,
          message: 'Mesaj okundu olarak işaretlendi'
        });
      } else {
        res.status(404).json({
          success: false,
          message: 'Mesaj bulunamadı'
        });
      }
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

      const count = await MongoMessage.getUnreadCount(userId);

      res.json({
        success: true,
        count
      });
    } catch (error) {
      console.error('Error getting unread count:', error);
      res.status(500).json({
        success: false,
        message: 'Okunmamış mesaj sayısı getirilirken hata oluştu'
      });
    }
  }

  // Delete message
  static async deleteMessage(req, res) {
    try {
      const { messageId } = req.params;

      const success = await MongoMessage.delete(messageId);

      if (success) {
        res.json({
          success: true,
          message: 'Mesaj başarıyla silindi'
        });
      } else {
        res.status(404).json({
          success: false,
          message: 'Mesaj bulunamadı'
        });
      }
    } catch (error) {
      console.error('Error deleting message:', error);
      res.status(500).json({
        success: false,
        message: 'Mesaj silinirken hata oluştu'
      });
    }
  }
}

module.exports = MongoMessageController;
