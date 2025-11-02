# ✅ Render.com - KESİN ÇÖZÜM (Vite Config ile)

## 🔍 SORUN

Build başarılı ama Render.com `dist` klasörünü bulamıyor çünkü dist yanlış yerde.

---

## ✅ ÇÖZÜM: Vite Config'de OutDir'i Dinamik Ayarla

Vite config'de `outDir`'i environment variable ile kontrol ediyoruz:
- Normal: `dist` (client dizininde)
- Render.com: `../../dist` (proje root'unda)

---

## 📋 RENDER.COM AYARLARI - KESİN ÇÖZÜM

### Settings → Environment:

#### Yeni Environment Variable Ekleyin:
- **Key:** `RENDER`
- **Value:** `true`

### Settings → Build & Deploy:

#### Root Directory:
```
(boş - hiçbir şey yazmayın)
```

#### Build Command:
```
cd "Desktop/sekret ilçe/sekreterlik4/sekreterlik-app/client" && rm -rf node_modules package-lock.json && npm install && npm run build
```

**Açıklama:**
- `cd` ile client dizinine gidiyoruz
- Build yapıyoruz
- Vite config otomatik olarak `../../dist` (root'a) build yapacak çünkü `RENDER=true` var

#### Publish Directory:
```
dist
```

---

## 🔄 ADIMLAR

1. **Render.com → Dashboard → Servis'iniz**
2. **Settings → Environment** sekmesine gidin
3. **Add Environment Variable** butonuna tıklayın
   - **Key:** `RENDER`
   - **Value:** `true`
   - **Save**
4. **Settings → Build & Deploy** sekmesine gidin
5. **Root Directory**'yi **TAMAMEN BOŞ** bırakın
6. **Build Command**'ı güncelleyin (artık `mv` yok):
   ```
   cd "Desktop/sekret ilçe/sekreterlik4/sekreterlik-app/client" && rm -rf node_modules package-lock.json && npm install && npm run build
   ```
7. **Publish Directory**'yi güncelleyin: `dist`
8. **Save Changes**
9. **Manual Deploy**

---

## ✅ BEKLENEN SONUÇ

Artık build başarılı olacak ve deploy edilecek:
```
✓ built in X.XXs
==> Deployed successfully!
```

**Nasıl Çalışıyor:**
1. `RENDER=true` environment variable'ı set ediliyor
2. Build command çalıştırılıyor
3. Vite config `process.env.RENDER` kontrolü yapıyor
4. `RENDER` varsa `outDir: '../../dist'` kullanıyor (proje root'una build)
5. Render.com `dist` klasörünü proje root'unda buluyor ve deploy ediyor

---

## 📝 NOTLAR

- **Environment Variable ZORUNLU:** `RENDER=true` olmadan build client dizininde kalır
- **Lokal Geliştirme:** `RENDER` yoksa normal `dist` klasöründe build olur
- **Render.com Deploy:** `RENDER=true` ile root'a (`../../dist`) build olur

