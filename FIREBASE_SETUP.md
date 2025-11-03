# Firebase Entegrasyonu Rehberi

Bu proje Firebase ile entegre edilmiştir. Tüm veriler şifrelenmiş olarak Firestore'da saklanır.

## Kurulum

### 1. NPM Paketlerini Yükleyin

```bash
cd sekreterlik-app/client
npm install
```

Yüklenecek paketler:
- `firebase` - Firebase SDK
- `crypto-js` - Şifreleme için

### 2. Environment Variables

`.env` dosyası oluşturun (veya mevcut `.env` dosyasına ekleyin):

```env
# Firebase kullanımını aktif et
VITE_USE_FIREBASE=true

# Şifreleme anahtarı (production'da güçlü bir anahtar kullanın)
VITE_ENCRYPTION_KEY=your-secret-encryption-key-minimum-32-characters
```

### 3. Firebase Console'da Gerekli Ayarlar

1. **Firestore Database**: Firestore veritabanını oluşturun (Test modunda başlayabilirsiniz)
2. **Firebase Authentication**: Email/Password authentication'ı aktif edin
3. **Security Rules**: Güvenlik kurallarını yapılandırın (aşağıdaki örneklere bakın)

## Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Admin koleksiyonu - sadece authenticated kullanıcılar
    match /admin/{document=**} {
      allow read, write: if request.auth != null;
    }
    
    // Members koleksiyonu - authenticated kullanıcılar
    match /members/{memberId} {
      allow read: if request.auth != null;
      allow create, update, delete: if request.auth != null;
    }
    
    // Meetings koleksiyonu
    match /meetings/{meetingId} {
      allow read: if request.auth != null;
      allow create, update, delete: if request.auth != null;
    }
    
    // Events koleksiyonu
    match /events/{eventId} {
      allow read: if request.auth != null;
      allow create, update, delete: if request.auth != null;
    }
    
    // Member Users koleksiyonu
    match /member_users/{userId} {
      allow read: if request.auth != null;
      allow create, update, delete: if request.auth != null;
    }
    
    // Diğer koleksiyonlar için benzer kurallar
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## Veri Şifreleme

Tüm hassas veriler (telefon, email, TC, adres, notlar vb.) otomatik olarak şifrelenir:

- **Şifrelenen alanlar**: `password`, `phone`, `email`, `tcNo`, `address`, `notes`, `description`, `content`, `message`
- **Şifreleme yöntemi**: AES-256 (crypto-js)
- **Şifreleme anahtarı**: `VITE_ENCRYPTION_KEY` environment variable'ından alınır

### Şifreleme Alanlarını Özelleştirme

`sekreterlik-app/client/src/utils/crypto.js` dosyasında `SENSITIVE_FIELDS` array'ini düzenleyebilirsiniz.

## Koleksiyon Yapısı

Firestore'da oluşturulacak koleksiyonlar:

- `members` - Üyeler
- `meetings` - Toplantılar
- `events` - Etkinlikler
- `tasks` - Görevler
- `admin` - Admin bilgileri
- `member_users` - Üye kullanıcıları
- `regions` - Bölgeler
- `positions` - Pozisyonlar
- `districts` - İlçeler
- `towns` - İlçeler
- `neighborhoods` - Mahalleler
- `villages` - Köyler
- `messages` - Mesajlar
- `message_groups` - Mesaj grupları
- `personal_documents` - Kişisel belgeler
- `archive` - Arşiv

## Authentication

Firebase Authentication kullanılır:

1. **Admin Girişi**: İlk admin kullanıcısını Firebase Console'dan manuel olarak oluşturun
2. **Member User Girişi**: Uygulama içinden üye kullanıcıları oluşturulur
3. **Email Format**: Username otomatik olarak `username@ilsekreterlik.local` formatına çevrilir

## API Service Kullanımı

Uygulama otomatik olarak Firebase'i kullanır:

```javascript
import ApiService from './utils/ApiService';

// Firebase aktifse otomatik olarak Firebase kullanılır
const members = await ApiService.getMembers();
const member = await ApiService.getMemberById('123');
```

## Veri Migrasyonu

Mevcut SQLite verilerini Firebase'e taşımak için:

1. SQLite verilerini export edin
2. FirebaseService kullanarak verileri import edin
3. Şifreleme otomatik olarak yapılır

## Önemli Notlar

1. **Şifreleme Anahtarı**: Production'da güçlü ve güvenli bir şifreleme anahtarı kullanın
2. **Firestore Rules**: Production'da daha sıkı güvenlik kuralları ayarlayın
3. **Backup**: Firestore backup'larını düzenli olarak alın
4. **Indexes**: Karmaşık sorgular için Firestore index'lerini oluşturun

## Sorun Giderme

### Firebase bağlantı hatası
- Firebase config dosyasını kontrol edin (`src/config/firebase.js`)
- Internet bağlantınızı kontrol edin
- Firebase Console'da projenin aktif olduğundan emin olun

### Authentication hatası
- Firebase Authentication'ın aktif olduğundan emin olun
- Email/Password provider'ın aktif olduğunu kontrol edin

### Şifreleme hatası
- `VITE_ENCRYPTION_KEY` environment variable'ının ayarlandığından emin olun
- Anahtarın en az 32 karakter olduğundan emin olun

## Dosya Yapısı

```
sekreterlik-app/client/
├── src/
│   ├── config/
│   │   └── firebase.js          # Firebase yapılandırması
│   ├── services/
│   │   └── FirebaseService.js  # Firestore CRUD işlemleri
│   └── utils/
│       ├── crypto.js            # Şifreleme utilities
│       ├── ApiService.js        # Ana API Service (Firebase/Backend)
│       └── FirebaseApiService.js # Firebase tabanlı API Service
```

