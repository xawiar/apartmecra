# 🚀 Deployment Rehberi

Bu rehber, projeyi Firebase, Git ve Render kullanarak production'a deploy etmek için adım adım talimatlar içerir.

## 📋 Ön Hazırlık

### 1. Firebase Projesi Kontrolü

Firebase Console'da şunların aktif olduğundan emin olun:
- ✅ **Authentication** - Email/Password etkin
- ✅ **Firestore Database** - Oluşturulmuş (europe-west1)
- ✅ **Storage** - Oluşturulmuş
- ✅ **Functions** - Blaze planı gerekli (ücretsiz tier yeterli)

### 2. Firebase CLI Kurulumu

```bash
npm install -g firebase-tools
```

### 3. Firebase'e Giriş ve Proje Bağlantısı

```bash
# Firebase'e giriş yap
firebase login

# Projeyi bağla (apartmecra-elz)
firebase use --add
# Seçeneklerden "apartmecra-elz" projesini seçin
```

## 🔥 Firebase Deploy Adımları

### Adım 1: Firestore ve Storage Rules Deploy

```bash
npm run firebase:deploy:rules
```

Bu komut şunları deploy eder:
- `firestore.rules` - Firestore güvenlik kuralları
- `storage.rules` - Storage güvenlik kuralları

### Adım 2: Firebase Functions Deploy

```bash
cd functions
npm install
cd ..
npm run firebase:deploy:functions
```

Bu komut şu fonksiyonları deploy eder:
- `createUserDocument` - Yeni kullanıcı oluşturulduğunda otomatik Firestore kaydı
- `createSiteUser` - Site oluşturulduğunda otomatik kullanıcı oluşturma
- `createCompanyUser` - Company oluşturulduğunda otomatik kullanıcı oluşturma
- `createAdminUser` - Admin kullanıcı oluşturma (manuel tetikleme)

### Adım 3: Tüm Firebase Servislerini Deploy (Opsiyonel)

```bash
npm run firebase:deploy:all
```

**Not:** Hosting'i deploy etmiyoruz çünkü Render kullanacağız.

## 📦 Git Repository Hazırlığı

### Adım 1: Git Repository Oluşturma

GitHub, GitLab veya Bitbucket'te yeni bir repository oluşturun.

### Adım 2: Git İlk Kurulumu (Eğer henüz yapılmadıysa)

```bash
# Git repository'yi başlat
git init

# .gitignore dosyasını kontrol et (önemli!)
# .env dosyası gitignore'da olmalı

# Tüm dosyaları ekle
git add .

# İlk commit
git commit -m "Initial commit: Firebase, Render deployment ready"

# Remote repository'yi ekle
git remote add origin <YOUR_REPOSITORY_URL>

# Main branch'e push
git branch -M main
git push -u origin main
```

### Adım 3: .gitignore Kontrolü

`.gitignore` dosyasında şunların olduğundan emin olun:
```
.env
.env.local
node_modules/
dist/
.firebase/
*.log
```

## 🌐 Render Deployment

### Adım 1: Render Dashboard'a Giriş

1. [Render Dashboard](https://dashboard.render.com/)'a giriş yapın
2. "New +" butonuna tıklayın
3. "Web Service" seçin

### Adım 2: Repository Bağlantısı

1. Git repository'nizi bağlayın (GitHub/GitLab/Bitbucket)
2. Repository'yi seçin
3. Branch: `main` seçin

### Adım 3: Build ve Deploy Ayarları

Render otomatik olarak `render.yaml` dosyasını okuyacak. Eğer manuel ayar yapmak isterseniz:

- **Name:** `apartmecra`
- **Environment:** `Node`
- **Build Command:** `npm install && npm run build`
- **Start Command:** `node server.cjs`
- **Plan:** `Free` (veya istediğiniz plan)

### Adım 4: Environment Variables

Render Dashboard'da "Environment" sekmesine gidin ve şu değişkenleri ekleyin:

```
NODE_ENV=production
PORT=10000
VITE_FIREBASE_API_KEY=AIzaSyDRYJ8wJpjIi4qF1jzLe14xtmb7iTT4jsc
VITE_FIREBASE_AUTH_DOMAIN=apartmecra-elz.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=apartmecra-elz
VITE_FIREBASE_STORAGE_BUCKET=apartmecra-elz.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=669151390046
VITE_FIREBASE_APP_ID=1:669151390046:web:30590b4e09a529d17d47cf
VITE_FIREBASE_MEASUREMENT_ID=G-4J8KGT8KJ5
```

**Not:** `render.yaml` dosyasında zaten tanımlı, ama Render Dashboard'dan da kontrol edin.

### Adım 5: Deploy

1. "Create Web Service" butonuna tıklayın
2. Render otomatik olarak build ve deploy işlemini başlatacak
3. İlk deploy 5-10 dakika sürebilir

## ✅ Deployment Sonrası Kontroller

### 1. Firebase Console Kontrolleri

- [ ] Firestore Database'de collections oluşturulabiliyor mu?
- [ ] Storage'da dosya yüklenebiliyor mu?
- [ ] Authentication'da kullanıcı oluşturulabiliyor mu?
- [ ] Functions çalışıyor mu?

### 2. Render Kontrolleri

- [ ] Web servisi çalışıyor mu?
- [ ] Build başarılı mı?
- [ ] Environment variables doğru mu?
- [ ] Health check başarılı mı? (`/api/sites` endpoint'i)

### 3. Uygulama Kontrolleri

- [ ] Ana sayfa yükleniyor mu?
- [ ] Login sayfası çalışıyor mu?
- [ ] Firebase bağlantısı başarılı mı?
- [ ] API endpoint'leri çalışıyor mu?

## 🔧 Sorun Giderme

### Firebase Deploy Hataları

```bash
# Firebase projesini kontrol et
firebase projects:list

# Aktif projeyi kontrol et
firebase use

# Projeyi değiştir
firebase use apartmecra-elz
```

### Render Build Hataları

1. Build loglarını kontrol edin
2. Environment variables'ların doğru olduğundan emin olun
3. `package.json`'daki script'leri kontrol edin
4. Node.js versiyonunu kontrol edin (Render otomatik algılar)

### CORS Hataları

`server.cjs` dosyasında CORS ayarları kontrol edin. Render URL'i `allowedOrigins` listesinde olmalı.

## 📝 Önemli Notlar

1. **.env Dosyası:** Local development için `.env` dosyası kullanılır, production'da Render environment variables kullanılır.

2. **Firebase Hosting:** Render kullandığımız için Firebase Hosting'e deploy etmiyoruz.

3. **Database:** İlk deploy'dan sonra Firestore'da collections'lar otomatik oluşturulacak.

4. **Admin Kullanıcı:** İlk admin kullanıcısını Firebase Console'dan manuel oluşturmanız gerekebilir veya `createAdminUser` function'ını kullanabilirsiniz.

5. **SSL:** Render otomatik olarak SSL sertifikası sağlar.

## 🎉 Başarılı Deployment!

Deployment tamamlandıktan sonra:
- Render size bir URL verecek (örn: `https://apartmecra.onrender.com`)
- Bu URL'i Firebase Console'da "Authorized domains" listesine ekleyin
- İlk admin kullanıcısını oluşturun
- Uygulamayı test edin

## 📞 Destek

Sorun yaşarsanız:
1. Build loglarını kontrol edin
2. Firebase Console'da hataları kontrol edin
3. Render Dashboard'da service health'i kontrol edin

