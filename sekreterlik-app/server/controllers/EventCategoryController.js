const db = require('../config/database');

class EventCategoryController {
  // Get all event categories
  static async getAll(req, res) {
    try {
      const categories = await db.all('SELECT * FROM event_categories ORDER BY name');
      res.json(categories);
    } catch (error) {
      console.error('Error getting event categories:', error);
      res.status(500).json({ message: 'Sunucu hatası', error: error.message });
    }
  }

  // Create new event category
  static async create(req, res) {
    try {
      const { name, description } = req.body;
      
      if (!name || name.trim() === '') {
        return res.status(400).json({ message: 'Etkinlik kategorisi adı gereklidir' });
      }
      
      // Check if category already exists
      const existingCategory = await db.get('SELECT * FROM event_categories WHERE name = ?', [name.trim()]);
      if (existingCategory) {
        return res.status(400).json({ message: 'Bu etkinlik kategorisi zaten kayıtlı' });
      }
      
      const result = await db.run('INSERT INTO event_categories (name, description) VALUES (?, ?)', [name.trim(), description?.trim() || null]);
      const newCategory = await db.get('SELECT * FROM event_categories WHERE id = ?', [result.lastID]);
      
      res.status(201).json(newCategory);
    } catch (error) {
      console.error('Error creating event category:', error);
      res.status(500).json({ message: 'Sunucu hatası', error: error.message });
    }
  }

  // Update event category
  static async update(req, res) {
    try {
      const { id } = req.params;
      const { name, description } = req.body;
      
      if (!name || name.trim() === '') {
        return res.status(400).json({ message: 'Etkinlik kategorisi adı gereklidir' });
      }
      
      // Check if category exists
      const existingCategory = await db.get('SELECT * FROM event_categories WHERE id = ?', [id]);
      if (!existingCategory) {
        return res.status(404).json({ message: 'Etkinlik kategorisi bulunamadı' });
      }
      
      // Check if new name already exists
      const duplicateCategory = await db.get('SELECT * FROM event_categories WHERE name = ? AND id != ?', [name.trim(), id]);
      if (duplicateCategory) {
        return res.status(400).json({ message: 'Bu etkinlik kategorisi adı zaten kullanılıyor' });
      }
      
      await db.run('UPDATE event_categories SET name = ?, description = ? WHERE id = ?', [name.trim(), description?.trim() || null, id]);
      const updatedCategory = await db.get('SELECT * FROM event_categories WHERE id = ?', [id]);
      
      res.json(updatedCategory);
    } catch (error) {
      console.error('Error updating event category:', error);
      res.status(500).json({ message: 'Sunucu hatası', error: error.message });
    }
  }

  // Delete event category
  static async delete(req, res) {
    try {
      const { id } = req.params;
      
      // Check if category exists
      const existingCategory = await db.get('SELECT * FROM event_categories WHERE id = ?', [id]);
      if (!existingCategory) {
        return res.status(404).json({ message: 'Etkinlik kategorisi bulunamadı' });
      }
      
      await db.run('DELETE FROM event_categories WHERE id = ?', [id]);
      
      res.json({ message: 'Etkinlik kategorisi başarıyla silindi' });
    } catch (error) {
      console.error('Error deleting event category:', error);
      res.status(500).json({ message: 'Sunucu hatası', error: error.message });
    }
  }
}

module.exports = EventCategoryController;
