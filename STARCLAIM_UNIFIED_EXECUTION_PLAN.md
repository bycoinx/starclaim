# StarClaim Unified Execution Plan

Bu dosya StarClaim icin tek karar ve uygulama planidir.

Eski roadmap, mimari ve deneyim planlari bu dosyada birlestirildi. Yeni is
sirasinda baska `*PLAN*.md`, roadmap veya mission dosyasi ana kaynak olarak
kullanilmayacak. Teknik specification, delivery summary ve acceptance checklist
dosyalari yalnizca kanit veya referans niteligindedir.

## 0. Kaynak Sirasi

1. `STARCLAIM_UNIFIED_EXECUTION_PLAN.md` - tek ana plan.
2. `MOBILE_2D_ACCEPTANCE_CHECKLIST.md` - mobil 2D kabul kaniti.
3. P0/P0.8 specification ve delivery summary dosyalari - teknik referans.
4. Kod ve testler - uygulamanin gercek durumu.

## 1. Urun Karari

- Mobil uygulama ana deneyimdir: yildiz secme, satin alma, sahiplik,
  StarVault, Sky Live ve ileride 3D yolculuk burada tamamlanir.
- Web vitrin, katalog, marketplace ve mobil devam katmanidir. Web; QR,
  deep link ve ortak sahiplik verisiyle mobil deneyime baglanir.
- 3D ana gelistirme, mobil 2D Sky Live uretim kabul kapisi kapanmadan tekrar
  ana is kalemi olmayacak.
- Tek yildiz kimligi ve tek sahiplik kaynagi kullanilacak. Web, mobil,
  backend ve gelecekte blockchain ayni `StarIdentity`, `StarTarget`,
  `OwnershipRecord`, `MarketplaceListing`, `VaultItem` ve
  `CertificateRecord` sozlesmesini tuketecek.
- Uygulama ekranlari plan/backlog metni gostermeyecek; kullanici yalnizca
  calisan urun deneyimi gorecek.

## 2. Mimari Ilkeler

### 2.1 Veri Sozlesmesi

`StarIdentity` asgari alanlari:

```text
id
source
sourceId
canonicalId
hip
hd
gaiaSourceId
starClaimCode
name
constellation
ra
dec
distanceParsec
magnitude
spectralType
epoch
```

Kurallar:

- `id` ve `canonicalId` sira veya UI indeksine bagli olmayacak.
- `StarTarget` ekranlar ve deep linkler arasi tek hedef modeli olacak.
- `OwnershipRecord` satin alma, sertifika, vault ve marketplace icin tek
  sahiplik ozeti olacak.
- AsyncStorage yalnizca cache/offline snapshot icin kullanilacak; kalici
  dogruluk backend sahiplik kaydindan gelecek.

### 2.2 Repository ve Store Katmani

UI dogrudan API, fixture, AsyncStorage veya katalog dosyasi okumayacak.

```text
StarRepository
OwnershipRepository
MarketplaceRepository
VaultRepository
CertificateRepository

CatalogStore
OwnershipStore
MarketplaceStore
VaultStore
SessionStore
SkyRuntimeStore
```

Kurallar:

- Web `Yildiz Al`, `Marketplace`, `StarVault`; mobil `Claim`, `Sky Live`,
  `StarVault`, `Profile` ayni kimlik ve sahiplik modelini kullanir.
- Kartlar, drawer'lar ve action bar'lar is mantigi tasimaz.
- Offline fallback, retry, loading, empty ve error davranislari store veya
  repository katmaninda merkezilesir.

### 2.3 API ve Sync

Hedef endpoint semantigi:

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

Kurallar:

- GET isteklerinde retry olabilir; POST istekleri idempotency key kullanir.
- Mobil acilis, one donus ve manuel yenilemede ownership/vault/marketplace
  snapshot'i yeniler.
- Snapshot SHA-256 ile dogrulanir; bozuk snapshot son saglam snapshot'i
  silmez.
- Backend tarihi ve siparis durumu conflict durumunda kazanir.

### 2.4 Deep Link ve Rota

Tek hedef modeli:

```text
starclaim://star/{starClaimCode}
starclaim://stars/{starId}
starclaim://hip/{hipId}
starclaim://marketplace/listing/{listingId}
starclaim://vault/item/{vaultItemId}
starclaim://certificate/{certificateId}
```

Mobil ana rotalar:

```text
/(tabs)/claim
/(tabs)/sky
/(tabs)/vault/home
/(tabs)/profile
/(tabs)/explore/stardetail
/(tabs)/vault/purchases
/(tabs)/vault/newmessage
```

Web ana rotalar:

```text
/stars
/marketplace
/vault
/star/:starId
/payment/success
```

## 3. Aktif Rank

### Rank 1 - Mobil 2D Sky Live Kabul Kapisi

Durum:

- Otomatik test kapisi geciyor: `npm run test:astronomy`.
- Expo config kapisi geciyor: `npx expo-doctor`.
- Sensor heading fallback, izin reddi ve invalid location payload riskleri
  sertlestirildi.
- Gorsel kalite otomatik kapisi magnitude radius, BP-RP/spektral renk,
  night vision ve kaliteye gore atmosfer katmani davranisini testlerle
  kilitliyor.
- Deep space gradient ve compact/mid/large phone referans viewport planlari
  otomatik testlerle dogrulandi.
- Referans screenshot/gorsel regresyon kapisi deterministik SVG snapshot ve
  SHA-256 baseline karsilastirmasi ile cihazsiz kapatildi.
- Fiziksel cihaz kaniti `MOBILE_2D_ACCEPTANCE_CHECKLIST.md` uzerinden
  kapatilacak; RAM riski nedeniyle cihaz calistirma bu turda kullanici manuel
  testine birakildi.

Kalan:

- Fiziksel cihaz 9 senaryosunu tek tek kaydet:
  soguk acilis, ana navigasyon, izin reddi, sensor lifecycle, offline tile
  fallback, 10 dakika dayaniklilik, 90 derece motor hissi, web deep link,
  StarVault deep link.
- Dusuk/orta/yuksek Android profillerinde FPS, isi, bellek ve crash kaydi al.
- Fiziksel cihaz 9 senaryosunu kullanici manuel test sonucu ile kapat.

Kabul:

- Sky Live izin reddi, offline, bozuk cache, sensor stale ve background/foreground
  durumlarinda crash uretmez.
- Harita ag olmadan gorunur yildiz verisiyle acilir.
- 10 dakika sensor modunda kritik FPS dususu veya crash yoktur.

### Rank 2 - Sahiplik, Satin Alma ve Sync

Hedef:

- Satin alma sonrasi ayni yildiz web, mobil, StarVault, sertifika ve Sky Live
  icinde ayni kimlikle gorunur.

Durum:

- Mobil purchase commit akisi tek `PURCHASE_COMMITTED` sync olayi uzerinden
  OwnershipStore ve VaultStore refresh'ini beklenebilir hale getiriyor.
- Ownership kayitlari `starId`, `canonicalId`, `catalogId`, `sourceId`,
  `gaiaSourceId`, `hip`, `hd` ve `starClaimCode` ile normalize edilip
  eslesebiliyor.
- Offline ownership snapshot canonical alanlari mobil cache'e tasiyor.
- Web Dashboard ve StarVault ayni ownership normalizer ile order/star
  eslestiriyor; certificate indirme `orders/certificate/{orderId}` sozlesmesini
  order listesi uzerinden cozer.
- Web StarVault istatistik fallback'leri mock 12/9/6 degerleri yerine
  store/API-derived 0/Cadet degerleriyle baslar.
- Web PaymentSuccess paid sonucundan sonra `/orders/mine` ve `/stars/mine/list`
  kaynaklarini ortak ownership normalizer ile okuyup pending sync kaydi birakir;
  Dashboard ve StarVault API gecikmesinde bu kaydi gecici olarak merge eder.
- Backend `checkout/status`, `orders/mine` ve `orders/offline-snapshot`
  response'lari ortak ownership contract alanlarini doner; certificate PDF
  endpoint'i ayni `orderId` sozlesmesiyle test edilir.

### Rank 3 - StarVault Mobil Urunlestirme

Hedef:

- Mobil StarVault web kalitesinde calisan urun merkezi olacak.

Durum:

- Mobil StarVault home ekrani artik sahiplik verisi yokken demo/public claimed
  yildiz gostermiyor; bos, loading ve hata durumlari acik CTA'larla yonetiliyor.
- Web contract ile uyumlu `orderId`, `starId`, `starClaimCode`, verified/local
  alanlari mobil kart, compass, sertifika ve timeline gorunumlerinde kullaniliyor.
- Secili yildizdan certificate PDF paylasimi backend `orders/certificate/{orderId}`
  sozlesmesine baglandi; sync durumu ve manuel yenileme hero icinde gorunur.

Zorunlu bolumler:

- Hero: sahip olunan yildiz, sertifika, vault item sayilari.
- Kisa yollar: `Yildiz Al`, `Sertifikalar`, `Hikaye Ekle`, `Satin Almalar`,
  `Guvenlik`, `Profil`.
- Vault listesi: mesajlar, sertifikalar, satin alma snapshot'i.
- Guvenlik: biyometrik kilit, tarih kilidi, yedekleme/sync durumu.
- Empty state: satin alma veya ilk mesaj aksiyonuna goturur.

### Rank 4 - Marketplace Web/Mobil Ortak Akis

Hedef:

- Web ve mobil ayni `MarketplaceListing` sozlesmesini kullanir.

Kurallar:

- Listing yildiz verisini tekrar tasimaz; `starId`, fiyat, durum ve seller
  bilgisini tutar.
- Detayda yildiz bilgisi `StarRepository` ile cozulur.
- Action listesi ortak olur: `viewDetail`, `buy`, `list`, `unlist`,
  `openVault`, `share`.

### Rank 5 - Web Baglanti ve Katalog Sertligi

Hedef:

- Web `Yildiz Al`, `Marketplace`, `StarVault` ayni repository/sahiplik
  mantigini kullanir ve mobil devam aksiyonlari uretir.

Kalan:

- `/api/stars/count` gibi opsiyonel endpointler sayfayi dusurmeyecek.
- Custom domain ve Vercel deployment her zaman relative `/api` rewrite akisini
  kullanacak.
- QR/deep link payload'lari `StarTarget` ile ayni kalacak.

### Rank 6 - 3D Voyage Yeniden Baslatma

Baslama sarti:

- Rank 1-3 kabul kapilari kapanmadan 3D ana gelistirme baslamaz.

Hedef mimari:

- Kanonik star identity, tile katalog ve ownership marker verisini kullanir.
- Eski Three.js/Expo GL prototipleri yalnizca referans kalir.
- Floating-origin, gercek sektor komsulugu, GL dispose, LOD ve cihaz kalite
  profili ilk gunden zorunludur.

DSO hedefi:

- Messier ve NGC derin uzay katmani 2D kabulden sonra 3D/DSO asamasinda ele
  alinir.
- DSO catalog: Messier 110 + kontrollu NGC alt kumesi, API testleri ve
  performans kaniti ile ilerler.

### Rank 7 - Web Yasayan Evren ve Hero

Baslama sarti:

- Mobil 2D kabul kapisi kapatilmadan web yasayan evren ana is kalemi olmaz.

Kurallar:

- CRA/CRACO + React 19 mevcut stack korunur.
- Tek canvas `UniverseBackdrop`; ikinci WebGL context yok.
- HYG/Gaia-lite veri kullanilir; Gaia tam katalog istemciye yuklenmez.
- Desktop 10-14k, orta 6-8k, mobil web 2-3.5k yildiz kalite profiline gore
  sinirlanir.
- Reduced motion modunda meteor/parallax/twinkle kapanir.

### Rank 8 - Unity/Native Scaffold

Durum:

- Sadece uzun vadeli POC fikri. Aktif sprint veya urun karari degildir.

Kural:

- Unity scaffold, mobil 2D kabul ve ana React Native akislari tamamlanmadan
  baslatilmaz.
- Baslatilirsa ayri POC olarak ele alinir; ana repo ve buyuk assetler LFS/
  Addressables karari olmadan sisirilmez.

## 4. Uygulama Paketleri

### Paket A - Mobil 2D Runtime Hardening

- [x] Sensor heading stale fallback.
- [x] Konum izni reddi diagnostic ve manuel fallback.
- [x] Invalid location payload korumasi.
- [x] Sky runtime unit testleri.
- [ ] Fiziksel cihaz 9/9 kabul kaydi.

### Paket B - Mobil 2D Gorsel Kabul

- [ ] Magnitude -> boyut egrisi kabul.
- [ ] BP-RP/spektral tip -> renk kabul.
- [ ] Halo ve etiket yogunlugu kabul.
- [ ] Night vision ve deep-space layer kabul.
- [ ] Referans screenshot seti.

### Paket C - Ownership ve StarVault Sync

- [ ] Purchase -> OwnershipStore -> VaultStore tek event zinciri.
- [ ] StarVault istatistikleri tamamen store-derived.
- [ ] Sky Live owned marker canonical id ile dogrulanir.
- [ ] Certificate ve vault item web/mobil ayni kayitlari kullanir.

### Paket D - Marketplace Mobil

- [ ] Mobil marketplace listing normalizer web ile ayni sozlesmede.
- [ ] Sahip olunan yildizdan listeleme aksiyonu.
- [ ] Buy/list/unlist aksiyonlari backend order/listing akisina baglanir.

### Paket E - Web Sertlestirme

- [ ] Katalog count/list fallback davranisi regression test ile korunur.
- [ ] Custom domain `/api` rewrite smoke testi.
- [ ] Web QR/deep link manuel smoke.

### Paket F - 3D/DSO Hazirlik

- [ ] 2D kabul raporu kapandiktan sonra baslar.
- [ ] Floating-origin ve LOD teknik tasarimi.
- [ ] DSO data/API performans kaniti.
- [ ] Mobil cihaz 3D FPS/isi/bellek profili.

## 5. Test Kapilari

Her paket icin uygun olanlar calistirilir:

```text
mobile: npm run test:astronomy
mobile: npx expo-doctor
frontend: npm run build
backend: ilgili pytest/API smoke
```

Fiziksel cihaz gerektiren maddeler tahminle kapatilmaz. Tarih, cihaz, OS,
sonuc ve not `MOBILE_2D_ACCEPTANCE_CHECKLIST.md` icine yazilir.

## 6. Dosya Politikasi

- Yeni roadmap veya plan dosyasi acilmayacak.
- Yeni karar bu dosyaya islenecek.
- Kabul kanitlari `MOBILE_2D_ACCEPTANCE_CHECKLIST.md` gibi checklist/kanit
  dosyalarinda tutulabilir.
- Teknik detay gerekiyorsa `SPECIFICATION` veya `IMPLEMENTATION_SUMMARY`
  dosyasi olabilir, ama karar sirasi bu dosyayi gecemez.
- Eski plan dosyalari silinmistir; tekrar eklenmeyecek.

## 7. Genel Kabul Kriterleri

- Mobil uygulama soguk acilista crash olmadan `Yildiz Al`, `Sky Live`,
  `StarVault`, `Profil` ekranlarini acar.
- Satin alma sonrasi ayni yildiz web, mobil, StarVault, sertifika ve Sky
  Live'da ayni kimlikle gorunur.
- Web `Yildiz Al`, `Marketplace`, `StarVault` ayni repository ve ownership
  snapshot mantigini kullanir.
- Offline modda katalog ve son saglam sahiplik snapshot'i kullanilabilir kalir.
- StarVault ekraninda plan/backlog metni kalmaz.
- 2D Sky Live fiziksel cihaz kabul testleri gecmeden 3D ana gelistirme
  tekrar baslamaz.
