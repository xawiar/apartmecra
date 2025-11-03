const db = require('../config/database');

class MessageGroup {
  static init() {
    return new Promise((resolve, reject) => {
      const sql = `
        CREATE TABLE IF NOT EXISTS message_groups (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          description TEXT,
          group_type TEXT DEFAULT 'general',
          created_by INTEGER NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          is_active BOOLEAN DEFAULT 1,
          FOREIGN KEY (created_by) REFERENCES member_users (id) ON DELETE CASCADE
        )
      `;
      
      db.run(sql, (err) => {
        if (err) {
          console.error('Error creating message_groups table:', err);
          reject(err);
        } else {
          console.log('Message groups table created successfully');
          resolve();
        }
      });
    });
  }

  static async create(groupData) {
    return new Promise((resolve, reject) => {
      const { name, description, groupType = 'general', createdBy } = groupData;
      
      const sql = `
        INSERT INTO message_groups (name, description, group_type, created_by)
        VALUES (?, ?, ?, ?)
      `;
      
      db.run(sql, [name, description, groupType, createdBy], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: this.lastID, ...groupData });
        }
      });
    });
  }

  static async getAll() {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT mg.*, mu.username as created_by_username, mu.chairman_name as created_by_name
        FROM message_groups mg
        LEFT JOIN member_users mu ON mg.created_by = mu.id
        WHERE mg.is_active = 1
        ORDER BY mg.created_at DESC
      `;
      
      db.all(sql, [], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  static async getById(id) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT mg.*, mu.username as created_by_username, mu.chairman_name as created_by_name
        FROM message_groups mg
        LEFT JOIN member_users mu ON mg.created_by = mu.id
        WHERE mg.id = ? AND mg.is_active = 1
      `;
      
      db.get(sql, [id], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  static async update(id, groupData) {
    return new Promise((resolve, reject) => {
      const { name, description, groupType } = groupData;
      
      const sql = `
        UPDATE message_groups 
        SET name = ?, description = ?, group_type = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;
      
      db.run(sql, [name, description, groupType, id], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ changes: this.changes });
        }
      });
    });
  }

  static async delete(id) {
    return new Promise((resolve, reject) => {
      const sql = `
        UPDATE message_groups 
        SET is_active = 0, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;
      
      db.run(sql, [id], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ changes: this.changes });
        }
      });
    });
  }

  static async getGeneralGroup() {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT * FROM message_groups 
        WHERE group_type = 'general' AND is_active = 1
        LIMIT 1
      `;
      
      db.get(sql, [], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }
}

module.exports = MessageGroup;
