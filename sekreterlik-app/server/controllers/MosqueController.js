const db = require('../config/database');

class MosqueController {
  // Get all mosques with location info
  static async getAll(req, res) {
    try {
      const mosques = await db.all(`
        SELECT m.*, 
               d.name as district_name,
               t.name as town_name,
               n.name as neighborhood_name,
               v.name as village_name
        FROM mosques m 
        LEFT JOIN districts d ON m.district_id = d.id 
        LEFT JOIN towns t ON m.town_id = t.id 
        LEFT JOIN neighborhoods n ON m.neighborhood_id = n.id 
        LEFT JOIN villages v ON m.village_id = v.id 
        ORDER BY d.name, t.name, n.name, v.name, m.name
      `);
      res.json(mosques);
    } catch (error) {
      console.error('Error getting mosques:', error);
      res.status(500).json({ message: 'Sunucu hatası', error: error.message });
    }
  }

  // Get mosques by district
  static async getByDistrict(req, res) {
    try {
      const { districtId } = req.params;
      const mosques = await db.all(`
        SELECT m.*, 
               d.name as district_name,
               t.name as town_name,
               n.name as neighborhood_name,
               v.name as village_name
        FROM mosques m 
        LEFT JOIN districts d ON m.district_id = d.id 
        LEFT JOIN towns t ON m.town_id = t.id 
        LEFT JOIN neighborhoods n ON m.neighborhood_id = n.id 
        LEFT JOIN villages v ON m.village_id = v.id 
        WHERE m.district_id = ?
        ORDER BY t.name, n.name, v.name, m.name
      `, [districtId]);
      res.json(mosques);
    } catch (error) {
      console.error('Error getting mosques by district:', error);
      res.status(500).json({ message: 'Sunucu hatası', error: error.message });
    }
  }

  // Create new mosque
  static async create(req, res) {
    try {
      const { name, district_id, town_id, neighborhood_id, village_id } = req.body;
      
      if (!name || name.trim() === '') {
        return res.status(400).json({ message: 'Cami adı gereklidir' });
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
      
      // Check if neighborhood exists (if provided)
      if (neighborhood_id) {
        const neighborhood = await db.get('SELECT * FROM neighborhoods WHERE id = ? AND district_id = ?', [neighborhood_id, district_id]);
        if (!neighborhood) {
          return res.status(400).json({ message: 'Seçilen mahalle bu ilçede bulunamadı' });
        }
      }
      
      // Check if village exists (if provided)
      if (village_id) {
        const village = await db.get('SELECT * FROM villages WHERE id = ? AND district_id = ?', [village_id, district_id]);
        if (!village) {
          return res.status(400).json({ message: 'Seçilen köy bu ilçede bulunamadı' });
        }
      }
      
      // Either neighborhood or village must be selected, but not both
      if (!neighborhood_id && !village_id) {
        return res.status(400).json({ message: 'Mahalle veya köy seçimi gereklidir' });
      }
      
      if (neighborhood_id && village_id) {
        return res.status(400).json({ message: 'Hem mahalle hem köy seçilemez' });
      }
      
      const result = await db.run(
        'INSERT INTO mosques (name, district_id, town_id, neighborhood_id, village_id) VALUES (?, ?, ?, ?, ?)', 
        [name.trim(), district_id, town_id || null, neighborhood_id || null, village_id || null]
      );
      
      const newMosque = await db.get(`
        SELECT m.*, 
               d.name as district_name,
               t.name as town_name,
               n.name as neighborhood_name,
               v.name as village_name
        FROM mosques m 
        LEFT JOIN districts d ON m.district_id = d.id 
        LEFT JOIN towns t ON m.town_id = t.id 
        LEFT JOIN neighborhoods n ON m.neighborhood_id = n.id 
        LEFT JOIN villages v ON m.village_id = v.id 
        WHERE m.id = ?
      `, [result.lastID]);
      
      res.status(201).json(newMosque);
    } catch (error) {
      console.error('Error creating mosque:', error);
      res.status(500).json({ message: 'Sunucu hatası', error: error.message });
    }
  }

  // Update mosque
  static async update(req, res) {
    try {
      const { id } = req.params;
      const { name, district_id, town_id, neighborhood_id, village_id } = req.body;
      
      if (!name || name.trim() === '') {
        return res.status(400).json({ message: 'Cami adı gereklidir' });
      }
      
      if (!district_id) {
        return res.status(400).json({ message: 'İlçe seçimi gereklidir' });
      }
      
      // Check if mosque exists
      const existingMosque = await db.get('SELECT * FROM mosques WHERE id = ?', [id]);
      if (!existingMosque) {
        return res.status(404).json({ message: 'Cami bulunamadı' });
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
      
      // Check if neighborhood exists (if provided)
      if (neighborhood_id) {
        const neighborhood = await db.get('SELECT * FROM neighborhoods WHERE id = ? AND district_id = ?', [neighborhood_id, district_id]);
        if (!neighborhood) {
          return res.status(400).json({ message: 'Seçilen mahalle bu ilçede bulunamadı' });
        }
      }
      
      // Check if village exists (if provided)
      if (village_id) {
        const village = await db.get('SELECT * FROM villages WHERE id = ? AND district_id = ?', [village_id, district_id]);
        if (!village) {
          return res.status(400).json({ message: 'Seçilen köy bu ilçede bulunamadı' });
        }
      }
      
      // Either neighborhood or village must be selected, but not both
      if (!neighborhood_id && !village_id) {
        return res.status(400).json({ message: 'Mahalle veya köy seçimi gereklidir' });
      }
      
      if (neighborhood_id && village_id) {
        return res.status(400).json({ message: 'Hem mahalle hem köy seçilemez' });
      }
      
      await db.run(
        'UPDATE mosques SET name = ?, district_id = ?, town_id = ?, neighborhood_id = ?, village_id = ? WHERE id = ?', 
        [name.trim(), district_id, town_id || null, neighborhood_id || null, village_id || null, id]
      );
      
      const updatedMosque = await db.get(`
        SELECT m.*, 
               d.name as district_name,
               t.name as town_name,
               n.name as neighborhood_name,
               v.name as village_name
        FROM mosques m 
        LEFT JOIN districts d ON m.district_id = d.id 
        LEFT JOIN towns t ON m.town_id = t.id 
        LEFT JOIN neighborhoods n ON m.neighborhood_id = n.id 
        LEFT JOIN villages v ON m.village_id = v.id 
        WHERE m.id = ?
      `, [id]);
      
      res.json(updatedMosque);
    } catch (error) {
      console.error('Error updating mosque:', error);
      res.status(500).json({ message: 'Sunucu hatası', error: error.message });
    }
  }

  // Delete mosque
  static async delete(req, res) {
    try {
      const { id } = req.params;
      
      // Check if mosque exists
      const existingMosque = await db.get('SELECT * FROM mosques WHERE id = ?', [id]);
      if (!existingMosque) {
        return res.status(404).json({ message: 'Cami bulunamadı' });
      }
      
      await db.run('DELETE FROM mosques WHERE id = ?', [id]);
      
      res.json({ message: 'Cami başarıyla silindi' });
    } catch (error) {
      console.error('Error deleting mosque:', error);
      res.status(500).json({ message: 'Sunucu hatası', error: error.message });
    }
  }
}

module.exports = MosqueController;
