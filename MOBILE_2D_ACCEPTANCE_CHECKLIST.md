# Mobile 2D Production Acceptance Checklist

Bu dosya Paket 5 icin kabul kanitini toplar. Otomatik kontroller her PR/degisiklikte kosulur; fiziksel cihaz kontrolleri 3D ana gelistirme yeniden baslamadan once gercek cihazda tamamlanir.

## Otomatik Kabul

- [x] Astronomi, Gaia tile, offline fallback, render budget, sensor math ve route testleri `npm run test:astronomy` altinda kosar.
- [x] Web build `npm run build` ile basarili uretilir.
- [x] Expo config `npx expo-doctor` ile 18/18 temizdir.
- [x] Web `Yildiz Al`, `Marketplace` ve `StarVault` mobil deep link/QR uretimini ortak `StarLinks` sozlesmesinden alir.
- [x] Mobil `starcalimx://star/{code}`, `starcalimx://hip/{hip}` ve `starcalimx://vault/item/{id}` linkleri route helper ile cozulur.

## Fiziksel Cihaz Kabul Senaryolari

- [ ] Soguk acilis: uygulama kapaliyken acilir ve `Yildiz Al` ilk ekran crash olmadan gelir.
- [ ] Ana navigasyon: `Yildiz Al` -> `Sky Live` -> `StarVault` -> `Profil` gecisleri crash olmadan tamamlanir.
- [ ] Izin reddi: konum izni reddedildiginde Sky Live manuel harita moduna duser ve kullanici haritayi surukleyebilir.
- [ ] Sensor lifecycle: uygulama arka plana alinir, geri acilir; pusula/sensor abonelikleri tekrar calisir veya manuel fallback gosterir.
- [ ] Tile cache: ilk katalog yuklemesinden sonra ag kapatilir; Sky Live HYG/offline fallback ile bos ekran gostermeden acilir.
- [ ] 10 dakika dayaniklilik: Sky Live sensor modunda 10 dakika acik kalir, FPS/telemetry kritik dusus veya crash uretmez.
- [ ] Webden mobile gecis: QR veya deep link ile web `Marketplace` detayindan mobil Sky Live hedef yildiza gider.
- [ ] StarVault gecisi: web StarVault onizlemesindeki QR/deep link mobil StarVault home'u acar.

## Kanit Notlari

- Otomatik son dogrulama: `npm run test:astronomy`, `npx expo-doctor`, `npm run build`.
- Fiziksel cihaz notlari burada tarih, cihaz modeli, OS surumu ve gozlenen sonuc ile islenecek.
