const db = require('../config/database');

const PositionPermission = {
  init() {
    return new Promise((resolve, reject) => {
      db.run(
        `CREATE TABLE IF NOT EXISTS position_permissions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          position TEXT NOT NULL,
          permission TEXT NOT NULL
        )`,
        (err) => {
          if (err) return reject(err);
          resolve();
        }
      );
    });
  },

  async getAll() {
    return db.all('SELECT position, permission FROM position_permissions');
  },

  async getByPosition(position) {
    return db.all('SELECT permission FROM position_permissions WHERE position = ?', [position]);
  },

  async setForPosition(position, permissions) {
    await db.run('DELETE FROM position_permissions WHERE position = ?', [position]);
    for (const p of permissions) {
      await db.run('INSERT INTO position_permissions (position, permission) VALUES (?, ?)', [position, p]);
    }
  }
};

module.exports = PositionPermission;


