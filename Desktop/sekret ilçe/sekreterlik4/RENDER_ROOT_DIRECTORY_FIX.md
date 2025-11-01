# 🔧 Render.com - Root Directory Hatası ÇÖZÜMÜ

## ❌ SORUN

```
bash: line 1: cd: sekreterlik-app/client: No such file or directory
```

**Build Logları:**
- Branch: `version1` ✅
- Commit: `311bf1c` ✅
- Hata: `cd sekreterlik-app/client` dizinini bulamıyor ❌

---

## ✅ ÇÖZÜM: Root Directory Kullanın!

Render.com'da **Root Directory** kullanmalısınız, `cd` komutunu kullanmamalısınız!

---

## 📋 RENDER.COM AYARLARI

### ADIM 1: Settings → Build & Deploy

#### Root Directory:

**Input alanına yazın:**
```
sekreterlik-app/client
```

**⚠️ ÖNEMLİ:** Bu alanı **DOLDURUN**, boş bırakmayın!

---

#### Build Command:

**Input alanına yazın (cd OLMADAN!):**
```
npm install && npm run build
```

**⚠️ ÖNEMLİ:** `cd` komutunu kaldırın! Root Directory zaten dizini belirtiyor!

---

#### Publish Directory:

**Input alanına yazın:**
```
dist
```

**⚠️ ÖNEMLİ:** Root Directory `sekreterlik-app/client` olduğu için, publish directory sadece `dist` olmalı!

---

### ADIM 2: Save ve Deploy

1. **"Save Changes"** butonuna tıklayın
2. **"Manual Deploy"** yapın veya otomatik deploy bekleyin

---

## 🔍 YANLIŞ vs DOĞRU AYARLAR

### ❌ YANLIŞ AYARLAR:

```
Root Directory: (BOŞ)
Build Command: cd sekreterlik-app/client && npm install && npm run build
Publish Directory: sekreterlik-app/client/dist
```

**Sonuç:** `cd` komutu çalışmaz çünkü Root Directory boş!

---

### ✅ DOĞRU AYARLAR:

```
Root Directory: sekreterlik-app/client
Build Command: npm install && npm run build
Publish Directory: dist
```

**Sonuç:** Render.com otomatik olarak `sekreterlik-app/client` dizinine gider, `cd` gerekmez!

---

## 💡 NASIL ÇALIŞIR?

**Root Directory:** Render.com'un başlangıç dizini
- `sekreterlik-app/client` yazdığınızda
- Render.com otomatik olarak bu dizine gider
- Build Command bu dizinde çalışır
- `cd` komutuna gerek yok!

**Build Command:**
- `npm install && npm run build`
- Bu komutlar Root Directory'de (`sekreterlik-app/client`) çalışır

**Publish Directory:**
- `dist`
- Root Directory göz önünde bulundurulur
- Final path: `sekreterlik-app/client/dist`

---

## ✅ ÖZET

**Yapmanız Gerekenler:**

1. ✅ **Root Directory:** `sekreterlik-app/client` (DOLDURUN!)
2. ✅ **Build Command:** `npm install && npm run build` (`cd` YOK!)
3. ✅ **Publish Directory:** `dist` (sadece `dist`!)

**⚠️ EN ÖNEMLİSİ: Root Directory'yi doldurun ve Build Command'dan `cd` komutunu kaldırın!**

---

## 🔄 EĞER HALA ÇALIŞMIYORSA

### 1. GitHub Branch Kontrolü

**GitHub'da kontrol edin:**
- https://github.com/xawiar/ilce-sekreterlik/tree/version1/sekreterlik-app/client

**Dosyalar var mı?**
- `package.json` var mı?
- `src/` dizini var mı?
- `public/` dizini var mı?

---

### 2. Render.com Projeyi Sil ve Yeniden Oluştur

Eğer hala çalışmıyorsa:
1. Static Site'ı silin
2. Yeni Static Site oluşturun
3. Ayarları yukarıdaki gibi yapın
4. Deploy edin

---

**EN ÖNEMLİSİ: Root Directory'yi doldurun ve Build Command'dan `cd` komutunu kaldırın!** ✅

