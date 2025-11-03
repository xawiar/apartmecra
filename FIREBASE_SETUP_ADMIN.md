# Firebase Admin Kullanıcısı Oluşturma Rehberi

## Hızlı Başlangıç

Firebase Authentication açıldıktan sonra ilk admin kullanıcısını oluşturmak için:

### Yöntem 1: Web Sayfası ile (Önerilen)

1. Uygulamayı başlatın:
```bash
cd sekreterlik-app/client
npm install
npm run dev
```

2. Tarayıcıda şu URL'yi açın:
```
http://localhost:5180/create-admin
```

3. "Admin Kullanıcısı Oluştur" butonuna tıklayın.

4. Kullanıcı bilgileri otomatik olarak oluşturulacak:
   - **Username**: `admin`
   - **Email**: `admin@ilsekreterlik.local`
   - **Password**: `admin123`

### Yöntem 2: HTML Dosyası ile

1. Tarayıcıda şu dosyayı açın:
```
sekreterlik-app/client/src/utils/createAdminUser.html
```

2. "Admin Kullanıcısı Oluştur" butonuna tıklayın.

## Ne Olur?

1. **Firebase Authentication'da** kullanıcı oluşturulur (veya zaten varsa giriş yapılır)
2. **Firestore'da** `admin` koleksiyonunda `main` dokümanına admin bilgileri kaydedilir
3. Bağlantı test edilir ve sonuç gösterilir

## Oluşturulan Veriler

Firestore'da `admin/main` dokümanında:
```json
{
  "username": "admin",
  "email": "admin@ilsekreterlik.local",
  "uid": "firebase-user-uid",
  "role": "admin",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

## Önemli Notlar

⚠️ **Güvenlik**:
- Production ortamında mutlaka şifreyi değiştirin!
- Firebase Console'dan kullanıcı şifresini güncelleyebilirsiniz
- Güçlü bir şifre kullanın (en az 8 karakter, büyük/küçük harf, rakam ve özel karakter)

## Sorun Giderme

### Kullanıcı zaten mevcut hatası
- Kullanıcı zaten oluşturulmuşsa, script otomatik olarak giriş yapar ve Firestore bilgilerini günceller.

### Firestore bağlantı hatası
- Firebase Console'da Firestore Database'in aktif olduğundan emin olun
- Security Rules'ın geçici olarak açık olduğundan emin olun (test için)

### Authentication hatası
- Firebase Console'da Email/Password authentication provider'ın aktif olduğundan emin olun
- Authentication > Sign-in method > Email/Password > Enable

## Sonraki Adımlar

1. Admin kullanıcısı ile giriş yapın (`/login` sayfasından)
2. Environment variable'ları ayarlayın (`.env` dosyasında):
   ```
   VITE_USE_FIREBASE=true
   VITE_ENCRYPTION_KEY=your-secret-key-32-characters-minimum
   ```
3. Uygulamayı kullanmaya başlayın!

