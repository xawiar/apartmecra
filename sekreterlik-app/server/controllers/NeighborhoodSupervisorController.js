const db = require('../config/database');

class NeighborhoodSupervisorController {
  // Get all neighborhood supervisors with location info
  static async getAll(req, res) {
    try {
      const supervisors = await db.all(`
        SELECT ns.*, 
               n.name as neighborhood_name,
               d.name as district_name,
               t.name as town_name,
               m.name as member_name
        FROM neighborhood_supervisors ns 
        LEFT JOIN neighborhoods n ON ns.neighborhood_id = n.id 
        LEFT JOIN districts d ON n.district_id = d.id 
        LEFT JOIN towns t ON n.town_id = t.id 
        LEFT JOIN members m ON ns.member_id = m.id 
        ORDER BY d.name, t.name, n.name, ns.name
      `);
      res.json(supervisors);
    } catch (error) {
      console.error('Error getting neighborhood supervisors:', error);
      res.status(500).json({ message: 'Sunucu hatası', error: error.message });
    }
  }

  // Get supervisors by neighborhood
  static async getByNeighborhood(req, res) {
    try {
      const { neighborhoodId } = req.params;
      const supervisors = await db.all(`
        SELECT ns.*, 
               n.name as neighborhood_name,
               d.name as district_name,
               t.name as town_name,
               m.name as member_name
        FROM neighborhood_supervisors ns 
        LEFT JOIN neighborhoods n ON ns.neighborhood_id = n.id 
        LEFT JOIN districts d ON n.district_id = d.id 
        LEFT JOIN towns t ON n.town_id = t.id 
        LEFT JOIN members m ON ns.member_id = m.id 
        WHERE ns.neighborhood_id = ?
        ORDER BY ns.name
      `, [neighborhoodId]);
      res.json(supervisors);
    } catch (error) {
      console.error('Error getting supervisors by neighborhood:', error);
      res.status(500).json({ message: 'Sunucu hatası', error: error.message });
    }
  }

  // Create new neighborhood supervisor
  static async create(req, res) {
    try {
      const { name, tc, phone, neighborhood_id, member_id } = req.body;
      
      if (!name || name.trim() === '') {
        return res.status(400).json({ message: 'Sorumlu adı gereklidir' });
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
      const existingSupervisor = await db.get('SELECT * FROM neighborhood_supervisors WHERE tc = ?', [tc.trim()]);
      if (existingSupervisor) {
        return res.status(400).json({ message: 'Bu TC kimlik numarası zaten kayıtlı' });
      }
      
      const result = await db.run(
        'INSERT INTO neighborhood_supervisors (name, tc, phone, neighborhood_id, member_id) VALUES (?, ?, ?, ?, ?)', 
        [name.trim(), tc.trim(), phone?.trim() || null, neighborhood_id, member_id || null]
      );
      
      const newSupervisor = await db.get(`
        SELECT ns.*, 
               n.name as neighborhood_name,
               d.name as district_name,
               t.name as town_name,
               m.name as member_name
        FROM neighborhood_supervisors ns 
        LEFT JOIN neighborhoods n ON ns.neighborhood_id = n.id 
        LEFT JOIN districts d ON n.district_id = d.id 
        LEFT JOIN towns t ON n.town_id = t.id 
        LEFT JOIN members m ON ns.member_id = m.id 
        WHERE ns.id = ?
      `, [result.lastID]);
      
      res.status(201).json(newSupervisor);
    } catch (error) {
      console.error('Error creating neighborhood supervisor:', error);
      res.status(500).json({ message: 'Sunucu hatası', error: error.message });
    }
  }

  // Update neighborhood supervisor
  static async update(req, res) {
    try {
      const { id } = req.params;
      const { name, tc, phone, neighborhood_id, member_id } = req.body;
      
      if (!name || name.trim() === '') {
        return res.status(400).json({ message: 'Sorumlu adı gereklidir' });
      }
      
      if (!tc || tc.trim() === '') {
        return res.status(400).json({ message: 'TC kimlik numarası gereklidir' });
      }
      
      if (!neighborhood_id) {
        return res.status(400).json({ message: 'Mahalle seçimi gereklidir' });
      }
      
      // Check if supervisor exists
      const existingSupervisor = await db.get('SELECT * FROM neighborhood_supervisors WHERE id = ?', [id]);
      if (!existingSupervisor) {
        return res.status(404).json({ message: 'Sorumlu bulunamadı' });
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
      const duplicateSupervisor = await db.get('SELECT * FROM neighborhood_supervisors WHERE tc = ? AND id != ?', [tc.trim(), id]);
      if (duplicateSupervisor) {
        return res.status(400).json({ message: 'Bu TC kimlik numarası zaten kullanılıyor' });
      }
      
      await db.run(
        'UPDATE neighborhood_supervisors SET name = ?, tc = ?, phone = ?, neighborhood_id = ?, member_id = ? WHERE id = ?', 
        [name.trim(), tc.trim(), phone?.trim() || null, neighborhood_id, member_id || null, id]
      );
      
      const updatedSupervisor = await db.get(`
        SELECT ns.*, 
               n.name as neighborhood_name,
               d.name as district_name,
               t.name as town_name,
               m.name as member_name
        FROM neighborhood_supervisors ns 
        LEFT JOIN neighborhoods n ON ns.neighborhood_id = n.id 
        LEFT JOIN districts d ON n.district_id = d.id 
        LEFT JOIN towns t ON n.town_id = t.id 
        LEFT JOIN members m ON ns.member_id = m.id 
        WHERE ns.id = ?
      `, [id]);
      
      res.json(updatedSupervisor);
    } catch (error) {
      console.error('Error updating neighborhood supervisor:', error);
      res.status(500).json({ message: 'Sunucu hatası', error: error.message });
    }
  }

  // Delete neighborhood supervisor
  static async delete(req, res) {
    try {
      const { id } = req.params;
      
      // Check if supervisor exists
      const existingSupervisor = await db.get('SELECT * FROM neighborhood_supervisors WHERE id = ?', [id]);
      if (!existingSupervisor) {
        return res.status(404).json({ message: 'Sorumlu bulunamadı' });
      }
      
      await db.run('DELETE FROM neighborhood_supervisors WHERE id = ?', [id]);
      
      res.json({ message: 'Mahalle sorumlusu başarıyla silindi' });
    } catch (error) {
      console.error('Error deleting neighborhood supervisor:', error);
      res.status(500).json({ message: 'Sunucu hatası', error: error.message });
    }
  }
}

module.exports = NeighborhoodSupervisorController;
