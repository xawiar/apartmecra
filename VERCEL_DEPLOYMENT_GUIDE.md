# 🚀 Vercel Deployment Kılavuzu

Bu proje Vercel'de deploy edilmek için hazırlanmıştır. Adım adım deployment kılavuzu.

---

## ✅ ÖN HAZIRLIK

### 1. GitHub Repository Kontrolü

Projeniz GitHub'da olmalı:
- **Repository:** https://github.com/xawiar/ilce-sekreterlik
- **Branch:** version1

### 2. Gerekli Dosyalar Kontrolü

Aşağıdaki dosyaların mevcut olduğundan emin olun:
- ✅ `vercel.json` - Vercel yapılandırması
- ✅ `.vercelignore` - Ignore dosyaları
- ✅ `sekreterlik-app/client/package.json` - Client bağımlılıkları

---

## 📋 DEPLOYMENT ADIMLARI

### Adım 1: Vercel Hesabı

1. [Vercel](https://vercel.com) hesabınıza giriş yapın
2. GitHub hesabınızı bağlayın (eğer bağlı değilse)

### Adım 2: Yeni Proje Oluştur

1. Vercel Dashboard → **"Add New..."** → **"Project"**
2. GitHub repository'nizi seçin: **`xawiar/ilce-sekreterlik`**
3. **"Import"** butonuna tıklayın

### Adım 3: Proje Ayarları

#### Framework Preset
- **Framework Preset:** `Other` veya `Vite` seçin

#### Root Directory
**ÖNEMLİ:** İki seçenekten birini seçin:

##### Seçenek A: Root Directory BOŞ (ÖNERİLEN)
```
Root Directory: (boş bırakın)
```

**Build & Development Settings:**
```
Build Command: cd sekreterlik-app/client && npm install && npm run build
Output Directory: sekreterlik-app/client/dist
Install Command: (otomatik tespit edilir)
```

##### Seçenek B: Root Directory = `sekreterlik-app/client`
```
Root Directory: sekreterlik-app/client
```

**Build & Development Settings:**
```
Build Command: npm install && npm run build
Output Directory: dist
Install Command: (otomatik tespit edilir)
```

#### Environment Variables

**Settings → Environment Variables** sekmesine gidin ve şu değişkenleri ekleyin:

```
VITE_USE_FIREBASE=true
VITE_ENCRYPTION_KEY=ilsekreterlik-app-encryption-key-2024-secret-very-long-key-for-security-minimum-32-characters
```

**⚠️ ÖNEMLİ:** 
- `VITE_ENCRYPTION_KEY` için güçlü bir anahtar kullanın (minimum 32 karakter)
- Production'da bu anahtarı değiştirmeniz önerilir

### Adım 4: Deploy

1. **"Deploy"** butonuna tıklayın
2. Build işlemi başlayacak (2-5 dakika sürebilir)
3. Build loglarını izleyin

---

## 🔍 BUILD KONTROLÜ

### Başarılı Build Kriterleri

Build loglarında şunları görmelisiniz:

```
✓ Installing dependencies...
✓ Building...
✓ Build completed
✓ Output: sekreterlik-app/client/dist
✓ index.html found
```

### Build Hatası Durumları

#### Hata 1: "Cannot find module"
```bash
# Çözüm: package.json'da bağımlılıklar eksik olabilir
# Vercel otomatik olarak npm install yapacaktır
```

#### Hata 2: "Build command failed"
```bash
# Çözüm: Build Command'ı kontrol edin
# Doğru: cd sekreterlik-app/client && npm install && npm run build
```

#### Hata 3: "Output directory not found"
```bash
# Çözüm: Output Directory'yi kontrol edin
# Doğru: sekreterlik-app/client/dist (veya dist)
```

---

## ✅ DEPLOYMENT SONRASI KONTROL

### 1. Deployment Başarılı mı?

1. Vercel Dashboard → **Deployments**
2. Son deployment'ın durumunu kontrol edin:
   - ✅ **Ready** = Başarılı
   - ❌ **Error** = Hata var (logları kontrol edin)

### 2. Site Çalışıyor mu?

1. Deployment'ın yanındaki **"Visit"** butonuna tıklayın
2. Ana sayfa yüklenmeli (`/`)
3. Login sayfası çalışmalı (`/login`)

### 3. Route'lar Çalışıyor mu?

Şu route'ları test edin:
- `/` - Ana sayfa
- `/login` - Login sayfası
- `/dashboard` - Dashboard (giriş yaptıktan sonra)

---

## 🔧 SORUN GİDERME

### Sorun 1: "404 NOT_FOUND"

**Çözüm:**
1. Vercel Dashboard → Settings → General
2. **Root Directory** ayarını kontrol edin
3. `vercel.json` dosyasındaki `rewrites` yapılandırmasını kontrol edin
4. Redeploy yapın (cache olmadan)

### Sorun 2: "Build failed"

**Çözüm:**
1. Build loglarını kontrol edin
2. Environment variables'ın doğru olduğundan emin olun
3. `package.json` dosyasında bağımlılıklar eksik olabilir
4. Vercel Dashboard'da **"Clear Build Cache"** yapın

### Sorun 3: "Environment variables not found"

**Çözüm:**
1. Vercel Dashboard → Settings → Environment Variables
2. Tüm değişkenlerin eklendiğinden emin olun
3. Değişken isimlerinin `VITE_` ile başladığından emin olun
4. Redeploy yapın

### Sorun 4: "Firebase connection error"

**Çözüm:**
1. Environment variables'da `VITE_USE_FIREBASE=true` olduğundan emin olun
2. Firebase Console'da Firestore Rules'un uygulandığını kontrol edin
3. Browser console'da hata mesajlarını kontrol edin

---

## 🔄 REDEPLOYMENT

### Yeniden Deploy

1. Vercel Dashboard → **Deployments**
2. Son deployment'ın yanındaki **"..."** menüsüne tıklayın
3. **"Redeploy"** seçeneğini seçin
4. ✅ **"Use existing Build Cache"** seçeneğini **KALDIRIN** (yeni build için)
5. **"Redeploy"** butonuna tıklayın

### Otomatik Deploy (GitHub Push)

Her GitHub push'unda otomatik deploy:
1. Vercel Dashboard → Settings → Git
2. **"Automatic deployments"** açık olmalı
3. Production branch: `version1` (veya `main`)
4. Her push'da otomatik deploy yapılacak

---

## 📝 ENVIRONMENT VARIABLES LİSTESİ

Vercel Dashboard'da eklemeniz gereken değişkenler:

| Değişken | Değer | Açıklama |
|----------|-------|----------|
| `VITE_USE_FIREBASE` | `true` | Firebase kullanımını aktif eder |
| `VITE_ENCRYPTION_KEY` | `ilsekreterlik-app-encryption-key-2024-secret-very-long-key-for-security-minimum-32-characters` | Şifreleme anahtarı (Production'da değiştirin!) |

**Opsiyonel:**
| Değişken | Değer | Açıklama |
|----------|-------|----------|
| `VITE_API_BASE_URL` | `https://your-backend-url.com/api` | Backend API URL (Firebase kullanmıyorsanız) |
| `VITE_SENTRY_DSN` | `your-sentry-dsn` | Sentry DSN (eğer kullanıyorsanız) |

---

## 🎯 BAŞARI KONTROL LİSTESİ

Deployment başarılı olduğunda:

- ✅ Build loglarında "Build completed" görünmeli
- ✅ Deployment durumu "Ready" olmalı
- ✅ Ana sayfa (`/`) yüklenmeli
- ✅ Login sayfası (`/login`) çalışmalı
- ✅ Tüm route'lar çalışmalı
- ✅ Browser console'da hata olmamalı
- ✅ Firebase bağlantısı çalışmalı (eğer kullanıyorsanız)

---

## 🔗 YARDIMCI LİNKLER

- **Vercel Dashboard:** https://vercel.com/dashboard
- **Vercel Docs:** https://vercel.com/docs
- **Vite Deployment:** https://vitejs.dev/guide/static-deploy.html#vercel
- **GitHub Repository:** https://github.com/xawiar/ilce-sekreterlik

---

## 📞 DESTEK

Eğer deployment sırasında sorun yaşarsanız:

1. Build loglarını kontrol edin
2. `vercel.json` dosyasını kontrol edin
3. Environment variables'ı kontrol edin
4. Vercel Dashboard ayarlarını kontrol edin

---

## ✅ TAMAMLANDI!

Deployment tamamlandıktan sonra:

1. Site URL'inizi paylaşın
2. Test edin
3. Production'da kullanıma hazır! 🎉

