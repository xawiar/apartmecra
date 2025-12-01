// Admin kullanıcı bilgilerini kontrol et
import { db } from './src/config/firebase.js';
import { collection, getDocs, query, where } from 'firebase/firestore';

async function checkAdminUser() {
  try {
    console.log('🔍 Admin kullanıcı bilgileri kontrol ediliyor...\n');
    
    // Users koleksiyonundan admin kullanıcısını bul
    console.log('1. Firestore\'dan admin kullanıcısını bulma:');
    const usersRef = collection(db, 'users');
    const usersSnapshot = await getDocs(usersRef);
    
    let adminUser = null;
    usersSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.role === 'admin' || data.email?.includes('@example.com')) {
        adminUser = { id: doc.id, ...data };
      }
    });
    
    if (adminUser) {
      console.log('✅ Admin kullanıcısı bulundu:');
      console.log(`   - Document ID: ${adminUser.id}`);
      console.log(`   - Email: ${adminUser.email}`);
      console.log(`   - Username: ${adminUser.username}`);
      console.log(`   - Role: ${adminUser.role}`);
      console.log(`   - Status: ${adminUser.status || 'active'}`);
      console.log('');
      
      console.log('2. Giriş bilgileri:');
      console.log(`   - Kullanıcı Adı: ${adminUser.username || adminUser.email?.split('@')[0]}`);
      console.log(`   - Email: ${adminUser.email}`);
      console.log(`   - Şifre: ${adminUser.password || 'Bilinmiyor'}`);
      console.log('');
      
    } else {
      console.log('❌ Admin kullanıcısı bulunamadı!');
      console.log('Mevcut kullanıcılar:');
      usersSnapshot.forEach(doc => {
        const data = doc.data();
        console.log(`   - ${data.username || data.email} (${data.role || 'Bilinmeyen'})`);
      });
    }
    
  } catch (error) {
    console.error('Hata:', error.message);
  }
}

checkAdminUser();


