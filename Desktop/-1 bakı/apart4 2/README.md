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

## Kurulum

1. Repoyu klonlayın:
   ```
   git clone <repo-url>
   ```

2. Bağımlılıkları yükleyin:
   ```
   npm install
   ```

3. Geliştirme sunucusunu başlatın:
   ```
   npm run dev
   ```

4. Uygulamayı tarayıcınızda açın: http://localhost:5173

## Kullanım

1. Uygulamaya erişmek için kullanıcı adı `admin` ve şifre `admin` ile giriş yapın.
2. Dashboard üzerinden sistemin genel durumunu görüntüleyin.
3. Menüden diğer bölümlere erişerek işlemleri yönetin.

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