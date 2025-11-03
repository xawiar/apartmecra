# Vercel 404 Hatası Çözümü

## 🔴 HATA: 404 NOT_FOUND

Vercel'de 404 hatası alıyorsanız, aşağıdaki adımları izleyin:

## ✅ ÇÖZÜM ADIMLARI

### 1️⃣ Vercel Dashboard Ayarları

1. **Vercel Dashboard'a gidin:** https://vercel.com/dashboard
2. Projenizi seçin
3. **Settings** → **General** sekmesine gidin
4. **Root Directory** ayarını kontrol edin:
   - **Boş bırakın** veya **`sekreterlik-app/client`** olarak ayarlayın
   - Eğer root directory ayarlanmışsa, build command ve output directory ayarlarını ona göre güncelleyin

### 2️⃣ Build Ayarlarını Kontrol Edin

**Vercel Dashboard → Settings → Build & Development Settings:**

#### Eğer Root Directory BOŞ ise (Root):
```json
Build Command: cd sekreterlik-app/client && npm install && npm run build
Output Directory: sekreterlik-app/client/dist
```

#### Eğer Root Directory `sekreterlik-app/client` ise:
```json
Build Command: npm install && npm run build
Output Directory: dist
```

### 3️⃣ Environment Variables

**Vercel Dashboard → Settings → Environment Variables:**

Şu environment variable'ları ekleyin:
```
VITE_USE_FIREBASE=true
VITE_ENCRYPTION_KEY=ilsekreterlik-app-encryption-key-2024-secret-very-long-key-for-security-minimum-32-characters
```

### 4️⃣ Redeploy

1. **Deployments** sekmesine gidin
2. Son deployment'ın yanındaki **"..."** menüsüne tıklayın
3. **"Redeploy"** seçeneğini seçin
4. Build loglarını kontrol edin

### 5️⃣ Alternatif: vercel.json'ı Güncelle

Eğer hala sorun varsa, `vercel.json` dosyasını şu şekilde güncelleyin:

**Root directory BOŞ ise:**
```json
{
  "buildCommand": "cd sekreterlik-app/client && npm install && npm run build",
  "outputDirectory": "sekreterlik-app/client/dist",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

**Root directory `sekreterlik-app/client` ise:**
```json
{
  "buildCommand": "npm install && npm run build",
  "outputDirectory": "dist",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

## 🔍 SORUN GİDERME

### Build Loglarını Kontrol Edin

1. Vercel Dashboard → **Deployments**
2. Son deployment'a tıklayın
3. **Build Logs** sekmesine gidin
4. Hataları kontrol edin

### Yaygın Sorunlar

#### 1. "Cannot find module"
- `package.json` dosyasında bağımlılıklar eksik olabilir
- `npm install` başarısız olmuş olabilir
- **Çözüm:** Build loglarını kontrol edin

#### 2. "Output directory not found"
- Build başarısız olmuş olabilir
- Output directory path'i yanlış olabilir
- **Çözüm:** Root directory ve output directory ayarlarını kontrol edin

#### 3. "404 on all routes"
- Rewrites yapılandırması yanlış olabilir
- `index.html` dosyası build output'ta yok olabilir
- **Çözüm:** Rewrites yapılandırmasını kontrol edin ve build output'u inceleyin

## 📝 MANUEL TEST

Build'i yerel olarak test edin:

```bash
cd sekreterlik-app/client
npm install
npm run build
ls -la dist
# dist klasöründe index.html dosyası olmalı
```

## ✅ BAŞARI KRİTERLERİ

404 hatası çözüldüğünde:
- ✅ Ana sayfa (`/`) yüklenmeli
- ✅ Tüm route'lar çalışmalı (`/login`, `/dashboard`, vb.)
- ✅ Browser console'da hata olmamalı
- ✅ Network tab'ında 200 status kodları görünmeli

## 🔗 YARDIMCI LİNKLER

- **Vercel Dashboard:** https://vercel.com/dashboard
- **Vercel Docs:** https://vercel.com/docs
- **Vite Config:** https://vitejs.dev/config/

