# 🏠 LOKAL MOD - TÜM DIŞ BAĞLANTILAR KAPALI

## ✅ Yapılandırma Durumu

### 🚫 Devre Dışı Bırakılan Servisler:
- ❌ **Firebase** - Tamamen devre dışı
- ❌ **Vercel** - Kullanılmıyor
- ❌ **Netlify** - Kullanılmıyor
- ❌ **Heroku** - Kullanılmıyor
- ❌ **AWS** - Kullanılmıyor
- ❌ **Tüm Bulut Servisleri** - Devre dışı

### ✅ Aktif Servisler:
- ✅ **Lokal JSON Server** - Port 3001
- ✅ **Vite Development Server** - Port 5173
- ✅ **Lokal Veritabanı** - db.json

## 📁 Veri Kaynağı

Tüm veriler **db.json** dosyasında saklanır:
- Kullanıcılar
- Siteler
- Firmalar
- Anlaşmalar
- İşlemler
- Ortaklar
- Diğer tüm veriler

## 🌐 API Endpoint'leri

Tüm API çağrıları **http://localhost:3001/** adresine yapılır:
- `/users` - Kullanıcılar
- `/sites` - Siteler
- `/companies` - Firmalar
- `/agreements` - Anlaşmalar
- `/transactions` - İşlemler
- `/partners` - Ortaklar
- `/panelImages` - Panel görselleri

## 🚀 Sunucuları Başlatma

### JSON Server (Veri API'si):
```bash
npm run json-server
# veya
npx json-server --watch db.json --port 3001
```

### Vite Development Server:
```bash
npm run dev
# veya
npm start
```

### Her İkisini Birlikte:
```bash
npm run start:all
```

## 🔐 Test Kullanıcıları

- **Admin:** `admin` / `1491aaa1491`
- **Site:** `VAD1` / `0543 624 79 25`

## ⚠️ Önemli Notlar

1. **Firebase bağlantıları tamamen kapalı** - Kodlar mevcut ama hiçbir zaman kullanılmaz
2. **İnternet bağlantısı gerektirmez** - Tüm veriler lokal olarak saklanır
3. **Sadece lokal modda çalışır** - Dış servislere bağlanmaz
4. **Veriler db.json dosyasında** - Yedekleme için bu dosyayı kopyalayın

## 🔧 Yapılandırma Dosyaları

- `src/services/api.js` - Sadece lokal API kullanır
- `src/config/firebase.js` - Firebase tamamen devre dışı
- `src/services/firebaseSync.js` - Senkronizasyon kapalı
- `vite.config.js` - Proxy ayarları lokal sunucuya yönlendirilir

## 📝 Değişiklikler

- Firebase import'ları yorum satırına alındı
- Tüm Firebase bağlantıları devre dışı bırakıldı
- API servisi sadece lokal modu kullanır
- package.json'dan Firebase script'leri kaldırıldı
- JSON Server script'i eklendi

