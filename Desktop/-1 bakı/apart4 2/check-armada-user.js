// armada sitesinin kullanıcı bilgilerini kontrol et
import { db } from './src/config/firebase.js';
import { collection, getDocs } from 'firebase/firestore';

async function checkArmadaUser() {
  try {
    console.log('🔍 armada sitesi kullanıcı bilgileri kontrol ediliyor...\n');
    
    // 1. Sites koleksiyonundan armada sitesini bul
    console.log('1. Firestore\'dan armada sitesini bulma:');
    const sitesRef = collection(db, 'sites');
    const sitesSnapshot = await getDocs(sitesRef);
    
    let armadaSite = null;
    sitesSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.name === 'armada' || doc.id.includes('armada') || doc.id === 'ARM1') {
        armadaSite = { id: doc.id, ...data };
      }
    });
    
    if (armadaSite) {
      console.log('✅ armada sitesi bulundu:');
      console.log(`   - Document ID: ${armadaSite.id}`);
      console.log(`   - Site Adı: ${armadaSite.name}`);
      console.log(`   - Yönetici: ${armadaSite.manager}`);
      console.log(`   - Telefon: ${armadaSite.phone}`);
      console.log(`   - Status: ${armadaSite.status || 'active'}`);
      console.log('');
      
      // 2. Bu site için email formatını göster
      console.log('2. Giriş bilgileri:');
      console.log(`   - Kullanıcı Adı: ${armadaSite.id}`);
      console.log(`   - Email: ${armadaSite.id}@site.local`);
      console.log(`   - Şifre: ${armadaSite.phone}`);
      console.log('');
      
    } else {
      console.log('❌ armada sitesi bulunamadı!');
    }
    
  } catch (error) {
    console.error('Hata:', error.message);
  }
}

checkArmadaUser();
