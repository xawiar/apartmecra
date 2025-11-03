const { getDB } = require('../config/mongodb');

class MongoMessageGroup {
  static async create(groupData) {
    try {
      const db = getDB();
      const collection = db.collection('message_groups');
      
      const group = {
        ...groupData,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const result = await collection.insertOne(group);
      return { id: result.insertedId, ...group };
    } catch (error) {
      console.error('MongoMessageGroup create error:', error);
      throw error;
    }
  }

  static async getById(groupId) {
    try {
      const db = getDB();
      const collection = db.collection('message_groups');
      const { ObjectId } = require('mongodb');
      
      const group = await collection.findOne({ _id: new ObjectId(groupId) });
      if (group) {
        return { id: group._id, ...group };
      }
      return null;
    } catch (error) {
      console.error('MongoMessageGroup getById error:', error);
      throw error;
    }
  }

  static async getAll() {
    try {
      const db = getDB();
      const collection = db.collection('message_groups');
      
      const groups = await collection.find({}).sort({ createdAt: -1 }).toArray();
      return groups.map(group => ({ id: group._id, ...group }));
    } catch (error) {
      console.error('MongoMessageGroup getAll error:', error);
      throw error;
    }
  }

  static async update(groupId, updateData) {
    try {
      const db = getDB();
      const collection = db.collection('message_groups');
      const { ObjectId } = require('mongodb');
      
      const result = await collection.updateOne(
        { _id: new ObjectId(groupId) },
        { $set: { ...updateData, updatedAt: new Date() } }
      );
      
      return result.modifiedCount > 0;
    } catch (error) {
      console.error('MongoMessageGroup update error:', error);
      throw error;
    }
  }

  static async delete(groupId) {
    try {
      const db = getDB();
      const collection = db.collection('message_groups');
      const { ObjectId } = require('mongodb');
      
      const result = await collection.deleteOne({ _id: new ObjectId(groupId) });
      return result.deletedCount > 0;
    } catch (error) {
      console.error('MongoMessageGroup delete error:', error);
      throw error;
    }
  }

  static async getOrCreateGeneral() {
    try {
      const db = getDB();
      const collection = db.collection('message_groups');
      
      // Genel grup var mı kontrol et
      let generalGroup = await collection.findOne({ name: 'Genel Sohbet' });
      
      if (!generalGroup) {
        // Genel grup yoksa oluştur
        generalGroup = {
          name: 'Genel Sohbet',
          description: 'Tüm kullanıcıların katılabileceği genel sohbet grubu',
          type: 'general',
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        const result = await collection.insertOne(generalGroup);
        generalGroup._id = result.insertedId;
      }
      
      return { id: generalGroup._id, ...generalGroup };
    } catch (error) {
      console.error('MongoMessageGroup getOrCreateGeneral error:', error);
      throw error;
    }
  }
}

module.exports = MongoMessageGroup;
