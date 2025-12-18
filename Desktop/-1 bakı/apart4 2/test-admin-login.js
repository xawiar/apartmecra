// Admin giriş testi
import { login } from './src/services/firebaseApi.js';

async function testAdminLogin() {
  console.log('🔍 Admin giriş testi...\n');
  
  const testCases = [
    { username: 'admin', password: 'admin123' },
    { username: 'admin@example.com', password: 'admin123' },
    { username: 'admin', password: 'admin' },
    { username: 'admin@example.com', password: 'admin' }
  ];
  
  for (const testCase of testCases) {
    console.log(`\n📝 Test: ${testCase.username} / ${testCase.password}`);
    try {
      const result = await login(testCase.username, testCase.password);
      if (result.error) {
        console.log(`❌ Hata: ${result.error}`);
      } else {
        console.log(`✅ Başarılı!`);
        console.log(`   - Kullanıcı: ${result.user.username}`);
        console.log(`   - Role: ${result.user.role}`);
        console.log(`   - Email: ${result.user.email}`);
        return;
      }
    } catch (error) {
      console.log(`❌ Exception: ${error.message}`);
    }
  }
  
  console.log('\n❌ Hiçbir admin girişi başarılı olmadı!');
}

testAdminLogin();
