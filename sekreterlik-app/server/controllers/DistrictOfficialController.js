const db = require('../config/database');

class DistrictOfficialController {
  // Get all district officials
  static async getAll(req, res) {
    try {
      const officials = await db.all(`
        SELECT do.*, 
               d.name as district_name,
               chairman_member.name as chairman_member_name,
               inspector_member.name as inspector_member_name
        FROM district_officials do 
        LEFT JOIN districts d ON do.district_id = d.id 
        LEFT JOIN members chairman_member ON do.chairman_member_id = chairman_member.id 
        LEFT JOIN members inspector_member ON do.inspector_member_id = inspector_member.id 
        ORDER BY d.name
      `);
      res.json(officials);
    } catch (error) {
      console.error('Error getting district officials:', error);
      res.status(500).json({ message: 'Sunucu hatası', error: error.message });
    }
  }

  // Get officials by district
  static async getByDistrict(req, res) {
    try {
      const { districtId } = req.params;
      const officials = await db.all(`
        SELECT do.*, 
               d.name as district_name,
               chairman_member.name as chairman_member_name,
               inspector_member.name as inspector_member_name
        FROM district_officials do 
        LEFT JOIN districts d ON do.district_id = d.id 
        LEFT JOIN members chairman_member ON do.chairman_member_id = chairman_member.id 
        LEFT JOIN members inspector_member ON do.inspector_member_id = inspector_member.id 
        WHERE do.district_id = ?
      `, [districtId]);
      res.json(officials);
    } catch (error) {
      console.error('Error getting officials by district:', error);
      res.status(500).json({ message: 'Sunucu hatası', error: error.message });
    }
  }

  // Create or update district officials
  static async createOrUpdate(req, res) {
    try {
      const { 
        district_id, 
        chairman_name, 
        chairman_phone, 
        chairman_member_id,
        inspector_name, 
        inspector_phone, 
        inspector_member_id
      } = req.body;
      
      if (!district_id) {
        return res.status(400).json({ message: 'İlçe seçimi gereklidir' });
      }
      
      // Check if district exists
      const district = await db.get('SELECT * FROM districts WHERE id = ?', [district_id]);
      if (!district) {
        return res.status(400).json({ message: 'Seçilen ilçe bulunamadı' });
      }
      
      // Check if members exist (if provided)
      if (chairman_member_id) {
        const member = await db.get('SELECT * FROM members WHERE id = ?', [chairman_member_id]);
        if (!member) {
          return res.status(400).json({ message: 'Seçilen başkan üyesi bulunamadı' });
        }
      }
      
      if (inspector_member_id) {
        const member = await db.get('SELECT * FROM members WHERE id = ?', [inspector_member_id]);
        if (!member) {
          return res.status(400).json({ message: 'Seçilen müfettiş üyesi bulunamadı' });
        }
      }
      
      
      // Check if officials already exist for this district
      const existingOfficials = await db.get('SELECT * FROM district_officials WHERE district_id = ?', [district_id]);
      
      if (existingOfficials) {
        // Update existing officials
        await db.run(`
          UPDATE district_officials SET 
            chairman_name = ?, 
            chairman_phone = ?, 
            chairman_member_id = ?,
            inspector_name = ?, 
            inspector_phone = ?, 
            inspector_member_id = ?,
            updated_at = CURRENT_TIMESTAMP
          WHERE district_id = ?
        `, [
          chairman_name?.trim() || null,
          chairman_phone?.trim() || null,
          chairman_member_id || null,
          inspector_name?.trim() || null,
          inspector_phone?.trim() || null,
          inspector_member_id || null,
          district_id
        ]);
      } else {
        // Create new officials
        await db.run(`
          INSERT INTO district_officials (
            district_id, 
            chairman_name, 
            chairman_phone, 
            chairman_member_id,
            inspector_name, 
            inspector_phone, 
            inspector_member_id
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
          district_id,
          chairman_name?.trim() || null,
          chairman_phone?.trim() || null,
          chairman_member_id || null,
          inspector_name?.trim() || null,
          inspector_phone?.trim() || null,
          inspector_member_id || null
        ]);
      }
      
      // Get updated officials
      const updatedOfficials = await db.get(`
        SELECT do.*, 
               d.name as district_name,
               chairman_member.name as chairman_member_name,
               inspector_member.name as inspector_member_name
        FROM district_officials do 
        LEFT JOIN districts d ON do.district_id = d.id 
        LEFT JOIN members chairman_member ON do.chairman_member_id = chairman_member.id 
        LEFT JOIN members inspector_member ON do.inspector_member_id = inspector_member.id 
        WHERE do.district_id = ?
      `, [district_id]);
      
      res.json(updatedOfficials);
    } catch (error) {
      console.error('Error creating/updating district officials:', error);
      res.status(500).json({ message: 'Sunucu hatası', error: error.message });
    }
  }

  // Delete district officials
  static async delete(req, res) {
    try {
      const { districtId } = req.params;
      
      // Check if officials exist
      const existingOfficials = await db.get('SELECT * FROM district_officials WHERE district_id = ?', [districtId]);
      if (!existingOfficials) {
        return res.status(404).json({ message: 'İlçe yöneticileri bulunamadı' });
      }
      
      await db.run('DELETE FROM district_officials WHERE district_id = ?', [districtId]);
      
      res.json({ message: 'İlçe yöneticileri başarıyla silindi' });
    } catch (error) {
      console.error('Error deleting district officials:', error);
      res.status(500).json({ message: 'Sunucu hatası', error: error.message });
    }
  }
}

module.exports = DistrictOfficialController;
