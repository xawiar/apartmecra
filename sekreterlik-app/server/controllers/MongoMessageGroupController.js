const MongoMessageGroup = require('../models/MongoMessageGroup');

class MongoMessageGroupController {
  // Create message group
  static async create(req, res) {
    try {
      const { name, description, type = 'custom' } = req.body;

      if (!name) {
        return res.status(400).json({
          success: false,
          message: 'Grup adı gerekli'
        });
      }

      const groupData = {
        name,
        description,
        type
      };

      const newGroup = await MongoMessageGroup.create(groupData);

      res.status(201).json({
        success: true,
        message: 'Grup başarıyla oluşturuldu',
        group: newGroup
      });
    } catch (error) {
      console.error('Error creating message group:', error);
      res.status(500).json({
        success: false,
        message: 'Grup oluşturulurken hata oluştu'
      });
    }
  }

  // Get all message groups
  static async getAll(req, res) {
    try {
      const groups = await MongoMessageGroup.getAll();

      res.json({
        success: true,
        groups
      });
    } catch (error) {
      console.error('Error getting message groups:', error);
      res.status(500).json({
        success: false,
        message: 'Gruplar getirilirken hata oluştu'
      });
    }
  }

  // Get message group by ID
  static async getById(req, res) {
    try {
      const { id } = req.params;

      const group = await MongoMessageGroup.getById(id);

      if (group) {
        res.json({
          success: true,
          group
        });
      } else {
        res.status(404).json({
          success: false,
          message: 'Grup bulunamadı'
        });
      }
    } catch (error) {
      console.error('Error getting message group:', error);
      res.status(500).json({
        success: false,
        message: 'Grup getirilirken hata oluştu'
      });
    }
  }

  // Update message group
  static async update(req, res) {
    try {
      const { id } = req.params;
      const { name, description } = req.body;

      const updateData = {};
      if (name) updateData.name = name;
      if (description) updateData.description = description;

      const success = await MongoMessageGroup.update(id, updateData);

      if (success) {
        res.json({
          success: true,
          message: 'Grup başarıyla güncellendi'
        });
      } else {
        res.status(404).json({
          success: false,
          message: 'Grup bulunamadı'
        });
      }
    } catch (error) {
      console.error('Error updating message group:', error);
      res.status(500).json({
        success: false,
        message: 'Grup güncellenirken hata oluştu'
      });
    }
  }

  // Delete message group
  static async delete(req, res) {
    try {
      const { id } = req.params;

      const success = await MongoMessageGroup.delete(id);

      if (success) {
        res.json({
          success: true,
          message: 'Grup başarıyla silindi'
        });
      } else {
        res.status(404).json({
          success: false,
          message: 'Grup bulunamadı'
        });
      }
    } catch (error) {
      console.error('Error deleting message group:', error);
      res.status(500).json({
        success: false,
        message: 'Grup silinirken hata oluştu'
      });
    }
  }

  // Get or create general group
  static async getOrCreateGeneral(req, res) {
    try {
      const generalGroup = await MongoMessageGroup.getOrCreateGeneral();

      res.json({
        success: true,
        group: generalGroup
      });
    } catch (error) {
      console.error('Error getting/creating general group:', error);
      res.status(500).json({
        success: false,
        message: 'Genel grup getirilirken hata oluştu'
      });
    }
  }
}

module.exports = MongoMessageGroupController;
