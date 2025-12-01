// Admin şifresini sıfırla
import { auth } from './src/config/firebase.js';
import { signInWithEmailAndPassword, updatePassword } from 'firebase/auth';

async function resetAdminPassword() {
  try {
    console.log('🔧 Admin şifresi sıfırlanıyor...\n');
    
    const email = 'admin@example.com';
    const newPassword = 'admin123';
    
    // Önce mevcut şifrelerle giriş yapmayı dene
    const testPasswords = ['admin', 'admin123', 'password', '123456'];
    
    for (const password of testPasswords) {
      try {
        console.log(`Test ediliyor: ${password}`);
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        console.log(`✅ Giriş başarılı: ${password}`);
        
        // Şifreyi güncelle
        await updatePassword(userCredential.user, newPassword);
        console.log(`✅ Şifre güncellendi: ${newPassword}`);
        
        console.log('\n🔐 Güncel giriş bilgileri:');
        console.log(`   - Kullanıcı Adı: admin`);
        console.log(`   - Email: ${email}`);
        console.log(`   - Şifre: ${newPassword}`);
        return;
        
      } catch (error) {
        console.log(`❌ ${password}: ${error.code}`);
        continue;
      }
    }
    
    console.log('❌ Hiçbir şifre çalışmıyor!');
    console.log('Firebase Console\'dan şifreyi sıfırlayın:');
    console.log('https://console.firebase.google.com/project/apartmecraelazig/authentication/users');
    
  } catch (error) {
    console.error('Hata:', error.message);
  }
}

resetAdminPassword();

