# 🔧 Vercel Root Directory Hatası - ÇÖZÜM

## ❌ HATA MESAJI

```
sh: satır 1: cd: sekreterlik-app/client: Böyle bir dosya veya dizin yok
Hata: "cd sekreterlik-app/client && npm install && npm run build" komutu 1 ile sonlandırı
```

## 🔍 SORUN

Bu hata, **Vercel'in Root Directory ayarının** yanlış olduğunu gösterir.

---

## ✅ ÇÖZÜM: Root Directory Ayarları

### SEÇENEK 1: Root Directory BOŞ (Root = Proje Root)

Eğer Root Directory **BOŞ** ise (proje root'u seçiliyse):

**Build Command:**
```
cd sekreterlik-app/client && npm install && npm run build
```

**Output Directory:**
```
sekreterlik-app/client/dist
```

---

### SEÇENEK 2: Root Directory = `sekreterlik-app`

Eğer Root Directory **`sekreterlik-app`** olarak ayarlanmışsa:

**Build Command:**
```
cd client && npm install && npm run build
```

**Output Directory:**
```
client/dist
```

**⚠️ ÖNEMLİ:** Root Directory ayarına göre build komutu değişir!

---

## 🎯 ADIM ADIM: Vercel Dashboard'da Düzeltme

### ADIM 1: Vercel Dashboard'a Gidin

1. https://vercel.com/dashboard
2. Projenizi seçin: **ilce-sekreterlik**
3. **Settings** → **General**

---

### ADIM 2: Root Directory Kontrolü

**Settings → General → Root Directory**

#### SEÇENEK A: Root Directory BOŞ BIRAKIN (ÖNERİLEN)

1. **Root Directory** alanını **BOŞ BIRAKIN** (hiçbir şey yazmayın)
2. **Build Command:**
   ```
   cd sekreterlik-app/client && npm install && npm run build
   ```
3. **Output Directory:**
   ```
   sekreterlik-app/client/dist
   ```
4. **Save** butonuna tıklayın

---

#### SEÇENEK B: Root Directory = `sekreterlik-app`

1. **Root Directory** alanına yazın:
   ```
   sekreterlik-app
   ```
2. **Build Command:**
   ```
   cd client && npm install && npm run build
   ```
3. **Output Directory:**
   ```
   client/dist
   ```
4. **Save** butonuna tıklayın

---

## ✅ ÖNERİLEN AYARLAR (Root Directory BOŞ)

### General Settings:

- **Root Directory:** (BOŞ - hiçbir şey yazmayın) ✅
- **Framework Preset:** Other
- **Build Command:**
  ```
  cd sekreterlik-app/client && npm install && npm run build
  ```
- **Output Directory:**
  ```
  sekreterlik-app/client/dist
  ```
- **Install Command:** (BOŞ - Vercel otomatik yapacak) ✅

---

## 📋 vercel.json Dosyası Güncelleme

`vercel.json` dosyasını şu şekilde güncelleyin:

```json
{
  "buildCommand": "cd sekreterlik-app/client && npm install && npm run build",
  "outputDirectory": "sekreterlik-app/client/dist",
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

## 🔄 REDEPLOY

Ayarları değiştirdikten sonra:

1. **Deployments** → Son deployment → **"..."** → **"Redeploy"**
2. ✅ **"Use existing Build Cache"** seçeneğini **KALDIRIN** ⚠️
3. **"Redeploy"** butonuna tıklayın

---

## 🛠️ ALTERNATİF: vercel.json ile Otomatik

`vercel.json` dosyasında ayarları yaparsanız, Vercel Dashboard ayarlarına gerek kalmaz:

```json
{
  "buildCommand": "cd sekreterlik-app/client && npm install && npm run build",
  "outputDirectory": "sekreterlik-app/client/dist",
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

## 📸 GÖRSEL AÇIKLAMA

### Vercel Dashboard - General Settings:

```
┌─────────────────────────────────────────────────┐
│ General Settings                                │
├─────────────────────────────────────────────────┤
│                                                 │
│ Root Directory:                                 │
│ ┌─────────────────────────────────────────┐   │
│ │                                         │   │ ← BOŞ BIRAKIN veya sekreterlik-app
│ └─────────────────────────────────────────┘   │
│                                                 │
│ Framework Preset:                               │
│ [Other ▼]                                       │
│                                                 │
│ Build Command:                                  │
│ ┌─────────────────────────────────────────┐   │
│ │ cd sekreterlik-app/client && npm install│   │
│ │ && npm run build                         │   │
│ └─────────────────────────────────────────┘   │
│                                                 │
│ Output Directory:                               │
│ ┌─────────────────────────────────────────┐   │
│ │ sekreterlik-app/client/dist             │   │
│ └─────────────────────────────────────────┘   │
│                                                 │
│ Install Command:                                │
│ ┌─────────────────────────────────────────┐   │
│ │                                         │   │ ← BOŞ BIRAKIN
│ └─────────────────────────────────────────┘   │
│                                                 │
│         [ Cancel ]  [ Save ]                   │
└─────────────────────────────────────────────────┘
```

---

## ⚠️ ÖNEMLİ NOTLAR

1. **Root Directory** ayarına göre build komutu değişir
2. **Root Directory BOŞ** ise: `cd sekreterlik-app/client`
3. **Root Directory = `sekreterlik-app`** ise: `cd client`
4. **vercel.json** dosyası Dashboard ayarlarını override eder
5. Ayarları değiştirdikten sonra **mutlaka Redeploy** yapın

---

## 🎯 HIZLI ÇÖZÜM

1. **Vercel Dashboard → Settings → General**
2. **Root Directory:** BOŞ BIRAKIN (veya `sekreterlik-app` yazın)
3. **Build Command:**
   - Root Directory BOŞ ise: `cd sekreterlik-app/client && npm install && npm run build`
   - Root Directory `sekreterlik-app` ise: `cd client && npm install && npm run build`
4. **Output Directory:**
   - Root Directory BOŞ ise: `sekreterlik-app/client/dist`
   - Root Directory `sekreterlik-app` ise: `client/dist`
5. **Save** → **Redeploy**

---

## 💡 SONUÇ

**Sorun:** Root Directory ayarı ile build komutu uyuşmuyor

**Çözüm:** 
- Root Directory'yi kontrol edin
- Build komutunu Root Directory'ye göre düzenleyin
- Redeploy yapın

✅ **En kolay çözüm:** Root Directory'yi **BOŞ BIRAKIN** ve build komutunu `cd sekreterlik-app/client && npm install && npm run build` olarak ayarlayın!

