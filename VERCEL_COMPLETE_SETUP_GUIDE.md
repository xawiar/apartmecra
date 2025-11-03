# 🚀 Vercel Dashboard - TAM SETUP KILAVUZU (BAŞTAN SONA)

## 📋 VERCEL DASHBOARD AYARLARI - ADIM ADIM

Bu kılavuz Vercel Dashboard'daki **TÜM** ayarları baştan sona açıklar.

---

## 🎯 ADIM 1: VERCEL DASHBOARD'A GİRİŞ

1. Tarayıcınızda şu adrese gidin: **https://vercel.com/dashboard**
2. Giriş yapın (eğer yapmadıysanız)
3. Projenizi bulun: **ilce-sekreterlik** (veya proje adınız)

---

## 🔧 ADIM 2: PROJE AYARLARI

### 2.1 Settings Sayfasına Gidin

1. Projenizin ana sayfasında
2. Üst menüden **"Settings"** sekmesine tıklayın
3. Sol menüden ayarlara erişebilirsiniz

---

## 📁 ADIM 3: GENERAL AYARLARI (ÇOK ÖNEMLİ!)

### Settings → General

#### 3.1 Root Directory

**⚠️ EN ÖNEMLİ AYAR!**

**Seçenek A (ÖNERİLEN - EN KOLAY):**

```
Root Directory: (BOŞ BIRAKIN - Hiçbir şey yazmayın)
```

**Seçenek B (ALTERNATIF):**

```
Root Directory: sekreterlik-app/client
```

**Nasıl Ayarlanır:**
1. Settings → General sekmesinde
2. "Root Directory" alanını bulun
3. **Seçenek A için:** Alanı BOŞ bırakın veya `./` yazın
4. **Seçenek B için:** `sekreterlik-app/client` yazın
5. **"Save"** butonuna tıklayın

---

## 🔨 ADIM 4: BUILD & DEVELOPMENT SETTINGS

### Settings → Build & Development Settings

#### 4.1 Framework Preset

**Değer:**
```
Other
```

**VEYA:**
```
Vite
```

**Nasıl Ayarlanır:**
1. "Framework Preset" dropdown menüsünü bulun
2. `Other` veya `Vite` seçin
3. **"Save"** butonuna tıklayın

---

#### 4.2 Root Directory'e Göre Build Command

### ⚠️ ÖNEMLİ: Root Directory'ye göre farklı değerler!

#### Eğer Root Directory BOŞ ise (Seçenek A):

**Build Command:**
```
cd sekreterlik-app/client && npm install && npm run build
```

**Output Directory:**
```
sekreterlik-app/client/dist
```

**Install Command:**
```
(BOŞ BIRAKIN - Hiçbir şey yazmayın)
```

---

#### Eğer Root Directory = `sekreterlik-app/client` ise (Seçenek B):

**Build Command:**
```
npm install && npm run build
```

**Output Directory:**
```
dist
```

**Install Command:**
```
(BOŞ BIRAKIN - Hiçbir şey yazmayın)
```

---

### 4.3 Nasıl Ayarlanır?

#### Build Command:

1. "Build Command" alanını bulun
2. Yukarıdaki değerlerden birini yazın (Root Directory'ye göre)
3. **Kopyala-Yapıştır yapın:**
   - **Root Directory BOŞ ise:** `cd sekreterlik-app/client && npm install && npm run build`
   - **Root Directory = sekreterlik-app/client ise:** `npm install && npm run build`

#### Output Directory:

1. "Output Directory" alanını bulun
2. Yukarıdaki değerlerden birini yazın (Root Directory'ye göre)
3. **Kopyala-Yapıştır yapın:**
   - **Root Directory BOŞ ise:** `sekreterlik-app/client/dist`
   - **Root Directory = sekreterlik-app/client ise:** `dist`

#### Install Command:

1. "Install Command" alanını bulun
2. **BOŞ BIRAKIN** (hiçbir şey yazmayın)
3. Veya `cd sekreterlik-app/client && npm install` yazın (eğer Root Directory BOŞ ise)

**⚠️ ÖNEMLİ:** Install Command'i boş bırakmak genellikle daha iyi çalışır.

---

### 4.4 Kaydetme

Tüm ayarları yaptıktan sonra:
1. Sayfanın alt kısmında **"Save"** butonuna tıklayın
2. Değişikliklerin kaydedildiğini görmelisiniz

---

## 🔐 ADIM 5: ENVIRONMENT VARIABLES

### Settings → Environment Variables

#### 5.1 Yeni Environment Variable Eklemek

1. **"Add New"** butonuna tıklayın
2. Açılan formda bilgileri girin

#### 5.2 İlk Değişken: VITE_USE_FIREBASE

**Key (Anahtar):**
```
VITE_USE_FIREBASE
```

**Value (Değer):**
```
true
```

**⚠️ ÖNEMLİ:** Tırnak işareti kullanmayın! Sadece `true` yazın.

**Environment (Ortam):**
- ✅ **Production** - İşaretli olmalı
- ✅ **Preview** - İşaretli olmalı
- ✅ **Development** - İşaretli olmalı

**"Save"** butonuna tıklayın.

---

#### 5.3 İkinci Değişken: VITE_ENCRYPTION_KEY

**Key (Anahtar):**
```
VITE_ENCRYPTION_KEY
```

**Value (Değer):**
```
ilsekreterlik-app-encryption-key-2024-secret-very-long-key-for-security-minimum-32-characters
```

**⚠️ ÖNEMLİ:** Tüm değeri kopyalayın, tırnak işareti kullanmayın!

**Environment (Ortam):**
- ✅ **Production** - İşaretli olmalı
- ✅ **Preview** - İşaretli olmalı
- ✅ **Development** - İşaretli olmalı

**"Save"** butonuna tıklayın.

---

## 📋 ADIM 6: AYARLAR KONTROL LİSTESİ

### 6.1 General Ayarları:

- [ ] Root Directory: BOŞ BIRAKILMIŞ (veya `sekreterlik-app/client`)
- [ ] Ayarlar kaydedilmiş

### 6.2 Build & Development Settings:

- [ ] Framework Preset: `Other` veya `Vite`
- [ ] Build Command: Doğru yazılmış (Root Directory'ye göre)
- [ ] Output Directory: Doğru yazılmış (Root Directory'ye göre)
- [ ] Install Command: BOŞ BIRAKILMIŞ (veya doğru yazılmış)
- [ ] Ayarlar kaydedilmiş

### 6.3 Environment Variables:

- [ ] `VITE_USE_FIREBASE` = `true` (Production, Preview, Development işaretli)
- [ ] `VITE_ENCRYPTION_KEY` = `ilsekreterlik-app-encryption-key-2024-secret-very-long-key-for-security-minimum-32-characters` (Production, Preview, Development işaretli)
- [ ] Ayarlar kaydedilmiş

---

## 🔄 ADIM 7: REDEPLOY

### 7.1 Deployments Sayfasına Gidin

1. Üst menüden **"Deployments"** sekmesine tıklayın
2. Son deployment'ı bulun

### 7.2 Redeploy Yapın

1. Son deployment'ın yanındaki **"..."** (üç nokta) menüsüne tıklayın
2. **"Redeploy"** seçeneğini seçin
3. Açılan pencerede:
   - ✅ **"Use existing Build Cache"** seçeneğini **KALDIRIN** ⚠️
   - **"Redeploy"** butonuna tıklayın

### 7.3 Build Loglarını İzleyin

1. Deployment detay sayfasında **"Build Logs"** sekmesine tıklayın
2. Build işlemini izleyin
3. Hataları kontrol edin

---

## ❌ HATA: "npm install" exited with 1

### Sorun Analizi:

Bu hata genellikle şu sebeplerden kaynaklanır:

1. **Build Command yanlış**
2. **Root Directory ile Build Command uyumsuz**
3. **Install Command çakışıyor**
4. **Node.js versiyonu sorunu**

---

## ✅ ÇÖZÜM ADIMLARI

### Çözüm 1: Build Command Kontrolü

#### Eğer Root Directory BOŞ ise:

**Build Command şöyle olmalı:**
```
cd sekreterlik-app/client && npm install && npm run build
```

**Kontrol:**
- ✅ `cd sekreterlik-app/client &&` ile başlamalı
- ✅ `npm install &&` içermeli
- ✅ `npm run build` ile bitmeli

#### Eğer Root Directory = `sekreterlik-app/client` ise:

**Build Command şöyle olmalı:**
```
npm install && npm run build
```

**Kontrol:**
- ✅ `cd` komutu OLMAMALI
- ✅ `npm install &&` ile başlamalı
- ✅ `npm run build` ile bitmeli

---

### Çözüm 2: Install Command'i Kaldırın

**Install Command:**
```
(BOŞ BIRAKIN - Hiçbir şey yazmayın)
```

**VEYA:**

Eğer Root Directory BOŞ ise:
```
cd sekreterlik-app/client && npm install
```

Eğer Root Directory = `sekreterlik-app/client` ise:
```
npm install
```

**⚠️ ÖNERİLEN:** Install Command'i BOŞ bırakın, Build Command'da zaten `npm install` var.

---

### Çözüm 3: Root Directory Kontrolü

**Settings → General → Root Directory:**

**Seçenek A (ÖNERİLEN):**
```
(BOŞ BIRAKIN)
```

**Build Command:**
```
cd sekreterlik-app/client && npm install && npm run build
```

**Output Directory:**
```
sekreterlik-app/client/dist
```

**Install Command:**
```
(BOŞ BIRAKIN)
```

---

### Çözüm 4: Node.js Versiyonu

**Settings → General → Node.js Version:**

Vercel otomatik olarak Node.js versiyonunu tespit eder. Eğer sorun varsa:

```
Node.js Version: 18.x
```

VEYA

```
Node.js Version: (Otomatik)
```

---

## 📊 ÖRNEK AYARLAR (TAM LİSTE)

### Seçenek A: Root Directory BOŞ (ÖNERİLEN)

**Settings → General:**
```
Root Directory: (boş)
```

**Settings → Build & Development Settings:**
```
Framework Preset: Other
Build Command: cd sekreterlik-app/client && npm install && npm run build
Output Directory: sekreterlik-app/client/dist
Install Command: (boş)
```

**Settings → Environment Variables:**
```
VITE_USE_FIREBASE = true (Production, Preview, Development)
VITE_ENCRYPTION_KEY = ilsekreterlik-app-encryption-key-2024-secret-very-long-key-for-security-minimum-32-characters (Production, Preview, Development)
```

---

### Seçenek B: Root Directory = sekreterlik-app/client

**Settings → General:**
```
Root Directory: sekreterlik-app/client
```

**Settings → Build & Development Settings:**
```
Framework Preset: Vite
Build Command: npm install && npm run build
Output Directory: dist
Install Command: (boş)
```

**Settings → Environment Variables:**
```
VITE_USE_FIREBASE = true (Production, Preview, Development)
VITE_ENCRYPTION_KEY = ilsekreterlik-app-encryption-key-2024-secret-very-long-key-for-security-minimum-32-characters (Production, Preview, Development)
```

---

## 🔍 BUILD LOG KONTROLÜ

Build başarılı olduğunda şunları görmelisiniz:

```
✓ Cloning repository...
✓ Installing dependencies...
✓ Building...
✓ Build completed successfully
✓ Output: sekreterlik-app/client/dist (veya dist)
✓ Found index.html
```

---

## ❌ HATA DURUMLARI VE ÇÖZÜMLERİ

### Hata 1: "npm install" exited with 1

**Çözüm:**
1. Build Command'ı kontrol edin
2. Root Directory ile Build Command uyumlu mu kontrol edin
3. Install Command'i BOŞ bırakın
4. Build Cache'i temizleyin (Redeploy'da "Use existing Build Cache" işaretini kaldırın)
5. Redeploy yapın

### Hata 2: "Command not found: cd"

**Çözüm:**
1. Root Directory BOŞ ise Build Command'da `cd sekreterlik-app/client &&` olmalı
2. Root Directory = `sekreterlik-app/client` ise Build Command'da `cd` OLMAMALI

### Hata 3: "Output directory not found"

**Çözüm:**
1. Output Directory'yi kontrol edin
2. Root Directory ile Output Directory uyumlu mu kontrol edin
3. Build'in başarılı olduğundan emin olun

---

## ✅ BAŞARI KONTROL LİSTESİ

Deployment başarılı olduğunda:

- ✅ Build loglarında "Build completed" görünmeli
- ✅ "npm install" hatası KAYBOLMALI
- ✅ Deployment durumu "Ready" olmalı
- ✅ Ana sayfa (`/`) yüklenmeli
- ✅ Browser console'da hata olmamalı

---

## 🔄 YENİDEN DENEME (SIFIRDAN)

Eğer hala sorun varsa:

### 1. Tüm Ayarları Sıfırla

1. Settings → General → Root Directory: **(BOŞ BIRAKIN)**
2. Settings → Build & Development Settings:
   - Framework Preset: **Other**
   - Build Command: `cd sekreterlik-app/client && npm install && npm run build`
   - Output Directory: `sekreterlik-app/client/dist`
   - Install Command: **(BOŞ BIRAKIN)**

### 2. Environment Variables Ekle

Settings → Environment Variables:
- `VITE_USE_FIREBASE` = `true` (tüm environment'lar)
- `VITE_ENCRYPTION_KEY` = `ilsekreterlik-app-encryption-key-2024-secret-very-long-key-for-security-minimum-32-characters` (tüm environment'lar)

### 3. Build Cache Temizle

Deployments → Redeploy → **"Use existing Build Cache"** işaretini KALDIRIN

### 4. Redeploy Yap

Redeploy butonuna tıklayın ve build loglarını izleyin

---

## 📞 YARDIM

Eğer hala sorun yaşıyorsanız:

1. Build loglarının tamamını paylaşın
2. Root Directory ayarınızı paylaşın
3. Build Command'ı paylaşın
4. Install Command'i paylaşın (boş olmalı)

---

## 💡 SON NOT

**En garantili ayarlar:**

```
Root Directory: (BOŞ)
Framework Preset: Other
Build Command: cd sekreterlik-app/client && npm install && npm run build
Output Directory: sekreterlik-app/client/dist
Install Command: (BOŞ)
```

Bu ayarlarla çalışması gerekir! ✅

