const db = require('../config/database');
const { collections } = require('../config/database');

class VillageController {
  // Get all villages with district and town info
  static async getAll(req, res) {
    try {
      const villages = await db.all(`
        SELECT v.*, d.name as district_name, t.name as town_name 
        FROM villages v 
        LEFT JOIN districts d ON v.district_id = d.id 
        LEFT JOIN towns t ON v.town_id = t.id 
        ORDER BY d.name, t.name, v.name
      `);
      res.json(villages);
    } catch (error) {
      console.error('Error getting villages:', error);
      res.status(500).json({ message: 'Sunucu hatası', error: error.message });
    }
  }

  // Get villages by district
  static async getByDistrict(req, res) {
    try {
      const { districtId } = req.params;
      const villages = await db.all(`
        SELECT v.*, d.name as district_name, t.name as town_name 
        FROM villages v 
        LEFT JOIN districts d ON v.district_id = d.id 
        LEFT JOIN towns t ON v.town_id = t.id 
        WHERE v.district_id = ?
        ORDER BY t.name, v.name
      `, [districtId]);
      res.json(villages);
    } catch (error) {
      console.error('Error getting villages by district:', error);
      res.status(500).json({ message: 'Sunucu hatası', error: error.message });
    }
  }

  // Create new village
  static async create(req, res) {
    try {
      const { name, district_id, town_id } = req.body;
      
      if (!name || name.trim() === '') {
        return res.status(400).json({ message: 'Köy adı gereklidir' });
      }
      
      if (!district_id) {
        return res.status(400).json({ message: 'İlçe seçimi gereklidir' });
      }
      
      // Check if district exists
      const district = await db.get('SELECT * FROM districts WHERE id = ?', [district_id]);
      if (!district) {
        return res.status(400).json({ message: 'Seçilen ilçe bulunamadı' });
      }
      
      // Check if town exists (if provided)
      if (town_id) {
        const town = await db.get('SELECT * FROM towns WHERE id = ? AND district_id = ?', [town_id, district_id]);
        if (!town) {
          return res.status(400).json({ message: 'Seçilen belde bu ilçede bulunamadı' });
        }
      }
      
      // Check if village already exists
      const existingVillage = await db.get(
        'SELECT * FROM villages WHERE name = ? AND district_id = ? AND (town_id = ? OR (town_id IS NULL AND ? IS NULL))', 
        [name.trim(), district_id, town_id, town_id]
      );
      if (existingVillage) {
        return res.status(400).json({ message: 'Bu köy zaten kayıtlı' });
      }
      
      const result = await db.run('INSERT INTO villages (name, district_id, town_id) VALUES (?, ?, ?)', [name.trim(), district_id, town_id || null]);
      const newVillage = await db.get(`
        SELECT v.*, d.name as district_name, t.name as town_name 
        FROM villages v 
        LEFT JOIN districts d ON v.district_id = d.id 
        LEFT JOIN towns t ON v.town_id = t.id 
        WHERE v.id = ?
      `, [result.lastID]);
      
      // Update in-memory collection
      collections.villages.push(newVillage);
      
      res.status(201).json(newVillage);
    } catch (error) {
      console.error('Error creating village:', error);
      res.status(500).json({ message: 'Sunucu hatası', error: error.message });
    }
  }

  // Update village
  static async update(req, res) {
    try {
      const { id } = req.params;
      const { name, district_id, town_id } = req.body;
      
      if (!name || name.trim() === '') {
        return res.status(400).json({ message: 'Köy adı gereklidir' });
      }
      
      if (!district_id) {
        return res.status(400).json({ message: 'İlçe seçimi gereklidir' });
      }
      
      // Check if village exists
      const existingVillage = await db.get('SELECT * FROM villages WHERE id = ?', [id]);
      if (!existingVillage) {
        return res.status(404).json({ message: 'Köy bulunamadı' });
      }
      
      // Check if district exists
      const district = await db.get('SELECT * FROM districts WHERE id = ?', [district_id]);
      if (!district) {
        return res.status(400).json({ message: 'Seçilen ilçe bulunamadı' });
      }
      
      // Check if town exists (if provided)
      if (town_id) {
        const town = await db.get('SELECT * FROM towns WHERE id = ? AND district_id = ?', [town_id, district_id]);
        if (!town) {
          return res.status(400).json({ message: 'Seçilen belde bu ilçede bulunamadı' });
        }
      }
      
      // Check if new name already exists
      const duplicateVillage = await db.get(
        'SELECT * FROM villages WHERE name = ? AND district_id = ? AND (town_id = ? OR (town_id IS NULL AND ? IS NULL)) AND id != ?', 
        [name.trim(), district_id, town_id, town_id, id]
      );
      if (duplicateVillage) {
        return res.status(400).json({ message: 'Bu köy adı zaten kullanılıyor' });
      }
      
      await db.run('UPDATE villages SET name = ?, district_id = ?, town_id = ? WHERE id = ?', [name.trim(), district_id, town_id || null, id]);
      const updatedVillage = await db.get(`
        SELECT v.*, d.name as district_name, t.name as town_name 
        FROM villages v 
        LEFT JOIN districts d ON v.district_id = d.id 
        LEFT JOIN towns t ON v.town_id = t.id 
        WHERE v.id = ?
      `, [id]);
      
      // Update in-memory collection
      const index = collections.villages.findIndex(v => v.id === parseInt(id));
      if (index !== -1) {
        collections.villages[index] = updatedVillage;
      }
      
      res.json(updatedVillage);
    } catch (error) {
      console.error('Error updating village:', error);
      res.status(500).json({ message: 'Sunucu hatası', error: error.message });
    }
  }

  // Delete village
  static async delete(req, res) {
    try {
      const { id } = req.params;
      
      // Check if village exists
      const existingVillage = await db.get('SELECT * FROM villages WHERE id = ?', [id]);
      if (!existingVillage) {
        return res.status(404).json({ message: 'Köy bulunamadı' });
      }
      
      await db.run('DELETE FROM villages WHERE id = ?', [id]);
      
      // Update in-memory collection
      const index = collections.villages.findIndex(v => v.id === parseInt(id));
      if (index !== -1) {
        collections.villages.splice(index, 1);
      }
      
      res.json({ message: 'Köy başarıyla silindi' });
    } catch (error) {
      console.error('Error deleting village:', error);
      res.status(500).json({ message: 'Sunucu hatası', error: error.message });
    }
  }
}

module.exports = VillageController;
