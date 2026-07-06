# StarClaim Unified Execution Plan

Bu dosya, mobil 2D/3D altyapi planini, web `Yildiz Al` / `Marketplace` / `StarVault` akislarini ve StarVault MVP planini tek uygulama sirasinda toplar. Ana ilke: urun ekranlari yalnizca calisan deneyimi gosterecek; plan, teknik karar ve backlog bu dosyada yasayacak.

## 0. Urun Karari

- Mobil uygulama ana deneyimdir: satin alma, sahiplik, Sky Live, StarVault ve ileride 3D yolculuk burada tamamlanir.
- Web vitrin ve yonlendirme katmanidir: `Yildiz Al`, `Marketplace` ve `StarVault` kullaniciyi dogru veri ve hesap akisina baglar; mobilde devam edebilmesi icin QR/deep link uretir.
- 3D gelistirme, 2D Sky Live ve astronomik veri katmani uretim guvenine ulasmadan tekrar ana is kalemi olmayacak.
- Tek yildiz kimligi ve tek sahiplik kaynagi kullanilacak. Web, mobil, backend ve gelecekte blockchain ayni `StarIdentity` / `OwnershipRecord` sozlesmesini tuketecek.

## 1. Mutlaka Kurulacak Ortak Altyapilar

### 1.1 Platform Veri Sozlesmesi

Kurulacak ana modeller:

```text
StarIdentity
StarTarget
OwnershipRecord
MarketplaceListing
VaultItem
CertificateRecord
UserSession
WalletLink
```

Kurallar:

- `StarIdentity` yildiz verisinin tek normal formu olacak: `id`, `source`, `sourceId`, `hip`, `hd`, `gaiaSourceId`, `starClaimCode`, `ra`, `dec`, `distanceParsec`, `magnitude`, `spectralType`, `epoch`.
- `StarTarget` ekranlar arasi gecis icin kullanilacak: `type`, `value`, `starId`, `starClaimCode`, `source`.
- `OwnershipRecord` satin alma, sertifika, vault ve marketplace icin tek sahiplik ozeti olacak.
- AsyncStorage yalnizca cache ve offline snapshot icin kullanilacak; ana dogruluk backend sahiplik kaydindan gelecek.

### 1.2 Repository ve Store Katmani

Mobil ve web tarafinda UI dogrudan API, fixture, AsyncStorage veya katalog dosyasi okumayacak.

```text
StarRepository
OwnershipRepository
MarketplaceRepository
VaultRepository
CertificateRepository
```

Uygulama storelari:

```text
CatalogStore
OwnershipStore
VaultStore
MarketplaceStore
SessionStore
SkyRuntimeStore
```

Beklenen fayda:

- `Yildiz Al`, `Marketplace`, `StarVault`, `Yildizlarim`, `Sky Live` ayni yildiz ve sahiplik bilgisini gorur.
- Kartlar, detay ekranlari ve aksiyon butonlari is mantigi tasimaz.
- Offline fallback, loading, error ve retry davranislari tek yerden yonetilir.

### 1.3 API Gateway ve Sync Katmani

Backend endpointleri tek semantik altinda toplanacak:

```text
GET  /api/stars
GET  /api/stars/{starId}
GET  /api/stars/resolve?code=&hip=&hd=&gaia=
GET  /api/ownership/mine
POST /api/orders
GET  /api/orders/{orderId}
GET  /api/orders/certificate/{orderId}
GET  /api/marketplace/listings
POST /api/marketplace/list
POST /api/marketplace/buy
GET  /api/vault/items
POST /api/vault/items
POST /api/vault/upload
POST /api/sync/mobile-snapshot
```

Sync kurallari:

- Web satin alma tamamlaninca backend `OwnershipRecord` olusturur.
- Mobil uygulama acilis, one donus ve manuel yenilemede `/api/sync/mobile-snapshot` ile sahiplik, sertifika, vault ve marketplace ozetini alir.
- Snapshot SHA-256 ile dogrulanir; bozuk veya eksik snapshot eski saglam snapshot'i silmez.
- Conflict durumunda backend tarihi ve siparis durumu kazanir.

### 1.4 Navigation ve Deep Link Tasarimi

Tek hedef modeli:

```text
starclaim://star/{starClaimCode}
starclaim://stars/{starId}
starclaim://hip/{hipId}
starclaim://marketplace/listing/{listingId}
starclaim://vault/item/{vaultItemId}
starclaim://certificate/{certificateId}
```

Mobil rota eslesmeleri:

```text
/(tabs)/claim                 -> Yildiz Al
/(tabs)/catalog               -> Katalog detayli liste
/(tabs)/explore/stardetail    -> Yildiz detay
/(tabs)/sky                   -> Sky Live
/(tabs)/vault/home            -> StarVault
/(tabs)/vault/purchases       -> Satin alma gecmisi
/(tabs)/vault/newmessage      -> Vault mesaji
/(tabs)/profile               -> Profil
```

Web rota eslesmeleri:

```text
/stars                        -> Yildiz Al / katalog
/marketplace                  -> Marketplace
/vault                        -> StarVault
/star/:starId                 -> Public star / detay
/payment/success              -> Siparis tamamlama
```

Kurallar:

- Ekranlar birbirine string path dagitmayacak; `routeBuilder` / `linkBuilder` yardimcilari kullanilacak.
- Web QR kodu veya deep link urettiginde ayni `StarTarget` payload'unu encode edecek.
- Mobil link acildiginda once hedef resolve edilir, sonra ilgili ekrana gidilir.

### 1.5 Hata Guvenligi ve Test Altyapisi

Zorunlu altyapilar:

- Render error boundary: Skia, GL ve agir katalog ekranlari icin ayri hata siniri.
- Network retry policy: idempotent GET isteklerinde otomatik retry, POST isteklerinde siparis idempotency key.
- Offline mode: gomulu HYG cekirdek katalog ve son saglam sahiplik snapshot'i.
- Diagnostics: ilk frame, FPS, bellek baskisi, katalog kayit sayisi, tile cache durumu.
- E2E smoke: uygulama acilir, `Yildiz Al`, `Sky Live`, `StarVault`, `Profil` gezilir.
- Unit/regression: astronomi, katalog tile, star identity, ownership snapshot, marketplace action ve vault item testleri.

## 2. Mobil Oncelik Sirasi

### P0 - Calisma Guveni ve Baglanti Temizligi

- Expo Router icindeki eski tekil ekranlar ile yeni tab ekranlari ayrilacak; aktif urun rotalari tek kaynaktan yonetilecek.
- `mobile/app/vault.js` gibi eski cockpit/decrypt ekranlari ya `legacy` altina alinacak ya da yeni StarVault akisina yonlendirilecek.
- Tab bar, profil, yildiz detayi, satin alma modal ve vault ekranlari ayni route builder ile baglanacak.
- Import ve path karmasasi icin `src/platform` altinda mobil repository/store katmani kurulacak.
- `expo-doctor`, `npm run test:astronomy` ve Android smoke testi temel kabul kapisi olacak.

### P1 - Sahiplik ve Satin Alma Akisi

- `PurchaseModal` satin alma sonucunda yalnizca lokal mesaj eklemeyecek; backend siparis ve sahiplik kaydi olusturacak.
- Siparis sonucu `OwnershipStore` ve `VaultStore` tarafina tek sync olayi olarak dusecek.
- `Yildiz Al` -> satin alma -> sertifika -> StarVault -> Sky Live acisi calisir hale gelecek.
- Mobil StarVault istatistikleri mock sayi yerine `OwnershipSnapshot` ve `VaultItem` verisinden hesaplanacak.

### P2 - 2D Sky Live Uretim Kapisi

- Gaia/HIP binary tile cache icin LRU, bozuk tile kurtarma ve versiyon yukseltme testleri kapatilacak.
- Pan, zoom, secim, etiket, takim yildizi ve ufuk filtreleri kanonik kimlikle dogrulanacak.
- Izin reddi, offline katalog, bozuk cache ve uygulama background/foreground senaryolari fiziksel cihazda test edilecek.
- Dusuk/orta/yuksek Android profillerinde 10 dakikalik FPS, isi, bellek ve crash kaydi alinacak.
- Sky Live motoru planetarium uygulamalari gibi davranacak: sensorde hiz siniri, olu bolge, kisa-yol RA easing, layer stabilizasyonu ve fiziksel cihaz kalibrasyon kabul testleri zorunlu olacak.
- Celestia/Stellarium benzeri uygulamalar referans alinabilir; GPL lisansli kod veya veri dogrudan kopyalanmayacak. Gaia, HYG, IAU ve lisansi uyumlu acik kataloglar platform veri sozlesmesine normalize edilerek kullanilacak.

#### P2.1 - Zorunlu Yurutme Sirasi (Kalite Sirasiyla)

Asagidaki siralama bozulmadan ilerlenir. Bir adim kabul kaniti olmadan sonraki adim acilmaz.

Durum (2026-07-06):
- Otomatik kapilar yeniden dogrulandi (`test:astronomy` ve `expo-doctor` temiz).
- Aktif is kalemi: 1. adim fiziksel cihaz kabul senaryolari.

1. Uretim guveni ve cihaz kabul kapisi
  - Fiziksel cihaz senaryolari, lifecycle, tile fallback, 10 dakika dayaniklilik.
  - Telemetry kayitlari: FPS, frame time, bellek, isi, crash.
2. Yildiz fotometrisi ve gorunurluk kurallari
  - Magnitude -> boyut egirisi dogrulamasi.
  - BP-RP/spektral tip -> renk esleme dogrulamasi.
  - Parlak yildiz halo esigi ve zoom tabanli etiket gorunurlugu.
3. Arka plan katmanlari
  - Deep space gradient, Milky Way bandi, dust/nebula katmani.
  - Gece gorusu ve kalite profilleriyle tutarli davranis.
4. Post-process ve ton yonetimi
  - Bloom ve ton esleme sadece performans butcesi icinde acilir.
  - Dusuk cihaz profilinde etkiler degrade edilerek kapatilabilir.
5. Gorsel regresyon ve yayin kapisi
  - Referans ekran goruntusu karsilastirma seti.
  - P2 kabul raporu olmadan P5 (3D Voyage) yeniden baslatilmaz.

#### P2.2 - Eklenecek Yeni Backlog Maddeleri

- [ ] Sky telemetry paneli: FPS, frame time, bellek, isi, dropped frame, sensor jitter.
- [ ] Yildiz boyut/renk/halo spec dokumani: magnitude ve BP-RP tabanli tek sozlesme.
- [ ] Arka plan spec dokumani: gradient + Milky Way + dust katmanlarinin kalite profili kurallari.
- [ ] Gorsel regresyon testleri: secilen referans acilarda screenshot karsilastirma.
- [ ] Fiziksel cihaz kanit kaydi: cihaz modeli, OS, test suresi, sonuc, issue linki.

### P3 - StarVault Mobil Urunlestirme

StarVault artik plan gostermeyecek; calisan urun merkezi olacak.

Ekran bolumleri:

- Hero: sahip yildiz, sertifika, vault item sayilari.
- Kisa yollar: `Yildiz Al`, `Sertifikalar`, `Hikaye Ekle`, `Satin Almalar`, `Guvenlik`, `Profil`.
- Vault listesi: mesajlar, sertifikalar ve satin alma snapshot'i tek listede veya tabli gorunumde.
- Guvenlik: biyometrik kilit, zaman kilidi, yedekleme/sync durumu.
- Empty state: kullaniciyi satin almaya veya ilk mesajini olusturmaya goturur.

### P4 - Marketplace Mobil Entegrasyonu

- Marketplace web ile ayni `MarketplaceListing` sozlesmesini kullanacak.
- Mobilde ilk asama listeleme/inceleme; satin alma backend order akisina baglaninca aktif olacak.
- Sahip olunan yildiz kartindan `Marketplace'te Listele` aksiyonu ayni action generator'dan gelecek.

### P5 - 3D Voyage Yeniden Baslatma

- Sadece P0-P3 kabul kapilari kapandiktan sonra.
- Eski Three.js prototipi referans kalacak; yeni 3D motor kanonik `StarTarget`, tile katalog ve ownership marker verisini kullanacak.
- Floating-origin, gercek sektor komsulugu, GL dispose ve cihaz kalite profili ilk gunden zorunlu olacak.

## 3. Web Baglanti Plani

### 3.1 Yildiz Al

- `StarRepository` ve `CatalogStore` web katalog icin tek kaynak olacak.
- Kartlar `StarCard` / `StarAssetImage` / `StarActionBar` ile platform kontratina baglanacak.
- Satin alma CTA'si backend order yaratacak; basarili odeme sonrasi `OwnershipRecord` uretilecek.
- Mobil devam icin `Open in Mobile`, QR ve deep link ayni `StarTarget` payload'unu kullanacak.

### 3.2 Marketplace

- Marketplace kartlari yildiz verisini tekrar tasimayacak; listing sadece `starId`, fiyat, durum ve seller bilgisini tutacak.
- Listing detayinda star bilgisi `StarRepository.getStarById` ile cozulur.
- Web ve mobil ayni `MarketplaceAction` listesini kullanir: `viewDetail`, `buy`, `list`, `unlist`, `openVault`, `share`.

### 3.3 StarVault Web

- StarVault web, mobildeki StarVault ile ayni sahiplik ve vault snapshot'ini tuketecek.
- Cuzdan durumu, Google oturumu ve backend hesap eslesmesi ayri state olarak tutulacak.
- On-chain islemler gorunur olsa bile backend sahiplik kaydiyla eslesmeden kalici sahiplik gostermeyecek.
- Web StarVault'tan mobil StarVault'a QR/deep link: `starclaim://vault/item/{vaultItemId}` veya `starclaim://stars/{starId}`.

## 4. Web-Mobil Ortak Akislar

### Akis A - Web'de Yildiz Sec, Mobilde Devam Et

```text
Web /stars
  -> StarTarget olustur
  -> QR/deep link
  -> Mobil resolve
  -> Star detail veya satin alma
  -> Order
  -> Ownership snapshot
  -> StarVault + Sky Live
```

### Akis B - Web Marketplace Satin Alma

```text
Web /marketplace
  -> Listing sec
  -> Backend order
  -> Payment success
  -> OwnershipRecord
  -> CertificateRecord
  -> Mobil sync
  -> StarVault / Satin Almalar
```

### Akis C - Mobil Satin Alma Sonrasi StarVault

```text
Mobil Yildiz Al
  -> PurchaseModal
  -> Backend order
  -> OwnershipStore.refresh()
  -> VaultStore.refresh()
  -> StarVault home
  -> Sky Live'da sahiplik isareti
```

### Akis D - StarVault Mesaj ve Sertifika

```text
Owned star
  -> Vault item olustur
  -> Local encrypted draft
  -> Backend vault upload
  -> Certificate link
  -> Web/Mobil snapshot
```

## 5. Eksik veya Hatali Dosyalar Icin Duzeltme Stratejisi

- Mojibake/encoding gorunen mobil dosyalar tek tek UTF-8 olarak temizlenecek; once aktif ekranlar, sonra legacy dosyalar.
- Eski rota dosyalari kullanici akisini bozuyorsa redirect'e cevrilecek.
- Mock sayilar ve sabit placeholder metinler veri store'undan hesaplanan degerlerle degistirilecek.
- UI bilesenleri API cagirmayacak; repository/store uzerinden veri alacak.
- Her refactor paketinde bir smoke testi ve ilgili unit testi calistirilacak.

## 6. Uygulama Paketleri

### Paket 1 - Plan ve Rota Temizligi

- [x] Bu dosya ana plan olarak kabul edilir.
- [x] Mobil StarVault icindeki plan/placeholder dili kaldirilir.
- [x] Eski vault rotalari yeni StarVault home'a kontrollu yonlendirilir.
- [x] Route builder taslagi eklenir.
- [x] Tab bar, StarVault, Claim, Profile, My Stars, Explore ve deep link gecisleri route builder'a baglanir.
- [ ] Eski decrypt/vault araci gerekiyorsa `legacy` altinda urun akisindan ayrilmis bir arac olarak yeniden konumlandirilir.

### Paket 2 - Mobil Platform Store

- [x] `mobile/src/platform/ownership`, `vault`, `marketplace`, `navigation` klasorleri olusturulur.
- [x] `OwnershipRecord`, `VaultItem` ve `MarketplaceListing` normalizer'lari eklenir.
- [x] `OwnershipStore`, `VaultStore` ve `MarketplaceStore` kurulur.
- [x] StarVault istatistikleri gercek snapshot ve local vault mesajlarindan hesaplanir.
- [x] Claim, Profile, My Stars, Vault Purchases ve Marketplace ekranlari mobil store katmanina baglanir.
- [ ] `mobile/src/platform/stars` ve `CatalogStore` mobil katalog refactor paketi olarak ayrica ele alinacak.

### Paket 3 - Satin Alma ve StarVault Sync

- [x] `PurchaseModal` backend order ve ownership sync akisi ile sertlestirilir.
- [x] Basarili satin alma StarVault ve Sky Live sahiplik isaretini otomatik gunceller.
- [x] Sertifika indirme/gosterme mobil ve web icin ayni endpoint'e baglanir.

### Paket 4 - Web Baglanti Sertlestirme

- [x] `Yildiz Al`, `Marketplace`, `StarVault` ortak `StarRepository`, `StarAssetManager`, action helper ve shell bilesenlerine baglanir.
- [x] Web QR/deep link uretimi eklenir.
- [x] Marketplace listing ve StarVault card'lari ortak yildiz/veri sozlesmesini kullanir.

### Paket 5 - 2D Uretim Kabul Kapisi

- [x] Route/deep link, tile cache, offline fallback ve sensor math otomatik kabul testlerine baglanir.
- [x] Kabul kaniti `MOBILE_2D_ACCEPTANCE_CHECKLIST.md` dokumanina islenir.
- [x] Sky Live sensor hareketi icin planetarium tarzi smoothing, hiz limiti, RA kisa-yol easing ve constellation layer stabilizasyonu eklenir.
- [ ] Izin reddi, sensor lifecycle ve 10 dakikalik cihaz testi fiziksel cihazda tamamlanir.

### Paket 6 - 3D Yeniden Kurulum

- Kanonik veri ve tile sistemi ustune yeni 3D render mimarisi kurulur.
- Eski prototipten yalnizca dogrulanmis fikirler tasinir.

## 7. Kabul Kriterleri

- Mobil uygulama soguk acilista crash olmadan `Yildiz Al`, `Sky Live`, `StarVault`, `Profil` ekranlarini acar.
- Satin alma sonrasi ayni yildiz web, mobil, StarVault, sertifika ve Sky Live'da ayni kimlikle gorunur.
- Web `Yildiz Al`, `Marketplace`, `StarVault` ayni repository ve sahiplik snapshot mantigini kullanir.
- Offline modda katalog ve son sahiplik snapshot'i kullanilabilir kalir.
- StarVault ekraninda plan/backlog metni kalmaz; kullanici yalnizca calisan vault aksiyonlarini gorur.
- 2D Sky Live fiziksel cihaz kabul testleri gecmeden 3D ana gelistirme tekrar baslamaz.
