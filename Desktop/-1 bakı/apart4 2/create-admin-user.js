// Admin kullanıcısı oluştur
import { auth } from './src/config/firebase.js';
import { createUserWithEmailAndPassword } from 'firebase/auth';

async function createAdminUser() {
  try {
    console.log('🔧 Admin kullanıcısı oluşturuluyor...\n');
    
    const email = 'admin@example.com';
    const password = 'admin123';
    
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    console.log('');
    
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    console.log('✅ Admin kullanıcısı başarıyla oluşturuldu!');
    console.log(`   - UID: ${userCredential.user.uid}`);
    console.log(`   - Email: ${userCredential.user.email}`);
    console.log('');
    console.log('🔐 Giriş bilgileri:');
    console.log(`   - Kullanıcı Adı: admin`);
    console.log(`   - Email: ${email}`);
    console.log(`   - Şifre: ${password}`);
    console.log('');
    console.log('Artık admin olarak giriş yapabilirsiniz!');
    
  } catch (error) {
    if (error.code === 'auth/email-already-in-use') {
      console.log('⚠️ Admin kullanıcısı zaten mevcut!');
      console.log('🔐 Giriş bilgileri:');
      console.log('   - Kullanıcı Adı: admin');
      console.log('   - Email: admin@example.com');
      console.log('   - Şifre: admin123');
    } else {
      console.error('❌ Hata:', error.message);
    }
  }
}

createAdminUser();


