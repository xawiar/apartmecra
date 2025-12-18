// Admin kullanıcısını Firebase'de oluştur
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore';

// Firebase configuration (apartmecra-elz)
const firebaseConfig = {
  apiKey: "AIzaSyDRYJ8wJpjIi4qF1jzLe14xtmb7iTT4jsc",
  authDomain: "apartmecra-elz.firebaseapp.com",
  projectId: "apartmecra-elz",
  storageBucket: "apartmecra-elz.firebasestorage.app",
  messagingSenderId: "669151390046",
  appId: "1:669151390046:web:30590b4e09a529d17d47cf",
  measurementId: "G-4J8KGT8KJ5"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function createAdminUser() {
  try {
    console.log('🔧 Admin kullanıcısı oluşturuluyor...\n');
    
    const email = 'admin@apartmecra.com';
    const password = 'Admin123!';
    
    console.log(`📧 Email: ${email}`);
    console.log(`🔐 Şifre: ${password}`);
    console.log('');
    
    // Firebase Authentication'da kullanıcı oluştur
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    console.log('✅ Admin kullanıcısı başarıyla oluşturuldu!');
    console.log(`   - UID: ${userCredential.user.uid}`);
    console.log(`   - Email: ${userCredential.user.email}`);
    console.log('');
    
    // Firestore'a admin kullanıcısını kaydet
    const userData = {
      uid: userCredential.user.uid,
      email: email,
      username: 'admin',
      role: 'admin',
      status: 'active',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    await setDoc(doc(db, 'users', userCredential.user.uid), userData);
    
    console.log('✅ Admin kullanıcısı Firestore\'a kaydedildi!');
    console.log('');
    console.log('🎉 Admin kullanıcı setup tamamlandı!');
    console.log('');
    console.log('🔐 Giriş bilgileri:');
    console.log(`   - Email: ${email}`);
    console.log(`   - Şifre: ${password}`);
    console.log('');
    console.log('Artık admin olarak giriş yapabilirsiniz!');
    
    process.exit(0);
    
  } catch (error) {
    if (error.code === 'auth/email-already-in-use') {
      console.log('⚠️ Bu email zaten kullanımda!');
      console.log('🔐 Giriş bilgileri:');
      console.log('   - Email: admin@apartmecra.com');
      console.log('   - Şifre: Admin123!');
      console.log('');
      console.log('Kullanıcı zaten mevcut, Firestore\'da kontrol ediliyor...');
      
      // Firestore'da admin kullanıcısını kontrol et
      try {
        const usersSnapshot = await getDocs(collection(db, 'users'));
        let adminFound = false;
        
        usersSnapshot.forEach(doc => {
          const data = doc.data();
          if (data.email === 'admin@apartmecra.com' && data.role === 'admin') {
            adminFound = true;
            console.log('✅ Admin kullanıcısı Firestore\'da mevcut!');
            console.log(`   - Document ID: ${doc.id}`);
            console.log(`   - Role: ${data.role}`);
          }
        });
        
        if (!adminFound) {
          console.log('⚠️ Admin kullanıcısı Firestore\'da yok, oluşturuluyor...');
          // Auth'dan kullanıcıyı bul ve Firestore'a ekle
          const user = auth.currentUser || await signInWithEmailAndPassword(auth, email, password);
          await setDoc(doc(db, 'users', user.uid), {
            uid: user.uid,
            email: email,
            username: 'admin',
            role: 'admin',
            status: 'active',
            updatedAt: serverTimestamp()
          }, { merge: true });
          console.log('✅ Admin kullanıcısı Firestore\'a eklendi!');
        }
      } catch (err) {
        console.error('❌ Firestore kontrol hatası:', err.message);
      }
    } else {
      console.error('❌ Hata:', error.message);
      console.error('Error code:', error.code);
    }
    process.exit(1);
  }
}

// Import eksik fonksiyonlar
import { getDocs, collection } from 'firebase/firestore';
import { signInWithEmailAndPassword } from 'firebase/auth';

createAdminUser();

