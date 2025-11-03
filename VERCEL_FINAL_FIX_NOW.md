# 🔴 Vercel cd Hatası - KESIN ÇÖZÜM

## ❌ HATA

```
sh: line 1: cd: sekreterlik-app/client: No such file or directory
Error: Command " cd sekreterlik-app/client && npm install && npm run build" exited with 1
```

## ✅ KESIN ÇÖZÜM (2 ADIM)

### ADIM 1: vercel.json Dosyasını Güncelle ✅

`vercel.json` dosyası **zaten güncellendi**! Artık sadece `rewrites` var.

**Yeni `vercel.json` İçeriği:**
```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

---

### ADIM 2: Vercel Dashboard Ayarları

#### Settings → General:

**Root Directory:**
```
sekreterlik-app/client
```

**Framework Preset:**
```
Other
```

**Save** butonuna tıklayın.

---

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

**Save** butonuna tıklayın.

---

### ADIM 3: Redeploy

1. **Deployments** → Son deployment → **"..."** → **"Redeploy"**
2. ✅ **"Use existing Build Cache"** seçeneğini **KALDIRIN** ⚠️
3. **"Redeploy"** butonuna tıklayın

---

## ✅ ÖZET

### Yapılacaklar:

1. ✅ **vercel.json** - Zaten güncellendi (sadece rewrites kaldı)

2. **Vercel Dashboard:**
   - **Root Directory:** `sekreterlik-app/client` ✅
   - **Build Command:** `npm install && npm run build` ✅
   - **Output Directory:** `dist` ✅

3. **Redeploy** yapın ✅

---

## ⚠️ ÖNEMLİ

**Root Directory = `sekreterlik-app/client`** olduğunda:
- ✅ Build komutunda `cd` kullanmayın
- ✅ Sadece `npm install && npm run build` yazın
- ✅ Output Directory: `dist` (çünkü zaten `sekreterlik-app/client` dizinindeyiz)

**ÖNCEKİ HATA:**
- Root Directory BOŞ ama build komutunda `cd sekreterlik-app/client` kullanılıyordu
- Vercel `sekreterlik-app/client` dizinini bulamıyordu

**YENİ ÇÖZÜM:**
- Root Directory = `sekreterlik-app/client` ✅
- Build komutu: `npm install && npm run build` (cd yok) ✅
- Output Directory: `dist` ✅

---

## 💡 SONUÇ

**Sorun:** `cd sekreterlik-app/client` komutu çalışmıyor

**Çözüm:**
1. Root Directory'yi **`sekreterlik-app/client`** olarak ayarlayın
2. Build komutundan **`cd`** kısmını kaldırın
3. Output Directory'yi **`dist`** olarak ayarlayın
4. Redeploy yapın

✅ **`vercel.json` dosyası zaten güncellendi! Şimdi sadece Vercel Dashboard ayarlarını yapın!**

