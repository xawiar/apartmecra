# Site Ödeme Takip Sistemi - Analiz ve Çözüm

## Mevcut Durum Analizi

### Sorunlar:

1. **Transaction Matching Yetersiz:**
   - `calculateSitePayments` fonksiyonu transaction'ları kontrol ediyor ama tarih aralığına göre spesifik matching yapmıyor
   - Aynı anlaşma için farklı tarih aralıklarında ödemeler yapıldığında karışıklık oluyor
   - Transaction'da tarih aralığı bilgisi (dateFrom, dateTo) yok

2. **Ödeme Yapıldıktan Sonra:**
   - `handlePaySitePayment` sadece `site.pendingPayments` array'inden kaldırıyor
   - Ama `calculatePendingPayments` transaction'lara bakarak yeniden hesaplıyor
   - Transaction matching yeterince spesifik olmadığı için ödeme yapıldıktan sonra bile tekrar görünebilir

3. **Site Dashboard'da:**
   - Gelecek ödemeler: `calculatePendingPayments` kullanılıyor (transaction'lara bakıyor)
   - Geçmiş ödemeler: Transaction'lardan alınıyor
   - Ama transaction matching yeterince spesifik değilse, ödenmiş ödemeler gelecek ödemelerde de görünebilir

## Çözüm Stratejisi

### 1. Transaction'a Tarih Aralığı Bilgisi Ekleme

**Problem:** Transaction'da hangi tarih aralığı için ödeme yapıldığı bilgisi yok.

**Çözüm:**
- Transaction oluştururken `paymentPeriod` field'ı ekle:
  ```javascript
  {
    dateFrom: sitePaymentFilter.dateFrom,
    dateTo: sitePaymentFilter.dateTo
  }
  ```

### 2. Transaction Matching'i İyileştirme

**Problem:** Transaction matching sadece site ve anlaşma ID'sine bakıyor, tarih aralığına bakmıyor.

**Çözüm:**
- `calculateSitePayments` ve `calculatePendingPayments` fonksiyonlarında:
  - Transaction'ın `paymentPeriod` field'ını kontrol et
  - Seçilen tarih aralığı ile transaction'ın tarih aralığını karşılaştır
  - Sadece eşleşen transaction'ları dikkate al

### 3. Ödeme Yapıldıktan Sonra State Güncelleme

**Problem:** Ödeme yapıldıktan sonra `calculateSitePayments` tekrar çağrıldığında ödenmiş ödemeler tekrar görünüyor.

**Çözüm:**
- Transaction oluşturulduktan sonra `transactions` state'ini güncelle
- `calculateSitePayments` fonksiyonu güncel transaction'ları kullanacak
- Ödenmiş ödemeler otomatik olarak filtrelenecek

### 4. Site Dashboard'da Gelecek/Geçmiş Ödemeler Ayrımı

**Problem:** Gelecek ödemeler ve geçmiş ödemeler doğru ayrılmıyor.

**Çözüm:**
- Gelecek ödemeler: `calculatePendingPayments` kullan (transaction'lara bakarak ödenmemiş olanları göster)
- Geçmiş ödemeler: Transaction'lardan al, sadece `type === 'expense'` ve `source.includes('Site Ödemesi')` olanları göster
- Toplam kazanç: Geçmiş ödemelerin toplamını göster

## Uygulama Adımları

1. ✅ Transaction oluştururken `paymentPeriod` field'ı ekle
2. ✅ `calculateSitePayments` fonksiyonunda tarih aralığına göre matching yap
3. ✅ `calculatePendingPayments` fonksiyonunda tarih aralığına göre matching yap
4. ✅ Site Dashboard'da geçmiş ödemeleri doğru göster
5. ✅ Cashier'da ödenmiş ödemeleri "Ödendi" olarak işaretle

