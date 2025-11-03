# Render.com Deploy ve SPA Routing Düzeltmesi

## Sorunlar

1. **Yaptığım değişiklikler sitede yok** - Deploy edilmemiş olabilir
2. **Sayfa yenilendiğinde 404 hatası** - SPA routing sorunu

## Çözüm

### Adım 1: Render.com Dashboard'a Git

1. Render.com Dashboard'a gidin: https://dashboard.render.com
2. Static Site'unuzu seçin: `ilce-sekreterlik` veya `yrpmerkezilcesekreterlik`

### Adım 2: Manual Deploy Yap

1. **Manual Deploy** butonuna tıklayın
2. **Branch:** `version1` seçin
3. **Commit:** En son commit'i seçin (veya boş bırakın)
4. **Deploy** butonuna tıklayın

### Adım 3: Environment Variables Kontrol

1. **Settings** → **Environment** sekmesine gidin
2. Şu environment variable'ların olduğundan emin olun:

```
VITE_USE_FIREBASE = true
VITE_ENCRYPTION_KEY = ilsekreterlik-app-encryption-key-2024-secret-very-long-key-for-security-minimum-32-characters
```

**ÖNEMLİ:** 
- `VITE_USE_FIREBASE` değeri **tırnak işareti olmadan** `true` olmalı
- `VITE_ENCRYPTION_KEY` değeri tam olarak yukarıdaki gibi olmalı

### Adım 4: Build Settings Kontrol

1. **Settings** → **Build & Deploy** sekmesine gidin
2. Şu ayarları kontrol edin:

**Build Command:**
```
cd "Desktop/sekret ilçe/sekreterlik4/sekreterlik-app/client" && npm install && npm run build
```

**Publish Directory:**
```
Desktop/sekret ilçe/sekreterlik4/sekreterlik-app/client/dist
```

**Root Directory:** (BOŞ BIRAKIN veya silin)

### Adım 5: Deploy Sonrası Test

1. **Deploy** tamamlandıktan sonra (2-3 dakika):
   - Ana sayfaya gidin: `https://yrpmerkezilcesekreterlik.onrender.com`
   - Login sayfasına gidin: `https://yrpmerkezilcesekreterlik.onrender.com/login`
   - Members sayfasına gidin: `https://yrpmerkezilcesekreterlik.onrender.com/members`
   - Her sayfayı **yenileyin (F5)** - 404 hatası almamalısınız

### Adım 6: Eğer Hala 404 Alıyorsanız

1. **Settings** → **Headers** sekmesine gidin (varsa)
2. Şu header'ı ekleyin:

```
Path: /*
Header: X-Redirect
Value: /* -> /index.html 200
```

VEYA

3. **Settings** → **Build & Deploy** sekmesine gidin
4. **Headers** bölümüne şunu ekleyin:

```
/* -> /index.html 200
```

### Adım 7: Clear All Data Sayfası

Deploy tamamlandıktan sonra:
1. Login yapın (admin/admin123)
2. Şu URL'ye gidin: `https://yrpmerkezilcesekreterlik.onrender.com/clear-all-data`
3. Tüm verileri temizleyebilirsiniz (admin hariç)

---

## Notlar

- Deploy genellikle 2-3 dakika sürer
- İlk deploy daha uzun sürebilir
- Environment variable'lar değiştirildiğinde yeniden deploy gerekir
- `404.html` dosyası oluşturuldu - bu dosya otomatik yönlendirme yapar

---

## Sorun Devam Ederse

1. **Build Logs**'u kontrol edin:
   - Render.com Dashboard → **Logs** sekmesi
   - Build sırasında hata var mı bakın

2. **Browser Console**'u kontrol edin:
   - F12 tuşuna basın
   - **Console** sekmesine gidin
   - Kırmızı hatalar var mı bakın

3. **Network** sekmesini kontrol edin:
   - F12 → **Network** sekmesi
   - `/members` isteği nereye gidiyor bakın
   - `localhost:5000`'e gidiyorsa Firebase aktif değil demektir
