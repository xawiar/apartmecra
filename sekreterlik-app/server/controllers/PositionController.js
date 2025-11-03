const db = require('../config/database');
const Position = require('../models/Position');
const { invalidate } = require('../middleware/cache');

class PositionController {
  // Get all positions
  static async getAll(req, res) {
    try {
      const positions = await db.all('SELECT * FROM positions ORDER BY name');
      res.json(positions);
    } catch (error) {
      console.error('Error getting positions:', error);
      res.status(500).json({ message: 'Sunucu hatası', error: error.message });
    }
  }

  // Create new position
  static async create(req, res) {
    try {
      const positionData = req.body;
      const errors = Position.validate(positionData);
      
      if (errors.length > 0) {
        return res.status(400).json({ message: 'Doğrulama hatası', errors });
      }
      
      // Check if position already exists
      const existingPosition = await db.get('SELECT * FROM positions WHERE name = ?', [positionData.name]);
      if (existingPosition) {
        return res.status(400).json({ message: 'Bu görev zaten kayıtlı' });
      }
      
      const result = await db.run('INSERT INTO positions (name) VALUES (?)', [positionData.name]);
      const newPosition = await db.get('SELECT * FROM positions WHERE id = ?', [result.lastID]);
      
      res.status(201).json(newPosition);
    } catch (error) {
      res.status(500).json({ message: 'Sunucu hatası', error: error.message });
    }
  }

  // Update position
  static async update(req, res) {
    try {
      const { id } = req.params;
      const positionData = req.body;
      const errors = Position.validate(positionData);
      
      if (errors.length > 0) {
        return res.status(400).json({ message: 'Doğrulama hatası', errors });
      }
      
      // Get the old position name before updating
      const oldPosition = await db.get('SELECT * FROM positions WHERE id = ?', [parseInt(id)]);
      if (!oldPosition) {
        return res.status(404).json({ message: 'Görev bulunamadı' });
      }
      
      // Check if new name already exists (excluding current position)
      const existingPosition = await db.get('SELECT * FROM positions WHERE name = ? AND id != ?', [positionData.name, parseInt(id)]);
      if (existingPosition) {
        return res.status(400).json({ message: 'Bu görev adı zaten kullanılıyor' });
      }
      
      // Update the position
      const sql = 'UPDATE positions SET name = ? WHERE id = ?';
      const params = [positionData.name, parseInt(id)];
      
      const result = await db.run(sql, params);
      if (result.changes === 0) {
        return res.status(404).json({ message: 'Görev bulunamadı' });
      }
      
      // Update all members with this position
      const membersUpdateResult = await db.run('UPDATE members SET position = ? WHERE position = ?', [positionData.name, oldPosition.name]);
      console.log(`Updated ${membersUpdateResult.changes} members with position change from "${oldPosition.name}" to "${positionData.name}"`);
      
      // Update member users table if it has position column
      try {
        const memberUsersUpdateResult = await db.run('UPDATE member_users SET position = ? WHERE position = ?', [positionData.name, oldPosition.name]);
        console.log(`Updated ${memberUsersUpdateResult.changes} member users with position change`);
      } catch (error) {
        // Ignore if position column doesn't exist in member_users
        console.log('Position column not found in member_users table');
      }
      
      // Update position_permissions table when position name changes
      try {
        const permissionsUpdateResult = await db.run('UPDATE position_permissions SET position = ? WHERE position = ?', [positionData.name, oldPosition.name]);
        console.log(`Updated ${permissionsUpdateResult.changes} permissions with position change from "${oldPosition.name}" to "${positionData.name}"`);
      } catch (error) {
        console.error('Error updating position_permissions:', error);
        // Don't fail the main operation if permissions update fails
      }
      
      // Invalidate permissions cache to reflect the updated position name
      try { invalidate('/api/permissions'); } catch (_) {}
      
      const updatedPosition = await db.get('SELECT * FROM positions WHERE id = ?', [parseInt(id)]);
      res.json(updatedPosition);
    } catch (error) {
      console.error('Error updating position:', error);
      res.status(500).json({ message: 'Sunucu hatası', error: error.message });
    }
  }

  // Delete position
  static async delete(req, res) {
    try {
      const { id } = req.params;
      
      // First check if position exists
      const position = await db.get('SELECT * FROM positions WHERE id = ?', [parseInt(id)]);
      if (!position) {
        return res.status(404).json({ message: 'Pozisyon bulunamadı' });
      }
      
      // Check if any members are using this position
      const membersUsingPosition = await db.get('SELECT COUNT(*) as count FROM members WHERE position = ?', [position.name]);
      if (membersUsingPosition.count > 0) {
        return res.status(400).json({ 
          message: `Bu pozisyon ${membersUsingPosition.count} üye tarafından kullanılıyor. Önce bu üyelerin pozisyonlarını değiştirin.` 
        });
      }
      
      // Delete the position
      const result = await db.run('DELETE FROM positions WHERE id = ?', [parseInt(id)]);
      
      if (result.changes === 0) {
        return res.status(404).json({ message: 'Pozisyon bulunamadı' });
      }
      
      res.json({ message: 'Pozisyon başarıyla silindi', position: position });
    } catch (error) {
      console.error('Error deleting position:', error);
      res.status(500).json({ message: 'Sunucu hatası', error: error.message });
    }
  }
}

module.exports = PositionController;