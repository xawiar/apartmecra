# Vercel Deployment Rehberi

Bu proje Vercel'de deploy edilmek için hazırlanmıştır.

## Yapılandırma

### 1. Frontend (Vercel)

Frontend otomatik olarak Vercel'de deploy edilecektir. Yapılandırma dosyaları:
- `vercel.json` - Vercel build ayarları
- `sekreterlik-app/client/vite.config.js` - Vite yapılandırması
- `sekreterlik-app/client/src/utils/ApiService.js` - API URL environment variable'dan alınır

### 2. Environment Variables (Vercel Dashboard)

Vercel projenizde aşağıdaki environment variable'ı ekleyin:

```
VITE_API_BASE_URL=https://your-backend-url.com/api
```

**Önemli:** Backend'inizi deploy ettiğiniz URL'i buraya yazın.

### 3. Deployment Adımları

#### Vercel CLI ile:

```bash
# Vercel CLI yükleyin (ilk kez)
npm i -g vercel

# Projeyi deploy edin
vercel

# Production'a deploy edin
vercel --prod
```

#### GitHub ile (Önerilen):

1. GitHub repository'nizi Vercel'e bağlayın
2. Vercel otomatik olarak:
   - Root'ta `vercel.json` dosyasını bulacak
   - `buildCommand` ve `outputDirectory` ayarlarını kullanacak
   - Environment variables'ı otomatik olarak inject edecek

### 4. Backend Deployment

Backend için ayrı bir servise deploy etmeniz gerekiyor:

**Önerilen Platformlar:**
- **Railway** (https://railway.app) - Kolay SQLite desteği
- **Render** (https://render.com) - Ücretsiz tier mevcut
- **Fly.io** (https://fly.io) - İyi performans

**Backend Deployment Notları:**
- Backend'iniz Express.js kullanıyor (Port 5000)
- SQLite veritabanı kullanıyor (persistent storage gerekli)
- MongoDB connection da var (environment variable gerekli)
- CORS ayarlarını production URL'ler için güncelleyin

### 5. Backend CORS Ayarları

Backend'i deploy ettikten sonra, `sekreterlik-app/server/index.js` dosyasında CORS ayarlarını güncelleyin:

```javascript
const envOrigins = (process.env.CORS_ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
// Production URL'inizi buraya ekleyin:
// 'https://your-vercel-app.vercel.app'
```

### 6. Environment Variables (Backend)

Backend'de gerekli environment variables:
- `CORS_ALLOWED_ORIGINS` - Frontend URL'iniz (Vercel)
- `JWT_SECRET` - JWT secret key
- `MONGODB_URI` - MongoDB connection string (eğer kullanılıyorsa)
- `PORT` - Server port (genelde otomatik atanır)

## Hızlı Başlangıç

1. **Backend'i deploy edin** (Railway/Render/Fly.io)
2. **Backend URL'ini alın**
3. **Vercel'e gidin** ve projeyi bağlayın
4. **Environment Variable ekleyin:**
   - `VITE_API_BASE_URL=https://your-backend-url.com/api`
5. **Deploy edin!**

## Sorun Giderme

### Build Hatası
- Root'ta `vercel.json` olduğundan emin olun
- `sekreterlik-app/client/package.json` içinde build script olduğunu kontrol edin

### API Bağlantı Hatası
- `VITE_API_BASE_URL` environment variable'ın doğru olduğundan emin olun
- Backend'inizin çalıştığını ve CORS ayarlarının doğru olduğunu kontrol edin
- Browser console'da network isteklerini kontrol edin

### CORS Hatası
- Backend'de frontend URL'inizin `CORS_ALLOWED_ORIGINS` içinde olduğundan emin olun

## Dosya Yapısı

```
/
├── vercel.json              # Vercel yapılandırması
├── package.json             # Root package.json (build scriptleri)
└── sekreterlik-app/
    ├── client/              # Frontend (React + Vite)
    │   ├── src/
    │   │   └── utils/
    │   │       └── ApiService.js  # API URL environment variable'dan alır
    │   └── vite.config.js
    └── server/              # Backend (Express.js)
        └── index.js        # CORS ayarlarını buradan güncelleyin
```

