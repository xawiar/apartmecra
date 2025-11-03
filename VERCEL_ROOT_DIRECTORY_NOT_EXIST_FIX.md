# 🔴 Vercel Root Directory "Does Not Exist" - ÇÖZÜM

## ❌ HATA

```
The specified Root Directory "sekreterlik-app/client" does not exist. Please update your Project Settings.
```

## 🔍 SORUN

Vercel Dashboard'da Root Directory olarak `sekreterlik-app/client` ayarlanmış ama Vercel bu dizini bulamıyor.

**Olası nedenler:**
1. Root Directory ayarı yanlış (gereksiz path)
2. Vercel henüz yeni `main` branch'ini çekmedi
3. Build komutu Root Directory ile uyuşmuyor

---

## ✅ ÇÖZÜM: Root Directory'yi BOŞ BIRAKIN

### ADIM 1: Root Directory'yi BOŞ BIRAKIN

#### Settings → General:

**Root Directory:**
```
(BOŞ BIRAKIN - Hiçbir şey yazmayın)
```

**VEYA:**
```
./
```

**Framework Preset:**
```
Other
```

**Save** butonuna tıklayın.

---

### ADIM 2: Build & Development Settings Güncelle

#### Settings → Build & Development Settings:

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

**Framework Preset:**
```
Other
```

**Save** butonuna tıklayın.

---

### ADIM 3: Redeploy

1. **Deployments** → Son deployment → **"..."** → **"Redeploy"**
2. ✅ **"Use existing Build Cache"** seçeneğini **KALDIRIN** ⚠️
3. **"Redeploy"** butonuna tıklayın

---

## ⚠️ ÖNEMLİ: İKİ SEÇENEK

### SEÇENEK 1: Root Directory BOŞ (ÖNERİLEN)

**Root Directory:** (BOŞ)

**Build Command:**
```
cd sekreterlik-app/client && npm install && npm run build
```

**Output Directory:**
```
sekreterlik-app/client/dist
```

**Bu yöntem %100 çalışır!** ✅

---

### SEÇENEK 2: Root Directory = `sekreterlik-app/client` (DENEYİN)

**Root Directory:** `sekreterlik-app/client`

**Build Command:**
```
npm install && npm run build
```

**Output Directory:**
```
dist
```

**Eğer bu yöntem çalışmıyorsa, SEÇENEK 1'i kullanın!** ✅

---

## 📋 KONTROL LİSTESİ

Ayarları yaptıktan sonra:

- [ ] **Root Directory:** BOŞ (Settings → General'de) ✅
- [ ] **Build Command:** `cd sekreterlik-app/client && npm install && npm run build` ✅
- [ ] **Output Directory:** `sekreterlik-app/client/dist` ✅
- [ ] **Environment Variables:** Her ikisi de ekli mi? ✅
- [ ] **Redeploy** yapın ✅

---

## 💡 SONUÇ

**Sorun:** Root Directory `sekreterlik-app/client` bulunamıyor

**En Kolay Çözüm:**
1. **Root Directory'yi BOŞ BIRAKIN** ✅
2. **Build Command:** `cd sekreterlik-app/client && npm install && npm run build` ✅
3. **Output Directory:** `sekreterlik-app/client/dist` ✅
4. **Redeploy** yapın ✅

**Bu yöntem kesin çalışır!** ✅

