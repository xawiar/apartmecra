const jsonServer = require('json-server');
const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const server = jsonServer.create();
// Create router with rewrites to handle /api prefix
const router = jsonServer.router('db.json', {
  foreignKeySuffix: '_id'
});
const middlewares = jsonServer.defaults();

// Security middleware
const rateLimitMap = new Map();

// Rate limiting middleware - More lenient for production
const rateLimit = (req, res, next) => {
  // Skip rate limiting for static files and favicon
  if (req.path === '/favicon.ico' || req.path.startsWith('/assets/') || req.path.startsWith('/uploads/')) {
    return next();
  }
  
  const clientIP = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for']?.split(',')[0] || 'unknown';
  const now = Date.now();
  const windowMs = 1 * 60 * 1000; // 1 minute (reduced from 15)
  const maxRequests = 200; // Max requests per window (increased from 100)
  
  if (!rateLimitMap.has(clientIP)) {
    rateLimitMap.set(clientIP, { count: 1, resetTime: now + windowMs });
  } else {
    const clientData = rateLimitMap.get(clientIP);
    if (now > clientData.resetTime) {
      clientData.count = 1;
      clientData.resetTime = now + windowMs;
    } else {
      clientData.count++;
      if (clientData.count > maxRequests) {
        console.log(`Rate limit exceeded for IP: ${clientIP}, requests: ${clientData.count}`);
        return res.status(429).json({ error: 'Too many requests, please try again later.' });
      }
    }
  }
  next();
};

// CORS configuration
// Allow both localhost (development) and Render production URLs
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  process.env.RENDER_EXTERNAL_URL, // Render production URL
  process.env.RENDER_EXTERNAL_HOSTNAME ? `https://${process.env.RENDER_EXTERNAL_HOSTNAME}` : null
].filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

// Apply security middleware
server.use(rateLimit);
server.use(middlewares);
server.use(jsonServer.bodyParser);

// Security headers
server.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, 'uploads', 'panel-images');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const agreementId = req.body.agreementId || 'unknown';
    const siteId = req.body.siteId || 'unknown';
    const blockId = req.body.blockId || 'unknown';
    const panelId = req.body.panelId || 'unknown';
    cb(null, `panel-${agreementId}-${siteId}-${blockId}-${panelId}-${uniqueSuffix}.${file.originalname.split('.').pop()}`);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Reset endpoint - handle it before the router
server.post('/reset', (req, res, next) => {
  try {
    // Read the original db structure
    const dbPath = path.join(__dirname, 'db.json');
    const dbContent = fs.readFileSync(dbPath, 'utf8');
    const db = JSON.parse(dbContent);
    
    // Keep only the admin user, delete all other users and data
    const adminUser = db.users ? db.users.find(user => user.username === 'admin') : null;
    const resetDb = {
      users: adminUser ? [adminUser] : [], // Keep only admin user
      sites: [],
      companies: [],
      agreements: [],
      transactions: [],
      partners: [],
      archivedSites: [],
      archivedCompanies: [],
      archivedAgreements: [],
      logs: [],
      panelImages: [] // Clear all panel images
    };
    
    // Write the reset database
    fs.writeFileSync(dbPath, JSON.stringify(resetDb, null, 2));
    
    // Delete all uploaded panel images
    const uploadsDir = path.join(__dirname, 'uploads', 'panel-images');
    if (fs.existsSync(uploadsDir)) {
      const files = fs.readdirSync(uploadsDir);
      files.forEach(file => {
        const filePath = path.join(uploadsDir, file);
        try {
          fs.unlinkSync(filePath);
        } catch (err) {
          console.error(`Error deleting file ${file}:`, err);
        }
      });
    }
    
    res.status(200).json({ message: 'Database reset successfully - Only admin user preserved' });
  } catch (error) {
    console.error('Error resetting database:', error);
    res.status(500).json({ error: 'Failed to reset database' });
  }
});

// Panel image upload endpoint
server.post('/api/upload-panel-image', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    // Generate proper filename with correct values
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const agreementId = req.body.agreementId || 'unknown';
    const siteId = req.body.siteId || 'unknown';
    const blockId = req.body.blockId || 'unknown';
    const panelId = req.body.panelId || 'unknown';
    const extension = req.file.originalname.split('.').pop();
    
    const properFilename = `panel-${agreementId}-${siteId}-${blockId}-${panelId}-${uniqueSuffix}.${extension}`;
    
    // Rename the uploaded file to proper filename
    const oldFilePath = req.file.path;
    const newFilePath = path.join(path.dirname(oldFilePath), properFilename);
    fs.renameSync(oldFilePath, newFilePath);

    // Get the uploaded file info
    const fileInfo = {
      filename: properFilename,
      originalName: req.file.originalname,
      size: req.file.size,
      path: newFilePath,
      url: `/uploads/panel-images/${properFilename}`,
      agreementId: req.body.agreementId,
      siteId: req.body.siteId,
      blockId: req.body.blockId,
      panelId: req.body.panelId,
      companyId: req.body.companyId,
      uploadedAt: new Date().toISOString()
    };

    // Read current database
    const dbPath = path.join(__dirname, 'db.json');
    const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

    // Initialize panel images array if it doesn't exist
    if (!db.panelImages) {
      db.panelImages = [];
    }

    // Add the image info to database
    db.panelImages.push(fileInfo);

    // Write updated database
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));

    res.status(200).json({
      message: 'Image uploaded successfully',
      imageUrl: fileInfo.url,
      imageInfo: fileInfo
    });

  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({ error: 'Failed to upload image' });
  }
});

// Panel images get endpoint
server.get('/api/panelImages', (req, res) => {
  try {
    const dbPath = path.join(__dirname, 'db.json');
    const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    
    const panelImages = db.panelImages || [];
    res.status(200).json(panelImages);
  } catch (error) {
    console.error('Error fetching panel images:', error);
    res.status(500).json({ error: 'Failed to fetch panel images' });
  }
});

// Panel image delete endpoint
server.delete('/api/panelImages/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const dbPath = path.join(__dirname, 'db.json');
    const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    
    if (!db.panelImages) {
      return res.status(404).json({ error: 'No panel images found' });
    }
    
    // Find the image to delete by filename
    const imageIndex = db.panelImages.findIndex(img => img.filename === filename);
    if (imageIndex === -1) {
      return res.status(404).json({ error: 'Image not found' });
    }
    
    const imageToDelete = db.panelImages[imageIndex];
    
    // Delete the physical file
    const filePath = path.join(__dirname, 'uploads', 'panel-images', imageToDelete.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    // Remove from database
    db.panelImages.splice(imageIndex, 1);
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
    
    res.status(200).json({ message: 'Image deleted successfully' });
  } catch (error) {
    console.error('Error deleting panel image:', error);
    res.status(500).json({ error: 'Failed to delete panel image' });
  }
});

// Cleanup expired panel images endpoint
server.post('/api/cleanup-expired-images', (req, res) => {
  try {
    const dbPath = path.join(__dirname, 'db.json');
    const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    
    if (!db.panelImages || !db.agreements) {
      return res.status(200).json({ message: 'No data to cleanup', deletedCount: 0 });
    }
    
    const currentDate = new Date();
    let deletedCount = 0;
    const imagesToDelete = [];
    
    // Find images from expired agreements
    db.panelImages.forEach((image, index) => {
      const agreement = db.agreements.find(ag => ag.id.toString() === image.agreementId);
      if (agreement && agreement.endDate) {
        const endDate = new Date(agreement.endDate);
        if (endDate < currentDate) {
          imagesToDelete.push({ image, index });
        }
      }
    });
    
    // Delete images (reverse order to maintain indices)
    imagesToDelete.reverse().forEach(({ image, index }) => {
      // Delete physical file
      const filePath = path.join(__dirname, 'uploads', 'panel-images', image.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      
      // Remove from database
      db.panelImages.splice(index, 1);
      deletedCount++;
    });
    
    // Save updated database
    if (deletedCount > 0) {
      fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
    }
    
    res.status(200).json({ 
      message: `Cleanup completed. Deleted ${deletedCount} expired images.`,
      deletedCount 
    });
  } catch (error) {
    console.error('Error cleaning up expired images:', error);
    res.status(500).json({ error: 'Failed to cleanup expired images' });
  }
});

// Fix undefined filenames endpoint
server.post('/api/fix-undefined-filenames', (req, res) => {
  try {
    const dbPath = path.join(__dirname, 'db.json');
    const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    
    if (!db.panelImages) {
      return res.status(200).json({ message: 'No panel images to fix', fixedCount: 0 });
    }
    
    let fixedCount = 0;
    
    db.panelImages.forEach((image, index) => {
      if (image.filename && image.filename.includes('undefined')) {
        // Generate new filename with correct values
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const agreementId = image.agreementId || 'unknown';
        const siteId = image.siteId || 'unknown';
        const blockId = image.blockId || 'unknown';
        const panelId = image.panelId || 'unknown';
        const extension = image.filename.split('.').pop();
        
        const newFilename = `panel-${agreementId}-${siteId}-${blockId}-${panelId}-${uniqueSuffix}.${extension}`;
        
        // Rename physical file
        const oldFilePath = path.join(__dirname, 'uploads', 'panel-images', image.filename);
        const newFilePath = path.join(__dirname, 'uploads', 'panel-images', newFilename);
        
        if (fs.existsSync(oldFilePath)) {
          fs.renameSync(oldFilePath, newFilePath);
          
          // Update database record
          db.panelImages[index].filename = newFilename;
          db.panelImages[index].url = `/uploads/panel-images/${newFilename}`;
          db.panelImages[index].path = newFilePath;
          
          fixedCount++;
        }
      }
    });
    
    // Save updated database
    if (fixedCount > 0) {
      fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
    }
    
    res.status(200).json({ 
      message: `Fixed ${fixedCount} undefined filenames.`,
      fixedCount 
    });
  } catch (error) {
    console.error('Error fixing undefined filenames:', error);
    res.status(500).json({ error: 'Failed to fix undefined filenames' });
  }
});

// Serve uploaded images
server.use('/uploads', (req, res, next) => {
  const filePath = path.join(__dirname, 'uploads', req.path);
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).send('File not found');
  }
});

// Serve static files from dist directory (production build)
const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
  server.use(express.static(distPath));
  
  // Serve index.html for all non-API routes (SPA routing)
  server.get('*', (req, res, next) => {
    // Skip API routes
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
      return next();
    }
    const indexPath = path.join(distPath, 'index.html');
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      next();
    }
  });
}

// Mount the router on a specific path to avoid conflicts
// json-server router needs to be mounted with rewrites
server.use('/api', (req, res, next) => {
  // Rewrite /api/* to /* for json-server router
  req.url = req.url.replace(/^\/api/, '');
  router(req, res, next);
});

// Use PORT from environment variable (Render provides this) or default to 3001
const PORT = process.env.PORT || 3001;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`JSON Server is running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  if (process.env.RENDER_EXTERNAL_URL) {
    console.log(`External URL: ${process.env.RENDER_EXTERNAL_URL}`);
  }
});