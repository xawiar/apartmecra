// ARM1 sitesini oluştur
import { createSite } from './src/services/firebaseApi.js';

async function createARM1Site() {
  try {
    console.log('ARM1 sitesi oluşturuluyor...\n');
    
    const siteData = {
      name: 'ARM1',
      manager: 'ARM1 Yöneticisi',
      phone: '1234567890',
      blocks: '3',
      elevatorsPerBlock: '2',
      agreementPercentage: '15',
      notes: 'ARM1 test sitesi',
      neighborhood: 'Test Mahallesi'
    };
    
    console.log('Site verisi:', siteData);
    
    const result = await createSite(siteData);
    
    if (result.success) {
      console.log('✅ ARM1 sitesi başarıyla oluşturuldu!');
      console.log(`   - Site ID: ${result.id}`);
      console.log(`   - Site Name: ${siteData.name}`);
      console.log(`   - Manager: ${siteData.manager}`);
      console.log(`   - Phone: ${siteData.phone}`);
      console.log('');
      console.log('🔐 Site kullanıcısı bilgileri:');
      console.log(`   - Email: ${result.id}@site.local`);
      console.log(`   - Password: ${siteData.phone}`);
      console.log('');
      console.log('Artık ARM1 sitesi ile giriş yapabilirsiniz!');
    } else {
      console.log('❌ ARM1 sitesi oluşturulamadı:', result.error);
    }
    
  } catch (error) {
    console.error('Hata:', error.message);
  }
}

createARM1Site();
