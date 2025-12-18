# UptimeRobot Kurulum Rehberi

Render ücretsiz planında servisler 15 dakika hareketsizlik sonrası uyku moduna geçer. UptimeRobot ile servisi otomatik olarak uyandırabilirsiniz.

## Health Check Endpoint

Servis şu endpoint'leri sağlar:
- **`/health`** - Ana health check endpoint (önerilen)
- **`/ping`** - Alternatif ping endpoint

Her iki endpoint de şu formatta JSON döner:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "uptime": 3600,
  "service": "apartmecra"
}
```

## UptimeRobot Kurulum Adımları

1. **UptimeRobot'a Kayıt Olun**
   - https://uptimerobot.com adresine gidin
   - Ücretsiz hesap oluşturun (50 monitor limiti)

2. **Yeni Monitor Oluşturun**
   - Dashboard'da "Add New Monitor" butonuna tıklayın
   - **Monitor Type**: `HTTP(s)` seçin
   - **Friendly Name**: `Apartmecra Health Check` (veya istediğiniz isim)
   - **URL**: `https://apartmecra-hyrs.onrender.com/health`
     - Not: Render URL'inizi kendi URL'inizle değiştirin
   - **Monitoring Interval**: `5 minutes` (ücretsiz plan için minimum)
   - **Alert Contacts**: E-posta veya SMS ekleyin (isteğe bağlı)

3. **Ayarları Kaydedin**
   - "Create Monitor" butonuna tıklayın
   - Monitor aktif olduğunda her 5 dakikada bir servisinizi ping edecek

## Önemli Notlar

- **Ücretsiz Plan**: UptimeRobot ücretsiz planında minimum 5 dakika interval var
- **Render URL**: Render dashboard'unuzdan servisinizin gerçek URL'ini alın
- **Test**: Monitor oluşturduktan sonra "Test" butonuna tıklayarak çalıştığını doğrulayın
- **Alert**: Servis down olduğunda e-posta/SMS almak istiyorsanız alert contact ekleyin

## Health Check Endpoint Detayları

- **Rate Limiting**: Health check endpoint'leri rate limiting'den muaf tutulmuştur
- **Response Time**: Çok hızlı yanıt verir (< 10ms)
- **Status Code**: Başarılı durumda `200 OK` döner

## Sorun Giderme

Eğer health check çalışmıyorsa:
1. Render dashboard'da servisinizin çalıştığını kontrol edin
2. URL'in doğru olduğundan emin olun (`/health` endpoint'i)
3. UptimeRobot'da "Test" butonuna tıklayarak manuel test yapın
4. Render logs'ları kontrol edin

