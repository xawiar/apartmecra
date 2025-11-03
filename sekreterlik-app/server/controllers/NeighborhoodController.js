const db = require('../config/database');
const { collections } = require('../config/database');

class NeighborhoodController {
  // Get all neighborhoods with district and town info
  static async getAll(req, res) {
    try {
      const neighborhoods = await db.all(`
        SELECT n.*, d.name as district_name, t.name as town_name 
        FROM neighborhoods n 
        LEFT JOIN districts d ON n.district_id = d.id 
        LEFT JOIN towns t ON n.town_id = t.id 
        ORDER BY d.name, t.name, n.name
      `);
      res.json(neighborhoods);
    } catch (error) {
      console.error('Error getting neighborhoods:', error);
      res.status(500).json({ message: 'Sunucu hatası', error: error.message });
    }
  }

  // Get neighborhoods by district
  static async getByDistrict(req, res) {
    try {
      const { districtId } = req.params;
      const neighborhoods = await db.all(`
        SELECT n.*, d.name as district_name, t.name as town_name 
        FROM neighborhoods n 
        LEFT JOIN districts d ON n.district_id = d.id 
        LEFT JOIN towns t ON n.town_id = t.id 
        WHERE n.district_id = ?
        ORDER BY t.name, n.name
      `, [districtId]);
      res.json(neighborhoods);
    } catch (error) {
      console.error('Error getting neighborhoods by district:', error);
      res.status(500).json({ message: 'Sunucu hatası', error: error.message });
    }
  }

  // Create new neighborhood
  static async create(req, res) {
    try {
      const { name, district_id, town_id } = req.body;
      
      if (!name || name.trim() === '') {
        return res.status(400).json({ message: 'Mahalle adı gereklidir' });
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
      
      // Check if neighborhood already exists
      const existingNeighborhood = await db.get(
        'SELECT * FROM neighborhoods WHERE name = ? AND district_id = ? AND (town_id = ? OR (town_id IS NULL AND ? IS NULL))', 
        [name.trim(), district_id, town_id, town_id]
      );
      if (existingNeighborhood) {
        return res.status(400).json({ message: 'Bu mahalle zaten kayıtlı' });
      }
      
      const result = await db.run('INSERT INTO neighborhoods (name, district_id, town_id) VALUES (?, ?, ?)', [name.trim(), district_id, town_id || null]);
      const newNeighborhood = await db.get(`
        SELECT n.*, d.name as district_name, t.name as town_name 
        FROM neighborhoods n 
        LEFT JOIN districts d ON n.district_id = d.id 
        LEFT JOIN towns t ON n.town_id = t.id 
        WHERE n.id = ?
      `, [result.lastID]);
      
      // Update in-memory collection
      collections.neighborhoods.push(newNeighborhood);
      
      res.status(201).json(newNeighborhood);
    } catch (error) {
      console.error('Error creating neighborhood:', error);
      res.status(500).json({ message: 'Sunucu hatası', error: error.message });
    }
  }

  // Update neighborhood
  static async update(req, res) {
    try {
      const { id } = req.params;
      const { name, district_id, town_id } = req.body;
      
      if (!name || name.trim() === '') {
        return res.status(400).json({ message: 'Mahalle adı gereklidir' });
      }
      
      if (!district_id) {
        return res.status(400).json({ message: 'İlçe seçimi gereklidir' });
      }
      
      // Check if neighborhood exists
      const existingNeighborhood = await db.get('SELECT * FROM neighborhoods WHERE id = ?', [id]);
      if (!existingNeighborhood) {
        return res.status(404).json({ message: 'Mahalle bulunamadı' });
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
      const duplicateNeighborhood = await db.get(
        'SELECT * FROM neighborhoods WHERE name = ? AND district_id = ? AND (town_id = ? OR (town_id IS NULL AND ? IS NULL)) AND id != ?', 
        [name.trim(), district_id, town_id, town_id, id]
      );
      if (duplicateNeighborhood) {
        return res.status(400).json({ message: 'Bu mahalle adı zaten kullanılıyor' });
      }
      
      await db.run('UPDATE neighborhoods SET name = ?, district_id = ?, town_id = ? WHERE id = ?', [name.trim(), district_id, town_id || null, id]);
      const updatedNeighborhood = await db.get(`
        SELECT n.*, d.name as district_name, t.name as town_name 
        FROM neighborhoods n 
        LEFT JOIN districts d ON n.district_id = d.id 
        LEFT JOIN towns t ON n.town_id = t.id 
        WHERE n.id = ?
      `, [id]);
      
      // Update in-memory collection
      const index = collections.neighborhoods.findIndex(n => n.id === parseInt(id));
      if (index !== -1) {
        collections.neighborhoods[index] = updatedNeighborhood;
      }
      
      res.json(updatedNeighborhood);
    } catch (error) {
      console.error('Error updating neighborhood:', error);
      res.status(500).json({ message: 'Sunucu hatası', error: error.message });
    }
  }

  // Delete neighborhood
  static async delete(req, res) {
    try {
      const { id } = req.params;
      
      // Check if neighborhood exists
      const existingNeighborhood = await db.get('SELECT * FROM neighborhoods WHERE id = ?', [id]);
      if (!existingNeighborhood) {
        return res.status(404).json({ message: 'Mahalle bulunamadı' });
      }
      
      await db.run('DELETE FROM neighborhoods WHERE id = ?', [id]);
      
      // Update in-memory collection
      const index = collections.neighborhoods.findIndex(n => n.id === parseInt(id));
      if (index !== -1) {
        collections.neighborhoods.splice(index, 1);
      }
      
      res.json({ message: 'Mahalle başarıyla silindi' });
    } catch (error) {
      console.error('Error deleting neighborhood:', error);
      res.status(500).json({ message: 'Sunucu hatası', error: error.message });
    }
  }
}

module.exports = NeighborhoodController;
