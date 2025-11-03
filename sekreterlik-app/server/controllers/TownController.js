const db = require('../config/database');
const { collections } = require('../config/database');
const MemberUser = require('../models/MemberUser');
const { invalidate } = require('../middleware/cache');

class TownController {
  // Get all towns with district info and town chairman name
  static async getAll(req, res) {
    try {
      const towns = await db.all(`
        SELECT t.*, 
               d.name as district_name,
               toff.chairman_name as town_chairman_name
        FROM towns t 
        LEFT JOIN districts d ON t.district_id = d.id 
        LEFT JOIN town_officials toff ON t.id = toff.town_id
        ORDER BY d.name, t.name
      `);
      res.json(towns);
    } catch (error) {
      console.error('Error getting towns:', error);
      res.status(500).json({ message: 'Sunucu hatası', error: error.message });
    }
  }

  // Get town by ID
  static async getById(req, res) {
    try {
      const { id } = req.params;
      const town = await db.get(`
        SELECT t.*, d.name as district_name 
        FROM towns t 
        LEFT JOIN districts d ON t.district_id = d.id 
        WHERE t.id = ?
      `, [parseInt(id)]);
      
      if (!town) {
        return res.status(404).json({ message: 'Belde bulunamadı' });
      }
      
      res.json({ success: true, town });
    } catch (error) {
      console.error('Error getting town by ID:', error);
      res.status(500).json({ message: 'Sunucu hatası', error: error.message });
    }
  }

  // Get towns by district
  static async getByDistrict(req, res) {
    try {
      const { districtId } = req.params;
      const towns = await db.all(`
        SELECT t.*, d.name as district_name 
        FROM towns t 
        LEFT JOIN districts d ON t.district_id = d.id 
        WHERE t.district_id = ?
        ORDER BY t.name
      `, [districtId]);
      res.json(towns);
    } catch (error) {
      console.error('Error getting towns by district:', error);
      res.status(500).json({ message: 'Sunucu hatası', error: error.message });
    }
  }

  // Create new town
  static async create(req, res) {
    try {
      const { name, district_id } = req.body;
      
      if (!name || name.trim() === '') {
        return res.status(400).json({ message: 'Belde adı gereklidir' });
      }
      
      if (!district_id) {
        return res.status(400).json({ message: 'İlçe seçimi gereklidir' });
      }
      
      // Check if district exists
      const district = await db.get('SELECT * FROM districts WHERE id = ?', [district_id]);
      if (!district) {
        return res.status(400).json({ message: 'Seçilen ilçe bulunamadı' });
      }
      
      // Check if town already exists in this district
      const existingTown = await db.get('SELECT * FROM towns WHERE name = ? AND district_id = ?', [name.trim(), district_id]);
      if (existingTown) {
        return res.status(400).json({ message: 'Bu belde zaten bu ilçede kayıtlı' });
      }
      
      const result = await db.run('INSERT INTO towns (name, district_id) VALUES (?, ?)', [name.trim(), district_id]);
      const newTown = await db.get(`
        SELECT t.*, d.name as district_name 
        FROM towns t 
        LEFT JOIN districts d ON t.district_id = d.id 
        WHERE t.id = ?
      `, [result.lastID]);
      
      // Update in-memory collection
      collections.towns.push(newTown);
      
      // Invalidate towns cache
      try { invalidate('/api/towns'); } catch (_) {}
      
      res.status(201).json(newTown);
    } catch (error) {
      console.error('Error creating town:', error);
      res.status(500).json({ message: 'Sunucu hatası', error: error.message });
    }
  }

  // Update town
  static async update(req, res) {
    try {
      const { id } = req.params;
      const { name, district_id } = req.body;
      
      if (!name || name.trim() === '') {
        return res.status(400).json({ message: 'Belde adı gereklidir' });
      }
      
      if (!district_id) {
        return res.status(400).json({ message: 'İlçe seçimi gereklidir' });
      }
      
      // Check if town exists
      const existingTown = await db.get('SELECT * FROM towns WHERE id = ?', [id]);
      if (!existingTown) {
        return res.status(404).json({ message: 'Belde bulunamadı' });
      }
      
      // Check if district exists
      const district = await db.get('SELECT * FROM districts WHERE id = ?', [district_id]);
      if (!district) {
        return res.status(400).json({ message: 'Seçilen ilçe bulunamadı' });
      }
      
      // Check if new name already exists in this district
      const duplicateTown = await db.get('SELECT * FROM towns WHERE name = ? AND district_id = ? AND id != ?', [name.trim(), district_id, id]);
      if (duplicateTown) {
        return res.status(400).json({ message: 'Bu belde adı zaten bu ilçede kullanılıyor' });
      }
      
      await db.run('UPDATE towns SET name = ?, district_id = ? WHERE id = ?', [name.trim(), district_id, id]);
      const updatedTown = await db.get(`
        SELECT t.*, d.name as district_name 
        FROM towns t 
        LEFT JOIN districts d ON t.district_id = d.id 
        WHERE t.id = ?
      `, [id]);
      
      // Update in-memory collection
      const index = collections.towns.findIndex(t => t.id === parseInt(id));
      if (index !== -1) {
        collections.towns[index] = updatedTown;
      }
      
      // Invalidate towns cache
      try { invalidate('/api/towns'); } catch (_) {}
      
      // Update town president user credentials if exists
      try {
        const townUser = await MemberUser.getUserByTownId(id);
        if (townUser) {
          // Get town officials to get chairman info
          const townOfficials = await db.get('SELECT * FROM town_officials WHERE town_id = ?', [id]);
          if (townOfficials && townOfficials.chairman_name && townOfficials.chairman_phone) {
            await MemberUser.updateTownPresidentUser(
              id, 
              name.trim(), 
              townOfficials.chairman_name, 
              townOfficials.chairman_phone
            );
          }
        }
      } catch (userError) {
        console.error('Error updating town president user:', userError);
        // Don't fail the main operation if user update fails
      }
      
      res.json(updatedTown);
    } catch (error) {
      console.error('Error updating town:', error);
      res.status(500).json({ message: 'Sunucu hatası', error: error.message });
    }
  }

  // Delete town
  static async delete(req, res) {
    try {
      const { id } = req.params;
      const numericId = parseInt(id);
      
      // Check if town exists
      const existingTown = await db.get('SELECT * FROM towns WHERE id = ?', [numericId]);
      if (!existingTown) {
        return res.status(404).json({ message: 'Belde bulunamadı' });
      }
      
      // Check if town has dependent neighborhoods or villages
      const dependentNeighborhoods = await db.get('SELECT COUNT(*) as count FROM neighborhoods WHERE town_id = ?', [numericId]);
      const dependentVillages = await db.get('SELECT COUNT(*) as count FROM villages WHERE town_id = ?', [numericId]);
      
      if (dependentNeighborhoods.count > 0 || dependentVillages.count > 0) {
        return res.status(400).json({ message: 'Bu beldeye bağlı mahalle veya köy var. Önce bunları siliniz.' });
      }
      
      await db.run('DELETE FROM towns WHERE id = ?', [numericId]);
      
      // Update in-memory collection
      const index = collections.towns.findIndex(t => t.id === numericId);
      if (index !== -1) {
        collections.towns.splice(index, 1);
      }
      
      // Invalidate towns cache
      try { invalidate('/api/towns'); } catch (_) {}
      
      res.json({ message: 'Belde başarıyla silindi' });
    } catch (error) {
      console.error('Error deleting town:', error);
      res.status(500).json({ message: 'Sunucu hatası', error: error.message });
    }
  }

  // Get town deputy inspectors
  static async getDeputyInspectors(req, res) {
    try {
      const { id } = req.params;
      
      const deputyInspectors = await db.all(
        'SELECT * FROM town_deputy_inspectors WHERE town_id = ? ORDER BY created_at ASC',
        [id]
      );
      
      res.json(deputyInspectors);
    } catch (error) {
      console.error('Error fetching deputy inspectors:', error);
      res.status(500).json({ message: 'Sunucu hatası', error: error.message });
    }
  }

  // Get all town deputy inspectors
  static async getAllDeputyInspectors(req, res) {
    try {
      const deputyInspectors = await db.all(
        `SELECT tdi.*, t.name as town_name, d.name as district_name, m.name as member_name, m.phone as member_phone
         FROM town_deputy_inspectors tdi
         LEFT JOIN towns t ON tdi.town_id = t.id
         LEFT JOIN districts d ON t.district_id = d.id
         LEFT JOIN members m ON tdi.member_id = m.id
         ORDER BY d.name, t.name, tdi.created_at ASC`
      );
      
      res.json(deputyInspectors);
    } catch (error) {
      console.error('Error fetching all deputy inspectors:', error);
      res.status(500).json({ message: 'Sunucu hatası', error: error.message });
    }
  }

  // Create or update town officials
  static async createOrUpdateTownOfficials(req, res) {
    try {
      const { town_id, chairman_name, chairman_phone, chairman_member_id, inspector_name, inspector_phone, inspector_member_id, deputy_inspectors } = req.body;
      
      if (!town_id) {
        return res.status(400).json({ message: 'Belde ID gereklidir' });
      }

      // Check if town exists
      const town = await db.get('SELECT * FROM towns WHERE id = ?', [town_id]);
      if (!town) {
        return res.status(404).json({ message: 'Belde bulunamadı' });
      }

      // Delete existing officials
      await db.run('DELETE FROM town_officials WHERE town_id = ?', [town_id]);
      await db.run('DELETE FROM town_deputy_inspectors WHERE town_id = ?', [town_id]);

      // Insert new officials
      await db.run(
        'INSERT INTO town_officials (town_id, chairman_name, chairman_phone, chairman_member_id, inspector_name, inspector_phone, inspector_member_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [town_id, chairman_name, chairman_phone, chairman_member_id, inspector_name, inspector_phone, inspector_member_id]
      );

      // Insert deputy inspectors
      if (deputy_inspectors && deputy_inspectors.length > 0) {
        for (const deputy of deputy_inspectors) {
          if (deputy.name && deputy.name.trim()) {
            await db.run(
              'INSERT INTO town_deputy_inspectors (town_id, name, phone, member_id) VALUES (?, ?, ?, ?)',
              [town_id, deputy.name, deputy.phone, deputy.member_id]
            );
          }
        }
      }

      // Update town president user credentials if chairman info is provided
      // If chairman_member_id is provided, ensure that member has a user account
      if (chairman_name && chairman_phone) {
        try {
          console.log(`Updating town president user for town_id: ${town_id}, chairman_name: ${chairman_name}, chairman_phone: ${chairman_phone}`);
          
          // Check if chairman is a member
          let chairmanIsMember = false;
          if (chairman_member_id) {
            try {
              const { decryptField } = require('../utils/crypto');
              const member = await db.get('SELECT * FROM members WHERE id = ? AND archived = 0', [chairman_member_id]);
              if (member) {
                chairmanIsMember = true;
                // Check if member already has a user account
                const memberUser = await MemberUser.getUserByMemberId(chairman_member_id);
                if (!memberUser) {
                  // Create user account for the member if doesn't exist
                  const tc = decryptField(member.tc);
                  const phone = decryptField(member.phone);
                  const username = tc;
                  const password = phone.replace(/\D/g, '');
                  await MemberUser.createMemberUser(chairman_member_id, username, password);
                  console.log(`Created member user for chairman member ID ${chairman_member_id} (TC: ${username})`);
                } else {
                  console.log(`Chairman is member ID ${chairman_member_id} and already has a user account, skipping town president user creation`);
                }
              }
            } catch (err) {
              console.log(`Error checking member user for chairman_member_id ${chairman_member_id}:`, err);
              // Continue to create town president user if member check fails
            }
          }
          
          // Only create/update town president user if chairman is not a member
          if (!chairmanIsMember) {
            const townUser = await MemberUser.getUserByTownId(town_id);
            console.log('Existing town user:', townUser);
            
            if (townUser) {
              // Check if phone number has changed by comparing with the new phone from the request
              const oldPhone = townUser.password; // Password is stored as phone number
              const newPhone = chairman_phone.replace(/\D/g, ''); // Remove non-digits from NEW phone
              
              console.log(`Phone comparison: old=${oldPhone}, new=${newPhone}`);
              
              // Update existing user (always update to ensure username and password are current)
              await MemberUser.updateTownPresidentUser(
                town_id, 
                town.name, 
                chairman_name, 
                chairman_phone
              );
              
              console.log('Town president user updated successfully');
              
              if (oldPhone !== newPhone) {
                console.log(`Town president phone updated: ${oldPhone} -> ${newPhone}`);
              }
            } else {
              console.log('No existing town user found, creating new one');
              // Create new user
              await MemberUser.createTownPresidentUser(
                town_id, 
                town.name, 
                chairman_name, 
                chairman_phone
              );
              console.log('New town president user created successfully');
            }
          }
        } catch (userError) {
          console.error('Error updating/creating town president user:', userError);
          // Don't fail the main operation if user update fails
        }
      }

      res.json({ message: 'Belde yöneticileri başarıyla kaydedildi' });
    } catch (error) {
      console.error('Error creating/updating town officials:', error);
      res.status(500).json({ message: 'Sunucu hatası', error: error.message });
    }
  }
}

module.exports = TownController;
