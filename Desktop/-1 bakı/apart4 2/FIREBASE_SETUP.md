# Firebase Kurulum Rehberi

Bu proje Firebase Authentication, Firestore Database ve Firebase Storage kullanmaktadır.

## 1. Firebase Projesi Oluşturma

1. [Firebase Console](https://console.firebase.google.com/)'a gidin
2. "Create a project" butonuna tıklayın
3. Proje adını girin (örn: `apart4-management`)
4. Google Analytics'i etkinleştirin (isteğe bağlı)
5. Projeyi oluşturun

## 2. Firebase Servislerini Etkinleştirme

### Authentication
1. Firebase Console'da "Authentication" > "Get started" tıklayın
2. "Sign-in method" sekmesine gidin
3. "Email/Password" sağlayıcısını etkinleştirin

### Firestore Database
1. "Firestore Database" > "Create database" tıklayın
2. "Start in test mode" seçin (geliştirme için)
3. Bir konum seçin (örn: europe-west1)

### Storage
1. "Storage" > "Get started" tıklayın
1. "Start in test mode" seçin
2. Aynı konumu seçin

## 3. Web Uygulaması Ekleme

1. Firebase Console'da proje ayarlarına gidin
2. "Add app" > "Web" seçin
3. Uygulama adını girin
4. Firebase SDK konfigürasyonunu kopyalayın

## 4. Environment Variables Ayarlama

`.env` dosyası oluşturun ve Firebase konfigürasyonunu ekleyin:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Firebase Emulators (for development)
VITE_USE_FIREBASE_EMULATORS=false

# Admin User Configuration
VITE_ADMIN_EMAIL=admin@example.com
VITE_ADMIN_PASSWORD=SecureAdmin2025!
```

## 5. Firebase CLI Kurulumu

```bash
npm install -g firebase-tools
```

## 6. Firebase Projesine Bağlanma

```bash
firebase login
firebase use --add
```

## 7. Emulator'ları Çalıştırma (Geliştirme için)

```bash
npm run firebase:emulators
```

Bu komut şu servisleri başlatır:
- Authentication Emulator: http://localhost:9099
- Firestore Emulator: http://localhost:8080
- Storage Emulator: http://localhost:9199
- Emulator UI: http://localhost:4000

## 8. Production'a Deploy Etme

```bash
npm run firebase:deploy
```

## 9. Güvenlik Kuralları

Firestore ve Storage güvenlik kuralları proje kök dizininde bulunmaktadır:
- `firestore.rules`
- `storage.rules`

Bu kurallar production'a deploy edilmeden önce gözden geçirilmelidir.

## 10. İlk Admin Kullanıcısı

Uygulama ilk çalıştırıldığında otomatik olarak admin kullanıcısı oluşturulur:
- Email: `admin@example.com` (VITE_ADMIN_EMAIL'den)
- Password: `SecureAdmin2025!` (VITE_ADMIN_PASSWORD'den)

## 11. Veri Yapısı

### Collections:
- `users` - Kullanıcı bilgileri
- `sites` - Site bilgileri
- `companies` - Şirket bilgileri
- `agreements` - Anlaşma bilgileri
- `transactions` - İşlem kayıtları
- `partners` - Ortak bilgileri
- `archivedSites` - Arşivlenmiş siteler
- `archivedCompanies` - Arşivlenmiş şirketler
- `archivedAgreements` - Arşivlenmiş anlaşmalar
- `logs` - Sistem logları
- `panelImages` - Panel resim bilgileri
- `agreementDocuments` - Anlaşma dökümanları

### Storage Buckets:
- `panel-images/` - Panel resimleri
- `company-logos/` - Şirket logoları
- `site-images/` - Site resimleri
- `agreement-documents/` - Anlaşma dökümanları

## 12. Sorun Giderme

### Emulator Bağlantı Sorunları
- Emulator'ların çalıştığından emin olun
- `VITE_USE_FIREBASE_EMULATORS=true` ayarını kontrol edin

### Authentication Sorunları
- Email/Password sağlayıcısının etkin olduğunu kontrol edin
- Domain'in Firebase Console'da authorized domains listesinde olduğunu kontrol edin

### Firestore Sorunları
- Güvenlik kurallarının doğru olduğunu kontrol edin
- Index'lerin oluşturulduğunu kontrol edin

### Storage Sorunları
- Storage bucket'ının oluşturulduğunu kontrol edin
- Güvenlik kurallarının doğru olduğunu kontrol edin
