# Mobile 2D Production Acceptance Checklist

Bu dosya Paket 5 icin kabul kanitini toplar. Otomatik kontroller her PR/degisiklikte kosulur; fiziksel cihaz kontrolleri 3D ana gelistirme yeniden baslamadan once gercek cihazda tamamlanir.

## Otomatik Kabul

- [x] Astronomi, Gaia tile, offline fallback, render budget, sensor math ve route testleri `npm run test:astronomy` altinda kosar.
- [x] Web build `npm run build` ile basarili uretilir.
- [x] Expo config `npx expo-doctor` ile 18/18 temizdir.
- [x] Web `Yildiz Al`, `Marketplace` ve `StarVault` mobil deep link/QR uretimini ortak `StarLinks` sozlesmesinden alir.
- [x] Mobil `starcalimx://star/{code}`, `starcalimx://hip/{hip}` ve `starcalimx://vault/item/{id}` linkleri route helper ile cozulur.
- [x] Sky Live sensor hedefi planetarium tarzi hareket icin smoothing, olu bolge ve hiz limiti ile sinirlanir.
- [x] Sky Live constellation layer secimi horizontal/sensor modunda kucuk merkez degisimlerinde yeniden secim yapmayacak sekilde stabilize edilir.

## Fiziksel Cihaz Kabul Senaryolari

- [ ] Soguk acilis: uygulama kapaliyken acilir ve `Yildiz Al` ilk ekran crash olmadan gelir.
- [ ] Ana navigasyon: `Yildiz Al` -> `Sky Live` -> `StarVault` -> `Profil` gecisleri crash olmadan tamamlanir.
- [ ] Izin reddi: konum izni reddedildiginde Sky Live manuel harita moduna duser ve kullanici haritayi surukleyebilir.
- [ ] Sensor lifecycle: uygulama arka plana alinir, geri acilir; pusula/sensor abonelikleri tekrar calisir veya manuel fallback gosterir.
- [ ] Tile cache: ilk katalog yuklemesinden sonra ag kapatilir; Sky Live HYG/offline fallback ile bos ekran gostermeden acilir.
- [ ] 10 dakika dayaniklilik: Sky Live sensor modunda 10 dakika acik kalir, FPS/telemetry kritik dusus veya crash uretmez.
- [ ] Motor hissi: sensor modunda yildizlar ve takim yildizi cizgileri elde tutulur telefonda titreme yapmaz; 90 derece donus kontrollu ve okunabilir hizda tamamlanir.
- [ ] Webden mobile gecis: QR veya deep link ile web `Marketplace` detayindan mobil Sky Live hedef yildiza gider.
- [ ] StarVault gecisi: web StarVault onizlemesindeki QR/deep link mobil StarVault home'u acar.

## Gorsel Kalite Kabul (P2 Sirali)

- [ ] Yildiz boyutu magnitude egirisine gore tutarlidir; ayni zoom seviyesinde parlak yildizlar belirgin, zayif yildizlar daha kucuktur.
- [ ] Yildiz rengi BP-RP/spektral tipe gore tutarlidir; mavi-beyaz, beyaz, sarimsi, turuncu-kirmizi dagilimi dogal gorunur.
- [ ] Parlak yildiz halo kurali yalnizca esitigin ustundeki yildizlarda devrededir; tum sahnede asiri parlama yoktur.
- [ ] Deep space gradient tek renk siyah degildir; kamera hareketinde banding veya kirilma olmadan devam eder.
- [ ] Milky Way ve dust katmanlari kalite profiline gore acilir/kapanir; dusuk profilde FPS dusmeden degrade olur.
- [ ] Gece gorusu modunda arka plan/yildiz kontrasti korunur; bilgi kaybi olmadan okunabilirlik devam eder.
- [ ] Referans acilar icin screenshot karsilastirma testleri gecmistir (minimum 3 cihaz sinifi).

## Kanit Notlari

- Otomatik son dogrulama: `npm run test:astronomy`, `npx expo-doctor`, `npm run build`.
- Fiziksel cihaz notlari burada tarih, cihaz modeli, OS surumu ve gozlenen sonuc ile islenecek.

### 2026-07-06 Otomatik Kanit Guncellemesi

- `npm run test:astronomy` -> 88/88 test gecti.
- `npx expo-doctor` -> 18/18 temiz.

### P2 Adim 1 Fiziksel Cihaz Uygulama Sirasi

Asagidaki sira bozulmadan ilerlenir; bir senaryo sonuc kaydi olmadan sonraki senaryoya gecilmez.

1. Soguk acilis
2. Ana navigasyon akisi
3. Izin reddi davranisi
4. Sensor lifecycle (arka plan/one donus)
5. Tile cache + offline fallback
6. 10 dakika dayaniklilik
7. Motor hissi (90 derece donus stabilitesi)
8. Web -> mobile deep link gecisi
9. StarVault deep link gecisi

### Senaryo 1 Test Scripti (Soguk Aclis)

Hedef: Uygulama kapaliyken acildiginda `Yildiz Al` ekraninin crash olmadan, kabul edilebilir surede acilmasi.

1. Telefonu ucak modundan cikar; ag acik olsun.
2. Uygulamayi gorev yoneticisinden tamamen kapat.
3. Kronometreyi baslat ve uygulamayi ikonundan ac.
4. `Yildiz Al` ekraninin gorundugu ani not et.
5. Asagidaki kontrolleri 60 saniye icinde yap:
	- UI donmadan kaydirma/dokunma calisiyor mu?
	- Ilk katalog kartlari veya loading state dogru gorunuyor mu?
	- Kirmizi hata ekrani / white screen / crash var mi?
6. Uygulamayi arka plana alip tekrar one getir; ayni ekrana stabil donus kontrol et.
7. Sonucu `Fiziksel Cihaz Sonuc Kayit Formati` ile kaydet.

Gecme Kriteri:
- Crash yok.
- `Yildiz Al` ekrani aciliyor.
- Ilk acilis suresi kabul edilebilir (hedef: orta cihazda <= 4 sn, dusuk cihazda <= 7 sn).

### Senaryo 2 Test Scripti (Ana Navigasyon Akisi)

Hedef: `Yildiz Al` -> `Sky Live` -> `StarVault` -> `Profil` gecislerinin donma/crash olmadan tamamlanmasi.

1. `Yildiz Al` ekranindan basla ve 5 saniye icinde etkileşim alindigini dogrula.
2. `Sky Live` ekranina gec; harita acildiktan sonra 20 saniye bekle.
3. Haritada 3 farkli noktaya dokunup secim panelinin acildigini dogrula.
4. `StarVault` ekranina gec; liste veya bos durum ekraninin 5 saniye icinde geldigini not et.
5. `Profil` ekranina gec; geri donusle tekrar `Yildiz Al` ekranina don.
6. Bu donguyu en az 2 kez tekrarla.
7. Sonucu `Fiziksel Cihaz Sonuc Kayit Formati` ile kaydet.

Gecme Kriteri:
- Gecislerde crash yok.
- Ana ekranlarda beyaz/siyah donuk ekran yok.
- Her ekranda 5 saniye icinde temel UI etkileşimi alinabiliyor.

### Fiziksel Cihaz Sonuc Kayit Formati

- Tarih:
- Cihaz:
- OS:
- Senaryo:
- Sonuc: Gecti / Kaldi
- Not:
- Issue/Log Linki:
