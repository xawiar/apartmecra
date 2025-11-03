# 🔧 Vercel npm install Hatası Çözümü

## ❌ HATA
```
Error: Command "cd sekreterlik-app/client && npm install" exited with 1
```

## 🔍 SORUN NEDİR?

`npm install` komutu Vercel'de başarısız oluyor. Bu genellikle şu sebeplerden kaynaklanır:
1. `installCommand` ve `buildCommand` çakışıyor
2. Root Directory ile path'ler uyumsuz
3. Node.js versiyonu uyumsuz
4. Build cache sorunlu

## ✅ ÇÖZÜM

### Çözüm 1: installCommand'i Kaldırın (ÖNERİLEN)

`vercel.json` dosyası güncellendi. `installCommand` kaldırıldı, sadece `buildCommand` kullanılıyor.

**Vercel Dashboard'da:**

**Settings → Build & Development Settings:**

```
Framework Preset: Other
Build Command: cd sekreterlik-app/client && npm install && npm run build
Output Directory: sekreterlik-app/client/dist
Install Command: (BOŞ BIRAKIN - Otomatik tespit edilir)
```

### Çözüm 2: Root Directory Ayarlayın

**Settings → General → Root Directory:**

**Seçenek A: Root Directory BOŞ (ÖNERİLEN)**
```
Root Directory: (boş bırakın)
```

**Build & Development Settings:**
```
Framework Preset: Other
Build Command: cd sekreterlik-app/client && npm install && npm run build
Output Directory: sekreterlik-app/client/dist
Install Command: (boş bırakın)
```

**Seçenek B: Root Directory = sekreterlik-app/client**
```
Root Directory: sekreterlik-app/client
```

**Build & Development Settings:**
```
Framework Preset: Vite
Build Command: npm install && npm run build
Output Directory: dist
Install Command: (boş bırakın)
```

### Çözüm 3: Build Cache Temizle

**Yöntem 1: Redeploy ile Cache Temizleme (ÖNERİLEN)**

1. **Deployments** → Son deployment'a tıklayın
2. **"Redeploy"** butonuna tıklayın
3. **"Use existing Build Cache"** seçeneğini **KALDIRIN** ⚠️
4. **"Redeploy"** butonuna tıklayın

**Yöntem 2: Clear Build Cache Butonu (Eğer varsa)**

1. **Deployments** → Son deployment'a tıklayın
2. Deployment detay sayfasında **"..."** menüsüne tıklayın
3. **"Clear Build Cache"** seçeneğini seçin
4. Onaylayın

**Not:** Bazı Vercel versiyonlarında "Clear Build Cache" butonu olmayabilir. Bu durumda **Yöntem 1**'i kullanın.

## 🔄 REDEPLOY

Ayarları güncelledikten sonra:

1. **Deployments** → Son deployment → **"..."** → **"Redeploy"**
2. ✅ **"Use existing Build Cache"** seçeneğini **KALDIRIN** ⚠️
3. **"Redeploy"** butonuna tıklayın

## 📋 BUILD LOG KONTROLÜ

Build başarılı olduğunda şunları görmelisiniz:

```
✓ Cloning repository...
✓ Installing dependencies...
✓ Building...
✓ Build completed successfully
✓ Output: sekreterlik-app/client/dist
✓ Found index.html
```

## ❓ SORUN GİDERME

### Hata: "npm install failed"

**Çözüm:**
1. Install Command'i BOŞ bırakın (otomatik tespit edilir)
2. Build Command'da `npm install` olduğundan emin olun
3. Build Cache'i temizleyin
4. Redeploy yapın (cache olmadan)

### Hata: "Cannot find module"

**Çözüm:**
1. Build loglarını kontrol edin
2. `package.json` dosyasında bağımlılıklar eksik olabilir
3. `package-lock.json` git'te var mı kontrol edin
4. Node.js versiyonu uyumlu mu kontrol edin

### Hata: "Command exited with 1"

**Çözüm:**
1. Build Command'ı kontrol edin
2. Root Directory ile Build Command'ın uyumlu olduğundan emin olun
3. Install Command'i BOŞ bırakın
4. Build Cache'i temizleyin
5. Redeploy yapın (cache olmadan)

## ✅ BAŞARI KRİTERLERİ

Build başarılı olduğunda:

- ✅ Build loglarında "Installing dependencies..." görünmeli
- ✅ Build loglarında "Build completed" görünmeli
- ✅ "npm install" hatası kaybolmalı
- ✅ Deployment durumu "Ready" olmalı
- ✅ Ana sayfa yüklenmeli

## 💡 ÖNEMLİ NOTLAR

### installCommand vs buildCommand

- **installCommand:** Sadece bağımlılıkları yükler
- **buildCommand:** Hem bağımlılıkları yükler hem de build yapar

**En iyi pratik:** Install Command'i BOŞ bırakın, Build Command'da `npm install` yapın.

### Root Directory Uyumu

Root Directory ve Build Command path'lerinin uyumlu olduğundan emin olun:

**Root Directory BOŞ ise:**
```
Build Command: cd sekreterlik-app/client && npm install && npm run build
```

**Root Directory = sekreterlik-app/client ise:**
```
Build Command: npm install && npm run build
```

## 📞 YARDIM

Eğer hala sorun yaşıyorsanız:

1. Build loglarının tamamını paylaşın
2. Root Directory ayarınızı paylaşın
3. Build Command'ı paylaşın
4. Install Command'i paylaşın (boş olmalı)

