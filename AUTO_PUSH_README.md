# 🚀 Otomatik GitHub Push Kılavuzu

Bu projede yapılan tüm değişikliklerin otomatik olarak GitHub'a push edilmesi için kurulum yapılmıştır.

## 📋 Kurulum (İlk Kez)

```bash
# Otomatik push script'lerini çalıştırılabilir yap
chmod +x scripts/auto-push.sh
chmod +x setup-auto-push.sh

# Setup script'ini çalıştır (eğer git hook istiyorsanız)
bash setup-auto-push.sh
```

## ✅ Kullanım

### 1. Manuel Push

Değişiklikleri commit ettikten sonra push yapmak için:

```bash
npm run push
```

### 2. Otomatik Commit + Push

Tüm değişiklikleri otomatik commit edip push yapmak için:

```bash
npm run commit-and-push
```

Bu komut:
- Tüm değişiklikleri stage'ler (`git add -A`)
- Otomatik commit yapar (tarih-saat ile)
- GitHub'a push eder

### 3. Git Hook ile Tam Otomatik (Opsiyonel)

Eğer her commit sonrası otomatik push istiyorsanız:

```bash
bash setup-auto-push.sh
```

Bu script `.git/hooks/post-commit` hook'unu kurar ve her commit sonrası otomatik push yapar.

**⚠️ Uyarı:** Bu özellik tüm commit'lerde çalışır. Dikkatli kullanın!

## 📝 Script Detayları

### `scripts/auto-push.sh`
- Mevcut branch'i otomatik tespit eder
- GitHub'a push yapar
- Hata durumunda bilgilendirme yapar

### `scripts/post-commit.sh`
- Git post-commit hook için script
- Commit sonrası otomatik olarak `auto-push.sh`'i çağırır

## 🔧 Sorun Giderme

### Push Başarısız Olursa

```bash
# Manuel olarak push yapmayı deneyin
git push origin version1

# Ya da npm script ile
npm run push
```

### Git Hook Çalışmıyorsa

```bash
# Hook'u yeniden kur
bash setup-auto-push.sh

# Hook'un çalıştırılabilir olduğundan emin ol
chmod +x .git/hooks/post-commit
```

### Branch Bilgisi Bulunamıyorsa

```bash
# Hangi branch'te olduğunuzu kontrol edin
git branch --show-current

# Branch oluşturun (gerekirse)
git checkout -b version1
```

## 💡 Öneriler

1. **Değişiklik yaptıktan sonra:**
   ```bash
   npm run commit-and-push
   ```

2. **Sadece push yapmak için:**
   ```bash
   npm run push
   ```

3. **Manuel kontrol için:**
   ```bash
   git status
   git add -A
   git commit -m "Mesajınız"
   npm run push
   ```

## 📌 Notlar

- Script'ler otomatik olarak mevcut branch'i tespit eder
- Sadece `origin` remote'una push yapar
- Hata durumunda script çalışmayı durdurur ve hata mesajı gösterir
- Tüm script'ler bash ile çalışır (macOS/Linux)

## ✅ Başarı Kontrolü

Push başarılı olduğunda terminal'de şunu görmelisiniz:

```
✅ Başarıyla GitHub'a push edildi!
🔗 Branch: version1
```

## 🔗 GitHub Repository

- **Repository:** https://github.com/xawiar/ilce-sekreterlik
- **Branch:** version1
- **Remote:** origin

