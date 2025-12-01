# Kurumsal Yönetim Sistemi

Bu proje, bir kurumsal yönetim sistemi için geliştirilmiş bir web uygulamasıdır. Sistem, siteler, firmalar, anlaşmalar, kasa işlemleri, ortak payları ve arşiv yönetimi gibi özellikleri içermektedir.

## Özellikler

- Kullanıcı girişi ve kimlik doğrulama
- Dashboard ile istatistiksel özet
- Site yönetimi (ekleme, düzenleme, arşivleme)
- Firma yönetimi (ekleme, düzenleme, arşivleme)
- Anlaşma yönetimi (ekleme, ödeme alma, arşivleme)
- Kasa işlemleri (gelir/gider ekleme, filtreleme)
- Ortak payları yönetimi (ekleme, düzenleme, ödeme dağıtımı)
- Arşivleme sistemi (siteler, firmalar, anlaşmalar)
- Ayarlar (şifre değiştirme, sistem ayarları)

## Teknolojiler

- React
- React Router
- Tailwind CSS
- Vite
- JSON Server (simüle edilmiş backend)

## Kurulum

1. Repoyu klonlayın:
   ```
   git clone <repo-url>
   ```

2. Bağımlılıkları yükleyin:
   ```
   npm install
   ```

## Çalıştırma

Uygulamayı çalıştırmak için iki ayrı terminal penceresi gereklidir:

1. İlk terminalde frontend geliştirme sunucusunu başlatın:
   ```
   npm run dev
   ```

2. İkinci terminalde backend simülasyon sunucusunu başlatın:
   ```
   npm run server
   ```

3. Uygulamayı tarayıcınızda açın: http://localhost:5173

## Kullanım

1. Uygulamaya erişmek için kullanıcı adı `admin` ve şifre `admin` ile giriş yapın.
2. Dashboard üzerinden sistemin genel durumunu görüntüleyin.
3. Menüden diğer bölümlere erişerek işlemleri yönetin.

## API Endpoints

Backend simülasyonu için aşağıdaki endpoint'ler kullanılabilir:

- `http://localhost:3001/users` - Kullanıcılar
- `http://localhost:3001/sites` - Siteler
- `http://localhost:3001/companies` - Firmalar
- `http://localhost:3001/agreements` - Anlaşmalar
- `http://localhost:3001/transactions` - İşlemler
- `http://localhost:3001/partners` - Ortaklar
- `http://localhost:3001/archivedSites` - Arşivlenmiş siteler
- `http://localhost:3001/archivedCompanies` - Arşivlenmiş firmalar
- `http://localhost:3001/archivedAgreements` - Arşivlenmiş anlaşmalar

## Dosya Yapısı

```
src/
├── components/          # Paylaşılan bileşenler
├── pages/               # Sayfa bileşenleri
├── services/            # API servisleri
├── utils/               # Yardımcı fonksiyonlar
├── App.jsx             # Ana uygulama bileşeni
├── main.jsx            # Uygulama giriş noktası
└── index.css           # Global stiller
```

## Geliştirme

- Bileşenler `src/components` dizininde bulunur
- Sayfalar `src/pages` dizininde bulunur
- Stil dosyaları `src/index.css` dosyasındadır

## Katkıda Bulunma

1. Fork edin
2. Yeni bir branch oluşturun (`git checkout -b feature/yeni-ozellik`)
3. Değişikliklerinizi commit edin (`git commit -am 'Yeni özellik ekle'`)
4. Branch'inizi push edin (`git push origin feature/yeni-ozellik`)
5. Yeni bir Pull Request oluşturun

## Lisans

Bu proje MIT lisansı altında lisanslanmıştır.