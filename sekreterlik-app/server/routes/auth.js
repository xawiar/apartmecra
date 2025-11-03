const express = require('express');
const router = express.Router();
const Admin = require('../models/Admin');
const MemberUser = require('../models/MemberUser');
const db = require('../config/database');

// Login endpoint
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  
  console.log('Login attempt:', { username, password });
  
  try {
    if (!username || !password) {
      console.log('Missing credentials');
      return res.status(400).json({
        success: false,
        message: 'Kullanıcı adı ve şifre zorunludur'
      });
    }

    // First try admin login
    const isAdminValid = await Admin.verifyAdmin(username, password);
    console.log('Admin validation result:', isAdminValid);
    
    if (isAdminValid) {
      console.log('Admin login successful');
      // Generate a simple token (in a real app, use JWT)
      const token = 'simple-auth-token';
      
      res.json({
        success: true,
        token,
        user: {
          username,
          name: 'Parti Sekreteri',
          role: 'admin'
        }
      });
      return;
    }

    // Then try member user login (including district and town presidents)
    // Normalize password: remove all non-digit characters (phone numbers are stored as digits only)
    const normalizedPassword = password.replace(/\D/g, '');
    console.log('Trying member user login with:', { username, originalPassword: password, normalizedPassword });
    const memberUser = await MemberUser.getUserByCredentialsUpdated(username, normalizedPassword);
    console.log('Member user validation result:', memberUser ? 'Found' : 'Not found');
    
    if (memberUser) {
      // Generate a simple token (in a real app, use JWT)
      const token = 'simple-auth-token';
      
      let userRole = 'member';
      let userData = {
        username,
        name: memberUser.name || memberUser.chairman_name,
        role: userRole,
        memberId: memberUser.member_id,
        region: memberUser.region,
        position: memberUser.position
      };

      // Handle different user types
      if (memberUser.user_type === 'district_president') {
        userRole = 'district_president';
        userData = {
          username,
          name: memberUser.chairman_name,
          role: userRole,
          districtId: memberUser.district_id,
          districtName: memberUser.district_name,
          chairmanName: memberUser.chairman_name
        };
      } else if (memberUser.user_type === 'town_president') {
        userRole = 'town_president';
        userData = {
          username,
          name: memberUser.chairman_name,
          role: userRole,
          townId: memberUser.town_id,
          townName: memberUser.town_name,
          chairmanName: memberUser.chairman_name
        };
      }
      
      res.json({
        success: true,
        token,
        user: userData
      });
      return;
    }

    // If neither admin nor member user found
    console.log('Login failed - invalid credentials');
    res.status(401).json({
      success: false,
      message: 'Geçersiz kullanıcı adı veya şifre'
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Giriş sırasında bir hata oluştu'
    });
  }
});

// Logout endpoint
router.post('/logout', (req, res) => {
  // In a real application, you would invalidate the token
  res.json({
    success: true,
    message: 'Çıkış yapıldı'
  });
});

// Get admin info endpoint
router.get('/admin', async (req, res) => {
  try {
    const admin = await Admin.getAdmin();
    res.json({
      success: true,
      admin: {
        username: admin.username,
        // Don't send password in response
        created_at: admin.created_at,
        updated_at: admin.updated_at
      }
    });
  } catch (error) {
    console.error('Get admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Admin bilgileri alınırken hata oluştu'
    });
  }
});

// Update admin credentials endpoint
router.put('/admin', async (req, res) => {
  const { username, password, currentPassword } = req.body;
  
  try {
    if (!username || !password || !currentPassword) {
      return res.status(400).json({
        success: false,
        message: 'Tüm alanlar zorunludur'
      });
    }

    // Verify current password
    const currentAdmin = await Admin.getAdmin();
    const isCurrentPasswordValid = await Admin.verifyAdmin(currentAdmin.username, currentPassword);
    
    if (!isCurrentPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Mevcut şifre yanlış'
      });
    }

    // Update admin credentials
    await Admin.updateAdmin(username, password);
    
    res.json({
      success: true,
      message: 'Admin bilgileri başarıyla güncellendi'
    });
  } catch (error) {
    console.error('Update admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Admin bilgileri güncellenirken hata oluştu'
    });
  }
});

// Get all member users endpoint
router.get('/member-users', async (req, res) => {
  try {
    const memberUsers = await MemberUser.getAllMemberUsers();
    res.json({
      success: true,
      users: memberUsers
    });
  } catch (error) {
    console.error('Get member users error:', error);
    res.status(500).json({
      success: false,
      message: 'Üye kullanıcıları alınırken hata oluştu'
    });
  }
});

// Create user for member endpoint
router.post('/member-users', async (req, res) => {
  const { memberId, username, password } = req.body;
  
  try {
    if (!memberId || !username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Tüm alanlar zorunludur'
      });
    }

    // Check if user already exists for this member
    const existingUser = await MemberUser.getUserByMemberId(memberId);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Bu üye için zaten bir kullanıcı oluşturulmuş'
      });
    }

    // Create user
    const newUser = await MemberUser.createMemberUser(memberId, username, password);
    
    res.json({
      success: true,
      message: 'Üye kullanıcısı başarıyla oluşturuldu',
      user: newUser
    });
  } catch (error) {
    console.error('Create member user error:', error);
    if (error.message.includes('UNIQUE constraint failed')) {
      res.status(400).json({
        success: false,
        message: 'Bu kullanıcı adı zaten kullanılıyor'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Üye kullanıcısı oluşturulurken hata oluştu'
      });
    }
  }
});

// Update member user credentials endpoint
router.put('/member-users/:id', async (req, res) => {
  const { id } = req.params;
  const { username, password } = req.body;
  
  try {
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Kullanıcı adı ve şifre zorunludur'
      });
    }

    // Update user credentials
    await MemberUser.updateUserCredentials(id, username, password);
    
    res.json({
      success: true,
      message: 'Üye kullanıcı bilgileri başarıyla güncellendi'
    });
  } catch (error) {
    console.error('Update member user error:', error);
    if (error.message.includes('UNIQUE constraint failed')) {
      res.status(400).json({
        success: false,
        message: 'Bu kullanıcı adı zaten kullanılıyor'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Üye kullanıcı bilgileri güncellenirken hata oluştu'
      });
    }
  }
});

// Toggle member user status endpoint
router.patch('/member-users/:id/toggle', async (req, res) => {
  const { id } = req.params;
  
  try {
    await MemberUser.toggleUserStatus(id);
    
    res.json({
      success: true,
      message: 'Üye kullanıcı durumu güncellendi'
    });
  } catch (error) {
    console.error('Toggle member user status error:', error);
    res.status(500).json({
      success: false,
      message: 'Üye kullanıcı durumu güncellenirken hata oluştu'
    });
  }
});

// Delete member user endpoint
router.delete('/member-users/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    await MemberUser.deleteUser(id);
    
    res.json({
      success: true,
      message: 'Üye kullanıcısı başarıyla silindi'
    });
  } catch (error) {
    console.error('Delete member user error:', error);
    res.status(500).json({
      success: false,
      message: 'Üye kullanıcısı silinirken hata oluştu'
    });
  }
});

// Create district president user endpoint
router.post('/district-president-users', async (req, res) => {
  const { districtId, districtName, chairmanName, chairmanPhone } = req.body;
  
  try {
    if (!districtId || !districtName || !chairmanName || !chairmanPhone) {
      return res.status(400).json({
        success: false,
        message: 'Tüm alanlar zorunludur'
      });
    }

    // Check if user already exists for this district
    const existingUser = await MemberUser.getUserByCredentialsUpdated(
      districtName.toLowerCase().replace(/\s+/g, '_'), 
      chairmanPhone.replace(/\D/g, '')
    );
    
    if (existingUser && existingUser.user_type === 'district_president') {
      return res.status(400).json({
        success: false,
        message: 'Bu ilçe için zaten bir başkan kullanıcısı oluşturulmuş'
      });
    }

    // Create district president user
    const newUser = await MemberUser.createDistrictPresidentUser(districtId, districtName, chairmanName, chairmanPhone);
    
    res.json({
      success: true,
      message: 'İlçe başkanı kullanıcısı başarıyla oluşturuldu',
      user: newUser
    });
  } catch (error) {
    console.error('Create district president user error:', error);
    if (error.message.includes('UNIQUE constraint failed')) {
      res.status(400).json({
        success: false,
        message: 'Bu kullanıcı adı zaten kullanılıyor'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'İlçe başkanı kullanıcısı oluşturulurken hata oluştu'
      });
    }
  }
});

// Create town president user endpoint
router.post('/town-president-users', async (req, res) => {
  const { townId, townName, chairmanName, chairmanPhone } = req.body;
  
  try {
    if (!townId || !townName || !chairmanName || !chairmanPhone) {
      return res.status(400).json({
        success: false,
        message: 'Tüm alanlar zorunludur'
      });
    }

    // Check if user already exists for this town
    const existingUser = await MemberUser.getUserByCredentialsUpdated(
      townName.toLowerCase().replace(/\s+/g, '_'), 
      chairmanPhone.replace(/\D/g, '')
    );
    
    if (existingUser && existingUser.user_type === 'town_president') {
      return res.status(400).json({
        success: false,
        message: 'Bu belde için zaten bir başkan kullanıcısı oluşturulmuş'
      });
    }

    // Create town president user
    const newUser = await MemberUser.createTownPresidentUser(townId, townName, chairmanName, chairmanPhone);
    
    res.json({
      success: true,
      message: 'Belde başkanı kullanıcısı başarıyla oluşturuldu',
      user: newUser
    });
  } catch (error) {
    console.error('Create town president user error:', error);
    if (error.message.includes('UNIQUE constraint failed')) {
      res.status(400).json({
        success: false,
        message: 'Bu kullanıcı adı zaten kullanılıyor'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Belde başkanı kullanıcısı oluşturulurken hata oluştu'
      });
    }
  }
});

// Update all user credentials based on current member/district/town data
router.post('/update-all-credentials', async (req, res) => {
  try {
    const results = {
      memberUsers: { updated: 0, errors: [] },
      districtPresidents: { updated: 0, errors: [] },
      townPresidents: { updated: 0, errors: [] }
    };

    // Update member users - Check all active members and create/update users
    try {
      const { decryptField } = require('../utils/crypto');
      
      // Get all active (non-archived) members
      console.log('Starting member users update...');
      const allMembers = await db.all('SELECT * FROM members WHERE archived = 0');
      console.log(`Found ${allMembers.length} active members`);
      
      for (const member of allMembers) {
        try {
          const tc = decryptField(member.tc);
          const phone = decryptField(member.phone);
          const username = tc; // Username should be TC
          const password = phone.replace(/\D/g, ''); // Normalize password (remove non-digits)
          
          // Check if user exists for this member
          const existingUser = await MemberUser.getUserByMemberId(member.id);
          
          if (existingUser) {
            // Always update existing user to ensure username is TC and password is phone
            // This fixes any incorrect usernames (e.g., encrypted TC instead of plain TC)
            await MemberUser.updateMemberUser(member.id, tc, phone);
            results.memberUsers.updated++;
            console.log(`Updated member user for member ID ${member.id} (username: ${username})`);
          } else {
            // Create new user if doesn't exist
            // Check if username already exists (might be taken by another member or user type)
            const userWithSameUsername = await new Promise((resolve, reject) => {
              db.get('SELECT * FROM member_users WHERE username = ? AND (member_id IS NULL OR member_id != ?)', [username, member.id], (err, row) => {
                if (err) reject(err);
                else resolve(row);
              });
            });
            
            if (!userWithSameUsername) {
              await MemberUser.createMemberUser(member.id, username, password);
              results.memberUsers.updated++;
              console.log(`Created member user for member ID ${member.id} (username: ${username})`);
            } else {
              // If username exists but for different member, try to update that user or create with member_id
              results.memberUsers.errors.push(`Member ID ${member.id}: Username ${username} already taken by another user`);
            }
          }
        } catch (error) {
          console.error(`Error processing member ID ${member.id}:`, error);
          results.memberUsers.errors.push(`Member ID ${member.id}: ${error.message}`);
        }
      }
    } catch (error) {
      console.error('General error in member users update:', error);
      results.memberUsers.errors.push(`General error: ${error.message}`);
    }

    // Update district presidents - Check all district officials and create/update users
    try {
      console.log('Starting district presidents update...');
      const districtOfficials = await db.all('SELECT * FROM district_officials WHERE chairman_name IS NOT NULL AND chairman_phone IS NOT NULL');
      console.log(`Found ${districtOfficials.length} district officials with chairman info`);
      for (const official of districtOfficials) {
        try {
          const district = await db.get('SELECT * FROM districts WHERE id = ?', [official.district_id]);
          if (district) {
            const existingUser = await MemberUser.getUserByDistrictId(official.district_id);
            if (existingUser) {
              // Update existing user
              await MemberUser.updateDistrictPresidentUser(
                official.district_id,
                district.name,
                official.chairman_name,
                official.chairman_phone
              );
              results.districtPresidents.updated++;
              console.log(`Updated district president user for district ID ${official.district_id}`);
            } else {
              // Create new user if doesn't exist
              await MemberUser.createDistrictPresidentUser(
                official.district_id,
                district.name,
                official.chairman_name,
                official.chairman_phone
              );
              results.districtPresidents.updated++;
              console.log(`Created district president user for district ID ${official.district_id}`);
            }
          }
        } catch (error) {
          results.districtPresidents.errors.push(`District ID ${official.district_id}: ${error.message}`);
        }
      }
    } catch (error) {
      results.districtPresidents.errors.push(`General error: ${error.message}`);
    }

    // Update town presidents - Check all town officials and create/update users
    // For town presidents: username is normalized town name, password is chairman phone (normalized)
    try {
      console.log('Starting town presidents update...');
      const townOfficials = await db.all('SELECT * FROM town_officials WHERE chairman_name IS NOT NULL AND chairman_phone IS NOT NULL');
      console.log(`Found ${townOfficials.length} town officials with chairman info`);
      for (const official of townOfficials) {
        try {
          const town = await db.get('SELECT * FROM towns WHERE id = ?', [official.town_id]);
          if (town) {
            const existingUser = await MemberUser.getUserByTownId(official.town_id);
            if (existingUser) {
              // Always update existing user to ensure credentials match current town/chairman info
              await MemberUser.updateTownPresidentUser(
                official.town_id,
                town.name,
                official.chairman_name,
                official.chairman_phone
              );
              results.townPresidents.updated++;
              console.log(`Updated town president user for town ID ${official.town_id} (town: ${town.name})`);
            } else {
              // Create new user if doesn't exist
              await MemberUser.createTownPresidentUser(
                official.town_id,
                town.name,
                official.chairman_name,
                official.chairman_phone
              );
              results.townPresidents.updated++;
              console.log(`Created town president user for town ID ${official.town_id} (town: ${town.name})`);
            }
          }
        } catch (error) {
          results.townPresidents.errors.push(`Town ID ${official.town_id}: ${error.message}`);
        }
      }
    } catch (error) {
      results.townPresidents.errors.push(`General error: ${error.message}`);
    }

    // Clean up orphaned users - users that don't belong to any active member or town/district president
    try {
      const { decryptField } = require('../utils/crypto');
      let deletedCount = 0;
      const deletedErrors = [];
      
      // Get all member_users
      const allUsers = await MemberUser.getAll();
      
      for (const user of allUsers) {
        try {
          let shouldDelete = false;
          let reason = '';
          
          if (user.user_type === 'member') {
            // For member type users, must have a valid member_id and active member
            if (!user.member_id) {
              // No member_id means orphaned user
              shouldDelete = true;
              reason = `Member user has no member_id`;
            } else {
              // Check if member exists and is not archived
              const member = await db.get('SELECT * FROM members WHERE id = ? AND archived = 0', [user.member_id]);
              if (!member) {
                shouldDelete = true;
                reason = `Member ID ${user.member_id} does not exist or is archived`;
              }
            }
          } else if (user.user_type === 'town_president') {
            if (!user.town_id) {
              // No town_id means orphaned user
              shouldDelete = true;
              reason = `Town president user has no town_id`;
            } else {
              // Check if town official exists with chairman info
              const townOfficial = await db.get(
                'SELECT * FROM town_officials WHERE town_id = ? AND chairman_name IS NOT NULL AND chairman_phone IS NOT NULL',
                [user.town_id]
              );
              if (!townOfficial) {
                shouldDelete = true;
                reason = `Town ID ${user.town_id} does not have a chairman`;
              }
            }
          } else if (user.user_type === 'district_president') {
            if (!user.district_id) {
              // No district_id means orphaned user
              shouldDelete = true;
              reason = `District president user has no district_id`;
            } else {
              // Check if district official exists with chairman info
              const districtOfficial = await db.get(
                'SELECT * FROM district_officials WHERE district_id = ? AND chairman_name IS NOT NULL AND chairman_phone IS NOT NULL',
                [user.district_id]
              );
              if (!districtOfficial) {
                shouldDelete = true;
                reason = `District ID ${user.district_id} does not have a chairman`;
              }
            }
          }
          
          if (shouldDelete) {
            await MemberUser.deleteUser(user.id);
            deletedCount++;
            console.log(`Deleted orphaned user ID ${user.id} (${user.user_type}): ${reason}`);
          }
        } catch (error) {
          deletedErrors.push(`User ID ${user.id}: ${error.message}`);
        }
      }
      
      results.cleaned = { deleted: deletedCount, errors: deletedErrors };
      console.log(`Cleaned up ${deletedCount} orphaned users`);
    } catch (error) {
      console.error('Error cleaning up orphaned users:', error);
      results.cleaned = { deleted: 0, errors: [`General error: ${error.message}`] };
    }

    res.json({
      success: true,
      message: 'Kullanıcı bilgileri güncellendi',
      results
    });
  } catch (error) {
    console.error('Error updating all credentials:', error);
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
});

module.exports = router;