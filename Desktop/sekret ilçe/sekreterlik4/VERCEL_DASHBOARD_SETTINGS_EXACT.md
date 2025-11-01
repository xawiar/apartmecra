# ✅ Vercel Dashboard Ayarları - KESIN ADIMLAR

## 🎯 SORUN

```
sh: line 1: cd: sekreterlik-app/client: No such file or directory
```

**Çözüm:** Root Directory'yi `sekreterlik-app/client` olarak ayarlayın ve build komutundan `cd` kısmını kaldırın.

---

## ✅ ADIM ADIM: VERCEL DASHBOARD AYARLARI

### ADIM 1: Vercel Dashboard'a Gidin

1. https://vercel.com/dashboard
2. Projenizi seçin: **ilce-sekreterlik**
3. **Settings** sekmesine tıklayın

---

### ADIM 2: General Settings

**Settings → General**

#### Root Directory:

**ALAN:** Root Directory  
**DEĞER:**
```
sekreterlik-app/client
```

**Nasıl Yapılır:**
1. "Root Directory" alanını bulun
2. **Tüm içeriği silin** (eğer bir şey varsa)
3. **Şunu yazın:** `sekreterlik-app/client`
4. **Save** butonuna tıklayın

---

#### Framework Preset:

**ALAN:** Framework Preset  
**DEĞER:**
```
Other
```

**Nasıl Yapılır:**
1. "Framework Preset" dropdown menüsünü bulun
2. **"Other"** seçin
3. **Save** butonuna tıklayın

---

### ADIM 3: Build & Development Settings

**Settings → Build & Development Settings**

#### Build Command:

**ALAN:** Build Command  
**DEĞER:**
```
npm install && npm run build
```

**⚠️ ÖNEMLİ:** `cd sekreterlik-app/client` YAZMAYIN! Sadece `npm install && npm run build` yazın!

**Nasıl Yapılır:**
1. "Build Command" alanını bulun
2. **Tüm içeriği silin** (eğer bir şey varsa)
3. **Şunu yazın:** `npm install && npm run build`
4. **Save** butonuna tıklayın

---

#### Output Directory:

**ALAN:** Output Directory  
**DEĞER:**
```
dist
```

**⚠️ ÖNEMLİ:** `sekreterlik-app/client/dist` YAZMAYIN! Sadece `dist` yazın!

**Nasıl Yapılır:**
1. "Output Directory" alanını bulun
2. **Tüm içeriği silin** (eğer bir şey varsa)
3. **Şunu yazın:** `dist`
4. **Save** butonuna tıklayın

---

#### Install Command:

**ALAN:** Install Command  
**DEĞER:**
```
(BOŞ BIRAKIN)
```

**Nasıl Yapılır:**
1. "Install Command" alanını bulun
2. **Tüm içeriği silin** (eğer bir şey varsa)
3. **BOŞ BIRAKIN** (hiçbir şey yazmayın)
4. **Save** butonuna tıklayın

---

### ADIM 4: Environment Variables

**Settings → Environment Variables**

#### Değişken 1: VITE_USE_FIREBASE

**Key:**
```
VITE_USE_FIREBASE
```

**Value:**
```
true
```

**Environment:**
- ✅ Production
- ✅ Preview
- ✅ Development

**Save** butonuna tıklayın.

---

#### Değişken 2: VITE_ENCRYPTION_KEY

**Key:**
```
VITE_ENCRYPTION_KEY
```

**Value:**
```
ilsekreterlik-app-encryption-key-2024-secret-very-long-key-for-security-minimum-32-characters
```

**Environment:**
- ✅ Production
- ✅ Preview
- ✅ Development

**Save** butonuna tıklayın.

---

### ADIM 5: Redeploy

1. **Deployments** sekmesine gidin
2. Son deployment'ın yanındaki **"..."** menüsüne tıklayın
3. **"Redeploy"** seçeneğini seçin
4. ✅ **"Use existing Build Cache"** seçeneğini **KALDIRIN** ⚠️
5. **"Redeploy"** butonuna tıklayın

---

## 📋 AYAR ÖZET TABLOSU

| Ayar | Değer |
|------|-------|
| **Root Directory** | `sekreterlik-app/client` |
| **Framework Preset** | `Other` |
| **Build Command** | `npm install && npm run build` |
| **Output Directory** | `dist` |
| **Install Command** | (BOŞ) |
| **VITE_USE_FIREBASE** | `true` |
| **VITE_ENCRYPTION_KEY** | `ilsekreterlik-app-encryption-key-2024-secret-very-long-key-for-security-minimum-32-characters` |

---

## ⚠️ ÖNEMLİ NOTLAR

### 1. Root Directory = `sekreterlik-app/client` olduğunda:

- ✅ Build komutunda **`cd` kullanmayın**
- ✅ Sadece **`npm install && npm run build`** yazın
- ✅ Output Directory: **`dist`** (çünkü zaten `sekreterlik-app/client` dizinindeyiz)

### 2. Önceki Hata:

- ❌ Root Directory BOŞ ama build komutunda `cd sekreterlik-app/client` kullanılıyordu
- ❌ Vercel `sekreterlik-app/client` dizinini bulamıyordu

### 3. Yeni Çözüm:

- ✅ Root Directory = `sekreterlik-app/client` ✅
- ✅ Build komutu: `npm install && npm run build` (cd yok) ✅
- ✅ Output Directory: `dist` ✅

---

## 🔍 KONTROL

Ayarları yaptıktan sonra kontrol edin:

1. **Settings → General** → Root Directory:** `sekreterlik-app/client` ✅
2. **Settings → Build & Development Settings** → Build Command: `npm install && npm run build` ✅
3. **Settings → Build & Development Settings** → Output Directory: `dist` ✅
4. **Settings → Environment Variables** → Her iki değişken var mı? ✅

---

## 💡 SONUÇ

**Sorun:** `cd sekreterlik-app/client` komutu çalışmıyor

**Çözüm:**
1. Root Directory: **`sekreterlik-app/client`** ✅
2. Build Command: **`npm install && npm run build`** (cd yok) ✅
3. Output Directory: **`dist`** ✅
4. Redeploy yapın ✅

✅ **`vercel.json` dosyası zaten güncellendi! Şimdi sadece Vercel Dashboard ayarlarını yukarıdaki gibi yapın!**

