// Firebase Authentication kullanıcılarını kontrol et
import { auth } from './src/config/firebase.js';
import { signInWithEmailAndPassword } from 'firebase/auth';

async function checkFirebaseAuthUsers() {
  try {
    console.log('🔍 Firebase Authentication kullanıcıları kontrol ediliyor...\n');
    
    // Bilinen admin email'lerini test et
    const adminEmails = [
      'admin@example.com',
      'admin@apartmecraelazig.com',
      'admin@test.com'
    ];
    
    console.log('1. Bilinen admin email\'lerini test ediliyor:');
    
    for (const email of adminEmails) {
      try {
        // Test şifreleri
        const testPasswords = ['admin', 'admin123', 'password', '123456'];
        
        for (const password of testPasswords) {
          try {
            console.log(`   - Test ediliyor: ${email} / ${password}`);
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            console.log(`   ✅ BAŞARILI: ${email} / ${password}`);
            console.log(`      - UID: ${userCredential.user.uid}`);
            console.log(`      - Email: ${userCredential.user.email}`);
            console.log('');
            return;
          } catch (error) {
            // Şifre yanlış, devam et
            continue;
          }
        }
      } catch (error) {
        // Email yok, devam et
        continue;
      }
    }
    
    console.log('❌ Hiçbir admin kullanıcısı bulunamadı!');
    console.log('');
    console.log('2. Admin kullanıcısı oluşturmak için:');
    console.log('   - Firebase Console\'a gidin: https://console.firebase.google.com/');
    console.log('   - Authentication > Users > Add User');
    console.log('   - Email: admin@example.com');
    console.log('   - Password: admin123');
    
  } catch (error) {
    console.error('Hata:', error.message);
  }
}

checkFirebaseAuthUsers();


