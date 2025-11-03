const db = require('../config/database');

class VillageSupervisorController {
  // Get all village supervisors with location info
  static async getAll(req, res) {
    try {
      const supervisors = await db.all(`
        SELECT vs.*, 
               v.name as village_name,
               d.name as district_name,
               t.name as town_name,
               m.name as member_name
        FROM village_supervisors vs 
        LEFT JOIN villages v ON vs.village_id = v.id 
        LEFT JOIN districts d ON v.district_id = d.id 
        LEFT JOIN towns t ON v.town_id = t.id 
        LEFT JOIN members m ON vs.member_id = m.id 
        ORDER BY d.name, t.name, v.name, vs.name
      `);
      res.json(supervisors);
    } catch (error) {
      console.error('Error getting village supervisors:', error);
      res.status(500).json({ message: 'Sunucu hatası', error: error.message });
    }
  }

  // Get supervisors by village
  static async getByVillage(req, res) {
    try {
      const { villageId } = req.params;
      const supervisors = await db.all(`
        SELECT vs.*, 
               v.name as village_name,
               d.name as district_name,
               t.name as town_name,
               m.name as member_name
        FROM village_supervisors vs 
        LEFT JOIN villages v ON vs.village_id = v.id 
        LEFT JOIN districts d ON v.district_id = d.id 
        LEFT JOIN towns t ON v.town_id = t.id 
        LEFT JOIN members m ON vs.member_id = m.id 
        WHERE vs.village_id = ?
        ORDER BY vs.name
      `, [villageId]);
      res.json(supervisors);
    } catch (error) {
      console.error('Error getting supervisors by village:', error);
      res.status(500).json({ message: 'Sunucu hatası', error: error.message });
    }
  }

  // Create new village supervisor
  static async create(req, res) {
    try {
      const { name, tc, phone, village_id, member_id } = req.body;
      
      if (!name || name.trim() === '') {
        return res.status(400).json({ message: 'Sorumlu adı gereklidir' });
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
      const existingSupervisor = await db.get('SELECT * FROM village_supervisors WHERE tc = ?', [tc.trim()]);
      if (existingSupervisor) {
        return res.status(400).json({ message: 'Bu TC kimlik numarası zaten kayıtlı' });
      }
      
      const result = await db.run(
        'INSERT INTO village_supervisors (name, tc, phone, village_id, member_id) VALUES (?, ?, ?, ?, ?)', 
        [name.trim(), tc.trim(), phone?.trim() || null, village_id, member_id || null]
      );
      
      const newSupervisor = await db.get(`
        SELECT vs.*, 
               v.name as village_name,
               d.name as district_name,
               t.name as town_name,
               m.name as member_name
        FROM village_supervisors vs 
        LEFT JOIN villages v ON vs.village_id = v.id 
        LEFT JOIN districts d ON v.district_id = d.id 
        LEFT JOIN towns t ON v.town_id = t.id 
        LEFT JOIN members m ON vs.member_id = m.id 
        WHERE vs.id = ?
      `, [result.lastID]);
      
      res.status(201).json(newSupervisor);
    } catch (error) {
      console.error('Error creating village supervisor:', error);
      res.status(500).json({ message: 'Sunucu hatası', error: error.message });
    }
  }

  // Update village supervisor
  static async update(req, res) {
    try {
      const { id } = req.params;
      const { name, tc, phone, village_id, member_id } = req.body;
      
      if (!name || name.trim() === '') {
        return res.status(400).json({ message: 'Sorumlu adı gereklidir' });
      }
      
      if (!tc || tc.trim() === '') {
        return res.status(400).json({ message: 'TC kimlik numarası gereklidir' });
      }
      
      if (!village_id) {
        return res.status(400).json({ message: 'Köy seçimi gereklidir' });
      }
      
      // Check if supervisor exists
      const existingSupervisor = await db.get('SELECT * FROM village_supervisors WHERE id = ?', [id]);
      if (!existingSupervisor) {
        return res.status(404).json({ message: 'Sorumlu bulunamadı' });
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
      const duplicateSupervisor = await db.get('SELECT * FROM village_supervisors WHERE tc = ? AND id != ?', [tc.trim(), id]);
      if (duplicateSupervisor) {
        return res.status(400).json({ message: 'Bu TC kimlik numarası zaten kullanılıyor' });
      }
      
      await db.run(
        'UPDATE village_supervisors SET name = ?, tc = ?, phone = ?, village_id = ?, member_id = ? WHERE id = ?', 
        [name.trim(), tc.trim(), phone?.trim() || null, village_id, member_id || null, id]
      );
      
      const updatedSupervisor = await db.get(`
        SELECT vs.*, 
               v.name as village_name,
               d.name as district_name,
               t.name as town_name,
               m.name as member_name
        FROM village_supervisors vs 
        LEFT JOIN villages v ON vs.village_id = v.id 
        LEFT JOIN districts d ON v.district_id = d.id 
        LEFT JOIN towns t ON v.town_id = t.id 
        LEFT JOIN members m ON vs.member_id = m.id 
        WHERE vs.id = ?
      `, [id]);
      
      res.json(updatedSupervisor);
    } catch (error) {
      console.error('Error updating village supervisor:', error);
      res.status(500).json({ message: 'Sunucu hatası', error: error.message });
    }
  }

  // Delete village supervisor
  static async delete(req, res) {
    try {
      const { id } = req.params;
      
      // Check if supervisor exists
      const existingSupervisor = await db.get('SELECT * FROM village_supervisors WHERE id = ?', [id]);
      if (!existingSupervisor) {
        return res.status(404).json({ message: 'Sorumlu bulunamadı' });
      }
      
      await db.run('DELETE FROM village_supervisors WHERE id = ?', [id]);
      
      res.json({ message: 'Köy sorumlusu başarıyla silindi' });
    } catch (error) {
      console.error('Error deleting village supervisor:', error);
      res.status(500).json({ message: 'Sunucu hatası', error: error.message });
    }
  }
}

module.exports = VillageSupervisorController;
