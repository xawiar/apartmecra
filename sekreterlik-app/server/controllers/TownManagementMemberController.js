const { collections } = require('../config/database');
const db = require('../config/database');

class TownManagementMemberController {
  static async getAll(req, res) {
    try {
      const members = await db.all('SELECT * FROM town_management_members ORDER BY created_at DESC');
      res.json(members);
    } catch (error) {
      console.error('Error fetching town management members:', error);
      res.status(500).json({ message: 'Sunucu hatası', error: error.message });
    }
  }

  static async getByTown(req, res) {
    try {
      const { townId } = req.params;
      const members = await db.all(
        'SELECT * FROM town_management_members WHERE town_id = ? ORDER BY created_at DESC',
        [townId]
      );
      res.json(members);
    } catch (error) {
      console.error('Error fetching town management members by town:', error);
      res.status(500).json({ message: 'Sunucu hatası', error: error.message });
    }
  }

  static async getById(req, res) {
    try {
      const { id } = req.params;
      const member = await db.get('SELECT * FROM town_management_members WHERE id = ?', [id]);
      
      if (!member) {
        return res.status(404).json({ message: 'Üye bulunamadı' });
      }
      
      res.json(member);
    } catch (error) {
      console.error('Error fetching town management member:', error);
      res.status(500).json({ message: 'Sunucu hatası', error: error.message });
    }
  }

  static async create(req, res) {
    try {
      const { town_id, tc, name, region, position, phone, email, address, notes } = req.body;

      // Validation
      const errors = [];
      if (!town_id) errors.push('Belde ID zorunludur');
      if (!tc) errors.push('TC kimlik numarası zorunludur');
      if (!name) errors.push('Ad soyad zorunludur');
      if (!phone) errors.push('Telefon numarası zorunludur');
      
      if (tc && tc.length !== 11) {
        errors.push('TC kimlik numarası 11 haneli olmalıdır');
      }

      if (errors.length > 0) {
        return res.status(400).json({ message: 'Doğrulama hatası', errors });
      }

      // Check if TC already exists
      const existingMember = await db.get('SELECT * FROM town_management_members WHERE tc = ?', [tc]);
      if (existingMember) {
        return res.status(400).json({ message: 'Bu TC kimlik numarası zaten kayıtlı' });
      }

      const sql = `INSERT INTO town_management_members 
                   (town_id, tc, name, region, position, phone, email, address, notes) 
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
      
      const result = await db.run(sql, [town_id, tc, name, region, position, phone, email, address, notes]);
      
      // Update in-memory collection
      const newMember = {
        id: result.lastID,
        town_id,
        tc,
        name,
        region,
        position,
        phone,
        email,
        address,
        notes,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      collections.town_management_members.push(newMember);
      
      res.status(201).json({ message: 'Üye başarıyla eklendi', member: newMember });
    } catch (error) {
      console.error('Error creating town management member:', error);
      res.status(500).json({ message: 'Sunucu hatası', error: error.message });
    }
  }

  static async update(req, res) {
    try {
      const { id } = req.params;
      const { tc, name, region, position, phone, email, address, notes } = req.body;

      // Validation
      const errors = [];
      if (!tc) errors.push('TC kimlik numarası zorunludur');
      if (!name) errors.push('Ad soyad zorunludur');
      if (!phone) errors.push('Telefon numarası zorunludur');
      
      if (tc && tc.length !== 11) {
        errors.push('TC kimlik numarası 11 haneli olmalıdır');
      }

      if (errors.length > 0) {
        return res.status(400).json({ message: 'Doğrulama hatası', errors });
      }

      // Check if TC already exists for another member
      const existingMember = await db.get('SELECT * FROM town_management_members WHERE tc = ? AND id != ?', [tc, id]);
      if (existingMember) {
        return res.status(400).json({ message: 'Bu TC kimlik numarası başka bir üyede kayıtlı' });
      }

      const sql = `UPDATE town_management_members 
                   SET tc = ?, name = ?, region = ?, position = ?, phone = ?, email = ?, address = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
                   WHERE id = ?`;
      
      await db.run(sql, [tc, name, region, position, phone, email, address, notes, id]);
      
      // Update in-memory collection
      const memberIndex = collections.town_management_members.findIndex(m => m.id === parseInt(id));
      if (memberIndex !== -1) {
        collections.town_management_members[memberIndex] = {
          ...collections.town_management_members[memberIndex],
          tc,
          name,
          region,
          position,
          phone,
          email,
          address,
          notes,
          updated_at: new Date().toISOString()
        };
      }
      
      res.json({ message: 'Üye başarıyla güncellendi' });
    } catch (error) {
      console.error('Error updating town management member:', error);
      res.status(500).json({ message: 'Sunucu hatası', error: error.message });
    }
  }

  static async delete(req, res) {
    try {
      const { id } = req.params;
      
      const sql = 'DELETE FROM town_management_members WHERE id = ?';
      await db.run(sql, [id]);
      
      // Update in-memory collection
      const memberIndex = collections.town_management_members.findIndex(m => m.id === parseInt(id));
      if (memberIndex !== -1) {
        collections.town_management_members.splice(memberIndex, 1);
      }
      
      res.json({ message: 'Üye başarıyla silindi' });
    } catch (error) {
      console.error('Error deleting town management member:', error);
      res.status(500).json({ message: 'Sunucu hatası', error: error.message });
    }
  }
}

module.exports = TownManagementMemberController;
