const db = require('../config/database');

class Message {
  static init() {
    return new Promise((resolve, reject) => {
      const sql = `
        CREATE TABLE IF NOT EXISTS messages (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          sender_id INTEGER NOT NULL,
          receiver_id INTEGER,
          group_id INTEGER,
          message TEXT NOT NULL,
          message_type TEXT DEFAULT 'text',
          file_path TEXT,
          is_read BOOLEAN DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (sender_id) REFERENCES member_users (id) ON DELETE CASCADE,
          FOREIGN KEY (receiver_id) REFERENCES member_users (id) ON DELETE CASCADE,
          FOREIGN KEY (group_id) REFERENCES message_groups (id) ON DELETE CASCADE
        )
      `;
      
      db.run(sql, (err) => {
        if (err) {
          console.error('Error creating messages table:', err);
          reject(err);
        } else {
          console.log('Messages table created successfully');
          resolve();
        }
      });
    });
  }

  static async create(messageData) {
    return new Promise((resolve, reject) => {
      const { senderId, receiverId, groupId, message, messageType = 'text', filePath } = messageData;
      
      const sql = `
        INSERT INTO messages (sender_id, receiver_id, group_id, message, message_type, file_path)
        VALUES (?, ?, ?, ?, ?, ?)
      `;
      
      db.run(sql, [senderId, receiverId, groupId, message, messageType, filePath], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: this.lastID, ...messageData });
        }
      });
    });
  }

  static async getByGroupId(groupId, limit = 50, offset = 0) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT m.*, mu.username, mu.chairman_name, mu.user_type
        FROM messages m
        LEFT JOIN member_users mu ON m.sender_id = mu.id
        WHERE m.group_id = ?
        ORDER BY m.created_at DESC
        LIMIT ? OFFSET ?
      `;
      
      db.all(sql, [groupId, limit, offset], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows.reverse()); // Reverse to show oldest first
        }
      });
    });
  }

  static async getByUserId(userId, limit = 50, offset = 0) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT m.*, mu.username, mu.chairman_name, mu.user_type
        FROM messages m
        LEFT JOIN member_users mu ON m.sender_id = mu.id
        WHERE m.receiver_id = ? OR m.sender_id = ?
        ORDER BY m.created_at DESC
        LIMIT ? OFFSET ?
      `;
      
      db.all(sql, [userId, userId, limit, offset], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows.reverse());
        }
      });
    });
  }

  static async markAsRead(messageId, userId) {
    return new Promise((resolve, reject) => {
      const sql = `
        UPDATE messages 
        SET is_read = 1 
        WHERE id = ? AND receiver_id = ?
      `;
      
      db.run(sql, [messageId, userId], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ changes: this.changes });
        }
      });
    });
  }

  static async getUnreadCount(userId) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT COUNT(*) as count
        FROM messages
        WHERE receiver_id = ? AND is_read = 0
      `;
      
      db.get(sql, [userId], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row.count);
        }
      });
    });
  }

  static async delete(messageId, userId) {
    return new Promise((resolve, reject) => {
      const sql = `
        DELETE FROM messages 
        WHERE id = ? AND sender_id = ?
      `;
      
      db.run(sql, [messageId, userId], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ changes: this.changes });
        }
      });
    });
  }
}

module.exports = Message;
