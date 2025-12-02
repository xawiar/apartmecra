const {beforeUserCreated} = require('firebase-functions/v2/identity');
const {onDocumentCreated} = require('firebase-functions/v2/firestore');
const {onCall} = require('firebase-functions/v2/https');
const admin = require('firebase-admin');

// Firebase Admin SDK'yı başlat
admin.initializeApp();

const db = admin.firestore();

// Yeni kullanıcı oluşturulduğunda otomatik olarak Firestore'a kaydet
exports.createUserDocument = beforeUserCreated(async (event) => {
  const user = event.data;
  try {
    console.log('New user created:', user.uid, user.email);
    
    // Kullanıcı verilerini Firestore'a kaydet
    const userData = {
      uid: user.uid,
      email: user.email,
      username: user.email ? user.email.split('@')[0] : user.uid,
      role: 'user', // Varsayılan rol
      status: 'active',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    // Email'den rol belirleme
    if (user.email) {
      const email = user.email;
      const username = email.split('@')[0];
      
      if (email.includes('@site.local')) {
        userData.role = 'site_user';
        userData.siteId = username;
      } else if (email.includes('@company.local')) {
        userData.role = 'company_user';
        userData.companyId = username;
      } else if (email.includes('@personnel.local')) {
        userData.role = 'personnel';
        userData.username = username;
      } else if (email === 'admin@apartmecra.com' || email.includes('admin@example.com')) {
        userData.role = 'admin';
      }
    }

    // Firestore'a kaydet
    await db.collection('users').doc(user.uid).set(userData);
    
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
      const siteId = event.params.siteId;
      
      console.log('New site created:', siteId, siteData);
      
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
      
      // Kullanıcı verilerini Firestore'a kaydet
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
      
      await db.collection('users').doc(userRecord.uid).set(userData);
      
      console.log('Site user document created:', userRecord.uid);
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
      const companyId = event.params.companyId;
      
      console.log('New company created:', companyId, companyData);
      
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
      
      // Kullanıcı verilerini Firestore'a kaydet
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
      
      await db.collection('users').doc(userRecord.uid).set(userData);
      
      console.log('Company user document created:', userRecord.uid);
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

// Email'e göre kullanıcıyı sil (Auth + Firestore) - CORS enabled
exports.deleteUserByEmail = onCall(
  {
    cors: true,
    region: 'us-central1'
  },
  async (request) => {
    try {
      const { email } = request.data || {};
      
      if (!email) {
        return { success: false, error: 'Email is required' };
      }
      
      console.log('Deleting user by email:', email);
      
      // Find user in Auth
      const userRecord = await admin.auth().getUserByEmail(email);
      
      // Delete from Auth
      await admin.auth().deleteUser(userRecord.uid);
      
      // Delete from Firestore users collection (if exists)
      await db.collection('users').doc(userRecord.uid).delete().catch(() => null);
      
      console.log('User deleted successfully:', userRecord.uid);
      
      return { success: true };
    } catch (error) {
      console.error('Error deleting user by email:', error);
      return { success: false, error: error.message };
    }
  }
);
