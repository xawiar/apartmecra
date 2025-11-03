const db = require('../config/database');
const MemberUser = require('../models/MemberUser');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../uploads/documents');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

class ArchiveController {
  // Upload document middleware
  static uploadDocument = upload.single('document');

  // Get all documents
  static async getDocuments(req, res) {
    try {
      const documents = await db.all('SELECT * FROM documents ORDER BY created_at DESC');
      res.json(documents);
    } catch (error) {
      res.status(500).json({ message: 'Belgeler getirilirken hata oluştu' });
    }
  }

  // Upload a new document
  static async uploadDocumentHandler(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'Dosya bulunamadı. Lütfen bir dosya seçin.' });
      }

      const { name, description } = req.body;
      
      // Save document info to database
      const result = await db.run(
        'INSERT INTO documents (name, description, filename, path, mimetype, size) VALUES (?, ?, ?, ?, ?, ?)',
        [
          name || req.file.originalname,
          description || '',
          req.file.filename,
          req.file.path,
          req.file.mimetype,
          req.file.size
        ]
      );

      res.status(201).json({
        id: result.lastID,
        name: name || req.file.originalname,
        description: description || '',
        filename: req.file.filename,
        path: req.file.path,
        mimetype: req.file.mimetype,
        size: req.file.size
      });
    } catch (error) {
      res.status(500).json({ message: 'Belge yüklenirken hata oluştu' });
    }
  }

  // Download a document
  static async downloadDocument(req, res) {
    try {
      const { id } = req.params;
      
      // Get document info from database
      const document = await db.get('SELECT * FROM documents WHERE id = ?', [id]);
      
      if (!document) {
        return res.status(404).json({ message: 'Belge bulunamadı' });
      }
      
      // Check if file exists
      if (!fs.existsSync(document.path)) {
        return res.status(404).json({ message: 'Dosya bulunamadı' });
      }
      
      // Set headers for download
      res.setHeader('Content-Disposition', `attachment; filename="${document.filename}"`);
      res.setHeader('Content-Type', document.mimetype);
      
      // Send file
      res.sendFile(path.resolve(document.path));
    } catch (error) {
      res.status(500).json({ message: 'Belge indirilirken hata oluştu' });
    }
  }

  // Delete a document
  static async deleteDocument(req, res) {
    try {
      const { id } = req.params;
      
      // Get document info from database
      const document = await db.get('SELECT * FROM documents WHERE id = ?', [id]);
      
      if (!document) {
        return res.status(404).json({ message: 'Belge bulunamadı' });
      }
      
      // Delete file from filesystem
      if (fs.existsSync(document.path)) {
        fs.unlinkSync(document.path);
      }
      
      // Delete from database
      await db.run('DELETE FROM documents WHERE id = ?', [id]);
      
      res.json({ message: 'Belge başarıyla silindi' });
    } catch (error) {
      res.status(500).json({ message: 'Belge silinirken hata oluştu' });
    }
  }

  // Delete an archived member permanently
  static async deleteArchivedMember(req, res) {
    try {
      const { id } = req.params;
      
      // Check if member exists and is archived
      const member = await db.get('SELECT * FROM members WHERE id = ? AND archived = 1', [id]);
      
      if (!member) {
        return res.status(404).json({ message: 'Arşivlenmiş üye bulunamadı' });
      }
      
      // Delete associated member_user first (if exists)
      try {
        const memberUser = await MemberUser.getUserByMemberId(parseInt(id));
        if (memberUser) {
          await MemberUser.deleteUser(memberUser.id);
          console.log(`Member user deleted for member ID ${id} (user ID: ${memberUser.id})`);
        } else {
          console.log(`No member user found for member ID ${id}`);
        }
      } catch (userError) {
        console.error(`Error deleting member user for member ID ${id}:`, userError);
        // Continue with member deletion even if user deletion fails
      }
      
      // Also check and delete by username in case member_id is NULL or incorrect
      try {
        const { decryptField } = require('../utils/crypto');
        const tc = decryptField(member.tc);
        const usersByUsername = await new Promise((resolve, reject) => {
          db.all('SELECT * FROM member_users WHERE username = ? AND user_type = ?', [tc, 'member'], (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
          });
        });
        
        for (const user of usersByUsername) {
          if (user.member_id === parseInt(id) || !user.member_id) {
            try {
              await MemberUser.deleteUser(user.id);
              console.log(`Additional member user deleted (ID: ${user.id}) by username for member ID ${id}`);
            } catch (err) {
              console.error(`Error deleting additional member user ${user.id}:`, err);
            }
          }
        }
      } catch (usernameError) {
        console.error(`Error checking member users by username for member ID ${id}:`, usernameError);
        // Continue even if this fails
      }
      
      // Delete member from database
      await db.run('DELETE FROM members WHERE id = ?', [id]);
      
      // Also remove from in-memory archived members collection
      db.delete('archivedMembers', parseInt(id));
      
      res.json({ message: 'Arşivlenmiş üye başarıyla silindi' });
    } catch (error) {
      console.error('Error deleting archived member:', error);
      res.status(500).json({ message: 'Arşivlenmiş üye silinirken hata oluştu' });
    }
  }

  // Delete an archived meeting permanently
  static async deleteArchivedMeeting(req, res) {
    try {
      const { id } = req.params;
      
      // Check if meeting exists and is archived
      const meeting = await db.get('SELECT * FROM meetings WHERE id = ? AND archived = 1', [id]);
      
      if (!meeting) {
        return res.status(404).json({ message: 'Arşivlenmiş toplantı bulunamadı' });
      }
      
      // Delete meeting from database
      await db.run('DELETE FROM meetings WHERE id = ?', [id]);
      
      // Also remove from in-memory archived meetings collection
      db.delete('archivedMeetings', parseInt(id));
      
      res.json({ message: 'Arşivlenmiş toplantı başarıyla silindi' });
    } catch (error) {
      console.error('Error deleting archived meeting:', error);
      res.status(500).json({ message: 'Arşivlenmiş toplantı silinirken hata oluştu' });
    }
  }

  // Clear all archived members - SIMPLIFIED VERSION
  static async clearArchivedMembers(req, res) {
    try {
      // Get all archived member IDs before deletion
      const archivedMembers = await db.all('SELECT id FROM members WHERE archived = 1');
      
      // Delete associated member_users for archived members
      for (const member of archivedMembers) {
        try {
          const memberUser = await MemberUser.getUserByMemberId(member.id);
          if (memberUser) {
            await MemberUser.deleteUser(memberUser.id);
          }
        } catch (userError) {
          console.error(`Error deleting member user for member ID ${member.id}:`, userError);
          // Continue with other members even if one fails
        }
      }
      
      // Delete all archived members from database
      await db.run('DELETE FROM members WHERE archived = 1');
      
      // Clear archived members from in-memory collection
      const memArchivedMembers = db.get('archivedMembers');
      if (memArchivedMembers && Array.isArray(memArchivedMembers)) {
        memArchivedMembers.length = 0;
      }
      
      res.json({ message: 'Arşivlenmiş üyeler başarıyla temizlendi' });
    } catch (error) {
      console.error('Error clearing archived members:', error);
      res.status(500).json({ message: 'Arşivlenmiş üyeler temizlenirken hata oluştu' });
    }
  }

  // Clear all archived meetings - SIMPLIFIED VERSION
  static async clearArchivedMeetings(req, res) {
    try {
      // Delete all archived meetings from database
      await db.run('DELETE FROM meetings WHERE archived = 1');
      
      // Clear archived meetings from in-memory collection
      const archivedMeetings = db.get('archivedMeetings');
      if (archivedMeetings && Array.isArray(archivedMeetings)) {
        archivedMeetings.length = 0;
      }
      
      res.json({ message: 'Arşivlenmiş toplantılar başarıyla temizlendi' });
    } catch (error) {
      console.error('Error clearing archived meetings:', error);
      res.status(500).json({ message: 'Arşivlenmiş toplantılar temizlenirken hata oluştu' });
    }
  }

  // Clear all documents - SIMPLIFIED VERSION
  static async clearDocuments(req, res) {
    try {
      // Get all documents to delete files from filesystem
      const documents = await db.all('SELECT * FROM documents');
      
      // Delete all files from filesystem
      for (const document of documents) {
        try {
          if (fs.existsSync(document.path)) {
            fs.unlinkSync(document.path);
          }
        } catch (fileError) {
          // Continue with other files even if one fails
        }
      }
      
      // Delete all documents from database
      await db.run('DELETE FROM documents');
      
      res.json({ message: 'Tüm belgeler başarıyla temizlendi' });
    } catch (error) {
      console.error('Error clearing documents:', error);
      res.status(500).json({ message: 'Belgeler temizlenirken hata oluştu' });
    }
  }

  // Clear all archived events
  static async clearArchivedEvents(req, res) {
    try {
      await db.run('DELETE FROM events WHERE archived = 1');
      try {
        const { invalidate } = require('../middleware/cache');
        invalidate('/api/events');
      } catch (_) {}
      res.json({ message: 'Arşivlenmiş etkinlikler başarıyla temizlendi' });
    } catch (error) {
      console.error('Error clearing archived events:', error);
      res.status(500).json({ message: 'Arşivlenmiş etkinlikler temizlenirken hata oluştu' });
    }
  }
}

module.exports = ArchiveController;