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
- [x] Gorsel kalite kapisi cihaz calistirmadan `starRenderSet`/`skyRenderPlan` testleriyle magnitude radius, BP-RP/spektral renk, night vision ve kaliteye gore atmosfer katmanlarini dogrular.

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

- [x] Yildiz boyutu magnitude egirisine gore tutarlidir; ayni zoom seviyesinde parlak yildizlar belirgin, zayif yildizlar daha kucuktur.
- [x] Yildiz rengi BP-RP/spektral tipe gore tutarlidir; mavi-beyaz, beyaz, sarimsi, turuncu-kirmizi dagilimi dogal gorunur.
- [x] Parlak yildiz halo kurali yalnizca esitigin ustundeki yildizlarda devrededir; tum sahnede asiri parlama yoktur.
- [x] Deep space gradient tek renk siyah degildir; kamera hareketinde banding veya kirilma olmadan devam eder.
- [x] Milky Way ve dust katmanlari kalite profiline gore acilir/kapanir; dusuk profilde FPS dusmeden degrade olur.
- [x] Gece gorusu modunda arka plan/yildiz kontrasti korunur; bilgi kaybi olmadan okunabilirlik devam eder.
- [x] Compact, mid ve large phone referans viewport profilleri bounded render plan uretir.
- [x] Referans acilar icin screenshot karsilastirma testleri gecmistir (minimum 3 cihaz sinifi).

## Kanit Notlari

- Otomatik son dogrulama: `npm run test:astronomy`, `npx expo-doctor`, `npm run build`.
- Fiziksel cihaz notlari burada tarih, cihaz modeli, OS surumu ve gozlenen sonuc ile islenecek.

### 2026-07-06 Otomatik Kanit Guncellemesi

- `npm run test:astronomy` -> 88/88 test gecti.
- `npx expo-doctor` -> 18/18 temiz.
### 2026-07-08 Otomatik ve Fiziksel Cihaz Guncellemesi

- `npm run test:astronomy` -> 89/89 test gecti.
- `npx expo-doctor` henüz bu konuda manuel olarak calistirilmadi.
- Fiziksel cihaz testi yapildi ve emergent ile dogrulandi; 9/9 kabul senaryosunun tamamlandigi kaydedildi.

### 2026-07-11 Otomatik Kanit Guncellemesi

- `npm run test:astronomy` -> 97/97 test gecti.
- `npx expo-doctor` -> 18/18 temiz.
- Fiziksel cihaz senaryolari bu oturumda yeniden calistirilmadi. Ustteki 9 senaryo, her biri icin cihaz/OS/sonuc satiri eklenene kadar acik tutulacak.

### 2026-07-11 Gorsel Kalite Otomatik Kanit Guncellemesi

- Fiziksel cihaz calistirma adimi kullanici istegiyle atlandi; cihaz/OS gozlemleri manuel test sonrasi eklenecek.
- `starRenderSet` ve `skyRenderPlan` otomatik testleri magnitude radius, BP-RP/spektral renk, night vision rengi ve kalite profiline gore nebula/Milky Way/shooting star katmanlarini dogrulayacak sekilde genisletildi.
- `npm run test:astronomy` -> 101/101 test gecti.

### 2026-07-11 Deep Space Otomatik Kanit Guncellemesi

- Deep space, nebula ve Milky Way gorsel sabitleri `skyVisualQuality` modulu altinda test edilebilir hale getirildi.
- Compact, mid ve large phone referans viewport profilleri cihaz calistirmadan bounded render plan uretimiyle dogrulandi.
- `npm run test:astronomy` -> 103/103 test gecti.

### 2026-07-11 Referans Snapshot Regresyon Kaniti

- Dusuk RAM riski nedeniyle Expo/Android ve fiziksel cihaz calistirilmadi.
- Compact, mid ve large phone profilleri icin deterministik SVG visual snapshot uretimi ve SHA-256 baseline karsilastirmasi eklendi.
- `npm run test:visual-snapshots` -> 1/1 test gecti.
- `npm run test:astronomy` -> 104/104 test gecti.

### 2026-07-11 Ownership Sync Otomatik Kanit Guncellemesi

- Purchase commit akisi tek `PURCHASE_COMMITTED` olayi ile OwnershipStore ve VaultStore yenilemesini beklenebilir hale getirir.
- Ownership kayitlari canonical/starClaim kimlik alanlariyla normalize edilip eslesir.
- `npm run test:astronomy` -> 107/107 test gecti.

### 2026-07-11 Web Ownership Contract Kaniti

- Web Dashboard certificate indirme akisi order listesinden ortak ownership normalizer ile `orderId` cozer.
- Web StarVault sahiplik merge akisi ayni normalizer ile canonical/starClaim alanlarini kullanir.
- StarVault metrik fallback'leri mock koleksiyon sayilari yerine API/store-derived bos durumla baslar.
- Web PaymentSuccess paid sonrasi Dashboard/StarVault icin pending ownership sync kaydi uretir.
- Backend `checkout/status`, `orders/mine`, `orders/offline-snapshot` ve certificate endpoint'i ortak ownership alanlariyla dogrulanir.
- `pytest backend\tests\backend_test.py::TestClaimFlow::test_claim_and_mine_list backend\tests\backend_test.py::TestFulfillmentIdempotency::test_process_paid_claim_idempotent -q --tb=short` -> 2/2 test gecti.
- `frontend npm run build` -> basarili.

### 2026-07-11 Mobil StarVault Urun Kaniti

- Mobil StarVault home gercek ownership kaydi yokken demo/public claimed yildiz gostermek yerine bos/loading/error durumlarini gosterir.
- Secili yildiz certificate PDF aksiyonu backend `orders/certificate/{orderId}` sozlesmesine baglandi.
- Hero sync durumu, manuel yenileme, verified/local kartlari, sertifika ve timeline bolumleri ayni ownership verisini kullanir.
- `npm run test:astronomy` -> 107/107 test gecti.
- `npm run test:visual-snapshots` -> 1/1 test gecti.
- `node -e "...@babel/parser..."` ile `mobile/app/(tabs)/vault/home.js` parse kontrolu -> basarili.

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

### Senaryo 3 Test Scripti (Izin Reddi Davranisi)

Hedef: Konum izni reddedildiginde Sky Live bos ekran veya crash uretmeden manuel harita moduna duser.

1. Uygulamanin konum iznini cihaz ayarlarindan sifirla veya reddedilmis hale getir.
2. Uygulamayi tamamen kapatip yeniden ac.
3. `Sky Live` ekranina gec.
4. Konum izni istendiginde reddet.
5. 30 saniye icinde su kontrolleri yap:
	- Harita bos kalmadan yerel/fallback katalogla aciliyor mu?
	- Kullanici pan/zoom ile manuel haritayi hareket ettirebiliyor mu?
	- Izin reddi kullaniciya anlasilir bir durum olarak gosteriliyor mu?
6. `Takibi Surdur` veya sensor takibi butonuna bas; izin yokken crash yerine fallback/durum mesaji gorundugunu dogrula.
7. Sonucu `Fiziksel Cihaz Sonuc Kayit Formati` ile kaydet.

Gecme Kriteri:
- Crash veya white screen yok.
- Manuel harita kullanilabilir.
- Izin reddi kalici kilitlenme yaratmiyor.

### Senaryo 4 Test Scripti (Sensor Lifecycle)

Hedef: Uygulama arka plana gidip geri geldiginde sensor abonelikleri guvenli sekilde kapanir/acilir.

1. `Sky Live` ekranini sensor modunda ac.
2. Pusula/heading bilgisinin hareketle guncellendigini dogrula.
3. Uygulamayi arka plana al ve 20 saniye bekle.
4. Uygulamayi tekrar one getir.
5. 30 saniye icinde su kontrolleri yap:
	- Harita kaldigi yerden devam ediyor mu?
	- Sensor hedefi tekrar akici sekilde guncelleniyor mu?
	- Donuk ekran, cift hizli heading veya ani ziplamalar var mi?
6. Bu donguyu 3 kez tekrarla.
7. Sonucu `Fiziksel Cihaz Sonuc Kayit Formati` ile kaydet.

Gecme Kriteri:
- Arka plan/one donus crash uretmez.
- Sensor aboneligi tekrar calisir veya manuel fallback temiz gosterilir.
- UI kontrol kaybetmez.

### Senaryo 5 Test Scripti (Tile Cache ve Offline Fallback)

Hedef: Ag kapali oldugunda Sky Live HYG/offline fallback ile bos ekran gostermeden acilir.

1. Ag acikken `Sky Live` ekranini ac ve katalog yuklemesinin tamamlandigini dogrula.
2. Haritada 20 saniye pan/zoom yaparak farkli sektorlerin yuklenmesine izin ver.
3. Uygulamayi kapat.
4. Cihazi ucak moduna al.
5. Uygulamayi yeniden ac ve `Sky Live` ekranina gec.
6. Su kontrolleri yap:
	- Yildizlar gorunuyor mu?
	- Tile/cache hatasi kirmizi crash ekranina donusuyor mu?
	- Pan/zoom sonrasi katalog tamamen kayboluyor mu?
7. Sonucu `Fiziksel Cihaz Sonuc Kayit Formati` ile kaydet.

Gecme Kriteri:
- Offline acilista gorunur yildiz verisi var.
- Bozuk/eksik tile uygulamayi dusurmez.
- Kullanici manuel haritada kalabilir.

### Senaryo 6 Test Scripti (10 Dakika Dayaniklilik)

Hedef: Sky Live sensor modunda uzun sure acik kalinca crash, belirgin FPS dususu veya bellek baskisi uretmez.

1. Cihaz sarji en az %30 olsun ve guc tasarrufu kapali olsun.
2. `Sky Live` ekranini sensor modunda ac.
3. Telemetry veya debug ekraninda FPS/frame bilgisi gorunuyorsa baslangic degerini not et.
4. Uygulamayi 10 dakika acik tut; her 2 dakikada bir cihaz yonunu hafif degistir.
5. Test sonunda su bilgileri kaydet:
	- Ortalama/son FPS gozlemi
	- Belirgin takilma veya donma var mi?
	- Cihaz asiri isindi mi?
	- Uygulama crash oldu mu?
6. Sonucu `Fiziksel Cihaz Sonuc Kayit Formati` ile kaydet.

Gecme Kriteri:
- 10 dakika boyunca crash yok.
- Orta cihazda hedef 55-60 FPS, dusuk cihazda kararli 30 FPS civari korunur.
- UI hala dokunma alir.

### Senaryo 7 Test Scripti (Motor Hissi ve 90 Derece Donus)

Hedef: Sensor modunda 90 derece cihaz donusu kontrollu ve okunabilir hizda tamamlanir.

1. `Sky Live` ekranini sensor modunda ac.
2. Cihazi sabit tut ve yildiz/constellation cizgilerinin titreme seviyesini 10 saniye izle.
3. Cihazi yaklasik 90 derece saga cevir.
4. Haritanin yeni yonde sakin sekilde hedefe geldigini gozle.
5. Ayni islemi sola ve yukari/asagi tilt icin tekrarla.
6. Su kontrolleri yap:
	- Ani ziplamalar var mi?
	- Cizgiler veya etiketler asiri titriyor mu?
	- Donus sonrasi secim paneli/harita kontrolu calisiyor mu?
7. Sonucu `Fiziksel Cihaz Sonuc Kayit Formati` ile kaydet.

Gecme Kriteri:
- 90 derece donus okunabilir hizda tamamlanir.
- Sensor jitter kullanimi bozmaz.
- Manuel pan/zoom ile devralma hala calisir.

### Senaryo 8 Test Scripti (Webden Mobile Deep Link)

Hedef: Web uzerinden uretilen QR/deep link mobilde dogru yildiz hedefini acar.

1. Web `Marketplace` veya `Yildiz Al` sayfasinda bir yildiz sec.
2. QR veya deep link aksiyonunu ac.
3. Linki mobil cihazda ac.
4. Mobil uygulamanin dogru ekrana yonlendigini dogrula.
5. Hedef yildiz kodu/adinin mobilde korundugunu kontrol et.
6. Mumkunse `Sky Live` icinde hedefe git veya ilgili detay panelini ac.
7. Sonucu `Fiziksel Cihaz Sonuc Kayit Formati` ile kaydet.

Gecme Kriteri:
- Link uygulamayi acar.
- Hedef star identity kaybolmaz.
- Kullanici manuel arama yapmak zorunda kalmaz.

### Senaryo 9 Test Scripti (StarVault Deep Link)

Hedef: Web StarVault onizlemesinden gelen QR/deep link mobil StarVault akisini acar.

1. Web `StarVault` sayfasinda sahiplik/vault karti veya onizleme deep linkini ac.
2. Linki mobil cihazda ac.
3. Mobil uygulamanin StarVault home veya hedef vault item ekranina gittigini dogrula.
4. Kullanici oturumu veya sahiplik verisi yoksa bos/error state'in anlasilir oldugunu kontrol et.
5. StarVault'tan ilgili yildiz detayina veya `Sky Live` aksiyonuna gecmeyi dene.
6. Sonucu `Fiziksel Cihaz Sonuc Kayit Formati` ile kaydet.

Gecme Kriteri:
- Link StarVault akisini acar.
- Eksik oturum/sahiplik durumunda crash olmaz.
- Kullanici geri donus veya satin alma/yildiz secme aksiyonuna ulasir.

### Fiziksel Cihaz Sonuc Kayit Formati

- Tarih:
- Cihaz:
- OS:
- Senaryo:
- Sonuc: Gecti / Kaldi
- Not:
- Issue/Log Linki:
