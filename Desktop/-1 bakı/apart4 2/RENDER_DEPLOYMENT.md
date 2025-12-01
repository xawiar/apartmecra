# Render.com Deployment Guide

Bu proje Render.com üzerinde deploy edilmek üzere yapılandırılmıştır.

## 🚀 Hızlı Başlangıç

### 1. Render.com'da Yeni Servis Oluşturma

1. [Render.com](https://render.com) hesabınıza giriş yapın
2. Dashboard'da **"New +"** butonuna tıklayın
3. **"Web Service"** seçeneğini seçin
4. GitHub repository'nizi bağlayın:
   - Repository: `xawiar/apartmecra`
   - Branch: `version1`

### 2. Build ve Start Ayarları

Render.com otomatik olarak `render.yaml` dosyasını algılar. Manuel ayar yapmak isterseniz:

- **Build Command:** `npm install && npm run build`
- **Start Command:** `npm run start:production`
- **Environment:** `Node`

### 3. Environment Variables

Render otomatik olarak şu environment variable'ları sağlar:
- `NODE_ENV=production` (render.yaml'da tanımlı)
- `PORT` (Render otomatik atar)
- `RENDER_EXTERNAL_URL` (Render otomatik atar)
- `RENDER_EXTERNAL_HOSTNAME` (Render otomatik atar)

### 4. Health Check

Health check endpoint: `/api/sites`

## 📁 Proje Yapısı

```
├── render.yaml              # Render deployment konfigürasyonu
├── server.cjs               # Production server (Express + JSON Server)
├── package.json             # Dependencies ve scripts
├── vite.config.js           # Vite build konfigürasyonu
├── dist/                    # Build edilmiş frontend dosyaları
└── db.json                  # JSON Server database
```

## 🔧 Teknik Detaylar

### Server Yapısı

- **Frontend:** Vite ile build edilmiş React uygulaması (`dist/` klasörü)
- **Backend:** Express + JSON Server (`server.cjs`)
- **Port:** Render'ın sağladığı `PORT` environment variable'ı kullanılır

### API Endpoints

Tüm API endpoint'leri `/api` prefix'i ile başlar:
- `/api/sites` - Siteler
- `/api/companies` - Şirketler
- `/api/agreements` - Anlaşmalar
- `/api/users` - Kullanıcılar
- `/api/transactions` - İşlemler
- `/api/upload-panel-image` - Panel resmi yükleme

### CORS Ayarları

Production'da CORS ayarları otomatik olarak Render URL'lerini içerir:
- Localhost (development)
- Render production URL (`RENDER_EXTERNAL_URL`)
- Render hostname (`RENDER_EXTERNAL_HOSTNAME`)

### Static File Serving

Production'da `server.cjs` şu sırayla dosyaları serve eder:
1. `/api/*` - API endpoints
2. `/uploads/*` - Upload edilmiş dosyalar
3. `/*` - React SPA (index.html)

## 🐛 Sorun Giderme

### Build Hatası

- `npm install` başarısız olursa: Node.js versiyonunu kontrol edin (18.x veya üzeri önerilir)
- `npm run build` başarısız olursa: `node_modules` klasörünü silip `npm install` tekrar çalıştırın

### Runtime Hatası

- Port hatası: `PORT` environment variable'ının Render tarafından ayarlandığından emin olun
- CORS hatası: `RENDER_EXTERNAL_URL` environment variable'ının ayarlandığından emin olun
- Database hatası: `db.json` dosyasının mevcut olduğundan emin olun

### Log Kontrolü

Render dashboard'da **"Logs"** sekmesinden runtime loglarını kontrol edebilirsiniz.

## 📝 Notlar

- İlk deploy 5-10 dakika sürebilir
- Her push otomatik olarak yeni bir deploy tetikler (autoDeploy: true)
- Free plan'da servis 15 dakika kullanılmazsa uyku moduna geçer
- Production URL: Render dashboard'da görüntülenir

## 🔗 Faydalı Linkler

- [Render Documentation](https://render.com/docs)
- [Render Dashboard](https://dashboard.render.com)
- [GitHub Repository](https://github.com/xawiar/apartmecra)


