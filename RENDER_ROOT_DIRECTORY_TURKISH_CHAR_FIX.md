# ✅ Render.com - Root Directory Türkçe Karakter Hatası Çözümü

## 🔍 SORUN

Root Directory'de Türkçe karakterler (`ç`, `ş`) ve boşluk var:
```
must match re "/^[A-Za-z0-9-_./ ]*$/
```

Render.com'un validasyonu bu karakterleri kabul etmiyor.

---

## ✅ ÇÖZÜM: Root Directory Boş, Publish Directory Tam Path

### 1. Root Directory:
```
(boş bırakın - hiçbir şey yazmayın)
```

### 2. Build Command (cd ile tam path):
```
cd "Desktop/sekret ilçe/sekreterlik4/sekreterlik-app/client" && rm -rf node_modules package-lock.json && npm install && npm run build
```

### 3. Publish Directory (tam path - dist ile birlikte):
```
Desktop/sekret ilçe/sekreterlik4/sekreterlik-app/client/dist
```

**⚠️ ÖNEMLİ:**
- Root Directory **mutlaka boş** olmalı
- Build Command'da `cd` ile tam path kullanıyoruz
- Publish Directory'de `dist` klasörünü de dahil ediyoruz

---

## 📋 RENDER.COM AYARLARI - GÜNCELLENMIŞ

### Settings → Build & Deploy:

#### Root Directory:
```
(boş - hiçbir şey yazmayın, boş bırakın)
```

#### Build Command:
```
cd "Desktop/sekret ilçe/sekreterlik4/sekreterlik-app/client" && rm -rf node_modules package-lock.json && npm install && npm run build
```

#### Publish Directory:
```
Desktop/sekret ilçe/sekreterlik4/sekreterlik-app/client/dist
```

---

## 🔄 ADIMLAR

1. **Render.com → Dashboard → Servis'iniz**
2. **Settings → Build & Deploy**
3. **Root Directory**'yi **TAMAMEN BOŞ** bırakın (varsa silin)
4. **Build Command**'ı güncelleyin: `cd "Desktop/sekret ilçe/sekreterlik4/sekreterlik-app/client" && rm -rf node_modules package-lock.json && npm install && npm run build`
5. **Publish Directory**'yi güncelleyin: `Desktop/sekret ilçe/sekreterlik4/sekreterlik-app/client/dist`
6. **Save Changes**
7. **Manual Deploy**

---

## ✅ BEKLENEN SONUÇ

Artık build başarılı olacak ve deploy edilecek:
```
✓ built in X.XXs
==> Deployed successfully!
```

**Not:** Root Directory boş bırakıldığında, Render.com proje root'undan (`/opt/render/project/src`) başlar. Build Command'da `cd` ile tam path'e gidiyoruz ve Publish Directory'de de tam path kullanıyoruz.

