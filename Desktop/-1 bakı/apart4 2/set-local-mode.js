// Lokal modu etkinleştirmek için script
// Tarayıcı konsolunda çalıştırın: node set-local-mode.js

console.log('🔧 Lokal mod ayarları yapılıyor...');

// localStorage'ı temizle ve lokal modu etkinleştir
if (typeof localStorage !== 'undefined') {
    // Firebase'i devre dışı bırak
    localStorage.setItem('firebaseEnabled', 'false');
    
    // Diğer Firebase ayarlarını temizle
    localStorage.removeItem('firebaseConfig');
    localStorage.removeItem('firebaseUser');
    localStorage.removeItem('firebaseSync');
    
    console.log('✅ Lokal mod etkinleştirildi!');
    console.log('Firebase durumu:', localStorage.getItem('firebaseEnabled'));
    console.log('Sistem artık tamamen lokal modda çalışacak.');
} else {
    console.log('❌ localStorage mevcut değil');
}

