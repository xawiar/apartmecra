# 🔄 Render.com - Temiz Deployment (Sıfırdan Bağlama)

## ❌ SORUN: Manual Deploy Hala Hata Veriyor

Render.com hala eski commit'i çekiyor veya cache sorunu var.

## ✅ ÇÖZÜM: Projeyi Sıfırdan Bağla

### ADIM 1: Mevcut Static Site'ı Sil

1. **Render Dashboard → Projeniz → Settings**
2. Aşağı kaydırın ve **"Delete Static Site"** butonunu bulun
3. **"Delete Static Site"** butonuna tıklayın
4. Onaylamak için proje adını yazın: **`ilce-sekreterlik`**
5. **"Delete"** butonuna tıklayın

**⚠️ ÖNEMLİ:** Bu işlem sadece Render bağlantısını keser, GitHub repository silinmez!

---

### ADIM 2: Yeni Static Site Oluştur

1. **Render Dashboard** ana sayfasına gidin
2. **"New +"** butonuna tıklayın (sağ üst köşe)
3. **"Static Site"** seçeneğini seçin
   - ⚠️ **"Web Service" DEĞİL, "Static Site" seçin!** ✅

---

### ADIM 3: GitHub Repository'yi Bağla

1. **"Connect a repository"** bölümünde
2. **GitHub** hesabınızı seçin
3. **Repository listesinde** `xawiar/ilce-sekreterlik` projesini bulun
4. **Repository'ye tıklayın** (seçmek için)

---

### ADIM 4: Build Ayarları (DİKKATLİ!)

#### Name:

**Input alanına yazın:**
```
ilce-sekreterlik
```

---

#### Branch:

**Dropdown menüsünden seçin:**
```
main
```

**⚠️ ÖNEMLİ:** `main` seçin! (artık güncel)

---

#### Root Directory:

**Input alanını BOŞ BIRAKIN** (hiçbir şey yazmayın):
```
(BOŞ)
```

---

#### Build Command:

**Input alanına yazın:**
```
cd sekreterlik-app/client && npm install && npm run build
```

**⚠️ ÖNEMLİ:** Tam olarak böyle yazın, başka bir şey eklemeyin!

---

#### Publish Directory:

**Input alanına yazın:**
```
sekreterlik-app/client/dist
```

**⚠️ ÖNEMLİ:** Tam olarak böyle yazın, başka bir şey eklemeyin!

---

### ADIM 5: Environment Variables

**Environment Variables** bölümünde:

#### Değişken 1: VITE_USE_FIREBASE

1. **"Add Environment Variable"** butonuna tıklayın
2. **Key** alanına yazın:
   ```
   VITE_USE_FIREBASE
   ```
3. **Value** alanına yazın:
   ```
   true
   ```
4. **"Save"** butonuna tıklayın

---

#### Değişken 2: VITE_ENCRYPTION_KEY

1. **"Add Environment Variable"** butonuna tıklayın
2. **Key** alanına yazın:
   ```
   VITE_ENCRYPTION_KEY
   ```
3. **Value** alanına yazın:
   ```
   ilsekreterlik-app-encryption-key-2024-secret-very-long-key-for-security-minimum-32-characters
   ```
   ⚠️ **ÖNEMLİ:** Tırnak işareti eklemeyin, sadece değeri yazın!
4. **"Save"** butonuna tıklayın

---

### ADIM 6: Deploy Et

1. Tüm ayarları yaptıktan sonra
2. **"Create Static Site"** butonuna tıklayın
3. Build başlayacak

---

### ADIM 7: Build Loglarını İzleyin

**Deployments → Son deployment → Logs:**

Şunları kontrol edin:
- ✅ **Branch:** `main`
- ✅ **Commit:** `1535d89` veya daha yeni (artık `88df207` değil!)
- ✅ **"cd sekreterlik-app/client"** komutu çalışmalı
- ✅ **"Installing dependencies..."** görünmeli
- ✅ **"Building..."** görünmeli
- ✅ **"Build completed successfully"** görünmeli

---

## 🔍 SORUN GİDERME

### Eğer Hala "cd: sekreterlik-app/client: Böyle bir dosya veya dizin yok" Hatası Alıyorsanız:

#### 1. GitHub'da Main Branch'i Kontrol Edin

**https://github.com/xawiar/ilce-sekreterlik/tree/main**

- Son commit `1535d89` veya daha yeni mi?
- `sekreterlik-app/client` dizini var mı?
- `sekreterlik-app/client/package.json` dosyası var mı?

#### 2. Render.com Branch Ayarları

**Settings → Build & Deploy:**

1. **Branch** alanını kontrol edin
2. **`main`** yazılı mı?
3. **Save** butonuna tıklayın

#### 3. Projeyi Tekrar Sil ve Yeni Oluştur

**Eğer hala çalışmıyorsa:**
1. Static Site'ı tekrar silin
2. Yeni Static Site oluşturun
3. Bu sefer **branch olarak `version1`** deneyin

---

## ⚠️ ALTERNATİF: Branch'i Version1 Olarak Değiştir

Eğer `main` branch'i hala sorun çıkarıyorsa:

### Render.com Ayarları:

1. **Settings → Build & Deploy**
2. **Branch** alanını bulun
3. **`version1`** yazın (veya dropdown'dan seçin)
4. **Save** butonuna tıklayın
5. **Manual Deploy** yapın

**`version1` branch'i zaten güncel ve çalışır durumda!** ✅

---

## 💡 SONUÇ

**Sorun:** Manual Deploy hala eski commit'i çekiyor

**En Kesin Çözüm:**
1. **Projeyi Render.com'da silin** ✅
2. **Yeni Static Site oluşturun** ✅
3. **Branch olarak `main` seçin** (artık güncel) ✅
4. **Ayarları yapın ve deploy edin** ✅

**VEYA:**
1. **Settings → Build & Deploy**
2. **Branch'i `version1` olarak değiştirin** ✅
3. **Manual Deploy yapın** ✅

---

**EN ÖNEMLİSİ: Projeyi sıfırdan bağlayın veya branch'i `version1` yapın!** ✅

