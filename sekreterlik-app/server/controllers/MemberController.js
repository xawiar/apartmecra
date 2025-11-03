const db = require('../config/database');
const Member = require('../models/Member');
const MemberUser = require('../models/MemberUser');
const xlsx = require('xlsx');
const { encryptField, decryptField } = require('../utils/crypto');
const { invalidate } = require('../middleware/cache');

class MemberController {
  // Get all members
  static async getAll(req, res) {
    try {
      const showArchived = req.query.archived === 'true';
      let sql, params;
      const page = parseInt(req.query.page, 10);
      const limit = parseInt(req.query.limit, 10);
      const hasPagination = Number.isFinite(page) && Number.isFinite(limit) && page > 0 && limit > 0;
      
      const q = (req.query.q || '').trim();
      const region = (req.query.region || '').trim();
      const where = [];
      params = [];
      if (!showArchived) {
        where.push('archived = 0');
      }
      if (q) {
        // Not: tc/phone alanları şifreli tutulduğu için LIKE ile aranamaz
        where.push('(name LIKE ?)');
        const like = `%${q}%`;
        params.push(like);
      }
      if (region) {
        where.push('region = ?');
        params.push(region);
      }
      const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
      sql = `SELECT * FROM members ${whereSql} ORDER BY created_at DESC`;

      if (hasPagination) {
        const offset = (page - 1) * limit;
        const countSql = `SELECT COUNT(*) as cnt FROM members ${whereSql}`;
        const [{ cnt }] = await db.all(countSql, params);
        const paged = await db.all(`${sql} LIMIT ? OFFSET ?`, [...params, limit, offset]);
        const decrypted = paged.map(m => ({
          ...m,
          tc: decryptField(m.tc),
          phone: decryptField(m.phone),
        }));
        return res.json({ data: decrypted, page, limit, total: cnt, totalPages: Math.ceil(cnt / limit) });
      }

      const members = await db.all(sql, params);
      const decrypted = members.map(m => ({
        ...m,
        tc: decryptField(m.tc),
        phone: decryptField(m.phone),
      }));
      res.json(decrypted);
    } catch (error) {
      console.error('Error getting members:', error);
      res.status(500).json({ message: 'Sunucu hatası', error: error.message });
    }
  }

  // Get member by ID
  static async getById(req, res) {
    console.log('getById method called with id:', req.params.id);
    try {
      const { id } = req.params;
      const member = await db.get('SELECT * FROM members WHERE id = ?', [parseInt(id)]);
      
      if (!member) {
        console.log('Member not found for id:', id);
        return res.status(404).json({ message: 'Üye bulunamadı' });
      }
      
      res.json({
        ...member,
        tc: decryptField(member.tc),
        phone: decryptField(member.phone),
      });
    } catch (error) {
      console.error('Error getting member by ID:', error);
      res.status(500).json({ message: 'Sunucu hatası', error: error.message });
    }
  }

  // Create new member
  static async create(req, res) {
    try {
      const memberData = req.body;
      console.log('Received member data in backend:', memberData); // Debug log
      
      const errors = Member.validate(memberData);
      console.log('Validation errors:', errors); // Debug log
      
      if (errors.length > 0) {
        console.log('Returning validation error response'); // Debug log
        return res.status(400).json({ message: 'Doğrulama hatası', errors });
      }
      
      // Check if TC already exists (compare with encrypted value)
      const encTc = encryptField(memberData.tc);
      const existingMember = await db.get('SELECT * FROM members WHERE tc = ?', [encTc]);
      if (existingMember) {
        console.log('TC already exists, returning error'); // Debug log
        return res.status(400).json({ message: 'Bu TC kimlik numarası zaten kayıtlı' });
      }
      
      const sql = `INSERT INTO members (tc, name, region, position, phone, email, address, district, notes, archived) 
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
      const params = [
        encTc,
        memberData.name,
        memberData.region,
        memberData.position,
        encryptField(memberData.phone),
        memberData.email || null,
        memberData.address || null,
        memberData.district || null,
        memberData.notes || null,
        0 // archived = false
      ];
      
      const result = await db.run(sql, params);
      const newMember = await db.get('SELECT * FROM members WHERE id = ?', [result.lastID]);
      
      console.log('Member added to database successfully'); // Debug log
      
      // Automatically create member_user for the new member
      try {
        const username = memberData.tc; // Use TC as username
        const password = memberData.phone.replace(/\D/g, ''); // Normalize password (remove non-digits)
        
        console.log(`Attempting to create user for member ID ${result.lastID}, username: ${username}`);
        
        // Check if username already exists
        const existingUserWithSameUsername = await db.get('SELECT * FROM member_users WHERE username = ?', [username]);
        
        if (!existingUserWithSameUsername) {
          await MemberUser.createMemberUser(result.lastID, username, password);
          console.log(`✓ Member user created automatically for member ID ${result.lastID} (username: ${username})`);
        } else {
          console.log(`⚠ Username ${username} already exists, skipping member user creation for member ID ${result.lastID}`);
        }
      } catch (userError) {
        console.error('❌ Error creating member user automatically:', userError);
        console.error('Error details:', userError.stack);
        // Don't fail the member creation if user creation fails
      }
      
      // Invalidate cache for members
      invalidate('/api/members');
      
      res.status(201).json({
        ...newMember,
        tc: decryptField(newMember.tc),
        phone: decryptField(newMember.phone),
      });
    } catch (error) {
      console.error('Error creating member in backend:', error); // Debug log
      res.status(500).json({ message: 'Sunucu hatası', error: error.message });
    }
  }

  // Update member
  static async update(req, res) {
    try {
      const { id } = req.params;
      const memberData = req.body;
      const errors = Member.validate(memberData);
      
      if (errors.length > 0) {
        return res.status(400).json({ message: 'Doğrulama hatası', errors });
      }
      
      // Get old member data to check if TC or phone changed
      const oldMember = await db.get('SELECT * FROM members WHERE id = ?', [parseInt(id)]);
      if (!oldMember) {
        return res.status(404).json({ message: 'Üye bulunamadı' });
      }
      
      const sql = `UPDATE members SET tc = ?, name = ?, region = ?, position = ?, phone = ?, 
                   email = ?, address = ?, district = ?, notes = ? WHERE id = ?`;
      const params = [
        encryptField(memberData.tc),
        memberData.name,
        memberData.region,
        memberData.position,
        encryptField(memberData.phone),
        memberData.email || null,
        memberData.address || null,
        memberData.district || null,
        memberData.notes || null,
        parseInt(id)
      ];
      
      const result = await db.run(sql, params);
      if (result.changes === 0) {
        return res.status(404).json({ message: 'Üye bulunamadı' });
      }
      
      const updatedMember = await db.get('SELECT * FROM members WHERE id = ?', [parseInt(id)]);
      
      // Update or create member user credentials if TC or phone changed
      const oldTc = decryptField(oldMember.tc);
      const oldPhone = decryptField(oldMember.phone);
      if (oldTc !== memberData.tc || oldPhone !== memberData.phone) {
        try {
          const memberUser = await MemberUser.getUserByMemberId(parseInt(id));
          if (memberUser) {
            // Update existing user
            await MemberUser.updateMemberUser(parseInt(id), memberData.tc, memberData.phone);
            console.log('Member user updated for member ID:', id);
          } else {
            // Create new user if doesn't exist
            const username = memberData.tc;
            const password = memberData.phone.replace(/\D/g, '');
            await MemberUser.createMemberUser(parseInt(id), username, password);
            console.log('Member user created for member ID:', id);
          }
        } catch (userError) {
          console.error('Error updating/creating member user:', userError);
          // Don't fail the main operation if user update fails
        }
      }
      
      // Invalidate cache for members
      invalidate('/api/members');
      
      res.json({
        ...updatedMember,
        tc: decryptField(updatedMember.tc),
        phone: decryptField(updatedMember.phone),
      });
    } catch (error) {
      console.error('Error updating member:', error);
      res.status(500).json({ message: 'Sunucu hatası', error: error.message });
    }
  }

  // Archive member
  static async archive(req, res) {
    try {
      const { id } = req.params;
      const member = await db.get('SELECT * FROM members WHERE id = ?', [parseInt(id)]);
      
      if (!member) {
        return res.status(404).json({ message: 'Üye bulunamadı' });
      }
      
      console.log('Archiving member:', member);
      
      // Update in database
      const result = await db.run('UPDATE members SET archived = 1 WHERE id = ?', [parseInt(id)]);
      console.log('Database update result:', result);
      
      if (result.changes === 0) {
        return res.status(404).json({ message: 'Üye bulunamadı' });
      }
      
      // Invalidate cache for members
      invalidate('/api/members');
      
      const archivedMember = { ...member, archived: 1 };
      res.json({ message: 'Üye arşivlendi', member: archivedMember });
    } catch (error) {
      console.error('Error archiving member:', error);
      res.status(500).json({ message: 'Üye arşivlenirken hata oluştu: ' + error.message });
    }
  }

  // Restore archived member
  static async restore(req, res) {
    try {
      const { id } = req.params;
      const member = await db.get('SELECT * FROM members WHERE id = ? AND archived = 1', [parseInt(id)]);
      
      if (!member) {
        return res.status(404).json({ message: 'Arşivlenmiş üye bulunamadı' });
      }
      
      console.log('Restoring member:', member);
      
      // Update in database
      const result = await db.run('UPDATE members SET archived = 0 WHERE id = ?', [parseInt(id)]);
      console.log('Database update result:', result);
      
      if (result.changes === 0) {
        return res.status(404).json({ message: 'Arşivlenmiş üye bulunamadı' });
      }
      
      // Invalidate cache for members
      invalidate('/api/members');
      
      const restoredMember = { ...member, archived: 0 };
      res.json({ message: 'Üye geri yüklendi', member: restoredMember });
    } catch (error) {
      console.error('Error restoring member:', error);
      res.status(500).json({ message: 'Üye geri yüklenirken hata oluştu: ' + error.message });
    }
  }

  // Helper function to create region if it doesn't exist
  static async createRegionIfNotExists(regionName) {
    if (!regionName || regionName.trim() === '') return null;
    
    const regions = await db.all('SELECT * FROM regions WHERE name = ?', [regionName.trim()]);
    if (regions.length > 0) {
      return regions[0];
    }
    
    // Create new region
    const result = await db.run('INSERT INTO regions (name) VALUES (?)', [regionName.trim()]);
    const newRegion = { id: result.lastID, name: regionName.trim() };
    
    // Add to in-memory collection
    db.add('regions', newRegion);
    
    return newRegion;
  }

  // Helper function to create position if it doesn't exist
  static async createPositionIfNotExists(positionName) {
    if (!positionName || positionName.trim() === '') return null;
    
    const positions = await db.all('SELECT * FROM positions WHERE name = ?', [positionName.trim()]);
    if (positions.length > 0) {
      return positions[0];
    }
    
    // Create new position
    const result = await db.run('INSERT INTO positions (name) VALUES (?)', [positionName.trim()]);
    const newPosition = { id: result.lastID, name: positionName.trim() };
    
    // Add to in-memory collection
    db.add('positions', newPosition);
    
    return newPosition;
  }

  // Import members from Excel
  static async importFromExcel(req, res) {
    try {
      console.log('Import endpoint called');
      console.log('Request files:', req.files);
      console.log('File object:', req.file);
      
      // Check if file was uploaded - support both req.files.file and req.file
      const file = req.files?.file || req.file;
      if (!file) {
        console.log('No file found in request');
        return res.status(400).json({ message: 'Dosya bulunamadı' });
      }

      // Handle both buffer and data properties
      const fileData = file.data || file.buffer;
      if (!fileData) {
        console.log('File data is missing');
        return res.status(400).json({ message: 'Dosya verisi bulunamadı' });
      }

      console.log('File received:', {
        name: file.name || file.originalname,
        size: file.size,
        mimetype: file.mimetype
      });
      
      const workbook = xlsx.read(fileData, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });

      // Remove header row
      const rows = data.slice(1);
      console.log('Excel rows to process:', rows.length);
      
      let importedCount = 0;
      const errors = [];

      // Process each row
      for (let i = 0; i < rows.length; i++) {
        try {
          const row = rows[i];
          console.log(`Processing row ${i + 1}:`, row);
          if (row.length < 6) {
            console.log(`Skipping row ${i + 1} due to insufficient columns`);
            continue; // Skip incomplete rows
          }

          // Map Excel columns to member fields (without automatic mapping)
          const tc = row[0] ? String(row[0]).trim() : '';
          const name = row[1] ? String(row[1]).trim() : '';
          const phone = row[2] ? String(row[2]).trim() : '';
          let position = row[3] ? String(row[3]).trim() : '';
          let region = row[4] ? String(row[4]).trim() : '';
          const district = row[5] ? String(row[5]).trim() : '';

          // If position or region is empty, set default values
          if (!position) {
            position = 'Üye';
          }
          
          if (!region) {
            region = 'Üye';
          }

          console.log(`Mapped data - TC: ${tc}, Name: ${name}, Phone: ${phone}, Position: ${position}, Region: ${region}, District: ${district}`);

          // Validate required fields
          if (!tc || !name || !phone || !district) {
            errors.push(`Satır ${i + 2}: Gerekli alanlar eksik`);
            console.log(`Validation failed for row ${i + 2}`);
            continue;
          }

          // Validate TC length
          if (tc.length !== 11) {
            errors.push(`Satır ${i + 2}: TC kimlik numarası 11 haneli olmalıdır`);
            console.log(`TC validation failed for row ${i + 2}`);
            continue;
          }

          // Check if TC already exists
          const existingMember = await db.get('SELECT * FROM members WHERE tc = ?', [tc]);
          if (existingMember) {
            errors.push(`Satır ${i + 2}: Bu TC kimlik numarası zaten kayıtlı`);
            console.log(`TC already exists for row ${i + 2}`);
            continue;
          }

          // Create region and position if they don't exist
          if (region) {
            await MemberController.createRegionIfNotExists(region);
          }
          
          if (position) {
            await MemberController.createPositionIfNotExists(position);
          }

          // Insert member into database
          console.log(`Inserting member: ${name}`);
          const result = await db.run(
            'INSERT INTO members (tc, name, phone, position, region, district) VALUES (?, ?, ?, ?, ?, ?)',
            [tc, name, phone, position, region, district]
          );
          
          // Add member to in-memory collection as well
          const newMember = {
            id: result.lastID,
            tc,
            name,
            phone,
            position,
            region,
            district,
            archived: false
          };
          db.add('members', newMember);
          
          importedCount++;
          console.log(`Successfully imported member: ${name}`);
        } catch (rowError) {
          console.error(`Error processing row ${i + 2}:`, rowError);
          errors.push(`Satır ${i + 2}: ${rowError.message}`);
        }
      }

      res.json({ 
        message: `${importedCount} üye başarıyla içe aktarıldı`, 
        count: importedCount,
        errors: errors.length > 0 ? errors : undefined
      });
    } catch (error) {
      console.error('Excel import error:', error);
      res.status(500).json({ message: 'Sunucu hatası', error: error.message });
    }
  }

  // Export members to Excel
  static exportToExcel(req, res) {
    try {
      // In a real implementation, you would generate an Excel file here
      // For now, we'll just return a success message
      res.json({ message: 'Üyeler başarıyla dışa aktarıldı' });
    } catch (error) {
      res.status(500).json({ message: 'Sunucu hatası', error: error.message });
    }
  }

  // Upload member photo
  static async uploadPhoto(req, res) {
    try {
      const { memberId } = req.body;
      const file = req.file;

      if (!file) {
        return res.status(400).json({ message: 'Fotoğraf dosyası bulunamadı' });
      }

      if (!memberId) {
        return res.status(400).json({ message: 'Üye ID gerekli' });
      }

      // Generate unique filename
      const filename = `member-${memberId}-${Date.now()}-${file.originalname}`;
      const photoUrl = `/uploads/photos/${filename}`;

      // Save file to disk
      const fs = require('fs');
      const path = require('path');
      const uploadsDir = path.join(__dirname, '../uploads/photos');
      
      // Ensure uploads directory exists
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      const filePath = path.join(uploadsDir, filename);
      fs.writeFileSync(filePath, file.buffer);

      // Update member photo in database
      const result = await db.run(
        'UPDATE members SET photo = ? WHERE id = ?',
        [photoUrl, memberId]
      );

      if (result.changes === 0) {
        return res.status(404).json({ message: 'Üye bulunamadı' });
      }

      // Photo URL is already updated in database above

      res.json({ 
        message: 'Fotoğraf başarıyla yüklendi',
        photoUrl: photoUrl
      });
    } catch (error) {
      console.error('Photo upload error:', error);
      res.status(500).json({ message: 'Fotoğraf yüklenirken hata oluştu: ' + error.message });
    }
  }

  // Archive all members
  static async archiveAll(req, res) {
    console.log('archiveAll method called');
    try {
      // Get all members
      const members = db.get('members');
      console.log('Members to archive:', members);
      
      // Move each member to archivedMembers and update in database
      for (const member of members) {
        const archivedMember = { ...member, archived: true };
        db.add('archivedMembers', archivedMember);
        await db.run('UPDATE members SET archived = 1 WHERE id = ?', [member.id]);
      }
      
      // Clear all active members and member registrations
      db.deleteAll('members');
      db.deleteAll('memberRegistrations');
      
      res.json({ message: 'Tüm üyeler arşivlendi' });
    } catch (error) {
      console.error('Error in archiveAll:', error);
      res.status(500).json({ message: 'Sunucu hatası', error: error.message });
    }
  }

  // New method to handle bulk archive via POST
  static bulkArchive(req, res) {
    console.log('bulkArchive method called');
    return MemberController.archiveAll(req, res);
  }

}

module.exports = MemberController;