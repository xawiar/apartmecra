# Render.com SPA Routing Düzeltmesi

## Sorun
Sayfa yenilendiğinde `404 Not Found` hatası alınıyor:
```
GET https://yrpmerkezilcesekreterlik.onrender.com/members 404 (Not Found)
```

## Çözüm

Render.com'da Static Site için SPA routing'i düzeltmek için şu adımları izleyin:

### 1. Render.com Dashboard Ayarları

1. Render.com Dashboard'a gidin: https://dashboard.render.com
2. Static Site'unuzu seçin
3. **Settings** sekmesine gidin
4. **Headers** bölümünü bulun veya **Custom Headers** ekleyin

### 2. Custom Headers Ekle

**Header Name:** `X-Redirect`
**Header Value:** `/*`

VEYA

Render.com Dashboard'da:
1. **Settings** → **Environment** sekmesi
2. **Add Header** butonuna tıklayın
3. Şu header'ı ekleyin:

```
Name: X-Redirect
Value: /* -> /index.html 200
```

### 3. Alternatif: `render.yaml` Güncellemesi

`render.yaml` dosyasına şunu ekleyin:

```yaml
services:
  - type: static
    name: ilce-sekreterlik
    buildCommand: cd "Desktop/sekret ilçe/sekreterlik4/sekreterlik-app/client" && npm install && npm run build
    staticPublishPath: "Desktop/sekret ilçe/sekreterlik4/sekreterlik-app/client/dist"
    headers:
      - path: /*
        name: X-Redirect
        value: /* -> /index.html 200
    envVars:
      - key: VITE_USE_FIREBASE
        value: "true"
      - key: VITE_ENCRYPTION_KEY
        value: ilsekreterlik-app-encryption-key-2024-secret-very-long-key-for-security-minimum-32-characters
```

### 4. Manuel Deploy

1. Render.com Dashboard'da **Manual Deploy** butonuna tıklayın
2. `version1` branch'ini seçin
3. **Deploy** butonuna tıklayın

### 5. Deploy Sonrası Test

1. Ana sayfaya gidin: `https://yrpmerkezilcesekreterlik.onrender.com`
2. `/members` sayfasına gidin: `https://yrpmerkezilcesekreterlik.onrender.com/members`
3. Sayfayı yenileyin (F5) - 404 hatası almamalısınız

---

## Notlar

- `_redirects` dosyası Netlify için çalışır, Render.com'da her zaman çalışmaz
- Render.com'da static site routing için **Headers** ayarları gerekli
- Eğer hala çalışmazsa, `404.html` dosyası oluşturuldu (bu dosya otomatik yönlendirme yapar)

