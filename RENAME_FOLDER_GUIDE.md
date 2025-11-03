# Klasör Adını Değiştirme Rehberi

## ⚠️ ÖNEMLİ UYARI

Klasör adını değiştirmeden önce, mevcut çözümü deneyin (build output'u basitleştirildi).

Eğer hala Türkçe karakter hatası alıyorsanız, bu rehberi kullanın.

---

## 📋 Adım Adım: Klasör Adını Değiştirme

### ADIM 1: Yerel Klasörü Yeniden Adlandırın

```bash
cd ~/Desktop
mv "sekret ilçe" "sekret-ilce"
```

**ÖNEMLİ:** 
- Klasör adını `sekret ilçe` → `sekret-ilce` olarak değiştiriyoruz
- Türkçe karakter (`ç`) kaldırıldı
- Boşluk tire (`-`) ile değiştirildi

### ADIM 2: Proje Dizinine Gidin

```bash
cd "sekret-ilce/sekreterlik4"
```

### ADIM 3: Git Status Kontrolü

```bash
git status
```

Git klasör adı değişikliğini algılamalı.

### ADIM 4: Tüm Değişiklikleri Commit Edin

```bash
git add -A
git commit -m "Rename folder: sekret ilçe to sekret-ilce (fix Turkish character issue)"
git push origin version1
```

**ÖNEMLİ:** Bu commit GitHub'daki dosya path'lerini güncelleyecek:
- Eski: `Desktop/sekret ilçe/sekreterlik4/...`
- Yeni: `Desktop/sekret-ilce/sekreterlik4/...`

### ADIM 5: Render.com Ayarlarını Güncelleyin

Render.com Dashboard → Settings → Build & Deploy:

#### Build Command:

```
cd "Desktop/sekret-ilce/sekreterlik4/sekreterlik-app/client" && npm install && npm run build && node scripts/fix-spa-routing.js
```

#### Publish Directory:

```
Desktop/sekret-ilce/sekreterlik4/sekreterlik-app/client/dist
```

**ÖNEMLİ:**
- `sekret ilçe` → `sekret-ilce` olarak değiştirildi
- Türkçe karakter kaldırıldı
- Render.com artık bu path'i kabul edecek

### ADIM 6: Render.com'da Manual Deploy

1. Manual Deploy butonuna tıklayın
2. Branch: `version1` seçin
3. Deploy butonuna tıklayın
4. Deploy tamamlanana kadar bekleyin (2-3 dakika)

---

## ✅ SONUÇ

Klasör adı değiştirildikten sonra:
- Git path'leri güncellenecek
- Render.com Türkçe karakter hatası vermeyecek
- Build başarılı olacak

---

## ⚠️ NOTLAR

1. **Klasör adı değişikliği Git'te tüm dosyaları etkiler**
   - GitHub'da dosya path'leri değişecek
   - Render.com ayarları güncellenmeli

2. **Yerel proje yolu değişir**
   - Eski: `~/Desktop/sekret ilçe/sekreterlik4`
   - Yeni: `~/Desktop/sekret-ilce/sekreterlik4`

3. **IDE/Açık dosyalar güncellenmelidir**
   - VSCode/Cursor açık klasörü yeniden açın
   - Yeni path: `~/Desktop/sekret-ilce/sekreterlik4`

---

## 🔄 ALTERNATİF: Klasör Adını Değiştirmeden Çözüm

Eğer klasör adını değiştirmek istemiyorsanız, **Publish Directory'i boş bırakın**:

### Render.com Settings → Build & Deploy:

#### Build Command:
```
cd "Desktop/sekret ilçe/sekreterlik4/sekreterlik-app/client" && npm install && npm run build && node scripts/fix-spa-routing.js
```

#### Publish Directory:
```
(BOŞ BIRAKIN)
```

Render.com build output'u otomatik bulacaktır.

