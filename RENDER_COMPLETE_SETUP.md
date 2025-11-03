# 🚀 Render.com - TAM SETUP KILAVUZU

## ✅ EKLENEN DOSYALAR

### 1. `_redirects` Dosyası ✅

**Konum:**
```
sekreterlik-app/client/public/_redirects
```

**İçerik:**
```
/* /index.html 200
```

**Amaç:** SPA routing için - React Router çalışması için gerekli.

---

### 2. `render.yaml` Dosyası ✅

**Konum:**
```
render.yaml
```

**İçerik:**
```yaml
services:
  - type: web
    name: ilce-sekreterlik
    env: static
    buildCommand: cd sekreterlik-app/client && npm install && npm run build
    staticPublishPath: sekreterlik-app/client/dist
    envVars:
      - key: VITE_USE_FIREBASE
        value: true
      - key: VITE_ENCRYPTION_KEY
        value: ilsekreterlik-app-encryption-key-2024-secret-very-long-key-for-security-minimum-32-characters
```

**Amaç:** Render.com otomatik deployment yapılandırması.

---

### 3. `.renderignore` Dosyası ✅

**Konum:**
```
.renderignore
```

**Amaç:** Render build'e dahil edilmeyecek dosyaları belirtir.

---

## 📋 RENDER.COM DASHBOARD AYARLARI

### ADIM 1: Yeni Static Site Oluştur

1. **Render Dashboard:** https://dashboard.render.com
2. **"New"** → **"Static Site"**
3. **GitHub repository'yi bağlayın:** `xawiar/ilce-sekreterlik`
4. **Branch:** `main` veya `version1`

---

### ADIM 2: Build Ayarları

#### Name:
```
ilce-sekreterlik
```

#### Build Command:
```
cd sekreterlik-app/client && npm install && npm run build
```

#### Publish Directory:
```
sekreterlik-app/client/dist
```

**VEYA:** `render.yaml` dosyası varsa, otomatik kullanılır.

---

### ADIM 3: Environment Variables

**Environment → Add Environment Variable:**

#### 1. VITE_USE_FIREBASE

**Key:**
```
VITE_USE_FIREBASE
```

**Value:**
```
true
```

---

#### 2. VITE_ENCRYPTION_KEY

**Key:**
```
VITE_ENCRYPTION_KEY
```

**Value:**
```
ilsekreterlik-app-encryption-key-2024-secret-very-long-key-for-security-minimum-32-characters
```

---

### ADIM 4: Deploy Et

**"Create Static Site"** butonuna tıklayın.

---

## 🔍 KONTROL LİSTESİ

Render.com'da deploy etmeden önce:

- [ ] **`_redirects` dosyası eklendi mi?** ✅ (`sekreterlik-app/client/public/_redirects`)
- [ ] **`render.yaml` dosyası eklendi mi?** ✅ (root dizinde)
- [ ] **`.renderignore` dosyası eklendi mi?** ✅ (root dizinde)
- [ ] **Firebase Console:** Authentication aktif mi? ✅
- [ ] **Firebase Console:** Firestore Database oluşturuldu mu? ✅
- [ ] **Firebase Console:** Security Rules ayarlandı mı? ✅
- [ ] **Render.com:** Environment Variables eklendi mi? ✅
  - [ ] `VITE_USE_FIREBASE` = `true` ✅
  - [ ] `VITE_ENCRYPTION_KEY` = `ilsekreterlik-app-encryption-key-...` ✅
- [ ] **Render.com:** Build Command doğru mu? ✅
- [ ] **Render.com:** Publish Directory doğru mu? ✅

---

## ✅ TÜM DOSYALAR HAZIR!

**Eklenen dosyalar:**
1. ✅ `sekreterlik-app/client/public/_redirects` - SPA routing
2. ✅ `render.yaml` - Render yapılandırması
3. ✅ `.renderignore` - Render ignore dosyası

**Zaten var (değiştirilmedi):**
- ✅ `sekreterlik-app/client/src/config/firebase.js` - Firebase config
- ✅ `sekreterlik-app/client/package.json` - Bağımlılıklar
- ✅ `sekreterlik-app/client/vite.config.js` - Vite yapılandırması

---

## 🚀 DEPLOY İÇİN HAZIR!

**Proje Render.com'a deploy edilmeye hazır!** ✅

**Sadece Render.com Dashboard'da:**
1. ✅ Static Site oluşturun
2. ✅ Environment Variables ekleyin
3. ✅ Deploy edin

---

**TÜM AYARLAR TAMAMLANDI!** ✅

