# 🔍 GitHub Dosya Yolu Kontrolü

## ❌ SORUN

**GitHub'da dosya bulunamıyor:**
```
sekreterlik-app/client/package.json
404 - page not found
```

---

## ✅ ÇÖZÜM: GitHub'da Dosya Yolunu Kontrol Edin

### ADIM 1: GitHub Repository'yi Açın

**Link:**
https://github.com/xawiar/ilce-sekreterlik/tree/version1

---

### ADIM 2: "Go to file" Özelliğini Kullanın

1. **GitHub repository sayfasında** üstte **"Go to file"** butonuna tıklayın
   - **VEYA** `T` tuşuna basın

2. **"package.json"** yazın ve arayın

3. **Client package.json'ı bulun** ve **tam path'ini kopyalayın**

**Muhtemel path'ler:**
- `Desktop/sekret ilçe/sekreterlik4/sekreterlik-app/client/package.json` ✅
- `sekreterlik-app/client/package.json` ❌ (bu path'te yok)

---

### ADIM 3: Render.com Ayarlarını Bulduğunuz Path'e Göre Yapın

#### Eğer GitHub'da Path `Desktop/...` ise:

**Render.com → Settings → Build & Deploy:**

**Root Directory:**
```
(BOŞ)
```

**Build Command:**
```
cd "Desktop/sekret ilçe/sekreterlik4/sekreterlik-app/client" && npm install && npm run build
```

**Publish Directory:**
```
Desktop/sekret ilçe/sekreterlik4/sekreterlik-app/client/dist
```

**⚠️ EĞER Publish Directory TÜRKÇE KARAKTER HATASI VERİRSE:**

**Publish Directory:**
```
(BOŞ BIRAKIN)
```

---

### ADIM 4: GitHub'da Dosyaları Klasörlerde Arayın

1. **GitHub repository sayfasında:**
   - `Desktop` klasörüne tıklayın
   - `sekret ilçe` klasörüne tıklayın (Türkçe karakterler!)
   - `sekreterlik4` klasörüne tıklayın
   - `sekreterlik-app` klasörüne tıklayın
   - `client` klasörüne tıklayın
   - `package.json` dosyasını bulun

**Tam Path:**
```
Desktop/sekret ilçe/sekreterlik4/sekreterlik-app/client/package.json
```

---

## ✅ ŞİMDİ YAPIN

1. ✅ **GitHub'da dosya yolunu bulun** (Go to file veya klasörlerde arayın)
2. ✅ **Render.com Build Command'ı bulduğunuz path'e göre ayarlayın**
3. ✅ **Manual Deploy yapın**

---

**GitHub'da dosya yolunu bulduktan sonra Render.com ayarlarını buna göre yapın!** ✅

