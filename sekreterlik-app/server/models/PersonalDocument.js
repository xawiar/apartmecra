const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class PersonalDocument {
  static init() {
    return new Promise((resolve, reject) => {
      const dbPath = path.join(__dirname, '../database.sqlite');
      const db = new sqlite3.Database(dbPath);
      
      const createTableQuery = `
        CREATE TABLE IF NOT EXISTS personal_documents (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          member_id INTEGER NOT NULL,
          document_type TEXT NOT NULL,
          document_name TEXT NOT NULL,
          file_path TEXT NOT NULL,
          file_size INTEGER,
          mime_type TEXT,
          uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (member_id) REFERENCES members (id) ON DELETE CASCADE
        )
      `;
      
      db.run(createTableQuery, (err) => {
        if (err) {
          console.error('Error creating personal_documents table:', err);
          reject(err);
        } else {
          console.log('Personal documents table created successfully');
          resolve();
        }
        db.close();
      });
    });
  }

  static create(memberId, documentData) {
    return new Promise((resolve, reject) => {
      const dbPath = path.join(__dirname, '../database.sqlite');
      const db = new sqlite3.Database(dbPath);
      
      const { document_type, document_name, file_path, file_size, mime_type } = documentData;
      
      const query = `
        INSERT INTO personal_documents 
        (member_id, document_type, document_name, file_path, file_size, mime_type)
        VALUES (?, ?, ?, ?, ?, ?)
      `;
      
      db.run(query, [memberId, document_type, document_name, file_path, file_size, mime_type], function(err) {
        if (err) {
          console.error('Error creating personal document:', err);
          reject(err);
        } else {
          resolve({ id: this.lastID, ...documentData, member_id: memberId });
        }
        db.close();
      });
    });
  }

  static getByMemberId(memberId) {
    return new Promise((resolve, reject) => {
      const dbPath = path.join(__dirname, '../database.sqlite');
      const db = new sqlite3.Database(dbPath);
      
      const query = 'SELECT * FROM personal_documents WHERE member_id = ? ORDER BY uploaded_at DESC';
      
      db.all(query, [memberId], (err, rows) => {
        if (err) {
          console.error('Error fetching personal documents:', err);
          reject(err);
        } else {
          resolve(rows);
        }
        db.close();
      });
    });
  }

  static getById(id) {
    return new Promise((resolve, reject) => {
      const dbPath = path.join(__dirname, '../database.sqlite');
      const db = new sqlite3.Database(dbPath);
      
      const query = 'SELECT * FROM personal_documents WHERE id = ?';
      
      db.get(query, [id], (err, row) => {
        if (err) {
          console.error('Error fetching personal document:', err);
          reject(err);
        } else {
          resolve(row);
        }
        db.close();
      });
    });
  }

  static delete(id) {
    return new Promise((resolve, reject) => {
      const dbPath = path.join(__dirname, '../database.sqlite');
      const db = new sqlite3.Database(dbPath);
      
      const query = 'DELETE FROM personal_documents WHERE id = ?';
      
      db.run(query, [id], function(err) {
        if (err) {
          console.error('Error deleting personal document:', err);
          reject(err);
        } else {
          resolve({ deleted: this.changes > 0 });
        }
        db.close();
      });
    });
  }

  static getDocumentTypes() {
    return [
      { value: 'ikametgah', label: 'İkametgah Belgesi' },
      { value: 'adli_sicil', label: 'Adli Sicil Belgesi' },
      { value: 'kimlik_fotokopi', label: 'Kimlik Fotokopisi' },
      { value: 'diploma', label: 'Diploma' },
      { value: 'sertifika', label: 'Sertifika' }
    ];
  }
}

module.exports = PersonalDocument;
