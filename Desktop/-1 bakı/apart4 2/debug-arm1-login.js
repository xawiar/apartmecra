// ARM1 kullanıcısının giriş ve site verilerini kontrol et
import { login } from './src/services/firebaseApi.js';
import { getSiteData } from './src/services/firebaseApi.js';

async function debugARM1Login() {
  try {
    console.log('🔍 ARM1 kullanıcısı giriş testi...\n');
    
    // 1. ARM1 ile giriş yap
    console.log('1. ARM1 ile giriş yapılıyor...');
    const loginResult = await login('ARM1', '123456');
    
    if (loginResult.error) {
      console.log('❌ Giriş hatası:', loginResult.error);
      return;
    }
    
    console.log('✅ Giriş başarılı!');
    console.log('   - Kullanıcı:', loginResult.user);
    console.log('   - Site ID:', loginResult.user.siteId);
    console.log('   - Role:', loginResult.user.role);
    console.log('');
    
    // 2. Site verilerini getir
    console.log('2. Site verileri getiriliyor...');
    const siteData = await getSiteData(loginResult.user.siteId);
    
    console.log('Site verileri:');
    console.log('   - Site:', siteData.site);
    console.log('   - Anlaşmalar:', siteData.agreements.length);
    console.log('   - İşlemler:', siteData.transactions.length);
    console.log('');
    
    if (siteData.site) {
      console.log('✅ Site verisi bulundu:');
      console.log(`   - Site Adı: ${siteData.site.name}`);
      console.log(`   - Yönetici: ${siteData.site.manager}`);
      console.log(`   - Telefon: ${siteData.site.phone}`);
      console.log(`   - Bloklar: ${siteData.site.blocks}`);
      console.log(`   - Asansörler: ${siteData.site.elevatorsPerBlock}`);
      console.log(`   - Paneller: ${siteData.site.panels}`);
    } else {
      console.log('❌ Site verisi bulunamadı!');
    }
    
  } catch (error) {
    console.error('Hata:', error.message);
  }
}

debugARM1Login();
