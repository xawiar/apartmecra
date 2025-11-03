const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'database.sqlite');
const db = new sqlite3.Database(dbPath);

class MemberUser {
  // Initialize member_users table
  static init() {
    return new Promise((resolve, reject) => {
      db.run(`
        CREATE TABLE IF NOT EXISTS member_users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          member_id INTEGER,
          username TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          user_type TEXT DEFAULT 'member', -- 'member', 'district_president', 'town_president'
          district_id INTEGER,
          town_id INTEGER,
          is_active BOOLEAN DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (member_id) REFERENCES members (id) ON DELETE CASCADE,
          FOREIGN KEY (district_id) REFERENCES districts (id) ON DELETE CASCADE,
          FOREIGN KEY (town_id) REFERENCES towns (id) ON DELETE CASCADE
        )
      `, (err) => {
        if (err) {
          reject(err);
        } else {
          // Add new columns if they don't exist
          db.run(`ALTER TABLE member_users ADD COLUMN user_type TEXT DEFAULT 'member'`, () => {});
          db.run(`ALTER TABLE member_users ADD COLUMN district_id INTEGER`, () => {});
          db.run(`ALTER TABLE member_users ADD COLUMN town_id INTEGER`, () => {});
          db.run(`ALTER TABLE member_users ADD COLUMN chairman_name TEXT`, () => {});
          // Backfill NULL is_active values to 1 to ensure active logins
          db.run(`UPDATE member_users SET is_active = 1 WHERE is_active IS NULL`, () => {});
          resolve();
        }
      });
    });
  }

  // Create user for a member
  static createMemberUser(memberId, username, password) {
    return new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO member_users (member_id, username, password) VALUES (?, ?, ?)',
        [memberId, username, password],
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({ id: this.lastID, member_id: memberId, username, password });
          }
        }
      );
    });
  }

  // Get user by username and password
  static getUserByCredentials(username, password) {
    return new Promise((resolve, reject) => {
      db.get(
        'SELECT mu.*, m.name, m.region, m.position FROM member_users mu JOIN members m ON mu.member_id = m.id WHERE mu.username = ? AND mu.password = ? AND mu.is_active = 1',
        [username, password],
        (err, row) => {
          if (err) {
            reject(err);
          } else if (row) {
            resolve(row);
          } else {
            resolve(null);
          }
        }
      );
    });
  }

  // Get user by member ID
  static getUserByMemberId(memberId) {
    return new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM member_users WHERE member_id = ?',
        [memberId],
        (err, row) => {
          if (err) {
            reject(err);
          } else if (row) {
            resolve(row);
          } else {
            resolve(null);
          }
        }
      );
    });
  }

  // Get all member users with member info
  // Only show users for members that still exist (not deleted/archived)
  // or users without member_id (district/town presidents)
  static getAllMemberUsers() {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT mu.*, 
         COALESCE(m.name, mu.chairman_name) as name,
         COALESCE(m.region, mu.region) as region,
         COALESCE(m.position, mu.position) as position
         FROM member_users mu 
         LEFT JOIN members m ON mu.member_id = m.id 
         WHERE mu.member_id IS NULL 
            OR (mu.member_id IS NOT NULL AND m.id IS NOT NULL AND m.archived = 0)
         ORDER BY mu.created_at DESC`,
        (err, rows) => {
          if (err) {
            reject(err);
          } else {
            // Ensure is_active is properly set (default to 1 if null)
            const processedRows = rows.map(row => ({
              ...row,
              is_active: row.is_active !== null ? row.is_active : 1
            }));
            resolve(processedRows);
          }
        }
      );
    });
  }

  // Get all users (all types)
  static getAll() {
    return new Promise((resolve, reject) => {
      db.all(`
        SELECT mu.*, m.name, m.region, m.position,
               d.name as district_name, t.name as town_name
        FROM member_users mu
        LEFT JOIN members m ON mu.member_id = m.id
        LEFT JOIN districts d ON mu.district_id = d.id
        LEFT JOIN towns t ON mu.town_id = t.id
        ORDER BY mu.created_at DESC
      `, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          // Ensure is_active is properly set (default to 1 if null)
          const processedRows = rows.map(row => ({
            ...row,
            is_active: row.is_active !== null ? row.is_active : 1
          }));
          resolve(processedRows);
        }
      });
    });
  }

  // Update user credentials
  static updateUserCredentials(userId, username, password) {
    return new Promise((resolve, reject) => {
      db.run(
        'UPDATE member_users SET username = ?, password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [username, password, userId],
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({ id: userId, username, password });
          }
        }
      );
    });
  }

  // Toggle user active status
  static toggleUserStatus(userId) {
    return new Promise((resolve, reject) => {
      db.run(
        'UPDATE member_users SET is_active = NOT is_active, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [userId],
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({ id: userId });
          }
        }
      );
    });
  }

  // Delete user
  static deleteUser(userId) {
    return new Promise((resolve, reject) => {
      db.run(
        'DELETE FROM member_users WHERE id = ?',
        [userId],
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({ id: userId });
          }
        }
      );
    });
  }

  // Generate username from TC (TC kimlik numarası)
  static generateUsername(tc) {
    return tc; // TC kimlik numarasını kullanıcı adı olarak kullan
  }

  // Generate password from phone number (telefon numarası)
  static generatePassword(phone) {
    // Telefon numarasından sadece rakamları al
    return phone.replace(/\D/g, '');
  }

  // Normalize username by converting to lowercase and replacing Turkish characters
  static normalizeUsername(name) {
    if (!name) return '';
    
    return name
      .toLowerCase()
      .replace(/ç/g, 'c')
      .replace(/ğ/g, 'g')
      .replace(/ı/g, 'i')
      .replace(/ö/g, 'o')
      .replace(/ş/g, 's')
      .replace(/ü/g, 'u')
      .replace(/İ/g, 'i')
      .replace(/Ç/g, 'c')
      .replace(/Ğ/g, 'g')
      .replace(/Ö/g, 'o')
      .replace(/Ş/g, 's')
      .replace(/Ü/g, 'u')
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '');
  }

  // Create user for district president
  static createDistrictPresidentUser(districtId, districtName, chairmanName, chairmanPhone) {
    return new Promise((resolve, reject) => {
      const username = MemberUser.normalizeUsername(districtName);
      const password = chairmanPhone.replace(/\D/g, '');
      
      db.run(
        'INSERT INTO member_users (username, password, user_type, district_id, chairman_name) VALUES (?, ?, ?, ?, ?)',
        [username, password, 'district_president', districtId, chairmanName],
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({ 
              id: this.lastID, 
              username, 
              password, 
              user_type: 'district_president',
              district_id: districtId,
              chairman_name: chairmanName
            });
          }
        }
      );
    });
  }

  // Create user for town president
  static createTownPresidentUser(townId, townName, chairmanName, chairmanPhone) {
    return new Promise((resolve, reject) => {
      const username = MemberUser.normalizeUsername(townName);
      const password = chairmanPhone.replace(/\D/g, '');
      
      db.run(
        'INSERT INTO member_users (username, password, user_type, town_id, chairman_name) VALUES (?, ?, ?, ?, ?)',
        [username, password, 'town_president', townId, chairmanName],
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({ 
              id: this.lastID, 
              username, 
              password, 
              user_type: 'town_president',
              town_id: townId,
              chairman_name: chairmanName
            });
          }
        }
      );
    });
  }

  // Get user by credentials (updated to handle all user types)
  static getUserByCredentialsUpdated(username, password) {
    return new Promise((resolve, reject) => {
      db.get(`
        SELECT mu.*, 
               m.name, m.region, m.position,
               d.name as district_name,
               t.name as town_name
        FROM member_users mu 
        LEFT JOIN members m ON mu.member_id = m.id 
        LEFT JOIN districts d ON mu.district_id = d.id
        LEFT JOIN towns t ON mu.town_id = t.id
        WHERE mu.username = ? AND mu.password = ? AND mu.is_active = 1
      `, [username, password], (err, row) => {
        if (err) {
          reject(err);
        } else if (row) {
          resolve(row);
        } else {
          resolve(null);
        }
      });
    });
  }

  // Update district president user credentials when district info changes
  static updateDistrictPresidentUser(districtId, districtName, chairmanName, chairmanPhone) {
    return new Promise((resolve, reject) => {
      const newUsername = MemberUser.normalizeUsername(districtName);
      const newPassword = chairmanPhone.replace(/\D/g, '');
      
      db.run(
        'UPDATE member_users SET username = ?, password = ?, chairman_name = ?, updated_at = CURRENT_TIMESTAMP WHERE user_type = ? AND district_id = ?',
        [newUsername, newPassword, chairmanName, 'district_president', districtId],
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({ 
              id: this.lastID, 
              username: newUsername, 
              password: newPassword, 
              user_type: 'district_president',
              district_id: districtId,
              chairman_name: chairmanName
            });
          }
        }
      );
    });
  }

  // Update town president user credentials when town info changes
  static updateTownPresidentUser(townId, townName, chairmanName, chairmanPhone) {
    return new Promise((resolve, reject) => {
      const newUsername = MemberUser.normalizeUsername(townName);
      const newPassword = chairmanPhone.replace(/\D/g, '');
      
      console.log(`Updating town president user: townId=${townId}, newUsername=${newUsername}, newPassword=${newPassword}`);
      
      db.run(
        'UPDATE member_users SET username = ?, password = ?, chairman_name = ?, updated_at = CURRENT_TIMESTAMP WHERE user_type = ? AND town_id = ?',
        [newUsername, newPassword, chairmanName, 'town_president', townId],
        function(err) {
          if (err) {
            console.error('Error updating town president user:', err);
            reject(err);
          } else {
            console.log(`Town president user updated successfully. Rows affected: ${this.changes}`);
            resolve({ 
              id: this.lastID, 
              username: newUsername, 
              password: newPassword, 
              user_type: 'town_president',
              town_id: townId,
              chairman_name: chairmanName
            });
          }
        }
      );
    });
  }

  // Update member user credentials when member info changes
  static updateMemberUser(memberId, tc, phone) {
    return new Promise((resolve, reject) => {
      const newUsername = tc;
      const newPassword = phone.replace(/\D/g, '');
      
      db.run(
        'UPDATE member_users SET username = ?, password = ?, updated_at = CURRENT_TIMESTAMP WHERE member_id = ?',
        [newUsername, newPassword, memberId],
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({ 
              id: this.lastID, 
              username: newUsername, 
              password: newPassword, 
              member_id: memberId
            });
          }
        }
      );
    });
  }

  // Get user by district ID
  static getUserByDistrictId(districtId) {
    return new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM member_users WHERE user_type = ? AND district_id = ?',
        ['district_president', districtId],
        (err, row) => {
          if (err) {
            reject(err);
          } else if (row) {
            resolve(row);
          } else {
            resolve(null);
          }
        }
      );
    });
  }

  // Get user by town ID
  static getUserByTownId(townId) {
    return new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM member_users WHERE user_type = ? AND town_id = ?',
        ['town_president', townId],
        (err, row) => {
          if (err) {
            reject(err);
          } else if (row) {
            resolve(row);
          } else {
            resolve(null);
          }
        }
      );
    });
  }
}

module.exports = MemberUser;
