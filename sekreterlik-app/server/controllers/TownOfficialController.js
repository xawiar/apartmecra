const db = require('../config/database');
const MemberUser = require('../models/MemberUser');

class TownOfficialController {
  // Get all town officials
  static async getAll(req, res) {
    try {
      const officials = await db.all(`
        SELECT \`to\`.*, 
               t.name as town_name,
               d.name as district_name,
               chairman_member.name as chairman_member_name,
               inspector_member.name as inspector_member_name
        FROM town_officials \`to\` 
        LEFT JOIN towns t ON \`to\`.town_id = t.id 
        LEFT JOIN districts d ON t.district_id = d.id 
        LEFT JOIN members chairman_member ON \`to\`.chairman_member_id = chairman_member.id 
        LEFT JOIN members inspector_member ON \`to\`.inspector_member_id = inspector_member.id 
        ORDER BY d.name, t.name
      `);
      res.json(officials);
    } catch (error) {
      console.error('Error getting town officials:', error);
      res.status(500).json({ message: 'Sunucu hatası', error: error.message });
    }
  }

  // Get officials by town
  static async getByTown(req, res) {
    try {
      const { townId } = req.params;
      const officials = await db.all(`
        SELECT \`to\`.*, 
               t.name as town_name,
               d.name as district_name,
               chairman_member.name as chairman_member_name,
               inspector_member.name as inspector_member_name
        FROM town_officials \`to\` 
        LEFT JOIN towns t ON \`to\`.town_id = t.id 
        LEFT JOIN districts d ON t.district_id = d.id 
        LEFT JOIN members chairman_member ON \`to\`.chairman_member_id = chairman_member.id 
        LEFT JOIN members inspector_member ON \`to\`.inspector_member_id = inspector_member.id 
        WHERE \`to\`.town_id = ?
      `, [townId]);
      res.json(officials);
    } catch (error) {
      console.error('Error getting officials by town:', error);
      res.status(500).json({ message: 'Sunucu hatası', error: error.message });
    }
  }

  // Create or update town officials
  static async createOrUpdate(req, res) {
    try {
      const { 
        town_id, 
        chairman_name, 
        chairman_phone, 
        chairman_member_id,
        inspector_name, 
        inspector_phone, 
        inspector_member_id,
        deputy_inspectors 
      } = req.body;
      
      if (!town_id) {
        return res.status(400).json({ message: 'Belde seçimi gereklidir' });
      }
      
      // Check if town exists
      const town = await db.get('SELECT * FROM towns WHERE id = ?', [town_id]);
      if (!town) {
        return res.status(400).json({ message: 'Seçilen belde bulunamadı' });
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
      
      // Check deputy inspector members if provided
      if (deputy_inspectors && deputy_inspectors.length > 0) {
        for (const deputy of deputy_inspectors) {
          if (deputy.member_id) {
            const member = await db.get('SELECT * FROM members WHERE id = ?', [deputy.member_id]);
            if (!member) {
              return res.status(400).json({ message: 'Seçilen müfettiş yardımcısı üyesi bulunamadı' });
            }
          }
        }
      }
      
      // Check if officials already exist for this town
      const existingOfficials = await db.get('SELECT * FROM town_officials WHERE town_id = ?', [town_id]);
      
      // Delete existing officials and deputy inspectors
      await db.run('DELETE FROM town_officials WHERE town_id = ?', [town_id]);
      await db.run('DELETE FROM town_deputy_inspectors WHERE town_id = ?', [town_id]);

      // Insert new officials
      await db.run(`
        INSERT INTO town_officials (
          town_id, 
          chairman_name, 
          chairman_phone, 
          chairman_member_id,
          inspector_name, 
          inspector_phone, 
          inspector_member_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        town_id,
        chairman_name?.trim() || null,
        chairman_phone?.trim() || null,
        chairman_member_id || null,
        inspector_name?.trim() || null,
        inspector_phone?.trim() || null,
        inspector_member_id || null
      ]);

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
      
      // Get updated officials
      const updatedOfficials = await db.get(`
        SELECT \`to\`.*, 
               t.name as town_name,
               d.name as district_name,
               chairman_member.name as chairman_member_name,
               inspector_member.name as inspector_member_name
        FROM town_officials \`to\` 
        LEFT JOIN towns t ON \`to\`.town_id = t.id 
        LEFT JOIN districts d ON t.district_id = d.id 
        LEFT JOIN members chairman_member ON \`to\`.chairman_member_id = chairman_member.id 
        LEFT JOIN members inspector_member ON \`to\`.inspector_member_id = inspector_member.id 
        WHERE \`to\`.town_id = ?
      `, [town_id]);
      
      // Create or update town president user if chairman info is provided
      // If chairman_member_id is provided, ensure that member has a user account
      if (chairman_name && chairman_phone && updatedOfficials) {
        try {
          const town = await db.get('SELECT * FROM towns WHERE id = ?', [town_id]);
          if (town) {
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
                console.error(`Error checking member user for chairman_member_id ${chairman_member_id}:`, err);
                // Continue to create town president user if member check fails
              }
            }
            
            // Only create/update town president user if chairman is not a member
            if (!chairmanIsMember) {
              const existingUser = await MemberUser.getUserByTownId(town_id);
              if (existingUser) {
                // Update existing user
                await MemberUser.updateTownPresidentUser(
                  town_id,
                  town.name,
                  chairman_name,
                  chairman_phone
                );
                console.log('Town president user updated for town ID:', town_id);
              } else {
                // Create new user
                await MemberUser.createTownPresidentUser(
                  town_id,
                  town.name,
                  chairman_name,
                  chairman_phone
                );
                console.log('Town president user created for town ID:', town_id);
              }
            }
          }
        } catch (userError) {
          console.error('Error creating/updating town president user:', userError);
          // Don't fail the main operation if user update fails
        }
      }
      
      res.json(updatedOfficials);
    } catch (error) {
      console.error('Error creating/updating town officials:', error);
      res.status(500).json({ message: 'Sunucu hatası', error: error.message });
    }
  }

  // Delete town officials
  static async delete(req, res) {
    try {
      const { townId } = req.params;
      
      // Check if officials exist
      const existingOfficials = await db.get('SELECT * FROM town_officials WHERE town_id = ?', [townId]);
      if (!existingOfficials) {
        return res.status(404).json({ message: 'Belde yöneticileri bulunamadı' });
      }
      
      await db.run('DELETE FROM town_officials WHERE town_id = ?', [townId]);
      
      // Delete associated town president user if exists
      try {
        const townUser = await MemberUser.getUserByTownId(townId);
        if (townUser) {
          await MemberUser.deleteUser(townUser.id);
          console.log('Town president user deleted for town ID:', townId);
        }
      } catch (userError) {
        console.error('Error deleting town president user:', userError);
        // Continue even if user deletion fails
      }
      
      res.json({ message: 'Belde yöneticileri başarıyla silindi' });
    } catch (error) {
      console.error('Error deleting town officials:', error);
      res.status(500).json({ message: 'Sunucu hatası', error: error.message });
    }
  }
}

module.exports = TownOfficialController;
