# Firebase Security Rules - Hızlı Düzeltme

## 🚨 ACİL: Üye Ekleme Hatası

Firebase Firestore Security Rules güncellenmemiş. Bu yüzden üye eklenemiyor.

## ⚡ Hızlı Çözüm (2 dakika)

### Adım 1: Firebase Console'a Git
1. [Firebase Console](https://console.firebase.google.com/) adresine git
2. Projenizi seç: **ilsekreterliki**

### Adım 2: Firestore Database Rules
1. Sol menüden **Firestore Database** tıkla
2. Üst menüden **Rules** sekmesine tıkla

### Adım 3: Kuralları Değiştir
Mevcut kuralları **TAMAMEN SİL** ve aşağıdakini yapıştır:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### Adım 4: Yayınla
1. **Publish** butonuna tıkla
2. "Rules published successfully" mesajını bekle (5-10 saniye)

### Adım 5: Test Et
1. Uygulamaya geri dön
2. Sayfayı yenile (F5)
3. Üye eklemeyi tekrar dene

## ✅ Bu Kural Ne Yapar?

- Sadece **giriş yapmış (authenticated)** kullanıcılar veri okuyabilir ve yazabilir
- Tüm collection'larda geçerlidir
- Güvenli ve çalışır durumdadır

## ⚠️ Dikkat

Eğer hala "Missing or insufficient permissions" hatası alıyorsan:

1. **Çıkış yap ve tekrar giriş yap** (login sayfasından)
2. Tarayıcı konsolunu kontrol et (F12) - authentication durumunu gösterir
3. Firebase Console'da Rules'un yayınlandığından emin ol

## 📋 Alternatif: Test Modu (SADECE GELİŞTİRME İÇİN)

**DİKKAT:** Production'da kullanma! Sadece test için!

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true; // HERKES okuyup yazabilir - SADECE TEST!
    }
  }
}
```

## 🔍 Sorun Devam Ederse

1. Firebase Console'da **Authentication** → **Users** kontrolü yap
2. Kullanıcının giriş yaptığından emin ol
3. Tarayıcı konsolunda `auth.currentUser` kontrolü yap
