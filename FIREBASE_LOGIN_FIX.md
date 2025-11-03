# Firebase Login Sorun Giderme

## Sorun
Admin kullanıcısı ile giriş yapılamıyor (`admin` / `admin123`)

## Çözüm Adımları

### 1. Admin Kullanıcısını Kontrol Edin

Tarayıcıda şu URL'yi açın:
```
http://localhost:5180/create-admin
```

"Admin Kullanıcısı Oluştur" butonuna tıklayın ve kullanıcının başarıyla oluşturulduğundan emin olun.

### 2. Giriş Bilgileri

Firebase Authentication için kullanılacak bilgiler:
- **Username**: `admin`
- **Email**: `admin@ilsekreterlik.local` (otomatik oluşturulur)
- **Password**: `admin123`

### 3. Browser Console'u Kontrol Edin

Giriş yapmaya çalıştığınızda browser console'da (F12) şu log'ları görmelisiniz:
- `Firebase login attempt: {username: 'admin', email: 'admin@ilsekreterlik.local'}`
- Başarılıysa: `Firebase login successful: [user-id]`
- Hata varsa: `Login error:` detayları

### 4. Olası Hatalar ve Çözümleri

#### "auth/user-not-found"
**Sorun**: Firebase Authentication'da kullanıcı yok
**Çözüm**: `/create-admin` sayfasından admin kullanıcısını oluşturun

#### "auth/wrong-password"
**Sorun**: Şifre yanlış
**Çözüm**: 
- Şifrenin `admin123` olduğundan emin olun
- `/create-admin` sayfasından kullanıcıyı yeniden oluşturun

#### "auth/invalid-email"
**Sorun**: Email formatı hatalı
**Çözüm**: Username alanına sadece `admin` yazın (email formatı otomatik oluşturulur)

### 5. Firebase Console'u Kontrol Edin

1. Firebase Console'a gidin: https://console.firebase.google.com
2. Projenizi seçin: `ilsekreterliki`
3. Authentication > Users bölümüne gidin
4. `admin@ilsekreterlik.local` kullanıcısının olduğunu kontrol edin

### 6. Firestore'u Kontrol Edin

1. Firebase Console > Firestore Database
2. `admin` koleksiyonunu kontrol edin
3. `main` dokümanının olduğunu ve `username: 'admin'` olduğunu kontrol edin

### 7. Environment Variable Kontrolü

`.env` dosyasında şu satırın olduğundan emin olun:
```
VITE_USE_FIREBASE=true
```

Sonra uygulamayı yeniden başlatın.

## Güncellenen Kod

FirebaseApiService login fonksiyonu güncellendi:
- Daha detaylı hata mesajları
- Console.log'lar eklendi
- `role` alanı eklendi (AuthContext ile uyumluluk için)
- Admin dokümanı kontrolü iyileştirildi

## Test

1. Uygulamayı yeniden başlatın: `npm run dev`
2. `/create-admin` sayfasından admin kullanıcısını oluşturun
3. `/login` sayfasından giriş yapmayı deneyin:
   - Username: `admin`
   - Password: `admin123`

## Hala Çalışmıyorsa

Browser console'da (F12) hata mesajlarını kontrol edin ve bana bildirin.

