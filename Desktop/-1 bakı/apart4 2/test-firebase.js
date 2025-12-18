// test-firebase.js
// Firebase bağlantısını test etmek için basit script

import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';

// Firebase configuration (emulator için)
const firebaseConfig = {
  apiKey: "demo-key",
  authDomain: "demo-project.firebaseapp.com",
  projectId: "demo-project",
  storageBucket: "demo-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:demo"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Emulator'ları bağla
if (import.meta.env.DEV) {
  auth.useEmulator('http://localhost:9099');
  db.useEmulator('localhost', 8080);
}

async function testFirebase() {
  try {
    console.log('🔥 Firebase bağlantısı test ediliyor...');
    
    // Admin kullanıcısı oluştur
    const userCredential = await createUserWithEmailAndPassword(
      auth, 
      'admin@example.com', 
      'SecureAdmin2025!'
    );
    
    console.log('✅ Admin kullanıcısı oluşturuldu:', userCredential.user.email);
    
    // Kullanıcı verilerini Firestore'a kaydet
    await setDoc(doc(db, 'users', userCredential.user.uid), {
      username: 'admin',
      email: 'admin@example.com',
      role: 'admin',
      status: 'active',
      createdAt: new Date().toISOString()
    });
    
    console.log('✅ Kullanıcı verileri Firestore\'a kaydedildi');
    
    // Test verisi oluştur
    await setDoc(doc(db, 'sites', 'test-site-1'), {
      name: 'Test Site',
      address: 'Test Address',
      blocks: 2,
      elevatorsPerBlock: 2,
      elevators: 4,
      panels: 8,
      status: 'active',
      createdAt: new Date().toISOString()
    });
    
    console.log('✅ Test sitesi oluşturuldu');
    
    // Veriyi oku
    const siteDoc = await getDoc(doc(db, 'sites', 'test-site-1'));
    if (siteDoc.exists()) {
      console.log('✅ Test sitesi okundu:', siteDoc.data().name);
    }
    
    console.log('🎉 Firebase entegrasyonu başarılı!');
    
  } catch (error) {
    console.error('❌ Firebase test hatası:', error.message);
  }
}

testFirebase();
