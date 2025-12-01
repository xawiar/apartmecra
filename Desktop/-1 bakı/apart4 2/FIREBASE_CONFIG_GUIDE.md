# 🔥 Firebase Konfigürasyon Bilgilerini Bulma Rehberi

## 📍 Firebase Console'dan Bilgileri Alma

### 1. Firebase Console'a Giriş
1. [Firebase Console](https://console.firebase.google.com/) adresine gidin
2. Google hesabınızla giriş yapın
3. Projenizi seçin (veya yeni proje oluşturun)

### 2. Web App Konfigürasyonunu Bulma

#### Adım 1: Proje Ayarlarına Git
1. Firebase Console'da sol üst köşedeki **⚙️ (Settings)** ikonuna tıklayın
2. **"Project settings"** seçeneğini seçin

#### Adım 2: Web App Konfigürasyonunu Bul
1. **"Project settings"** sayfasında aşağı kaydırın
2. **"Your apps"** bölümüne gelin
3. Eğer web app yoksa:
   - **"Add app"** butonuna tıklayın
   - **"Web" (</>)** ikonunu seçin
   - App nickname girin (örn: `apartmecra-web`)
   - **"Register app"** butonuna tıklayın

#### Adım 3: Konfigürasyon Bilgilerini Kopyala
Web app oluşturulduktan sonra şu bilgileri göreceksiniz:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyDMe5MyBF1zvE4sznBLRXAeteu0L0AYpMY",
  authDomain: "apartmecraelazig.firebaseapp.com",
  projectId: "apartmecraelazig",
  storageBucket: "apartmecraelazig.firebasestorage.app",  // ← Bu VITE_FIREBASE_STORAGE_BUCKET
  messagingSenderId: "21282078673",  // ← Bu VITE_FIREBASE_MESSAGING_SENDER_ID
  appId: "1:21282078673:web:86a736f4910c50392aeaf0"
};
```

### 3. Her Bilginin Anlamı

| Firebase Config | Environment Variable | Nereden Bulunur |
|----------------|---------------------|-----------------|
| `apiKey` | `VITE_FIREBASE_API_KEY` | Firebase Console > Project Settings > Web App Config |
| `authDomain` | `VITE_FIREBASE_AUTH_DOMAIN` | Firebase Console > Project Settings > Web App Config |
| `projectId` | `VITE_FIREBASE_PROJECT_ID` | Firebase Console > Project Settings > General |
| `storageBucket` | `VITE_FIREBASE_STORAGE_BUCKET` | Firebase Console > Project Settings > Web App Config |
| `messagingSenderId` | `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase Console > Project Settings > Web App Config |
| `appId` | `VITE_FIREBASE_APP_ID` | Firebase Console > Project Settings > Web App Config |

### 4. Storage Bucket Bilgisini Kontrol Etme

Eğer `storageBucket` bilgisi farklı görünüyorsa:

1. Firebase Console'da **"Storage"** sekmesine gidin
2. **"Get started"** butonuna tıklayın (eğer Storage aktif değilse)
3. Storage bucket adı genellikle şu formatta olur:
   - `your-project-id.appspot.com` veya
   - `your-project-id.firebasestorage.app`

### 5. Messaging Sender ID Kontrol

`messagingSenderId` genellikle Firebase Cloud Messaging (FCM) için kullanılır. Bu bilgi:
- Firebase Console > Project Settings > Cloud Messaging sekmesinde de bulunabilir
- Ancak genellikle Web App config'inde zaten mevcuttur

## 📝 Örnek Environment Variables

Firebase Console'dan aldığınız bilgilerle şöyle görünecek:

```env
VITE_FIREBASE_API_KEY=AIzaSyDMe5MyBF1zvE4sznBLRXAeteu0L0AYpMY
VITE_FIREBASE_AUTH_DOMAIN=apartmecraelazig.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=apartmecraelazig
VITE_FIREBASE_STORAGE_BUCKET=apartmecraelazig.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=21282078673
VITE_FIREBASE_APP_ID=1:21282078673:web:86a736f4910c50392aeaf0
```

## 🔍 Alternatif Yol: Firebase CLI ile

Eğer Firebase CLI kuruluysa:

```bash
firebase projects:list
firebase use your-project-id
firebase apps:list
```

## ⚠️ Önemli Notlar

1. **Güvenlik:** Bu bilgileri public repository'lerde paylaşmayın
2. **Environment Variables:** Render.com'da bu bilgileri Environment Variables olarak ekleyin
3. **VITE_ Prefix:** Vite projelerinde environment variable'lar `VITE_` ile başlamalı

## 🎯 Hızlı Erişim

Firebase Console'da doğrudan bu sayfaya gitmek için:
1. [Firebase Console](https://console.firebase.google.com/)
2. Projenizi seçin
3. ⚙️ Settings > Project settings
4. "Your apps" bölümüne scroll edin

## 📸 Görsel Rehber

Firebase Console'da şu sırayı takip edin:
```
Firebase Console
  └─ ⚙️ Settings (Sol üst köşe)
      └─ Project settings
          └─ Scroll down to "Your apps"
              └─ Web app config (</> icon)
                  └─ Firebase SDK snippet
                      └─ Config object (tüm bilgiler burada)
```


