const db = require('../config/database');

class VillageRepresentativeController {
  // Get all village representatives with location info
  static async getAll(req, res) {
    try {
      const representatives = await db.all(`
        SELECT vr.*, 
               v.name as village_name,
               d.name as district_name,
               t.name as town_name,
               m.name as member_name
        FROM village_representatives vr 
        LEFT JOIN villages v ON vr.village_id = v.id 
        LEFT JOIN districts d ON v.district_id = d.id 
        LEFT JOIN towns t ON v.town_id = t.id 
        LEFT JOIN members m ON vr.member_id = m.id 
        ORDER BY d.name, t.name, v.name, vr.name
      `);
      res.json(representatives);
    } catch (error) {
      console.error('Error getting village representatives:', error);
      res.status(500).json({ message: 'Sunucu hatası', error: error.message });
    }
  }

  // Get representatives by village
  static async getByVillage(req, res) {
    try {
      const { villageId } = req.params;
      const representatives = await db.all(`
        SELECT vr.*, 
               v.name as village_name,
               d.name as district_name,
               t.name as town_name,
               m.name as member_name
        FROM village_representatives vr 
        LEFT JOIN villages v ON vr.village_id = v.id 
        LEFT JOIN districts d ON v.district_id = d.id 
        LEFT JOIN towns t ON v.town_id = t.id 
        LEFT JOIN members m ON vr.member_id = m.id 
        WHERE vr.village_id = ?
        ORDER BY vr.name
      `, [villageId]);
      res.json(representatives);
    } catch (error) {
      console.error('Error getting representatives by village:', error);
      res.status(500).json({ message: 'Sunucu hatası', error: error.message });
    }
  }

  // Create new village representative
  static async create(req, res) {
    try {
      const { name, tc, phone, village_id, member_id } = req.body;
      
      if (!name || name.trim() === '') {
        return res.status(400).json({ message: 'Temsilci adı gereklidir' });
      }
      
      if (!tc || tc.trim() === '') {
        return res.status(400).json({ message: 'TC kimlik numarası gereklidir' });
      }
      
      if (!village_id) {
        return res.status(400).json({ message: 'Köy seçimi gereklidir' });
      }
      
      // Check if village exists
      const village = await db.get('SELECT * FROM villages WHERE id = ?', [village_id]);
      if (!village) {
        return res.status(400).json({ message: 'Seçilen köy bulunamadı' });
      }
      
      // Check if member exists (if provided)
      if (member_id) {
        const member = await db.get('SELECT * FROM members WHERE id = ?', [member_id]);
        if (!member) {
          return res.status(400).json({ message: 'Seçilen üye bulunamadı' });
        }
      }
      
      // Check if TC already exists
      const existingRepresentative = await db.get('SELECT * FROM village_representatives WHERE tc = ?', [tc.trim()]);
      if (existingRepresentative) {
        return res.status(400).json({ message: 'Bu TC kimlik numarası zaten kayıtlı' });
      }
      
      const result = await db.run(
        'INSERT INTO village_representatives (name, tc, phone, village_id, member_id) VALUES (?, ?, ?, ?, ?)', 
        [name.trim(), tc.trim(), phone?.trim() || null, village_id, member_id || null]
      );
      
      const newRepresentative = await db.get(`
        SELECT vr.*, 
               v.name as village_name,
               d.name as district_name,
               t.name as town_name,
               m.name as member_name
        FROM village_representatives vr 
        LEFT JOIN villages v ON vr.village_id = v.id 
        LEFT JOIN districts d ON v.district_id = d.id 
        LEFT JOIN towns t ON v.town_id = t.id 
        LEFT JOIN members m ON vr.member_id = m.id 
        WHERE vr.id = ?
      `, [result.lastID]);
      
      res.status(201).json(newRepresentative);
    } catch (error) {
      console.error('Error creating village representative:', error);
      res.status(500).json({ message: 'Sunucu hatası', error: error.message });
    }
  }

  // Update village representative
  static async update(req, res) {
    try {
      const { id } = req.params;
      const { name, tc, phone, village_id, member_id } = req.body;
      
      if (!name || name.trim() === '') {
        return res.status(400).json({ message: 'Temsilci adı gereklidir' });
      }
      
      if (!tc || tc.trim() === '') {
        return res.status(400).json({ message: 'TC kimlik numarası gereklidir' });
      }
      
      if (!village_id) {
        return res.status(400).json({ message: 'Köy seçimi gereklidir' });
      }
      
      // Check if representative exists
      const existingRepresentative = await db.get('SELECT * FROM village_representatives WHERE id = ?', [id]);
      if (!existingRepresentative) {
        return res.status(404).json({ message: 'Temsilci bulunamadı' });
      }
      
      // Check if village exists
      const village = await db.get('SELECT * FROM villages WHERE id = ?', [village_id]);
      if (!village) {
        return res.status(400).json({ message: 'Seçilen köy bulunamadı' });
      }
      
      // Check if member exists (if provided)
      if (member_id) {
        const member = await db.get('SELECT * FROM members WHERE id = ?', [member_id]);
        if (!member) {
          return res.status(400).json({ message: 'Seçilen üye bulunamadı' });
        }
      }
      
      // Check if TC already exists (excluding current record)
      const duplicateRepresentative = await db.get('SELECT * FROM village_representatives WHERE tc = ? AND id != ?', [tc.trim(), id]);
      if (duplicateRepresentative) {
        return res.status(400).json({ message: 'Bu TC kimlik numarası zaten kullanılıyor' });
      }
      
      await db.run(
        'UPDATE village_representatives SET name = ?, tc = ?, phone = ?, village_id = ?, member_id = ? WHERE id = ?', 
        [name.trim(), tc.trim(), phone?.trim() || null, village_id, member_id || null, id]
      );
      
      const updatedRepresentative = await db.get(`
        SELECT vr.*, 
               v.name as village_name,
               d.name as district_name,
               t.name as town_name,
               m.name as member_name
        FROM village_representatives vr 
        LEFT JOIN villages v ON vr.village_id = v.id 
        LEFT JOIN districts d ON v.district_id = d.id 
        LEFT JOIN towns t ON v.town_id = t.id 
        LEFT JOIN members m ON vr.member_id = m.id 
        WHERE vr.id = ?
      `, [id]);
      
      res.json(updatedRepresentative);
    } catch (error) {
      console.error('Error updating village representative:', error);
      res.status(500).json({ message: 'Sunucu hatası', error: error.message });
    }
  }

  // Delete village representative
  static async delete(req, res) {
    try {
      const { id } = req.params;
      
      // Check if representative exists
      const existingRepresentative = await db.get('SELECT * FROM village_representatives WHERE id = ?', [id]);
      if (!existingRepresentative) {
        return res.status(404).json({ message: 'Temsilci bulunamadı' });
      }
      
      await db.run('DELETE FROM village_representatives WHERE id = ?', [id]);
      
      res.json({ message: 'Köy temsilcisi başarıyla silindi' });
    } catch (error) {
      console.error('Error deleting village representative:', error);
      res.status(500).json({ message: 'Sunucu hatası', error: error.message });
    }
  }
}

module.exports = VillageRepresentativeController;
