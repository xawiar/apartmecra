# 🔄 Vercel Production Branch Değiştirme - Alternatif Çözümler

## ❌ SORUN

Production Branch'i `version1` yapamıyorsunuz.

## ✅ ALTERNATİF ÇÖZÜMLER

### ÇÖZÜM 1: Settings → Git Sekmesinde Bulma

#### Adım 1: Vercel Dashboard'a Gidin

1. https://vercel.com/dashboard
2. Projenizi seçin: **ilce-sekreterlik**
3. **Settings** → **Git** sekmesine tıklayın

#### Adım 2: Production Branch'i Bulun

**Settings → Git → Production Branch:**

1. **"Production Branch"** alanını bulun
2. Dropdown menüsüne tıklayın
3. **`version1`** seçeneğini seçin
4. **Save** butonuna tıklayın

**⚠️ Eğer dropdown menüsünde `version1` yoksa:**
- GitHub repository'de `version1` branch'inin var olduğundan emin olun
- Vercel'in GitHub repository'ye erişimi olduğundan emin olun

---

### ÇÖZÜM 2: Proje Ayarlarından Değiştirme

#### Adım 1: Settings → General

1. Vercel Dashboard → **Settings** → **General**
2. **"Production Branch"** bölümünü arayın
3. Eğer burada varsa, değiştirin

#### Adım 2: Settings → Git

1. Vercel Dashboard → **Settings** → **Git**
2. **"Production Branch"** bölümünü bulun
3. **`version1`** olarak değiştirin

---

### ÇÖZÜM 3: Projeyi Sıfırdan Bağlama (EN KESIN)

#### Adım 1: Projeyi Sil

1. Vercel Dashboard → Projeniz → **Settings**
2. **"Danger Zone"** bölümünü bulun
3. **"Delete Project"** butonuna tıklayın
4. Onaylayın (repo silinmez, sadece Vercel bağlantısı kesilir)

#### Adım 2: Yeni Proje Oluştur

1. Vercel Dashboard → **"Add New..."** → **"Project"**
2. GitHub repository'yi seçin: **`xawiar/ilce-sekreterlik`**
3. **"Import"** butonuna tıklayın

#### Adım 3: Import Sırasında Branch Seçimi

Import sırasında şunları yapın:

**Framework Preset:**
```
Other
```

**Root Directory:**
```
sekreterlik-app/client
```

**Branch:**
```
version1
```
⚠️ **ÖNEMLİ:** Import sırasında branch seçimi yapabilirsiniz!

**Build Command:**
```
npm install && npm run build
```

**Output Directory:**
```
dist
```

**Environment Variables:**
- `VITE_USE_FIREBASE` = `true`
- `VITE_ENCRYPTION_KEY` = `ilsekreterlik-app-encryption-key-2024-secret-very-long-key-for-security-minimum-32-characters`

**Deploy** butonuna tıklayın.

---

### ÇÖZÜM 4: Vercel CLI ile Değiştirme

#### Adım 1: Vercel CLI Yükleyin

```bash
npm install -g vercel
```

#### Adım 2: Login Yapın

```bash
vercel login
```

#### Adım 3: Projeyi Linkleyin

```bash
cd /Users/dayhan/Desktop/sekret\ ilçe/sekreterlik4
vercel link
```

#### Adım 4: Branch Ayarlarını Kontrol Edin

Vercel CLI ile branch ayarlarını görebilirsiniz, ancak Dashboard'dan değiştirmek daha kolaydır.

---

### ÇÖZÜM 5: GitHub'da Main Branch'i Version1'e Taşıma

**⚠️ UYARI:** Bu yöntem risklidir, önerilmez. Sadece son çare olarak kullanın.

Eğer Production Branch'i değiştiremiyorsanız ve `main` branch'ini kullanmak zorundaysanız:

1. GitHub'da `version1` branch'indeki değişiklikleri `main` branch'ine merge edin
2. Veya `main` branch'ini `version1` branch'i ile değiştirin

**AMA:** En iyi çözüm Production Branch'i değiştirmektir!

---

## 🔍 SORUN GİDERME

### Production Branch Nerede?

**Settings → Git → Production Branch:**

1. Vercel Dashboard → **Settings**
2. Sol menüden **"Git"** sekmesine tıklayın
3. **"Production Branch"** bölümünü bulun
4. Dropdown menüsüne tıklayın ve `version1` seçin

### Dropdown Menüsünde version1 Yok?

**Sorun:** Vercel henüz `version1` branch'ini görmemiş olabilir.

**Çözüm:**
1. GitHub repository'ye gidin: https://github.com/xawiar/ilce-sekreterlik
2. `version1` branch'inin var olduğundan emin olun
3. Vercel Dashboard → **Settings** → **Git**
4. **"Reconnect"** veya **"Sync"** butonuna tıklayın (varsa)
5. Tekrar **"Production Branch"** dropdown'ını kontrol edin

### Settings → Git Sekmesi Yok?

**Sorun:** Vercel hesabınızda Git ayarları görünmüyor olabilir.

**Çözüm:**
1. Vercel Dashboard → **Settings** → **General**
2. Git repository bağlantısını kontrol edin
3. Eğer Git bağlantısı yoksa, projeyi yeniden bağlayın

---

## 💡 EN KOLAY ÇÖZÜM (ÖNERİLEN)

### Projeyi Sıfırdan Bağlayın:

1. **Delete Project** (repo silinmez!)
2. **Add New → Project**
3. Repository'yi seçin
4. **Import sırasında `version1` branch'ini seçin** ✅
5. Ayarları yapın ve deploy edin

**Bu yöntem kesin çalışır!** ✅

---

## 📋 KONTROL LİSTESİ

Production Branch'i değiştirmek için:

- [ ] Settings → Git sekmesine gidin
- [ ] Production Branch dropdown menüsünü bulun
- [ ] version1 seçeneğini seçin
- [ ] Save butonuna tıklayın
- [ ] Eğer hala yapamıyorsanız, projeyi sıfırdan bağlayın

---

## ⚠️ ÖNEMLİ NOTLAR

1. **Production Branch ayarı değiştirilemiyorsa**, projeyi sıfırdan bağlamak en kesin çözümdür.
2. **Import sırasında** branch seçimi yapabilirsiniz.
3. **GitHub repository'de** `version1` branch'inin var olduğundan emin olun.

---

## 🎯 SONUÇ

**Sorun:** Production Branch'i `version1` yapamıyorsunuz.

**En Kolay Çözüm:**
1. **Projeyi silin** (repo silinmez)
2. **Yeni proje oluşturun**
3. **Import sırasında `version1` branch'ini seçin** ✅
4. Ayarları yapın ve deploy edin

✅ **Bu yöntem %100 çalışır!**

