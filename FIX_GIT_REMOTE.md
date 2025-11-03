# Git Remote URL Düzeltme

## 🔴 SORUN

Terminal'de şu hatayı alıyorsanız:
```
remote: Repository not found.
fatal: repository 'https://github.com/xawiar/ilce-sekreterlik.git/' not found
```

Bu, git remote URL'inin hala HTTPS kullandığı anlamına gelir.

## ✅ ÇÖZÜM

### 1. Terminal'de Proje Dizinine Gidin

```bash
cd /Users/dayhan/Desktop/sekret\ ilçe/sekreterlik4
```

### 2. Mevcut Remote URL'i Kontrol Edin

```bash
git remote -v
```

### 3. Remote URL'i SSH'a Çevirin

```bash
git remote set-url origin git@github.com-xawiar:xawiar/ilce-sekreterlik.git
```

### 4. Doğrulayın

```bash
git remote -v
```

Şu şekilde görünmeli:
```
origin  git@github.com-xawiar:xawiar/ilce-sekreterlik.git (fetch)
origin  git@github.com-xawiar:xawiar/ilce-sekreterlik.git (push)
```

### 5. SSH Key'i Ekleyin

```bash
ssh-add ~/.ssh/id_ed25519_xawiar
```

### 6. Push Deneyin

```bash
git push origin version1
```

## 📝 NOTLAR

- SSH config dosyası (`~/.ssh/config`) `github.com-xawiar` host'unu içermelidir
- SSH key (`id_ed25519_xawiar`) doğru key olmalıdır
- Repository `xawiar/ilce-sekreterlik` olmalıdır

## ✅ BAŞARI KRİTERLERİ

Push başarılı olduğunda şunu görmelisiniz:
```
To github.com-xawiar:xawiar/ilce-sekreterlik.git
   [commit-hash]..[commit-hash]  version1 -> version1
```

VEYA:
```
Everything up-to-date
```

## 🔧 SORUN GİDERME

### Hata: "Permission denied (publickey)"

**Çözüm:**
```bash
ssh-add ~/.ssh/id_ed25519_xawiar
ssh -T git@github.com-xawiar
```

### Hata: "Repository not found"

**Çözüm:**
1. GitHub'da repository'nin var olduğunu kontrol edin: https://github.com/xawiar/ilce-sekreterlik
2. Repository private ise, SSH key'i GitHub'a eklemeniz gerekir
3. Remote URL'i doğru olduğundan emin olun

### Hata: "Host key verification failed"

**Çözüm:**
```bash
ssh-keyscan -t rsa github.com >> ~/.ssh/known_hosts
```

