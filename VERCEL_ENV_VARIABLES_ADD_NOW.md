# ✅ Vercel Environment Variables - EKLEMENİZ GEREKENLER

## 🎯 EVET, ENVIRONMENT VARIABLES EKLEMENİZ GEREKİYOR!

**2 adet Environment Variable eklemeniz gerekiyor:**

1. `VITE_USE_FIREBASE`
2. `VITE_ENCRYPTION_KEY`

---

## 📋 ADIM ADIM: ENVIRONMENT VARIABLES EKLEME

### ADIM 1: Vercel Dashboard'a Gidin

1. https://vercel.com/dashboard
2. Projenizi seçin: **ilce-sekreterlik**
3. **Settings** sekmesine tıklayın
4. Sol menüden **"Environment Variables"** seçeneğine tıklayın

**VEYA direkt link:**
```
Settings → Environment Variables
```

---

### ADIM 2: İlk Değişken - VITE_USE_FIREBASE

1. **"Add New"** butonuna tıklayın

2. **Key (Anahtar) Alanı:**
   ```
   VITE_USE_FIREBASE
   ```
   ⚠️ **SADECE BUNU YAZIN!** Başka bir şey eklemeyin!

3. **Value (Değer) Alanı:**
   ```
   true
   ```
   ⚠️ **SADECE BUNU YAZIN!** Tırnak işareti eklemeyin!

4. **Environment (Ortam) Seçenekleri:**
   - ✅ **Production** - İşaretleyin
   - ✅ **Preview** - İşaretleyin
   - ✅ **Development** - İşaretleyin

5. **"Save"** butonuna tıklayın

---

### ADIM 3: İkinci Değişken - VITE_ENCRYPTION_KEY

1. **"Add New"** butonuna tekrar tıklayın

2. **Key (Anahtar) Alanı:**
   ```
   VITE_ENCRYPTION_KEY
   ```
   ⚠️ **SADECE BUNU YAZIN!** Başka bir şey eklemeyin!

3. **Value (Değer) Alanı:**
   ```
   ilsekreterlik-app-encryption-key-2024-secret-very-long-key-for-security-minimum-32-characters
   ```
   ⚠️ **SADECE BUNU YAZIN!**
   - ❌ Tırnak işareti eklemeyin (`"` veya `'`)
   - ❌ Key kısmını yazmayın
   - ❌ `=` işareti eklemeyin

4. **Environment (Ortam) Seçenekleri:**
   - ✅ **Production** - İşaretleyin
   - ✅ **Preview** - İşaretleyin
   - ✅ **Development** - İşaretleyin

5. **"Save"** butonuna tıklayın

---

## 📸 GÖRSEL ÖRNEK

### Environment Variables Formu:

```
┌─────────────────────────────────────────────────┐
│ Add New Environment Variable                     │
├─────────────────────────────────────────────────┤
│                                                 │
│ Key:                                            │
│ ┌─────────────────────────────────────────┐   │
│ │ VITE_USE_FIREBASE                     │   │ ← SADECE BUNU!
│ └─────────────────────────────────────────┘   │
│                                                 │
│ Value:                                          │
│ ┌─────────────────────────────────────────┐   │
│ │ true                                     │   │ ← SADECE BUNU!
│ └─────────────────────────────────────────┘   │
│                                                 │
│ Environment:                                    │
│ ☑ Production                                   │
│ ☑ Preview                                      │
│ ☑ Development                                  │
│                                                 │
│         [ Cancel ]  [ Save ]                   │
└─────────────────────────────────────────────────┘
```

---

## ✅ EKLENMESİ GEREKEN DEĞİŞKENLER ÖZET

| Key | Value | Environment |
|-----|-------|-------------|
| `VITE_USE_FIREBASE` | `true` | Production, Preview, Development |
| `VITE_ENCRYPTION_KEY` | `ilsekreterlik-app-encryption-key-2024-secret-very-long-key-for-security-minimum-32-characters` | Production, Preview, Development |

---

## 🔍 KONTROL

Environment Variables ekledikten sonra:

1. **Settings → Environment Variables** sayfasına gidin
2. Listede şunları görmelisiniz:
   - ✅ `VITE_USE_FIREBASE` = `true`
   - ✅ `VITE_ENCRYPTION_KEY` = `ilsekreterlik-app-encryption-key-2024-secret-very-long-key-for-security-minimum-32-characters`

---

## ⚠️ ÖNEMLİ NOTLAR

### 1. Key ve Value AYRI!

**YANLIŞ:**
```
Key: VITE_USE_FIREBASE=true
```

**DOĞRU:**
```
Key: VITE_USE_FIREBASE
Value: true
```

---

### 2. Tırnak İşareti Kullanmayın

**YANLIŞ:**
```
Value: "true"
Value: 'true'
Value: "ilsekreterlik-app-encryption-key..."
```

**DOĞRU:**
```
Value: true
Value: ilsekreterlik-app-encryption-key-2024-secret-very-long-key-for-security-minimum-32-characters
```

---

### 3. Her Environment İçin Ayrı Eklenebilir

Her değişken için **Production, Preview, Development** seçeneklerinden birini veya hepsini seçebilirsiniz.

**Öneri:** Her üçünü de seçin! ✅

---

## 🔄 REDEPLOY

Environment Variables ekledikten sonra:

1. **Deployments** → Son deployment → **"..."** → **"Redeploy"**
2. ✅ **"Use existing Build Cache"** seçeneğini **KALDIRIN** ⚠️
3. **"Redeploy"** butonuna tıklayın

**ÖNEMLİ:** Environment Variables ekledikten sonra mutlaka redeploy yapın!

---

## 💡 SONUÇ

**Soru:** Environment Variables kısmına bir şey yazacak mıyım?

**Cevap:** 
- ✅ **EVET!** 2 adet Environment Variable eklemeniz gerekiyor:
  1. `VITE_USE_FIREBASE` = `true`
  2. `VITE_ENCRYPTION_KEY` = `ilsekreterlik-app-encryption-key-2024-secret-very-long-key-for-security-minimum-32-characters`

**Nasıl:**
1. Settings → Environment Variables
2. "Add New" butonuna tıklayın
3. Key ve Value'ları yukarıdaki gibi ekleyin
4. Her üç environment'ı seçin (Production, Preview, Development)
5. Save butonuna tıklayın
6. Redeploy yapın ✅

