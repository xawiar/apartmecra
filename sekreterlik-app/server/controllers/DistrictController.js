const db = require('../config/database');
const { collections } = require('../config/database');
const MemberUser = require('../models/MemberUser');
const { invalidate } = require('../middleware/cache');

class DistrictController {
  // Get all districts
  static async getAll(req, res) {
    try {
      const districts = await db.all('SELECT * FROM districts ORDER BY name');
      res.json(districts);
    } catch (error) {
      console.error('Error getting districts:', error);
      res.status(500).json({ message: 'Sunucu hatası', error: error.message });
    }
  }

  // Create new district
  static async create(req, res) {
    try {
      const { name } = req.body;
      
      if (!name || name.trim() === '') {
        return res.status(400).json({ message: 'İlçe adı gereklidir' });
      }
      
      // Check if district already exists
      const existingDistrict = await db.get('SELECT * FROM districts WHERE name = ?', [name.trim()]);
      if (existingDistrict) {
        return res.status(400).json({ message: 'Bu ilçe zaten kayıtlı' });
      }
      
      const result = await db.run('INSERT INTO districts (name) VALUES (?)', [name.trim()]);
      const newDistrict = await db.get('SELECT * FROM districts WHERE id = ?', [result.lastID]);
      
      // Update in-memory collection
      collections.districts.push(newDistrict);
      
      // Invalidate districts cache
      try { invalidate('/api/districts'); } catch (_) {}
      
      res.status(201).json(newDistrict);
    } catch (error) {
      console.error('Error creating district:', error);
      res.status(500).json({ message: 'Sunucu hatası', error: error.message });
    }
  }

  // Update district
  static async update(req, res) {
    try {
      const { id } = req.params;
      const { name } = req.body;
      
      if (!name || name.trim() === '') {
        return res.status(400).json({ message: 'İlçe adı gereklidir' });
      }
      
      // Check if district exists
      const existingDistrict = await db.get('SELECT * FROM districts WHERE id = ?', [id]);
      if (!existingDistrict) {
        return res.status(404).json({ message: 'İlçe bulunamadı' });
      }
      
      // Check if new name already exists
      const duplicateDistrict = await db.get('SELECT * FROM districts WHERE name = ? AND id != ?', [name.trim(), id]);
      if (duplicateDistrict) {
        return res.status(400).json({ message: 'Bu ilçe adı zaten kullanılıyor' });
      }
      
      await db.run('UPDATE districts SET name = ? WHERE id = ?', [name.trim(), id]);
      const updatedDistrict = await db.get('SELECT * FROM districts WHERE id = ?', [id]);
      
      // Update in-memory collection
      const index = collections.districts.findIndex(d => d.id === parseInt(id));
      if (index !== -1) {
        collections.districts[index] = updatedDistrict;
      }
      
      // Invalidate districts cache
      try { invalidate('/api/districts'); } catch (_) {}
      
      // Update district president user credentials if exists
      try {
        const districtUser = await MemberUser.getUserByDistrictId(id);
        if (districtUser) {
          // Get district officials to get chairman info
          const districtOfficials = await db.get('SELECT * FROM district_officials WHERE district_id = ?', [id]);
          if (districtOfficials && districtOfficials.chairman_name && districtOfficials.chairman_phone) {
            await MemberUser.updateDistrictPresidentUser(
              id, 
              name.trim(), 
              districtOfficials.chairman_name, 
              districtOfficials.chairman_phone
            );
          }
        }
      } catch (userError) {
        console.error('Error updating district president user:', userError);
        // Don't fail the main operation if user update fails
      }
      
      res.json(updatedDistrict);
    } catch (error) {
      console.error('Error updating district:', error);
      res.status(500).json({ message: 'Sunucu hatası', error: error.message });
    }
  }

  // Delete district
  static async delete(req, res) {
    try {
      const { id } = req.params;
      const numericId = parseInt(id);
      
      // Check if district exists
      const existingDistrict = await db.get('SELECT * FROM districts WHERE id = ?', [numericId]);
      if (!existingDistrict) {
        return res.status(404).json({ message: 'İlçe bulunamadı' });
      }
      
      // Check if district has dependent towns
      const dependentTowns = await db.get('SELECT COUNT(*) as count FROM towns WHERE district_id = ?', [numericId]);
      if (dependentTowns.count > 0) {
        return res.status(400).json({ message: 'Bu ilçeye bağlı beldeler var. Önce beldeleri siliniz.' });
      }
      
      await db.run('DELETE FROM districts WHERE id = ?', [numericId]);
      
      // Update in-memory collection
      const index = collections.districts.findIndex(d => d.id === parseInt(id));
      if (index !== -1) {
        collections.districts.splice(index, 1);
      }
      
      // Invalidate districts cache
      try { invalidate('/api/districts'); } catch (_) {}
      
      res.json({ message: 'İlçe başarıyla silindi' });
    } catch (error) {
      console.error('Error deleting district:', error);
      res.status(500).json({ message: 'Sunucu hatası', error: error.message });
    }
  }

  // Create or update district officials
  static async createOrUpdateDistrictOfficials(req, res) {
    try {
      const { district_id, chairman_name, chairman_phone, chairman_member_id, inspector_name, inspector_phone, inspector_member_id, deputy_inspectors } = req.body;
      
      if (!district_id) {
        return res.status(400).json({ message: 'İlçe ID gereklidir' });
      }

      // Check if district exists
      const district = await db.get('SELECT * FROM districts WHERE id = ?', [district_id]);
      if (!district) {
        return res.status(404).json({ message: 'İlçe bulunamadı' });
      }

      // Delete existing officials
      await db.run('DELETE FROM district_officials WHERE district_id = ?', [district_id]);
      await db.run('DELETE FROM district_deputy_inspectors WHERE district_id = ?', [district_id]);

      // Insert new officials
      await db.run(
        'INSERT INTO district_officials (district_id, chairman_name, chairman_phone, chairman_member_id, inspector_name, inspector_phone, inspector_member_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [district_id, chairman_name, chairman_phone, chairman_member_id, inspector_name, inspector_phone, inspector_member_id]
      );

      // Insert deputy inspectors
      if (deputy_inspectors && deputy_inspectors.length > 0) {
        for (const deputy of deputy_inspectors) {
          if (deputy.name && deputy.name.trim()) {
            await db.run(
              'INSERT INTO district_deputy_inspectors (district_id, name, phone, member_id) VALUES (?, ?, ?, ?)',
              [district_id, deputy.name, deputy.phone, deputy.member_id]
            );
          }
        }
      }

      // Update district president user credentials if chairman info is provided
      if (chairman_name && chairman_phone) {
        try {
          const districtUser = await MemberUser.getUserByDistrictId(district_id);
          if (districtUser) {
            // Check if phone number has changed by comparing with the new phone from the request
            const oldPhone = districtUser.password; // Password is stored as phone number
            const newPhone = chairman_phone.replace(/\D/g, ''); // Remove non-digits from NEW phone
            
            // Update existing user (always update to ensure username and password are current)
            await MemberUser.updateDistrictPresidentUser(
              district_id, 
              district.name, 
              chairman_name, 
              chairman_phone
            );
            
            if (oldPhone !== newPhone) {
              console.log(`District president phone updated: ${oldPhone} -> ${newPhone}`);
            }
          } else {
            // Create new user
            await MemberUser.createDistrictPresidentUser(
              district_id, 
              district.name, 
              chairman_name, 
              chairman_phone
            );
          }
        } catch (userError) {
          console.error('Error updating/creating district president user:', userError);
          // Don't fail the main operation if user update fails
        }
      }

      res.json({ message: 'İlçe yöneticileri başarıyla kaydedildi' });
    } catch (error) {
      console.error('Error creating/updating district officials:', error);
      res.status(500).json({ message: 'Sunucu hatası', error: error.message });
    }
  }

  // Get district deputy inspectors
  static async getDeputyInspectors(req, res) {
    try {
      const { id } = req.params;
      
      const deputyInspectors = await db.all(
        'SELECT * FROM district_deputy_inspectors WHERE district_id = ? ORDER BY created_at ASC',
        [id]
      );
      
      res.json(deputyInspectors);
    } catch (error) {
      console.error('Error fetching deputy inspectors:', error);
      res.status(500).json({ message: 'Sunucu hatası', error: error.message });
    }
  }

  // Get all district deputy inspectors
  static async getAllDeputyInspectors(req, res) {
    try {
      const deputyInspectors = await db.all(
        `SELECT ddi.*, d.name as district_name, m.name as member_name, m.phone as member_phone
         FROM district_deputy_inspectors ddi
         LEFT JOIN districts d ON ddi.district_id = d.id
         LEFT JOIN members m ON ddi.member_id = m.id
         ORDER BY d.name, ddi.created_at ASC`
      );
      
      res.json(deputyInspectors);
    } catch (error) {
      console.error('Error fetching all deputy inspectors:', error);
      res.status(500).json({ message: 'Sunucu hatası', error: error.message });
    }
  }
}

module.exports = DistrictController;
