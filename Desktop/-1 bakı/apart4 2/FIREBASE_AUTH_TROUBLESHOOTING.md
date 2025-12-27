# Firebase Authentication Sorun Giderme Rehberi

## Farklı Cihazlardan Giriş Yapılamıyor Sorunu

### Sorun
Kendi bilgisayarınızda/telefonunuzda giriş yapabiliyorsunuz ama başka cihazlardan giriş yapılamıyor.

### Olası Nedenler ve Çözümler

#### 1. Firebase Authorized Domains Ayarları

**Sorun:** Firebase Console'da authorized domains listesine tüm kullanılan domain'ler eklenmemiş olabilir.

**Çözüm:**
1. Firebase Console'a gidin: https://console.firebase.google.com/
2. Projenizi seçin: `apartmecra-elz`
3. **Authentication** → **Settings** → **Authorized domains** bölümüne gidin
4. Şu domain'leri ekleyin (yoksa):
   - `localhost` (geliştirme için)
   - `apartmecra.onrender.com` (production için)
   - `apartmecra-hyrs.onrender.com` (varsa ikinci deployment)
   - Kullanılan diğer tüm domain'ler

**Önemli:** Her yeni domain/IP için authorized domains listesine ekleme yapılmalıdır.

#### 2. IP Kısıtlamaları

Firebase Authentication varsayılan olarak IP kısıtlaması yapmaz, ancak:
- Şirket ağında firewall kuralları olabilir
- VPN kullanımı sorun yaratabilir
- Mobil veri vs WiFi farklı IP'ler kullanır

**Kontrol:**
- Farklı cihazlardan aynı network'ten (aynı WiFi) deneyin
- Mobil veri ile deneyin
- VPN'i kapatıp deneyin

#### 3. Tarayıcı Cache ve Cookies

**Çözüm:**
- Farklı cihazlarda tarayıcı cache'ini temizleyin
- Incognito/Private mode'da deneyin
- Farklı tarayıcıda deneyin

#### 4. Firebase API Key Kısıtlamaları

**Kontrol:**
1. Google Cloud Console'a gidin
2. **APIs & Services** → **Credentials**
3. API Key'inizi bulun
4. **Application restrictions** kontrol edin
5. Eğer kısıtlama varsa, tüm domain'leri ekleyin veya kısıtlamayı kaldırın

### Hata Mesajları ve Anlamları

- **"Geçersiz kimlik bilgileri"**: Genellikle authorized domains sorunu
- **"Ağ bağlantısı hatası"**: Network veya domain sorunu
- **"400 Bad Request"**: Domain/IP yetkilendirme sorunu

### Debug İçin

Tarayıcı konsolunda şu hataları kontrol edin:
- `auth/unauthorized-domain`
- `auth/domain-not-allowed`
- `400 Bad Request`
- Network sekmesinde istek durumları

### Hızlı Test

1. Farklı bir cihazdan aynı network'ten (aynı WiFi) giriş yapmayı deneyin
2. Mobil veri ile giriş yapmayı deneyin
3. Farklı bir tarayıcıda giriş yapmayı deneyin
4. Incognito mode'da giriş yapmayı deneyin

Bu testler sorunun kaynağını belirlemenize yardımcı olacaktır.

