// Firebase Admin User Creation Script
// Node.js ortamında çalıştırmak için: node create-admin-user.js

import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword 
} from "firebase/auth";
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc 
} from "firebase/firestore";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAAkFCVr_IrA9qR8gAgDAZMGGk-xGsY2nA",
  authDomain: "ilsekreterliki.firebaseapp.com",
  projectId: "ilsekreterliki",
  storageBucket: "ilsekreterliki.firebasestorage.app",
  messagingSenderId: "112937724027",
  appId: "1:112937724027:web:03e419ca720eea178c1ade",
  measurementId: "G-YMN4TEP8Z1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function createAdminUser() {
  try {
    const adminUsername = 'admin';
    const adminPassword = 'admin123'; // Güçlü bir şifre kullanın!
    const adminEmail = `${adminUsername}@ilsekreterlik.local`;

    console.log('🔐 Firebase bağlantısı test ediliyor...');
    
    // Firestore bağlantısını test et
    console.log('📊 Firestore bağlantısı başarılı!');
    
    // Admin kullanıcısı var mı kontrol et
    console.log(`🔍 Admin kullanıcısı kontrol ediliyor: ${adminEmail}`);
    
    try {
      // Firebase Auth'da kullanıcı oluştur
      console.log('👤 Firebase Authentication\'da kullanıcı oluşturuluyor...');
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        adminEmail, 
        adminPassword
      );
      console.log('✅ Firebase Authentication kullanıcısı oluşturuldu:', userCredential.user.uid);
      
      // Firestore'da admin bilgilerini kaydet
      console.log('💾 Firestore\'da admin bilgileri kaydediliyor...');
      const adminDocRef = doc(db, 'admin', 'main');
      
      await setDoc(adminDocRef, {
        username: adminUsername,
        email: adminEmail,
        uid: userCredential.user.uid,
        role: 'admin',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }, { merge: true });
      
      console.log('✅ Admin bilgileri Firestore\'a kaydedildi!');
      
      // Bağlantıyı test et
      console.log('🧪 Bağlantı test ediliyor...');
      const testDoc = await getDoc(adminDocRef);
      
      if (testDoc.exists()) {
        console.log('✅ Admin dokümanı başarıyla okundu:', testDoc.data());
      }
      
      // Giriş testi
      console.log('🔑 Giriş testi yapılıyor...');
      await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
      console.log('✅ Giriş testi başarılı!');
      
      console.log('\n🎉 Admin kullanıcısı başarıyla oluşturuldu!');
      console.log('\n📋 Kullanıcı Bilgileri:');
      console.log('   Username: admin');
      console.log('   Email: admin@ilsekreterlik.local');
      console.log('   Password: admin123');
      console.log('   ⚠️  Production\'da mutlaka şifreyi değiştirin!');
      
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        console.log('ℹ️  Kullanıcı zaten mevcut, bilgileri güncelleniyor...');
        
        // Kullanıcı zaten varsa giriş yap
        const userCredential = await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
        console.log('✅ Mevcut kullanıcıya giriş yapıldı');
        
        // Firestore'da admin bilgilerini güncelle
        const adminDocRef = doc(db, 'admin', 'main');
        await setDoc(adminDocRef, {
          username: adminUsername,
          email: adminEmail,
          uid: userCredential.user.uid,
          role: 'admin',
          updatedAt: new Date().toISOString()
        }, { merge: true });
        
        console.log('✅ Admin bilgileri güncellendi!');
        console.log('\n📋 Kullanıcı Bilgileri:');
        console.log('   Username: admin');
        console.log('   Email: admin@ilsekreterlik.local');
        console.log('   Password: admin123');
      } else {
        throw error;
      }
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Hata oluştu:', error);
    console.error('   Error code:', error.code);
    console.error('   Error message:', error.message);
    process.exit(1);
  }
}

// Script'i çalıştır
createAdminUser();

