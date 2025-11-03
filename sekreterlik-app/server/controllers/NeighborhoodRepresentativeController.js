const db = require('../config/database');

class NeighborhoodRepresentativeController {
  // Get all neighborhood representatives with location info
  static async getAll(req, res) {
    try {
      const representatives = await db.all(`
        SELECT nr.*, 
               n.name as neighborhood_name,
               d.name as district_name,
               t.name as town_name,
               m.name as member_name
        FROM neighborhood_representatives nr 
        LEFT JOIN neighborhoods n ON nr.neighborhood_id = n.id 
        LEFT JOIN districts d ON n.district_id = d.id 
        LEFT JOIN towns t ON n.town_id = t.id 
        LEFT JOIN members m ON nr.member_id = m.id 
        ORDER BY d.name, t.name, n.name, nr.name
      `);
      res.json(representatives);
    } catch (error) {
      console.error('Error getting neighborhood representatives:', error);
      res.status(500).json({ message: 'Sunucu hatası', error: error.message });
    }
  }

  // Get representatives by neighborhood
  static async getByNeighborhood(req, res) {
    try {
      const { neighborhoodId } = req.params;
      const representatives = await db.all(`
        SELECT nr.*, 
               n.name as neighborhood_name,
               d.name as district_name,
               t.name as town_name,
               m.name as member_name
        FROM neighborhood_representatives nr 
        LEFT JOIN neighborhoods n ON nr.neighborhood_id = n.id 
        LEFT JOIN districts d ON n.district_id = d.id 
        LEFT JOIN towns t ON n.town_id = t.id 
        LEFT JOIN members m ON nr.member_id = m.id 
        WHERE nr.neighborhood_id = ?
        ORDER BY nr.name
      `, [neighborhoodId]);
      res.json(representatives);
    } catch (error) {
      console.error('Error getting representatives by neighborhood:', error);
      res.status(500).json({ message: 'Sunucu hatası', error: error.message });
    }
  }

  // Create new neighborhood representative
  static async create(req, res) {
    try {
      const { name, tc, phone, neighborhood_id, member_id } = req.body;
      
      if (!name || name.trim() === '') {
        return res.status(400).json({ message: 'Temsilci adı gereklidir' });
      }
      
      if (!tc || tc.trim() === '') {
        return res.status(400).json({ message: 'TC kimlik numarası gereklidir' });
      }
      
      if (!neighborhood_id) {
        return res.status(400).json({ message: 'Mahalle seçimi gereklidir' });
      }
      
      // Check if neighborhood exists
      const neighborhood = await db.get('SELECT * FROM neighborhoods WHERE id = ?', [neighborhood_id]);
      if (!neighborhood) {
        return res.status(400).json({ message: 'Seçilen mahalle bulunamadı' });
      }
      
      // Check if member exists (if provided)
      if (member_id) {
        const member = await db.get('SELECT * FROM members WHERE id = ?', [member_id]);
        if (!member) {
          return res.status(400).json({ message: 'Seçilen üye bulunamadı' });
        }
      }
      
      // Check if TC already exists
      const existingRepresentative = await db.get('SELECT * FROM neighborhood_representatives WHERE tc = ?', [tc.trim()]);
      if (existingRepresentative) {
        return res.status(400).json({ message: 'Bu TC kimlik numarası zaten kayıtlı' });
      }
      
      const result = await db.run(
        'INSERT INTO neighborhood_representatives (name, tc, phone, neighborhood_id, member_id) VALUES (?, ?, ?, ?, ?)', 
        [name.trim(), tc.trim(), phone?.trim() || null, neighborhood_id, member_id || null]
      );
      
      const newRepresentative = await db.get(`
        SELECT nr.*, 
               n.name as neighborhood_name,
               d.name as district_name,
               t.name as town_name,
               m.name as member_name
        FROM neighborhood_representatives nr 
        LEFT JOIN neighborhoods n ON nr.neighborhood_id = n.id 
        LEFT JOIN districts d ON n.district_id = d.id 
        LEFT JOIN towns t ON n.town_id = t.id 
        LEFT JOIN members m ON nr.member_id = m.id 
        WHERE nr.id = ?
      `, [result.lastID]);
      
      res.status(201).json(newRepresentative);
    } catch (error) {
      console.error('Error creating neighborhood representative:', error);
      res.status(500).json({ message: 'Sunucu hatası', error: error.message });
    }
  }

  // Update neighborhood representative
  static async update(req, res) {
    try {
      const { id } = req.params;
      const { name, tc, phone, neighborhood_id, member_id } = req.body;
      
      if (!name || name.trim() === '') {
        return res.status(400).json({ message: 'Temsilci adı gereklidir' });
      }
      
      if (!tc || tc.trim() === '') {
        return res.status(400).json({ message: 'TC kimlik numarası gereklidir' });
      }
      
      if (!neighborhood_id) {
        return res.status(400).json({ message: 'Mahalle seçimi gereklidir' });
      }
      
      // Check if representative exists
      const existingRepresentative = await db.get('SELECT * FROM neighborhood_representatives WHERE id = ?', [id]);
      if (!existingRepresentative) {
        return res.status(404).json({ message: 'Temsilci bulunamadı' });
      }
      
      // Check if neighborhood exists
      const neighborhood = await db.get('SELECT * FROM neighborhoods WHERE id = ?', [neighborhood_id]);
      if (!neighborhood) {
        return res.status(400).json({ message: 'Seçilen mahalle bulunamadı' });
      }
      
      // Check if member exists (if provided)
      if (member_id) {
        const member = await db.get('SELECT * FROM members WHERE id = ?', [member_id]);
        if (!member) {
          return res.status(400).json({ message: 'Seçilen üye bulunamadı' });
        }
      }
      
      // Check if TC already exists (excluding current record)
      const duplicateRepresentative = await db.get('SELECT * FROM neighborhood_representatives WHERE tc = ? AND id != ?', [tc.trim(), id]);
      if (duplicateRepresentative) {
        return res.status(400).json({ message: 'Bu TC kimlik numarası zaten kullanılıyor' });
      }
      
      await db.run(
        'UPDATE neighborhood_representatives SET name = ?, tc = ?, phone = ?, neighborhood_id = ?, member_id = ? WHERE id = ?', 
        [name.trim(), tc.trim(), phone?.trim() || null, neighborhood_id, member_id || null, id]
      );
      
      const updatedRepresentative = await db.get(`
        SELECT nr.*, 
               n.name as neighborhood_name,
               d.name as district_name,
               t.name as town_name,
               m.name as member_name
        FROM neighborhood_representatives nr 
        LEFT JOIN neighborhoods n ON nr.neighborhood_id = n.id 
        LEFT JOIN districts d ON n.district_id = d.id 
        LEFT JOIN towns t ON n.town_id = t.id 
        LEFT JOIN members m ON nr.member_id = m.id 
        WHERE nr.id = ?
      `, [id]);
      
      res.json(updatedRepresentative);
    } catch (error) {
      console.error('Error updating neighborhood representative:', error);
      res.status(500).json({ message: 'Sunucu hatası', error: error.message });
    }
  }

  // Delete neighborhood representative
  static async delete(req, res) {
    try {
      const { id } = req.params;
      
      // Check if representative exists
      const existingRepresentative = await db.get('SELECT * FROM neighborhood_representatives WHERE id = ?', [id]);
      if (!existingRepresentative) {
        return res.status(404).json({ message: 'Temsilci bulunamadı' });
      }
      
      await db.run('DELETE FROM neighborhood_representatives WHERE id = ?', [id]);
      
      res.json({ message: 'Mahalle temsilcisi başarıyla silindi' });
    } catch (error) {
      console.error('Error deleting neighborhood representative:', error);
      res.status(500).json({ message: 'Sunucu hatası', error: error.message });
    }
  }
}

module.exports = NeighborhoodRepresentativeController;
