const PersonalDocument = require('../models/PersonalDocument');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../uploads/personal-documents');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `document-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: function (req, file, cb) {
    // Allow only PDF files
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Sadece PDF dosyaları yüklenebilir'), false);
    }
  }
});

class PersonalDocumentController {
  static uploadMiddleware() {
    return upload.single('document');
  }

  static async create(req, res) {
    try {
      const { memberId } = req.params;
      const { document_type } = req.body;
      
      if (!req.file) {
        return res.status(400).json({ error: 'Dosya yüklenmedi' });
      }

      if (!document_type) {
        return res.status(400).json({ error: 'Belge türü belirtilmedi' });
      }

      // Check if member already has 5 documents
      const existingDocs = await PersonalDocument.getByMemberId(memberId);
      if (existingDocs.length >= 5) {
        // Delete uploaded file
        fs.unlinkSync(req.file.path);
        return res.status(400).json({ error: 'En fazla 5 belge yüklenebilir' });
      }

      // Check if document type already exists for this member
      const existingType = existingDocs.find(doc => doc.document_type === document_type);
      if (existingType) {
        // Delete uploaded file
        fs.unlinkSync(req.file.path);
        return res.status(400).json({ error: 'Bu belge türü zaten mevcut' });
      }

      const documentData = {
        document_type,
        document_name: req.file.originalname,
        file_path: req.file.path,
        file_size: req.file.size,
        mime_type: req.file.mimetype
      };

      const document = await PersonalDocument.create(memberId, documentData);
      
      res.status(201).json({
        message: 'Belge başarıyla yüklendi',
        document: {
          id: document.id,
          document_type: document.document_type,
          document_name: document.document_name,
          file_size: document.file_size,
          uploaded_at: document.uploaded_at
        }
      });
    } catch (error) {
      console.error('Error creating personal document:', error);
      res.status(500).json({ error: 'Belge yüklenirken hata oluştu' });
    }
  }

  static async getByMemberId(req, res) {
    try {
      const { memberId } = req.params;
      const documents = await PersonalDocument.getByMemberId(memberId);
      
      // Add document types info
      const documentTypes = PersonalDocument.getDocumentTypes();
      const documentsWithTypes = documents.map(doc => {
        const typeInfo = documentTypes.find(type => type.value === doc.document_type);
        return {
          ...doc,
          document_type_label: typeInfo ? typeInfo.label : doc.document_type
        };
      });

      res.json(documentsWithTypes);
    } catch (error) {
      console.error('Error fetching personal documents:', error);
      res.status(500).json({ error: 'Belgeler yüklenirken hata oluştu' });
    }
  }

  static async download(req, res) {
    try {
      const { id } = req.params;
      const document = await PersonalDocument.getById(id);
      
      if (!document) {
        return res.status(404).json({ error: 'Belge bulunamadı' });
      }

      const filePath = document.file_path;
      
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'Dosya bulunamadı' });
      }

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${document.document_name}"`);
      
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
    } catch (error) {
      console.error('Error downloading personal document:', error);
      res.status(500).json({ error: 'Belge indirilirken hata oluştu' });
    }
  }

  static async delete(req, res) {
    try {
      const { id } = req.params;
      const document = await PersonalDocument.getById(id);
      
      if (!document) {
        return res.status(404).json({ error: 'Belge bulunamadı' });
      }

      // Delete file from filesystem
      if (fs.existsSync(document.file_path)) {
        fs.unlinkSync(document.file_path);
      }

      // Delete from database
      await PersonalDocument.delete(id);
      
      res.json({ message: 'Belge başarıyla silindi' });
    } catch (error) {
      console.error('Error deleting personal document:', error);
      res.status(500).json({ error: 'Belge silinirken hata oluştu' });
    }
  }

  static async getDocumentTypes(req, res) {
    try {
      const documentTypes = PersonalDocument.getDocumentTypes();
      res.json(documentTypes);
    } catch (error) {
      console.error('Error fetching document types:', error);
      res.status(500).json({ error: 'Belge türleri yüklenirken hata oluştu' });
    }
  }
}

module.exports = PersonalDocumentController;
