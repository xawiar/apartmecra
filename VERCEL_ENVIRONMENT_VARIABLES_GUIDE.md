# 🔐 Vercel Environment Variables - DETAYLI KILAVUZ

## 📋 NEDİR?

Environment Variables (Çevre Değişkenleri), uygulamanızın çalışması için gerekli gizli bilgileri (şifreler, API anahtarları, vb.) saklamanızı sağlar.

---

## 🎯 ADIM ADIM: VERCEL'DE ENVIRONMENT VARIABLES EKLEME

### ADIM 1: Vercel Dashboard'a Giriş

1. Tarayıcınızda şu adrese gidin: **https://vercel.com/dashboard**
2. Giriş yapın (eğer yapmadıysanız)
3. Projenizi seçin: **ilce-sekreterlik** (veya proje adınız ne ise)

---

### ADIM 2: Settings Sayfasına Gidin

1. Proje sayfasında, üst menüden **"Settings"** sekmesine tıklayın
2. Sol menüde **"Environment Variables"** seçeneğini tıklayın

**Veya direkt link:**
```
https://vercel.com/[projeniz-adi]/settings/environment-variables
```

---

### ADIM 3: Yeni Environment Variable Eklemek

1. **"Environment Variables"** sayfasında, sağ üstte **"Add New"** butonuna tıklayın

2. Açılan formda şu bilgileri gireceksiniz:

#### İlk Değişken: `VITE_USE_FIREBASE`

**Key (Anahtar):**
```
VITE_USE_FIREBASE
```

**Value (Değer):**
```
true
```

**Environment (Ortam):** 
✅ **Production** - İşaretli olmalı
✅ **Preview** - İşaretli olmalı  
✅ **Development** - İşaretli olmalı

**"Save"** butonuna tıklayın.

---

#### İkinci Değişken: `VITE_ENCRYPTION_KEY`

**Key (Anahtar):**
```
VITE_ENCRYPTION_KEY
```

**Value (Değer):**
```
ilsekreterlik-app-encryption-key-2024-secret-very-long-key-for-security-minimum-32-characters
```

**⚠️ ÖNEMLİ:** Bu değeri **AYNEN** yapıştırın. Tırnak işareti eklemeyin!

**Environment (Ortam):** 
✅ **Production** - İşaretli olmalı
✅ **Preview** - İşaretli olmalı
✅ **Development** - İşaretli olmalı

**"Save"** butonuna tıklayın.

---

## 📸 GÖRSEL AÇIKLAMA

### Environment Variables Formu:

```
┌─────────────────────────────────────────────────┐
│ Add Environment Variable                       │
├─────────────────────────────────────────────────┤
│                                                 │
│ Key (Name):                                     │
│ ┌─────────────────────────────────────────────┐ │
│ │ VITE_USE_FIREBASE                          │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ Value:                                          │
│ ┌─────────────────────────────────────────────┐ │
│ │ true                                        │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ Environment:                                    │
│ ☑ Production                                    │
│ ☑ Preview                                       │
│ ☑ Development                                   │
│                                                 │
│           [ Cancel ]  [ Save ]                  │
└─────────────────────────────────────────────────┘
```

---

## ✅ EKLENMESİ GEREKEN 2 DEĞİŞKEN

### 1️⃣ VITE_USE_FIREBASE

**Ne işe yarar?** Firebase kullanımını aktif eder.

**Key:**
```
VITE_USE_FIREBASE
```

**Value:**
```
true
```

**Nasıl yazılır?**
- Key kısmına: `VITE_USE_FIREBASE` yazın
- Value kısmına: `true` yazın (tırnak işareti YOK)
- Tüm environment'ları işaretleyin (Production, Preview, Development)
- Save butonuna tıklayın

---

### 2️⃣ VITE_ENCRYPTION_KEY

**Ne işe yarar?** Verilerin şifrelenmesi için kullanılan gizli anahtar.

**Key:**
```
VITE_ENCRYPTION_KEY
```

**Value:**
```
ilsekreterlik-app-encryption-key-2024-secret-very-long-key-for-security-minimum-32-characters
```

**Nasıl yazılır?**
- Key kısmına: `VITE_ENCRYPTION_KEY` yazın
- Value kısmına: `ilsekreterlik-app-encryption-key-2024-secret-very-long-key-for-security-minimum-32-characters` yazın (tırnak işareti YOK, tümünü kopyalayın)
- Tüm environment'ları işaretleyin (Production, Preview, Development)
- Save butonuna tıklayın

---

## 📋 EKLEME SONRASI KONTROL LİSTESİ

Environment Variables eklendikten sonra şu şekilde görünmelidir:

| Key | Value | Production | Preview | Development |
|-----|-------|----------|---------|-------------|
| `VITE_USE_FIREBASE` | `true` | ✅ | ✅ | ✅ |
| `VITE_ENCRYPTION_KEY` | `ilsekreterlik-app-encryption-key-2024-secret-very-long-key-for-security-minimum-32-characters` | ✅ | ✅ | ✅ |

---

## ⚠️ ÖNEMLİ NOTLAR

### 1. Tırnak İşareti Kullanmayın
❌ **YANLIŞ:**
```
Value: "true"
Value: 'true'
```

✅ **DOĞRU:**
```
Value: true
```

### 2. Boşluk Bırakmayın
Key kısmında başta veya sonda boşluk olmamalı:
❌ ` VITE_USE_FIREBASE `
✅ `VITE_USE_FIREBASE`

### 3. Tüm Environment'ları İşaretleyin
Her iki değişken için de:
- ✅ Production
- ✅ Preview  
- ✅ Development

Hepsi işaretli olmalı.

### 4. Value Değerlerini Tam Olarak Kopyalayın
Özellikle `VITE_ENCRYPTION_KEY` için tüm karakterleri kopyalayın, eksik veya fazla karakter olmamalı.

---

## 🔄 REDEPLOY (YENİDEN DEPLOY)

Environment Variables ekledikten sonra **MUTLAKA** redeploy yapmalısınız:

1. **Deployments** sekmesine gidin
2. Son deployment'ın yanındaki **"..."** menüsüne tıklayın
3. **"Redeploy"** seçeneğini seçin
4. ✅ **"Use existing Build Cache"** seçeneğini **KALDIRIN** ⚠️
5. **"Redeploy"** butonuna tıklayın

**Neden?** Environment Variables sadece yeni deployment'larda yüklenir. Eski deployment'lar bu değişkenleri göremez.

---

## 🎯 HIZLI KOPYALA-YAPIŞTIR

### VITE_USE_FIREBASE için:

**Key:**
```
VITE_USE_FIREBASE
```

**Value:**
```
true
```

---

### VITE_ENCRYPTION_KEY için:

**Key:**
```
VITE_ENCRYPTION_KEY
```

**Value:**
```
ilsekreterlik-app-encryption-key-2024-secret-very-long-key-for-security-minimum-32-characters
```

---

## ❓ SORUN GİDERME

### Sorun: "Environment Variable not found"

**Çözüm:**
1. Environment Variables'ın eklendiğinden emin olun
2. Key'in doğru yazıldığından emin olun (büyük/küçük harf duyarlı)
3. Redeploy yaptığınızdan emin olun

### Sorun: "Cannot read property"

**Çözüm:**
1. Value değerinin doğru yazıldığından emin olun
2. Tırnak işareti kullanmadığınızdan emin olun
3. Tüm environment'ları işaretlediğinizden emin olun

---

## ✅ BAŞARI KRİTERLERİ

Environment Variables başarıyla eklendiğinde:

- ✅ Settings → Environment Variables sayfasında 2 değişken görünmeli
- ✅ Her ikisi de Production, Preview, Development için işaretli olmalı
- ✅ Redeploy sonrası uygulama çalışmalı
- ✅ Browser console'da hata olmamalı

---

## 📞 YARDIM

Eğer hala sorun yaşıyorsanız:

1. Environment Variables sayfasının ekran görüntüsünü alın
2. Build loglarını kontrol edin
3. Browser console'daki hataları kontrol edin

---

## 🔗 HIZLI LİNKLER

- **Vercel Dashboard:** https://vercel.com/dashboard
- **Environment Variables:** https://vercel.com/[projeniz]/settings/environment-variables

---

## 📝 ÖZET

1. Vercel Dashboard → Projeniz → **Settings** → **Environment Variables**
2. **"Add New"** butonuna tıklayın
3. İlk değişken: Key=`VITE_USE_FIREBASE`, Value=`true`
4. İkinci değişken: Key=`VITE_ENCRYPTION_KEY`, Value=`ilsekreterlik-app-encryption-key-2024-secret-very-long-key-for-security-minimum-32-characters`
5. Her ikisi için de tüm environment'ları işaretleyin (Production, Preview, Development)
6. **Save** butonuna tıklayın
7. **Redeploy** yapın (cache olmadan)

**Hepsi bu kadar!** 🎉

