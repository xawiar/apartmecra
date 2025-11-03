# 🔴 Vercel Root Directory Hatası - ANINDA ÇÖZÜM

## ❌ HATA MESAJI

```
sh: satır 1: cd: sekreterlik-app/client: Böyle bir dosya veya dizin yok
Hata: "cd sekreterlik-app/client && npm install && npm run build" komutu 1 ile sonlandırıldı
```

## 🔍 SORUN

Bu hata, **Vercel Dashboard'daki Root Directory** ayarının `vercel.json` dosyasındaki build komutuyla uyuşmadığını gösterir.

---

## ✅ ÇÖZÜM 1: Root Directory BOŞ BIRAKIN (ÖNERİLEN)

### Adım 1: Vercel Dashboard'a Gidin

1. https://vercel.com/dashboard
2. Projenizi seçin: **ilce-sekreterlik**
3. **Settings** → **General**

### Adım 2: Root Directory'yi BOŞ BIRAKIN

**Settings → General → Root Directory:**

```
Root Directory: (BOŞ BIRAKIN - Hiçbir şey yazmayın)
```

**VEYA:**

```
Root Directory: ./
```

**Save** butonuna tıklayın.

---

### Adım 3: Build & Development Settings Kontrol

**Settings → Build & Development Settings:**

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

**Save** butonuna tıklayın.

---

## ✅ ÇÖZÜM 2: Root Directory = `sekreterlik-app`

### Adım 1: Vercel Dashboard'a Gidin

1. https://vercel.com/dashboard
2. Projenizi seçin: **ilce-sekreterlik**
3. **Settings** → **General**

### Adım 2: Root Directory'yi Ayarlayın

**Settings → General → Root Directory:**

```
Root Directory: sekreterlik-app
```

**Save** butonuna tıklayın.

---

### Adım 3: Build & Development Settings Güncelle

**Settings → Build & Development Settings:**

**Build Command:**
```
cd client && npm install && npm run build
```

**Output Directory:**
```
client/dist
```

**Install Command:**
```
cd client && npm install
```

**Save** butonuna tıklayın.

---

### Adım 4: vercel.json Güncelle

`vercel.json` dosyasını güncelleyin:

```json
{
  "buildCommand": "cd client && npm install && npm run build",
  "outputDirectory": "client/dist",
  "framework": null,
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

---

## 🎯 HIZLI ÇÖZÜM (ÖNERİLEN)

**1. Vercel Dashboard → Settings → General**
- **Root Directory:** BOŞ BIRAKIN ✅

**2. Vercel Dashboard → Settings → Build & Development Settings**
- **Build Command:** `cd sekreterlik-app/client && npm install && npm run build`
- **Output Directory:** `sekreterlik-app/client/dist`

**3. Redeploy:**
- Deployments → Son deployment → "..." → "Redeploy"
- ✅ "Use existing Build Cache" seçeneğini KALDIRIN ⚠️
- "Redeploy" butonuna tıklayın

---

## 📋 vercel.json Alternatifi

Eğer `vercel.json` dosyasını kullanmak istiyorsanız, Vercel Dashboard ayarlarını boş bırakın:

**Root Directory:** (BOŞ)
**Build Command:** (BOŞ - vercel.json'dan alınacak)
**Output Directory:** (BOŞ - vercel.json'dan alınacak)

`vercel.json` otomatik olarak kullanılacaktır.

---

## ⚠️ ÖNEMLİ NOTLAR

1. **Root Directory** ayarına göre build komutu **değişir**:
   - Root Directory BOŞ → `cd sekreterlik-app/client`
   - Root Directory `sekreterlik-app` → `cd client`

2. **vercel.json** dosyası varsa ve ayarları varsa, **Vercel Dashboard ayarlarını override eder**.

3. Ayarları değiştirdikten sonra **mutlaka Redeploy** yapın!

4. Redeploy yaparken **"Use existing Build Cache"** seçeneğini **KALDIRIN**.

---

## 🔄 REDEPLOY

Ayarları değiştirdikten sonra:

1. **Deployments** → Son deployment → **"..."** → **"Redeploy"**
2. ✅ **"Use existing Build Cache"** seçeneğini **KALDIRIN** ⚠️
3. **"Redeploy"** butonuna tıklayın

---

## 💡 SONUÇ

**Sorun:** Root Directory ile build komutu uyuşmuyor

**En Kolay Çözüm:**
1. Root Directory'yi **BOŞ BIRAKIN**
2. Build Command'ı **`cd sekreterlik-app/client && npm install && npm run build`** olarak ayarlayın
3. Output Directory'yi **`sekreterlik-app/client/dist`** olarak ayarlayın
4. Redeploy yapın

✅ **ÇÖZÜM 1 (Root Directory BOŞ)** önerilen yöntemdir!

