# ✅ Render.com Environment Variable Kontrolü

## 🔍 SORUN

`deleteArchivedMember` fonksiyonu hala `localhost:5000` API'sine istek atıyor. Bu, `VITE_USE_FIREBASE` environment variable'ının Render.com'da doğru set edilmediğini gösteriyor.

---

## ✅ ÇÖZÜM: Environment Variable Kontrolü

Render.com'da **MUTLAKA** `VITE_USE_FIREBASE=true` set edilmiş olmalı!

---

## 📋 RENDER.COM AYARLARI - KONTROL

### Settings → Environment:

#### ZORUNLU Environment Variable:

**Key:** `VITE_USE_FIREBASE`
**Value:** `true`

**⚠️ ÖNEMLİ:**
- Key: **TAM OLARAK** `VITE_USE_FIREBASE` (büyük/küçük harf duyarlı)
- Value: **TAM OLARAK** `true` (string, tırnak işareti YOK)
- **Mutlaka mevcut olmalı!**

#### Diğer Environment Variables:

1. **Key:** `VITE_ENCRYPTION_KEY`
   **Value:** `ilsekreterlik-app-encryption-key-2024-secret-very-long-key-for-security-minimum-32-characters`

2. **Key:** `RENDER`
   **Value:** `true`

---

## 🔄 ADIMLAR - KONTROL

1. **Render.com → Dashboard → Servis'iniz**
2. **Settings → Environment** sekmesine gidin
3. **Environment Variables** listesini kontrol edin
4. **`VITE_USE_FIREBASE`** var mı kontrol edin:
   - **Varsa:** Value'sunu kontrol edin (`true` olmalı)
   - **Yoksa:** **Add Environment Variable** ile ekleyin:
     - **Key:** `VITE_USE_FIREBASE`
     - **Value:** `true`
     - **Save**
5. **Save Changes** butonuna tıklayın
6. **Manual Deploy** yapın

---

## 🔍 DEBUG KONTROLÜ

Browser Console'da (F12 → Console) şunu görmelisiniz:

```
[ApiService] Firebase check: {
  VITE_USE_FIREBASE: "true",
  USE_FIREBASE: true,
  MODE: "production"
}
```

**Eğer `USE_FIREBASE: false` görüyorsanız:**
- Render.com'da `VITE_USE_FIREBASE=true` set edin
- Deploy'u yeniden başlatın
- Cache'i temizleyin

---

## ✅ BEKLENEN SONUÇ

Arşivlenmiş üyeyi sildiğinizde Console'da:

```
[ApiService.deleteArchivedMember] Called: { id: "...", USE_FIREBASE: true, ... }
[ApiService.deleteArchivedMember] Using FirebaseApiService
FirebaseApiService.deleteArchivedMember called with id: "..."
```

**VE** `localhost:5000` API'sine istek **OLMAMALI**!

---

## ⚠️ ÖNEMLİ NOT

- Environment variable'lar **Build zamanında** inject edilir
- Değişiklik yaptıktan sonra **MUTLAKA** yeni deploy yapın
- Build cache'i temizlemek için **Clear Build Cache** butonunu kullanın (varsa)

