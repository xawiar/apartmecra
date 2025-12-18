# Yanlış Oluşturulan Kullanıcıları Temizleme

## Sorun
Site ve firma oluşturulurken Cloud Function yanlış ID (Firestore document ID) kullanarak kullanıcı oluşturuyordu. Bu, geçersiz email adresleriyle kullanıcıların oluşmasına neden oldu.

## Çözüm
1. ✅ Cloud Function düzeltildi - artık custom ID kullanıyor
2. ✅ Cloud Function deploy edildi
3. ⚠️ Mevcut yanlış kullanıcıları temizlemeniz gerekiyor

## Temizleme Yöntemleri

### Yöntem 1: Firebase Console'dan Manuel Silme (Önerilen)
1. Firebase Console'a gidin: https://console.firebase.google.com/project/apartmecra-elz/authentication/users
2. Her yanlış kullanıcıyı tek tek seçip silin
3. Yanlış kullanıcılar:
   - `jzq5loraz2vadsk8z97y@company.local`
   - `vsofmocc82vrefxkef8h@company.local`
   - `i8vjw7aq6tj2aq5acwyx@site.local`
   - `e5irddydbsj09pkpxkdf@site.local`
   - `lr3qrsrumokfeaz3nl9a@company.local`
   - `7jwhfwnr9q8gw4jx7qss@site.local`
   - Ve diğer benzer uzun ID'li kullanıcılar

### Yöntem 2: Script ile Otomatik Temizleme
1. Firebase Console'dan Service Account Key indirin:
   - Firebase Console > Project Settings > Service Accounts
   - "Generate new private key" butonuna tıklayın
   - İndirilen JSON dosyasını proje kök dizinine `serviceAccountKey.json` olarak kaydedin
   
2. Script'i çalıştırın:
   ```bash
   node cleanup-duplicate-users.cjs
   ```

   Script:
   - Tüm kullanıcıları kontrol eder
   - Geçerli site/firma ID'lerini kontrol eder
   - Geçersiz kullanıcıları otomatik olarak siler

### Yöntem 3: Firebase CLI ile Toplu Silme
Firebase CLI ile de yapabilirsiniz, ancak bu daha karmaşık.

## Gelecek İçin
Artık yeni site/firma oluşturulduğunda:
- ✅ Cloud Function custom ID kullanıyor
- ✅ Duplicate kontrolü yapıyor
- ✅ Sadece doğru kullanıcılar oluşturuluyor

## Kontrol
Temizleme sonrası Firebase Auth'da sadece şu kullanıcılar olmalı:
- `HAZ1@site.local` (veya sitenizin gerçek ID'si)
- `BIL1@company.local` (veya firmanızın gerçek ID'si)
- `admin@apartmecra.com`
- Diğer personel kullanıcıları (varsa)

