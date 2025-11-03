# 🔐 Vercel Environment Variables - TAM DEĞERLER

## 📋 ADIM 3: ENVIRONMENT VARIABLES EKLEME

Bu kılavuz, Vercel Dashboard'da Environment Variables eklerken **TAM OLARAK** ne yazacağınızı gösterir.

---

## 🎯 İLK DEĞİŞKEN: VITE_USE_FIREBASE

### Vercel Dashboard'da "Add New" Butonuna Tıklayın

Açılan formda şu bilgileri girin:

### Key (Anahtar) Kutusu:
```
VITE_USE_FIREBASE
```

**TAM OLARAK:**
- Büyük harflerle
- Alt çizgi ile
- Boşluk yok
- Tırnak işareti yok
- Tam olarak: `VITE_USE_FIREBASE`

---

### Value (Değer) Kutusu:
```
true
```

**TAM OLARAK:**
- Küçük harflerle
- Tırnak işareti YOK
- Sadece: `true`
- Boşluk yok

---

### Environment (Ortam) Seçenekleri:

**İşaretlemeniz gerekenler:**
- ✅ **Production** - İşaretli olmalı (checkbox'ı işaretleyin)
- ✅ **Preview** - İşaretli olmalı (checkbox'ı işaretleyin)
- ✅ **Development** - İşaretli olmalı (checkbox'ı işaretleyin)

**Üçünü de işaretleyin!**

---

### Save Butonuna Tıklayın

✅ **"Save"** butonuna tıklayın.

---

## 🎯 İKİNCİ DEĞİŞKEN: VITE_ENCRYPTION_KEY

### Yeni "Add New" Butonuna Tıklayın

Açılan formda şu bilgileri girin:

### Key (Anahtar) Kutusu:
```
VITE_ENCRYPTION_KEY
```

**TAM OLARAK:**
- Büyük harflerle
- Alt çizgi ile
- Boşluk yok
- Tırnak işareti yok
- Tam olarak: `VITE_ENCRYPTION_KEY`

---

### Value (Değer) Kutusu:
```
ilsekreterlik-app-encryption-key-2024-secret-very-long-key-for-security-minimum-32-characters
```

**TAM OLARAK:**
- Küçük harflerle
- Tümünü kopyalayın (tam olarak aşağıdaki gibi)
- Tırnak işareti YOK
- Boşluk yok
- Tam olarak:

```
ilsekreterlik-app-encryption-key-2024-secret-very-long-key-for-security-minimum-32-characters
```

**Kopyala-Yapıştır için:**

```
ilsekreterlik-app-encryption-key-2024-secret-very-long-key-for-security-minimum-32-characters
```

---

### Environment (Ortam) Seçenekleri:

**İşaretlemeniz gerekenler:**
- ✅ **Production** - İşaretli olmalı (checkbox'ı işaretleyin)
- ✅ **Preview** - İşaretli olmalı (checkbox'ı işaretleyin)
- ✅ **Development** - İşaretli olmalı (checkbox'ı işaretleyin)

**Üçünü de işaretleyin!**

---

### Save Butonuna Tıklayın

✅ **"Save"** butonuna tıklayın.

---

## 📊 ÖZET TABLO

| Key (Anahtar) | Value (Değer) | Production | Preview | Development |
|--------------|---------------|-----------|---------|-------------|
| `VITE_USE_FIREBASE` | `true` | ✅ | ✅ | ✅ |
| `VITE_ENCRYPTION_KEY` | `ilsekreterlik-app-encryption-key-2024-secret-very-long-key-for-security-minimum-32-characters` | ✅ | ✅ | ✅ |

---

## 📸 GÖRSEL ÖRNEK

### İlk Değişken (VITE_USE_FIREBASE):

```
┌─────────────────────────────────────────┐
│ Add Environment Variable               │
├─────────────────────────────────────────┤
│                                         │
│ Key (Name):                             │
│ ┌─────────────────────────────────────┐ │
│ │ VITE_USE_FIREBASE                  │ │ ← BU ŞEKİLDE
│ └─────────────────────────────────────┘ │
│                                         │
│ Value:                                   │
│ ┌─────────────────────────────────────┐ │
│ │ true                               │ │ ← BU ŞEKİLDE (tırnak yok)
│ └─────────────────────────────────────┘ │
│                                         │
│ Environment:                             │
│ ☑ Production                             │ ← İŞARETLİ
│ ☑ Preview                                │ ← İŞARETLİ
│ ☑ Development                            │ ← İŞARETLİ
│                                         │
│           [ Cancel ]  [ Save ]           │
└─────────────────────────────────────────┘
```

---

### İkinci Değişken (VITE_ENCRYPTION_KEY):

```
┌─────────────────────────────────────────┐
│ Add Environment Variable               │
├─────────────────────────────────────────┤
│                                         │
│ Key (Name):                             │
│ ┌─────────────────────────────────────┐ │
│ │ VITE_ENCRYPTION_KEY                │ │ ← BU ŞEKİLDE
│ └─────────────────────────────────────┘ │
│                                         │
│ Value:                                   │
│ ┌─────────────────────────────────────┐ │
│ │ ilsekreterlik-app-encryption-key-  │ │ ← TÜMÜNÜ YAPIŞTIRIN
│ │ 2024-secret-very-long-key-for-      │ │
│ │ security-minimum-32-characters      │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ Environment:                             │
│ ☑ Production                             │ ← İŞARETLİ
│ ☑ Preview                                │ ← İŞARETLİ
│ ☑ Development                            │ ← İŞARETLİ
│                                         │
│           [ Cancel ]  [ Save ]           │
└─────────────────────────────────────────┘
```

---

## ⚠️ ÖNEMLİ NOTLAR

### 1. Tırnak İşareti Kullanmayın

❌ **YANLIŞ:**
```
Value: "true"
Value: 'true'
Value: "ilsekreterlik-app-encryption-key-2024-secret-very-long-key-for-security-minimum-32-characters"
```

✅ **DOĞRU:**
```
Value: true
Value: ilsekreterlik-app-encryption-key-2024-secret-very-long-key-for-security-minimum-32-characters
```

### 2. Boşluk Bırakmayın

Key kısmında başta veya sonda boşluk olmamalı:
❌ ` VITE_USE_FIREBASE ` (yanlış)
✅ `VITE_USE_FIREBASE` (doğru)

### 3. Büyük/Küçük Harf Duyarlı

Key'ler büyük harfle yazılmalı:
✅ `VITE_USE_FIREBASE`
❌ `vite_use_firebase`

### 4. Tüm Environment'ları İşaretleyin

Her iki değişken için de:
- ✅ Production
- ✅ Preview
- ✅ Development

**Hepsi işaretli olmalı!**

---

## ✅ KONTROL LİSTESİ

Environment Variables ekledikten sonra:

- [ ] İki değişken var mı?
- [ ] Key'ler doğru yazılmış mı?
- [ ] Value'lar doğru yazılmış mı?
- [ ] Tırnak işareti kullanılmamış mı?
- [ ] Boşluk bırakılmamış mı?
- [ ] Üç environment da işaretli mi?
- [ ] Her ikisi için de "Save" yapılmış mı?

---

## 🎯 HIZLI KOPYALA-YAPIŞTIR

### İlk Değişken:

**Key:**
```
VITE_USE_FIREBASE
```

**Value:**
```
true
```

---

### İkinci Değişken:

**Key:**
```
VITE_ENCRYPTION_KEY
```

**Value:**
```
ilsekreterlik-app-encryption-key-2024-secret-very-long-key-for-security-minimum-32-characters
```

---

## ✅ BAŞARI KRİTERLERİ

Environment Variables başarıyla eklendiğinde:

- ✅ Settings → Environment Variables sayfasında 2 değişken görünmeli
- ✅ Her ikisi de Production, Preview, Development için işaretli olmalı
- ✅ Key'ler doğru yazılmış olmalı
- ✅ Value'lar doğru yazılmış olmalı

---

## 📞 YARDIM

Eğer hala sorun yaşıyorsanız:

1. Settings → Environment Variables sayfasının ekran görüntüsünü alın
2. Key ve Value'ları kontrol edin
3. Environment seçeneklerinin işaretli olduğundan emin olun

---

## 💡 ÖZET

**Key 1:** `VITE_USE_FIREBASE`  
**Value 1:** `true`  
**Environment:** Production, Preview, Development (hepsi işaretli)

**Key 2:** `VITE_ENCRYPTION_KEY`  
**Value 2:** `ilsekreterlik-app-encryption-key-2024-secret-very-long-key-for-security-minimum-32-characters`  
**Environment:** Production, Preview, Development (hepsi işaretli)

**Hepsi bu kadar!** ✅

