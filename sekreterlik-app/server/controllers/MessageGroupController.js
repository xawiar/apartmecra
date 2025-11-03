const MessageGroup = require('../models/MessageGroup');

class MessageGroupController {
  // Create message group
  static async create(req, res) {
    try {
      const { name, description, groupType = 'general' } = req.body;
      const createdBy = req.user.id;

      if (!name) {
        return res.status(400).json({
          success: false,
          message: 'Grup adı gerekli'
        });
      }

      const groupData = {
        name,
        description,
        groupType,
        createdBy
      };

      const newGroup = await MessageGroup.create(groupData);

      res.json({
        success: true,
        message: 'Grup oluşturuldu',
        data: newGroup
      });
    } catch (error) {
      console.error('Error creating message group:', error);
      res.status(500).json({
        success: false,
        message: 'Grup oluşturulurken hata oluştu'
      });
    }
  }

  // Get all groups
  static async getAll(req, res) {
    try {
      const groups = await MessageGroup.getAll();

      res.json({
        success: true,
        groups
      });
    } catch (error) {
      console.error('Error getting message groups:', error);
      res.status(500).json({
        success: false,
        message: 'Gruplar alınırken hata oluştu'
      });
    }
  }

  // Get group by ID
  static async getById(req, res) {
    try {
      const { id } = req.params;
      const group = await MessageGroup.getById(id);

      if (!group) {
        return res.status(404).json({
          success: false,
          message: 'Grup bulunamadı'
        });
      }

      res.json({
        success: true,
        group
      });
    } catch (error) {
      console.error('Error getting message group:', error);
      res.status(500).json({
        success: false,
        message: 'Grup alınırken hata oluştu'
      });
    }
  }

  // Update group
  static async update(req, res) {
    try {
      const { id } = req.params;
      const { name, description, groupType } = req.body;

      const groupData = {
        name,
        description,
        groupType
      };

      const result = await MessageGroup.update(id, groupData);

      if (result.changes === 0) {
        return res.status(404).json({
          success: false,
          message: 'Grup bulunamadı'
        });
      }

      res.json({
        success: true,
        message: 'Grup güncellendi'
      });
    } catch (error) {
      console.error('Error updating message group:', error);
      res.status(500).json({
        success: false,
        message: 'Grup güncellenirken hata oluştu'
      });
    }
  }

  // Delete group
  static async delete(req, res) {
    try {
      const { id } = req.params;

      const result = await MessageGroup.delete(id);

      if (result.changes === 0) {
        return res.status(404).json({
          success: false,
          message: 'Grup bulunamadı'
        });
      }

      res.json({
        success: true,
        message: 'Grup silindi'
      });
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
      let group = await MessageGroup.getGeneralGroup();

      if (!group) {
        // Create general group if it doesn't exist
        const groupData = {
          name: 'Genel Sohbet',
          description: 'Tüm üyelerin katılabileceği genel sohbet grubu',
          groupType: 'general',
          createdBy: req.user.id
        };

        group = await MessageGroup.create(groupData);
      }

      res.json({
        success: true,
        group
      });
    } catch (error) {
      console.error('Error getting or creating general group:', error);
      res.status(500).json({
        success: false,
        message: 'Genel grup alınırken hata oluştu'
      });
    }
  }
}

module.exports = MessageGroupController;
