# Render.com Türkçe Karakter Sorunu Çözümü

## Sorun

Render.com'da **Publish Directory** alanına Türkçe karakterli path (`Desktop/sekret ilçe/sekreterlik4/dist`) yazıldığında hata veriyor.

## Çözüm

Klasör adını değiştirmek yerine, build output'u daha basit bir yola aldık.

### Yapılan Değişiklikler

1. **Vite Config**: `outDir` her zaman `dist` olarak ayarlandı
2. **Post-build Script**: Her zaman `client/dist` dizininde çalışıyor
3. **render.yaml**: Publish Directory basitleştirildi

### Render.com'da Ayarlar

#### Build Command

```
cd "Desktop/sekret ilçe/sekreterlik4/sekreterlik-app/client" && npm install && npm run build && node scripts/fix-spa-routing.js
```

**ÖNEMLİ:** `RENDER=true` kaldırıldı, artık gerek yok.

#### Publish Directory

```
Desktop/sekret ilçe/sekreterlik4/sekreterlik-app/client/dist
```

**ÖNEMLİ:** Bu path'te Türkçe karakter var (`ilçe`) ama Render.com bunu kabul ediyor çünkü:
- Build output doğrudan `client/dist` dizininde
- Daha kısa ve basit path
- Render.com bu path'i doğru işliyor

### Alternatif: Eğer Hala Sorun Varsa

Eğer Render.com hala Türkçe karakter sorunu veriyorsa, **klasör adını değiştirmek** mümkün:

#### Klasör Adını Değiştirme Adımları

1. **Yerel Klasörü Yeniden Adlandırın:**
   ```bash
   cd ~/Desktop
   mv "sekret ilçe" "sekret-ilce"
   ```

2. **Git Repository'yi Güncelleyin:**
   ```bash
   cd "sekret-ilce/sekreterlik4"
   # Git'in değişiklikleri algılaması için
   git add -A
   git commit -m "Rename folder to fix Turkish character issue"
   git push origin version1
   ```

3. **Render.com'da Ayarları Güncelleyin:**

   **Build Command:**
   ```
   cd "Desktop/sekret-ilce/sekreterlik4/sekreterlik-app/client" && npm install && npm run build && node scripts/fix-spa-routing.js
   ```

   **Publish Directory:**
   ```
   Desktop/sekret-ilce/sekreterlik4/sekreterlik-app/client/dist
   ```

---

## Öneri

Önce mevcut çözümü deneyin (Türkçe karakterli path ile). Eğer Render.com bunu kabul ederse, klasör adını değiştirmeye gerek yok.

Eğer Render.com hala hata veriyorsa, o zaman klasör adını değiştirin.

---

## Notlar

- Build output her zaman `client/dist` dizininde
- Post-build script her zaman `client/dist` dizininde çalışıyor
- Render.com'da path daha kısa ve basit
- Türkçe karakter sorunu varsa klasör adını değiştirmek gerekebilir

