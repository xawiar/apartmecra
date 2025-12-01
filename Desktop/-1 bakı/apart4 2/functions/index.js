const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Firebase Admin SDK'yı başlat
admin.initializeApp();

const db = admin.firestore();

// Yeni kullanıcı oluşturulduğunda otomatik olarak Firestore'a kaydet
exports.createUserDocument = functions.auth.user().onCreate(async (user) => {
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
      if (user.email.includes('@site.local')) {
        userData.role = 'site_user';
        userData.siteId = user.email.split('@')[0];
      } else if (user.email.includes('@company.local')) {
        userData.role = 'company_user';
        userData.companyId = user.email.split('@')[0];
      } else if (user.email.includes('admin@example.com')) {
        userData.role = 'admin';
      }
    }

    // Firestore'a kaydet
    await db.collection('users').doc(user.uid).set(userData);
    
    console.log('User document created successfully:', user.uid);
    return null;
  } catch (error) {
    console.error('Error creating user document:', error);
    return null;
  }
});

// Site oluşturulduğunda otomatik kullanıcı oluştur
exports.createSiteUser = functions.firestore
  .document('sites/{siteId}')
  .onCreate(async (snap, context) => {
    try {
      const siteData = snap.data();
      const siteId = context.params.siteId;
      
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
      return null;
    } catch (error) {
      console.error('Error creating site user:', error);
      return null;
    }
  });

// Company oluşturulduğunda otomatik kullanıcı oluştur
exports.createCompanyUser = functions.firestore
  .document('companies/{companyId}')
  .onCreate(async (snap, context) => {
    try {
      const companyData = snap.data();
      const companyId = context.params.companyId;
      
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
      return null;
    } catch (error) {
      console.error('Error creating company user:', error);
      return null;
    }
  });

// Admin kullanıcısını oluştur (manuel tetikleme için)
exports.createAdminUser = functions.https.onCall(async (data, context) => {
  try {
    const { email, password, displayName } = data;
    
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
