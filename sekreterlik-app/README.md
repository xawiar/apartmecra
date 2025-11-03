# Parti Sekreterliği Sistemi

Bu proje, siyasi parti sekreterlerinin toplantı oluşturma, yönetim kurulu üyesi ekleme, yoklama alma ve belge kaydetme gibi işlemleri yapabileceği kapsamlı bir web uygulamasıdır.

## Özellikler

- **Üyeler**: Yönetim kurulu üyelerini kaydedin, listeleyin ve yönetin
- **Toplantılar**: Toplantı oluşturun, yoklama alın ve toplantı notlarını kaydedin
- **Arşiv**: Belgeleri arşivleyin ve geçmiş toplantıları/üyeleri görüntüleyin
- **Görevler**: Parti görevlerini takip edin ve yönetin
- **Ayarlar**: Bölge ve görev tanımlamalarını yönetin

## Teknolojiler

### Frontend
- React
- React Router
- Tailwind CSS
- Vite

### Backend
- Node.js
- Express.js
- JSON dosya tabanlı veri depolama (geliştirme için)

## Kurulum

### Önkoşullar
- Node.js (v14 veya üzeri)
- npm veya yarn

### Kurulum Adımları

1. **Frontend'i başlatma:**
```bash
cd client
npm install
npm run dev
```

2. **Backend'i başlatma:**
```bash
cd server
npm install
npm run dev
```

## API Endpoints

### Üyeler
- `GET /api/members` - Tüm üyeleri getir
- `GET /api/members/:id` - Belirli bir üyeyi getir
- `POST /api/members` - Yeni üye oluştur
- `PUT /api/members/:id` - Üye güncelle
- `DELETE /api/members/:id/archive` - Üye arşivle
- `POST /api/members/import` - Excel'den üye içe aktar
- `GET /api/members/export` - Üyeleri Excel'e aktar

### Toplantılar
- `GET /api/meetings` - Tüm toplantıları getir
- `GET /api/meetings/:id` - Belirli bir toplantıyı getir
- `POST /api/meetings` - Yeni toplantı oluştur
- `PUT /api/meetings/:id` - Toplantı güncelle
- `DELETE /api/meetings/:id/archive` - Toplantı arşivle
- `PUT /api/meetings/:id/attendance` - Yoklama güncelle

### Bölgeler
- `GET /api/regions` - Tüm bölgeleri getir
- `POST /api/regions` - Yeni bölge oluştur
- `PUT /api/regions/:id` - Bölge güncelle
- `DELETE /api/regions/:id` - Bölge sil

### Görevler
- `GET /api/positions` - Tüm görevleri getir
- `POST /api/positions` - Yeni görev oluştur
- `PUT /api/positions/:id` - Görev güncelle
- `DELETE /api/positions/:id` - Görev sil

### Görevler
- `GET /api/tasks` - Tüm görevleri getir
- `GET /api/tasks/:id` - Belirli bir görevi getir
- `POST /api/tasks` - Yeni görev oluştur
- `PUT /api/tasks/:id` - Görev güncelle
- `DELETE /api/tasks/:id` - Görev sil

### Belgeler
- `GET /api/documents` - Tüm belgeleri getir
- `GET /api/documents/:id` - Belirli bir belgeyi getir
- `POST /api/documents` - Yeni belge yükle
- `GET /api/documents/:id/download` - Belge indir
- `DELETE /api/documents/:id` - Belge sil

## Katkıda Bulunma

1. Forklayın
2. Feature branch oluşturun (`git checkout -b feature/AmazingFeature`)
3. Değişikliklerinizi commit edin (`git commit -m 'Add some AmazingFeature'`)
4. Branch'inizi push edin (`git push origin feature/AmazingFeature`)
5. Pull Request açın

## Lisans

Bu proje MIT lisansı altında lisanslanmıştır. Daha fazla bilgi için [LICENSE](LICENSE) dosyasına bakın.

## İletişim

Proje Linki: [https://github.com/your-username/sekreterlik-app](https://github.com/your-username/sekreterlik-app)