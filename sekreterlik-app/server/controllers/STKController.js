const db = require('../config/database');

class STKController {
  // Get all STKs
  static async getAll(req, res) {
    try {
      const stks = await db.all('SELECT * FROM stks ORDER BY name');
      res.json(stks);
    } catch (error) {
      console.error('Error getting STKs:', error);
      res.status(500).json({ message: 'Sunucu hatası', error: error.message });
    }
  }

  // Create new STK
  static async create(req, res) {
    try {
      const { name, description } = req.body;
      
      if (!name || name.trim() === '') {
        return res.status(400).json({ message: 'STK adı gereklidir' });
      }
      
      // Check if STK already exists
      const existingSTK = await db.get('SELECT * FROM stks WHERE name = ?', [name.trim()]);
      if (existingSTK) {
        return res.status(400).json({ message: 'Bu STK zaten kayıtlı' });
      }
      
      const result = await db.run('INSERT INTO stks (name, description) VALUES (?, ?)', [name.trim(), description?.trim() || null]);
      const newSTK = await db.get('SELECT * FROM stks WHERE id = ?', [result.lastID]);
      
      res.status(201).json(newSTK);
    } catch (error) {
      console.error('Error creating STK:', error);
      res.status(500).json({ message: 'Sunucu hatası', error: error.message });
    }
  }

  // Update STK
  static async update(req, res) {
    try {
      const { id } = req.params;
      const { name, description } = req.body;
      
      if (!name || name.trim() === '') {
        return res.status(400).json({ message: 'STK adı gereklidir' });
      }
      
      // Check if STK exists
      const existingSTK = await db.get('SELECT * FROM stks WHERE id = ?', [id]);
      if (!existingSTK) {
        return res.status(404).json({ message: 'STK bulunamadı' });
      }
      
      // Check if new name already exists
      const duplicateSTK = await db.get('SELECT * FROM stks WHERE name = ? AND id != ?', [name.trim(), id]);
      if (duplicateSTK) {
        return res.status(400).json({ message: 'Bu STK adı zaten kullanılıyor' });
      }
      
      await db.run('UPDATE stks SET name = ?, description = ? WHERE id = ?', [name.trim(), description?.trim() || null, id]);
      const updatedSTK = await db.get('SELECT * FROM stks WHERE id = ?', [id]);
      
      res.json(updatedSTK);
    } catch (error) {
      console.error('Error updating STK:', error);
      res.status(500).json({ message: 'Sunucu hatası', error: error.message });
    }
  }

  // Delete STK
  static async delete(req, res) {
    try {
      const { id } = req.params;
      
      // Check if STK exists
      const existingSTK = await db.get('SELECT * FROM stks WHERE id = ?', [id]);
      if (!existingSTK) {
        return res.status(404).json({ message: 'STK bulunamadı' });
      }
      
      await db.run('DELETE FROM stks WHERE id = ?', [id]);
      
      res.json({ message: 'STK başarıyla silindi' });
    } catch (error) {
      console.error('Error deleting STK:', error);
      res.status(500).json({ message: 'Sunucu hatası', error: error.message });
    }
  }
}

module.exports = STKController;
