const db = require('../config/database');

class PushSubscription {
  static init() {
    return new Promise((resolve, reject) => {
      const sql = `
        CREATE TABLE IF NOT EXISTS push_subscriptions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          endpoint TEXT NOT NULL,
          p256dh TEXT NOT NULL,
          auth TEXT NOT NULL,
          user_agent TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          is_active BOOLEAN DEFAULT 1,
          FOREIGN KEY (user_id) REFERENCES member_users (id) ON DELETE CASCADE
        )
      `;
      
      db.run(sql, (err) => {
        if (err) {
          console.error('Error creating push_subscriptions table:', err);
          reject(err);
        } else {
          console.log('Push subscriptions table created successfully');
          resolve();
        }
      });
    });
  }

  static async create(subscriptionData) {
    return new Promise((resolve, reject) => {
      const { userId, endpoint, p256dh, auth, userAgent } = subscriptionData;
      
      const sql = `
        INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth, user_agent)
        VALUES (?, ?, ?, ?, ?)
      `;
      
      db.run(sql, [userId, endpoint, p256dh, auth, userAgent], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: this.lastID, ...subscriptionData });
        }
      });
    });
  }

  static async getByUserId(userId) {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM push_subscriptions WHERE user_id = ? AND is_active = 1';
      
      db.all(sql, [userId], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  static async getAll() {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT ps.*, mu.username, mu.chairman_name, mu.user_type
        FROM push_subscriptions ps
        LEFT JOIN member_users mu ON ps.user_id = mu.id
        WHERE ps.is_active = 1
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

  static async update(userId, subscriptionData) {
    return new Promise((resolve, reject) => {
      const { endpoint, p256dh, auth, userAgent } = subscriptionData;
      
      const sql = `
        UPDATE push_subscriptions 
        SET endpoint = ?, p256dh = ?, auth = ?, user_agent = ?, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ? AND is_active = 1
      `;
      
      db.run(sql, [endpoint, p256dh, auth, userAgent, userId], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ changes: this.changes });
        }
      });
    });
  }

  static async delete(userId) {
    return new Promise((resolve, reject) => {
      const sql = 'UPDATE push_subscriptions SET is_active = 0 WHERE user_id = ?';
      
      db.run(sql, [userId], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ changes: this.changes });
        }
      });
    });
  }

  static async deleteByEndpoint(endpoint) {
    return new Promise((resolve, reject) => {
      const sql = 'UPDATE push_subscriptions SET is_active = 0 WHERE endpoint = ?';
      
      db.run(sql, [endpoint], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ changes: this.changes });
        }
      });
    });
  }
}

module.exports = PushSubscription;
