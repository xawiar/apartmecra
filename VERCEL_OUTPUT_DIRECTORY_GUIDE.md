# 📁 Vercel Output Directory - DETAYLI KILAVUZ

## 🎯 OUTPUT DIRECTORY NE DEMEK?

Output Directory (Çıktı Dizini), Vercel'in build sonrası hangi klasörü deploy edeceğini belirler.

---

## ✅ DOĞRU OUTPUT DIRECTORY DEĞERLERİ

### Seçenek 1: Root Directory BOŞ (ÖNERİLEN)

**Eğer Vercel Dashboard'da Root Directory BOŞ BIRAKILMIŞSA:**

**Output Directory:**
```
sekreterlik-app/client/dist
```

**Tam ayarlar:**
```
Root Directory: (boş bırakın)
Build Command: cd sekreterlik-app/client && npm install && npm run build
Output Directory: sekreterlik-app/client/dist
Install Command: cd sekreterlik-app/client && npm install
```

---

### Seçenek 2: Root Directory = `sekreterlik-app/client`

**Eğer Vercel Dashboard'da Root Directory `sekreterlik-app/client` OLARAK AYARLANMIŞSA:**

**Output Directory:**
```
dist
```

**Tam ayarlar:**
```
Root Directory: sekreterlik-app/client
Build Command: npm install && npm run build
Output Directory: dist
Install Command: npm install
```

---

## 📋 VERCEL DASHBOARD'DA NASIL AYARLANIR?

### Adım 1: Settings Sayfasına Gidin

1. Vercel Dashboard → Projeniz → **Settings**
2. Sol menüden **"Build & Development Settings"** sekmesine tıklayın

### Adım 2: Output Directory'yi Ayarlayın

**"Output Directory"** alanını bulun ve yazın:

#### Eğer Root Directory BOŞ ise:
```
sekreterlik-app/client/dist
```

#### Eğer Root Directory `sekreterlik-app/client` ise:
```
dist
```

### Adım 3: Kaydedin

**"Save"** butonuna tıklayın.

---

## 🔍 KONTROL EDİN

### Root Directory Kontrolü

**Settings → General → Root Directory:**

- ✅ **Boş bırakılmışsa** → Output Directory: `sekreterlik-app/client/dist`
- ✅ **`sekreterlik-app/client` yazılmışsa** → Output Directory: `dist`

---

## 📸 GÖRSEL ÖRNEK

### Senaryo 1: Root Directory BOŞ

```
Vercel Dashboard
├── Settings
    ├── General
    │   └── Root Directory: (boş) ← BOŞ
    └── Build & Development Settings
        ├── Build Command: cd sekreterlik-app/client && npm install && npm run build
        ├── Output Directory: sekreterlik-app/client/dist ← BU DEĞER
        └── Install Command: cd sekreterlik-app/client && npm install
```

### Senaryo 2: Root Directory = sekreterlik-app/client

```
Vercel Dashboard
├── Settings
    ├── General
    │   └── Root Directory: sekreterlik-app/client ← BU DEĞER
    └── Build & Development Settings
        ├── Build Command: npm install && npm run build
        ├── Output Directory: dist ← BU DEĞER
        └── Install Command: npm install
```

---

## ⚠️ ÖNEMLİ NOTLAR

### 1. Root Directory ve Output Directory Uyumu

**❌ YANLIŞ:**
```
Root Directory: sekreterlik-app/client
Output Directory: sekreterlik-app/client/dist  ← YANLIŞ!
```

**✅ DOĞRU:**
```
Root Directory: sekreterlik-app/client
Output Directory: dist  ← DOĞRU!
```

**Çünkü:** Root Directory zaten `sekreterlik-app/client` olduğu için, Output Directory sadece `dist` olmalıdır.

---

### 2. Path Yapısı

Vercel şu path'i arar:
```
Root Directory + Output Directory = Build Output Path
```

**Örnek 1:**
```
Root Directory: (boş)
Output Directory: sekreterlik-app/client/dist
Sonuç: sekreterlik-app/client/dist
```

**Örnek 2:**
```
Root Directory: sekreterlik-app/client
Output Directory: dist
Sonuç: sekreterlik-app/client/dist
```

Her ikisi de aynı yere işaret eder! ✅

---

## 🎯 HIZLI CEVAP

**Soru:** Output Directory'ye ne yazmalıyım?

**Cevap:** Root Directory'ye göre:

- **Root Directory BOŞ ise:** `sekreterlik-app/client/dist`
- **Root Directory `sekreterlik-app/client` ise:** `dist`

---

## ✅ KONTROL LİSTESİ

Output Directory doğru ayarlandığında:

- ✅ Root Directory ile uyumlu
- ✅ Build loglarında "Output: ..." görünmeli
- ✅ Build loglarında "Found index.html" görünmeli
- ✅ Deployment başarılı olmalı

---

## 🔄 REDEPLOY

Output Directory'yi değiştirdikten sonra:

1. **Deployments** → Son deployment → **"..."** → **"Redeploy"**
2. ✅ **"Use existing Build Cache"** seçeneğini **KALDIRIN** ⚠️
3. **"Redeploy"** butonuna tıklayın

---

## ❓ SORUN GİDERME

### Sorun: "Output directory not found"

**Çözüm:**
1. Root Directory'yi kontrol edin
2. Output Directory'nin doğru olduğundan emin olun
3. Build Command'ın başarılı olduğundan emin olun
4. Build loglarını kontrol edin

### Sorun: "404 NOT_FOUND"

**Çözüm:**
1. Output Directory'nin doğru olduğundan emin olun
2. Build output'ta `index.html` olup olmadığını kontrol edin
3. Rewrites yapılandırmasını kontrol edin

---

## 📞 YARDIM

Eğer hala sorun yaşıyorsanız:

1. Root Directory ayarınızı paylaşın
2. Output Directory ayarınızı paylaşın
3. Build loglarını kontrol edin

---

## 💡 ÖNERİ

**En kolay yol:** Root Directory'yi BOŞ bırakın ve Output Directory'ye `sekreterlik-app/client/dist` yazın.

Bu şekilde daha az karışıklık olur! ✅

