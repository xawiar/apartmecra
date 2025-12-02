const {beforeUserCreated} = require('firebase-functions/v2/identity');
const {onDocumentCreated} = require('firebase-functions/v2/firestore');
const {onCall, onRequest} = require('firebase-functions/v2/https');
const admin = require('firebase-admin');
const cors = require('cors')({ origin: true });

// Firebase Admin SDK'yı başlat
admin.initializeApp();

const db = admin.firestore();

// Yeni kullanıcı oluşturulduğunda otomatik olarak Firestore'a kaydet
exports.createUserDocument = beforeUserCreated(async (event) => {
  const user = event.data;
  try {
    console.log('New user created:', user.uid, user.email);
    
    // Skip if this is a site or company user - createSiteUser/createCompanyUser will handle it
    if (user.email) {
      if (user.email.includes('@site.local') || user.email.includes('@company.local')) {
        console.log('Skipping createUserDocument for site/company user - will be handled by createSiteUser/createCompanyUser:', user.email);
        return; // Don't create document here, let createSiteUser/createCompanyUser handle it
      }
    }
    
    // Check if user document already exists (might be created by createSiteUser or createCompanyUser)
    const userDocRef = db.collection('users').doc(user.uid);
    const userDoc = await userDocRef.get();
    
    if (userDoc.exists) {
      // User document already exists, just update it with any missing fields
      console.log('User document already exists, updating if needed:', user.uid);
      const existingData = userDoc.data();
      
      // Only update if role is incorrect or missing
      const email = user.email;
      let shouldUpdate = false;
      const updateData = {};
      
      if (email) {
        const username = email.split('@')[0];
        
        // Check if role needs to be updated
        if (email.includes('@personnel.local') && existingData.role !== 'personnel') {
          updateData.role = 'personnel';
          updateData.username = username;
          shouldUpdate = true;
        } else if ((email === 'admin@apartmecra.com' || email.includes('admin@example.com')) && existingData.role !== 'admin') {
          updateData.role = 'admin';
          shouldUpdate = true;
        }
      }
      
      // Update only if needed
      if (shouldUpdate) {
        updateData.updatedAt = admin.firestore.FieldValue.serverTimestamp();
        await userDocRef.update(updateData);
        console.log('User document updated:', user.uid, updateData);
      } else {
        console.log('User document already correct, no update needed:', user.uid);
      }
      return; // Don't create a new document
    }
    
    // User document doesn't exist, create it
    const userData = {
      uid: user.uid,
      email: user.email,
      username: user.email ? user.email.split('@')[0] : user.uid,
      role: 'user', // Varsayılan rol
      status: 'active',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    // Email'den rol belirleme (only for non-site/company users)
    if (user.email) {
      const email = user.email;
      const username = email.split('@')[0];
      
      if (email.includes('@personnel.local')) {
        userData.role = 'personnel';
        userData.username = username;
      } else if (email === 'admin@apartmecra.com' || email.includes('admin@example.com')) {
        userData.role = 'admin';
      }
    }

    // Firestore'a kaydet
    await userDocRef.set(userData);
    
    console.log('User document created successfully:', user.uid);
  } catch (error) {
    console.error('Error creating user document:', error);
  }
});

// Site oluşturulduğunda otomatik kullanıcı oluştur
exports.createSiteUser = onDocumentCreated(
  {document: 'sites/{siteId}'},
  async (event) => {
    try {
      const siteData = event.data.data();
      const documentId = event.params.siteId; // Firestore document ID
      
      // Use custom ID from siteData if available, otherwise use document ID
      const siteId = siteData.id || documentId;
      
      console.log('New site created - Document ID:', documentId, 'Custom ID:', siteId, 'Data:', siteData);
      
      // Check if user already exists (to prevent duplicate creation)
      // This can happen if both Cloud Function and manual creation run
      try {
        const existingUser = await admin.auth().getUserByEmail(`${siteId}@site.local`);
        if (existingUser) {
          console.log('Site user already exists, skipping creation:', `${siteId}@site.local`);
          return;
        }
      } catch (error) {
        // User doesn't exist, continue with creation
        if (error.code !== 'auth/user-not-found') {
          console.error('Error checking existing user:', error);
        }
      }
      
      // Site kullanıcısı için email ve şifre oluştur
      const email = `${siteId}@site.local`;
      const password = siteData.phone || siteId;
      
      // Firebase Authentication'da kullanıcı oluştur
      const userRecord = await admin.auth().createUser({
        email: email,
        password: password,
        displayName: siteData.name || siteId
      });
      
      console.log('Site user created in Firebase Auth:', userRecord.uid);
      
      // Check if user document already exists (might be created by createUserDocument)
      const userDocRef = db.collection('users').doc(userRecord.uid);
      const userDoc = await userDocRef.get();
      
      if (userDoc.exists) {
        // User document already exists (created by createUserDocument), just update it
        console.log('User document already exists, updating with site data:', userRecord.uid);
        await userDocRef.update({
          role: 'site_user',
          siteId: siteId,
          username: siteId,
          password: password,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        console.log('Site user document updated:', userRecord.uid);
      } else {
        // User document doesn't exist, create it
        const userData = {
          uid: userRecord.uid,
          email: email,
          username: siteId,
          password: password,
          role: 'site_user',
          siteId: siteId,
          status: 'active',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };
        
        await userDocRef.set(userData);
        console.log('Site user document created:', userRecord.uid);
      }
    } catch (error) {
      console.error('Error creating site user:', error);
    }
  }
);

// Company oluşturulduğunda otomatik kullanıcı oluştur
exports.createCompanyUser = onDocumentCreated(
  {document: 'companies/{companyId}'},
  async (event) => {
    try {
      const companyData = event.data.data();
      const documentId = event.params.companyId; // Firestore document ID
      
      // Use custom ID from companyData if available, otherwise use document ID
      const companyId = companyData.id || documentId;
      
      console.log('New company created - Document ID:', documentId, 'Custom ID:', companyId, 'Data:', companyData);
      
      // Check if user already exists (to prevent duplicate creation)
      // This can happen if both Cloud Function and manual creation run
      try {
        const existingUser = await admin.auth().getUserByEmail(`${companyId}@company.local`);
        if (existingUser) {
          console.log('Company user already exists, skipping creation:', `${companyId}@company.local`);
          return;
        }
      } catch (error) {
        // User doesn't exist, continue with creation
        if (error.code !== 'auth/user-not-found') {
          console.error('Error checking existing user:', error);
        }
      }
      
      // Company kullanıcısı için email ve şifre oluştur
      const email = `${companyId}@company.local`;
      const password = companyData.phone || companyId;
      
      // Firebase Authentication'da kullanıcı oluştur
      const userRecord = await admin.auth().createUser({
        email: email,
        password: password,
        displayName: companyData.name || companyId
      });
      
      console.log('Company user created in Firebase Auth:', userRecord.uid);
      
      // Check if user document already exists (might be created by createUserDocument)
      const userDocRef = db.collection('users').doc(userRecord.uid);
      const userDoc = await userDocRef.get();
      
      if (userDoc.exists) {
        // User document already exists (created by createUserDocument), just update it
        console.log('User document already exists, updating with company data:', userRecord.uid);
        await userDocRef.update({
          role: 'company_user',
          companyId: companyId,
          username: companyId,
          password: password,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        console.log('Company user document updated:', userRecord.uid);
      } else {
        // User document doesn't exist, create it
        const userData = {
          uid: userRecord.uid,
          email: email,
          username: companyId,
          password: password,
          role: 'company_user',
          companyId: companyId,
          status: 'active',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };
        
        await userDocRef.set(userData);
        console.log('Company user document created:', userRecord.uid);
      }
    } catch (error) {
      console.error('Error creating company user:', error);
    }
  }
);

// Admin kullanıcısını oluştur (manuel tetikleme için)
exports.createAdminUser = onCall(async (request) => {
  try {
    const { email, password, displayName } = request.data;
    
    // Firebase Authentication'da admin kullanıcısı oluştur
    const userRecord = await admin.auth().createUser({
      email: email,
      password: password,
      displayName: displayName || 'Admin'
    });
    
    // Admin kullanıcısını Firestore'a kaydet
    const userData = {
      uid: userRecord.uid,
      email: email,
      username: email.split('@')[0],
      role: 'admin',
      status: 'active',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    await db.collection('users').doc(userRecord.uid).set(userData);
    
    console.log('Admin user created:', userRecord.uid);
    return { success: true, uid: userRecord.uid };
  } catch (error) {
    console.error('Error creating admin user:', error);
    return { success: false, error: error.message };
  }
});

// Email'e göre kullanıcıyı sil (Auth + Firestore) - CORS enabled with onRequest
exports.deleteUserByEmail = onRequest(
  {
    cors: true,
    region: 'us-central1'
  },
  async (req, res) => {
    return cors(req, res, async () => {
      try {
        // Handle both GET and POST requests
        const email = req.method === 'POST' ? (req.body?.email || req.body) : req.query.email;
        
        if (!email) {
          return res.status(400).json({ success: false, error: 'Email is required' });
        }
        
        console.log('Deleting user by email:', email);
        
        // Find user in Auth
        const userRecord = await admin.auth().getUserByEmail(email);
        
        // Delete from Auth
        await admin.auth().deleteUser(userRecord.uid);
        
        // Delete from Firestore users collection (if exists)
        await db.collection('users').doc(userRecord.uid).delete().catch(() => null);
        
        console.log('User deleted successfully:', userRecord.uid);
        
        return res.status(200).json({ success: true });
      } catch (error) {
        console.error('Error deleting user by email:', error);
        return res.status(500).json({ success: false, error: error.message });
      }
    });
  }
);
