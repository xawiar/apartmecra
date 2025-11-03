const { getDB } = require('../config/mongodb');

class MongoMessage {
  static async create(messageData) {
    try {
      const db = getDB();
      const collection = db.collection('messages');
      
      const message = {
        ...messageData,
        groupId: messageData.groupId, // String olarak sakla
        isRead: false, // Okundu durumu
        readAt: null, // Okunma zamanı
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const result = await collection.insertOne(message);
      return { id: result.insertedId, ...message };
    } catch (error) {
      console.error('MongoMessage create error:', error);
      throw error;
    }
  }

  static async getById(messageId) {
    try {
      const db = getDB();
      const collection = db.collection('messages');
      const { ObjectId } = require('mongodb');
      
      const message = await collection.findOne({ _id: new ObjectId(messageId) });
      if (message) {
        return { id: message._id, ...message };
      }
      return null;
    } catch (error) {
      console.error('MongoMessage getById error:', error);
      throw error;
    }
  }

  static async getGroupMessages(groupId) {
    try {
      const db = getDB();
      const collection = db.collection('messages');
      const { ObjectId } = require('mongodb');
      
      // groupId string olarak geliyorsa ObjectId'ye çevir
      const query = { groupId: typeof groupId === 'string' ? groupId : new ObjectId(groupId) };
      
      const messages = await collection
        .find(query)
        .sort({ createdAt: 1 })
        .toArray();
      
      return messages.map(msg => ({ id: msg._id, ...msg }));
    } catch (error) {
      console.error('MongoMessage getGroupMessages error:', error);
      throw error;
    }
  }

  static async getUserMessages(userId) {
    try {
      const db = getDB();
      const collection = db.collection('messages');
      
      const messages = await collection
        .find({ $or: [{ senderId: userId }, { receiverId: userId }] })
        .sort({ createdAt: -1 })
        .toArray();
      
      return messages.map(msg => ({ id: msg._id, ...msg }));
    } catch (error) {
      console.error('MongoMessage getUserMessages error:', error);
      throw error;
    }
  }

  static async markAsRead(messageId) {
    try {
      const db = getDB();
      const collection = db.collection('messages');
      const { ObjectId } = require('mongodb');
      
      const result = await collection.updateOne(
        { _id: new ObjectId(messageId) },
        { $set: { isRead: true, readAt: new Date() } }
      );
      
      return result.modifiedCount > 0;
    } catch (error) {
      console.error('MongoMessage markAsRead error:', error);
      throw error;
    }
  }

  static async getUnreadCount(userId) {
    try {
      const db = getDB();
      const collection = db.collection('messages');
      
      const count = await collection.countDocuments({
        receiverId: userId,
        isRead: { $ne: true }
      });
      
      return count;
    } catch (error) {
      console.error('MongoMessage getUnreadCount error:', error);
      throw error;
    }
  }

  static async delete(messageId) {
    try {
      const db = getDB();
      const collection = db.collection('messages');
      const { ObjectId } = require('mongodb');
      
      const result = await collection.deleteOne({ _id: new ObjectId(messageId) });
      return result.deletedCount > 0;
    } catch (error) {
      console.error('MongoMessage delete error:', error);
      throw error;
    }
  }

  // Mesajı okundu olarak işaretle
  static async markAsRead(messageId) {
    try {
      const db = getDB();
      const collection = db.collection('messages');
      const { ObjectId } = require('mongodb');
      
      const result = await collection.updateOne(
        { _id: new ObjectId(messageId) },
        { 
          $set: { 
            isRead: true, 
            readAt: new Date(),
            updatedAt: new Date()
          } 
        }
      );
      return result.modifiedCount > 0;
    } catch (error) {
      console.error('MongoMessage markAsRead error:', error);
      throw error;
    }
  }

  // Kullanıcının okunmamış mesaj sayısını getir
  static async getUnreadCount(userId) {
    try {
      const db = getDB();
      const collection = db.collection('messages');
      
      const count = await collection.countDocuments({
        $or: [
          { senderId: userId, isRead: false },
          { receiverId: userId, isRead: false }
        ]
      });
      return count;
    } catch (error) {
      console.error('MongoMessage getUnreadCount error:', error);
      throw error;
    }
  }
}

module.exports = MongoMessage;
