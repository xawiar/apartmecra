const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'database.sqlite');
const db = new sqlite3.Database(dbPath);

class Admin {
  // Initialize admin table
  static init() {
    return new Promise((resolve, reject) => {
      db.run(`
        CREATE TABLE IF NOT EXISTS admin (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) {
          reject(err);
        } else {
          // Check if admin exists, if not create default admin
          Admin.getAdmin().then(() => {
            resolve();
          }).catch(() => {
            // Admin doesn't exist, create default
            Admin.createAdmin('admin', 'admin').then(() => {
              resolve();
            }).catch(reject);
          });
        }
      });
    });
  }

  // Get admin credentials
  static getAdmin() {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM admin ORDER BY id LIMIT 1', (err, row) => {
        if (err) {
          reject(err);
        } else if (row) {
          resolve(row);
        } else {
          reject(new Error('Admin not found'));
        }
      });
    });
  }

  // Create admin
  static createAdmin(username, password) {
    return new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO admin (username, password) VALUES (?, ?)',
        [username, password],
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({ id: this.lastID, username, password });
          }
        }
      );
    });
  }

  // Update admin credentials
  static updateAdmin(username, password) {
    return new Promise((resolve, reject) => {
      db.run(
        'UPDATE admin SET username = ?, password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = 1',
        [username, password],
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({ username, password });
          }
        }
      );
    });
  }

  // Verify admin credentials
  static verifyAdmin(username, password) {
    return new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM admin WHERE username = ? AND password = ?',
        [username, password],
        (err, row) => {
          if (err) {
            reject(err);
          } else if (row) {
            resolve(true);
          } else {
            resolve(false);
          }
        }
      );
    });
  }
}

module.exports = Admin;
