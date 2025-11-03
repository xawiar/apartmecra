# 🔴 Vercel Branch Hatası - ÇÖZÜM

## ❌ SORUN (Build Loglarından Görülen)

```
Cloning github.com/xawiar/ilce-sekreterlik (Branch: main, Commit: 322c1e7)
npm error path /vercel/path0/package.json
npm error errno -2
npm error enoent Could not read package.json
```

## 🔍 KÖK SORUN

**2 Ana Sorun:**

1. **Branch Sorunu:** Vercel `main` branch'ini çekiyor ama kod `version1` branch'inde!
2. **Root Directory Sorunu:** Vercel root dizinde `package.json` arıyor ama `sekreterlik-app/client/package.json` olmalı.

---

## ✅ ÇÖZÜM: 2 ADIM

### ADIM 1: Production Branch'i `version1` Yap

#### Settings → Git:

**Production Branch:**
```
version1
```

**Nasıl Yapılır:**
1. Vercel Dashboard → **Settings** → **Git**
2. **Production Branch** alanını bulun
3. **`main`** yazılıyorsa, **`version1`** olarak değiştirin
4. **Save** butonuna tıklayın

**⚠️ ÖNEMLİ:** Vercel şu anda `main` branch'ini çekiyor ama kod `version1` branch'inde!

---

### ADIM 2: Root Directory'yi `sekreterlik-app/client` Yap

#### Settings → General:

**Root Directory:**
```
sekreterlik-app/client
```

**Nasıl Yapılır:**
1. Vercel Dashboard → **Settings** → **General**
2. **Root Directory** alanını bulun
3. **Şunu yazın:** `sekreterlik-app/client`
4. **Save** butonuna tıklayın

---

### ADIM 3: Build & Development Settings Kontrolü

#### Settings → Build & Development Settings:

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
(BOŞ BIRAKIN)
```

**Framework Preset:**
```
Other
```

**Save** butonuna tıklayın.

---

### ADIM 4: Redeploy

1. **Deployments** → Son deployment → **"..."** → **"Redeploy"**
2. ✅ **"Use existing Build Cache"** seçeneğini **KALDIRIN** ⚠️
3. **"Redeploy"** butonuna tıklayın

**Artık `version1` branch'inden çekecek!** ✅

---

## ⚠️ ÖNEMLİ: NE OLDU?

### Önceki Durum:
- ❌ Branch: `main` (yanlış!)
- ❌ Root Directory: Yanlış veya boş
- ❌ Vercel root dizinde `package.json` arıyordu
- ❌ `main` branch'inde `sekreterlik-app/client` dizini yok!

### Yeni Durum:
- ✅ Branch: `version1` (doğru!)
- ✅ Root Directory: `sekreterlik-app/client`
- ✅ Vercel `sekreterlik-app/client` dizininde `package.json` bulacak
- ✅ `version1` branch'inde `sekreterlik-app/client` dizini var!

---

## 📋 KONTROL LİSTESİ

Ayarları yaptıktan sonra kontrol edin:

- [ ] **Production Branch:** `version1` (Settings → Git'te) ✅
- [ ] **Root Directory:** `sekreterlik-app/client` (Settings → General'de) ✅
- [ ] **Build Command:** `npm install && npm run build` (cd yok!) ✅
- [ ] **Output Directory:** `dist` ✅
- [ ] **Environment Variables:** Her ikisi de ekli mi? ✅

---

## 💡 SONUÇ

**Sorun:** 
1. Vercel `main` branch'ini çekiyordu (kod `version1` branch'inde)
2. Root Directory yanlış ayarlanmıştı

**Çözüm:**
1. Production Branch: **`version1`** ✅
2. Root Directory: **`sekreterlik-app/client`** ✅
3. Build Command: **`npm install && npm run build`** ✅
4. Output Directory: **`dist`** ✅
5. Redeploy yapın ✅

**⚠️ EN ÖNEMLİSİ: Production Branch'i `version1` yapmayı unutmayın!**

