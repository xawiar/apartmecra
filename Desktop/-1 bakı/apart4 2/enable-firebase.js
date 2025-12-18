// Firebase'i etkinleştirmek için script
console.log('Firebase etkinleştiriliyor...');

// localStorage'ı ayarla
if (typeof localStorage !== 'undefined') {
    localStorage.setItem('firebaseEnabled', 'true');
    console.log('✅ Firebase etkinleştirildi!');
    console.log('Firebase durumu:', localStorage.getItem('firebaseEnabled'));
} else {
    console.log('❌ localStorage mevcut değil');
}

// Sayfayı yenile
setTimeout(() => {
    console.log('Sayfa yenileniyor...');
    window.location.reload();
}, 1000);


