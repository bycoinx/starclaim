# StarClaim Experience Redesign Plan

**Tarih:** 19 Haziran 2026  
**Kapsam:** Mobil arayüz, mobil 2D Sky Live, web ana sayfa ve yaşayan evren sistemi  
**Durum:** Uygulama öncesi yol haritası

Bu plan, paylaşılan üç görsel referansı mevcut StarClaim kod tabanına uyarlamak için hazırlanmıştır. Referanslar birebir kopyalanmayacak; astronomi motoru, sahiplik akışı, Expo Go gereksinimi ve web performans bütçesi korunarak aynı premium duygu StarClaim'e özgü biçimde kurulacaktır.

## 1. Kesin Ürün Kararları

### 1.1 Solana görünürlüğü

- Mobil arayüzde `SOLANA_NETWORK`, SOL bakiyesi, SOL fiyat hareketi, cüzdan adresi ve zincir telemetrisi gösterilmeyecek.
- Mobil uygulama kullanıcıya blockchain altyapısını değil yıldız, hikaye, sertifika ve gözlem deneyimini gösterecek.
- Fiyat yalnız satın alma bağlamında ve gerçek ödeme para birimiyle gösterilecek; token fiyatı veya piyasa grafiği bulunmayacak.
- Eski backend/contract kodu bu arayüz çalışmasında silinmeyecek; geçmiş uyumluluk için izole kalacak.
- Expo Go paketi Solana SDK veya cüzdan adaptörü taşımayacak.
- Cüzdan desteği ileride geri dönerse özellik bayraklı ayrı entegrasyon olacak; ana navigasyona yerleşmeyecek.

### 1.2 Platform rolleri

- **Web:** Marka vitrini, yıldız seçimi ve satın alma başlangıcı. Tam gözlem haritası değildir.
- **Mobil ana ekran:** Sakin, premium keşif merkezi. Finansal dashboard değildir.
- **Mobil 2D Sky Live:** Gerçek konum, zaman ve sensör verisine dayalı gözlem aracı.
- **Mobil 3D Evren:** Sahip olunan veya kodla bulunan yıldıza sinematik yolculuk.
- **StarVault:** Mesaj, sertifika ve anı saklama alanı.

### 1.3 Görsel kimlik

- Temel alan saf siyaha yakın, hafif soğuk tonlu uzay olacak.
- Altın yalnız sahiplik, seçili durum ve ana eylem için kullanılacak.
- Mavi-beyaz yıldız ışığı gözlem ve navigasyonu temsil edecek.
- Mor yalnız derin uzay/3D vurgu rengi olacak; ekranı tek başına domine etmeyecek.
- Neon HUD, terminal dili, aşırı monospace ve dekoratif köşeler azaltılacak.
- Başlıklar Cinzel/marka serif; işlevsel metinler okunaklı sans-serif olacak.
- Gökyüzü ana içerik, arayüz ise sessiz yardımcı katman olacak.

## 2. Referansların Projeye Uyarlanması

### 2.1 Mobil ana ekran

Alınacak öğeler:

- İlk bakışta StarClaim markası ve gerçek uzay sahnesi.
- Net bir değer önerisi ve iki ana eylem.
- Alt kısımda sade cam navigasyon.
- Altın sahiplik ile mavi gözlem vurgusunun ayrılması.
- Büyük yüzeylerde boşluk, kontrollü parlaklık ve tek odak noktası.

Uyarlanmayacak öğeler:

- Aynı anda yedi navigasyon hedefi.
- Dev dekoratif merkez düğmesi.
- Gezegen, nebula, galaksi ve yıldızların aynı parlaklıkta kullanılması.
- Küçük telefonlarda okunamayacak tablet ölçekli tipografi.

### 2.2 2D harita

Alınacak öğeler:

- Gerçek gökyüzünün ekranın ana içeriği olması.
- Üstte pusula/yön şeridi.
- Seçili yıldız için kısa bilgi kartı.
- Sağda katman, derin uzay ve merkezleme araçları.
- Konum, tarih ve saatin tek kompakt panelde gösterilmesi.

StarClaim farkı:

- Sahip olunan yıldız altın halo ve doğrulanmış StarClaim koduyla görünecek.
- 2D görünümden tek dokunuşla 3D yolculuk başlatılacak.
- Takımyıldızı çizgileri bilimsel katman olarak kalacak.
- Çevrimdışı katalog ve son doğrulanmış sahiplik snapshot'ı çalışmaya devam edecek.

### 2.3 Web ana sayfa

Alınacak öğeler:

- İlk viewport'u taşıyan sinematik evren kompozisyonu.
- Ortalanmış marka mesajı, iki CTA ve sakin tipografi.
- Sol alt ve sağ üstte kompozisyonu çerçeveleyen uzay yapıları.
- Menü ile sahnenin aynı lüks dilde birleşmesi.

Uyarlanmayacak öğeler:

- Metni bastıran aşırı parlak galaksi ve nebula.
- Sürekli hareket eden büyük gezegenler.
- Görünür aç/kapa yapan yıldızlar.
- Sadece büyük masaüstünde çalışan sabit koordinatlı kompozisyon.

## 3. Ortak Tasarım Sistemi

### 3.1 Tokenlar

- `space.black`: `#02040A`
- `space.panel`: `rgba(7, 11, 20, 0.78)`
- `star.white`: `#F4F7FF`
- `observation.blue`: `#77BFFF`
- `claim.gold`: `#E6BC4A`
- `deep.violet`: `#7868D8`
- `danger.red`: yalnız hata ve silme işlemleri
- Panel radius: `8-12px`.
- Dokunma hedefi: en az `44x44`.
- Android yatay modda sağ/sol sistem insetleri zorunlu.

### 3.2 Tipografi

- Marka ve gerçek hero başlığı: Cinzel.
- Gövde ve buton: okunaklı sans-serif.
- Monospace yalnız koordinat, HIP/HD kodu ve geliştirici ölçümü için.
- Tüm büyük harf kullanımı küçük etiketlerle sınırlı.
- Normal metin harf aralığı `0`; terminal tarzı geniş aralık kaldırılacak.

### 3.3 Ortak bileşenler

- `BrandHeader`
- `GlassNavigation`
- `PrimaryGoldAction`
- `ObservationAction`
- `StarIdentityCard`
- `SkyToolButton`
- `LoadingState`, `EmptyState`, `OfflineState`, `ErrorState`
- `QualityProfileBadge` yalnız geliştirici modunda

## 4. Cerrahi Uygulama Sırası

Her paket ayrı uygulanacak, test edilecek, fiziksel cihaz ekran görüntüsüyle onaylanacak ve sonra sıradaki pakete geçilecektir.

### Paket 0 - Kabul tabanı

**Amaç:** Değişikliklerden önce karşılaştırılabilir başlangıç noktası oluşturmak.

- [ ] Mobil ana ekran, marketplace, StarVault, 2D ve 3D için ekran görüntüsü matrisi hazırlanacak.
- [ ] `360x800`, `393x873`, küçük tablet ve mevcut yatay cihaz ölçüleri kaydedilecek.
- [ ] Web `1440x900`, `1920x1080`, `1366x768`, tablet ve mobil baseline'ları alınacak.
- [ ] FPS, ilk çizim, bellek ve uzun görev ölçümleri kaydedilecek.
- [ ] Referanslar okunabilirlik, odak, taşma, kontrast ve sahne yoğunluğu kabul ölçütlerine çevrilecek.

**Çıkış kriteri:** Önce/sonra ekran ve performans tabanı hazır.

### Paket 1 - Mobil P0 kabuk ve Solana temizliği

**Amaç:** Yeni tasarımdan önce kırık yerleşimi ve yanlış ürün mesajını kaldırmak.

- [x] SOL bakiyesi, SOL fiyatı, adres ve `SOLANA_NETWORK` kartı kaldırıldı.
- [x] Eski cüzdan girişleri görünür navigasyondan çıkarıldı.
- [x] Android yatay mod için gerçek safe-area insetleri uygulandı.
- [x] Sistem navigasyon çubuğu koyu/ışık ikonlu olacak şekilde yapılandırıldı; içerik inset altında kalmıyor.
- [x] Ana ekrandaki ikinci alt menü kaldırıldı; tab bar yatay insetlere bağlandı.
- [x] Marketplace kullanılabilir genişliğe göre 1/2 kolon değiştiriyor.
- [x] Bozuk ikon adları ve kullanıcıya görünen eski teknik metinler düzeltildi.
- [x] 3D katalog/GL yükleme, hata ve yeniden dene durumları görünür hale getirildi.

**Doğrulama:** Expo Doctor `18/18`, astronomi/projeksiyon testleri `18/18`, Android Hermes export başarılı. Fiziksel cihaz safe-area ekran görüntüsü Paket 2 kabul turunda alınacak.

**Çıkış kriteri:** Ana ekranlar kırpılmıyor, Solana görünmüyor, boş render sessizce başarısız olmuyor.

### Paket 2 - Mobil navigasyon ve kabuk

**Amaç:** Referanstaki premium kabuğu küçük telefonlarda güvenilir hale getirmek.

- [ ] Alt navigasyon beş hedefe sabitlenecek: `Yıldız Al`, `Sky Live`, `3D Evren`, `StarVault`, `Profil`.
- [ ] `Koleksiyon/Yıldızlarım`, Profil veya StarVault içinden erişilen ikincil yüzey olacak.
- [ ] Aktif sekme bağlama göre altın veya mavi vurgulanacak.
- [ ] Tablet/yatay telefonda geniş, dar telefonda güvenli ikon+etiket düzeni kullanılacak.
- [ ] Header, geri, arama, bildirim ve ayar düğmeleri aynı ölçü sistemine taşınacak.
- [ ] `CockpitLayout` terminal çerçevesinden premium gözlem çerçevesine dönüşecek.

**Çıkış kriteri:** Navigasyon taşmaz; ana akışlara en fazla iki dokunuşta ulaşılır.

### Paket 3 - Mobil ana ekran

**Amaç:** Finansal dashboard yerine StarClaim'in duygusal ve astronomik değerini göstermek.

- [ ] İlk ekran tam yüzey sinematik uzay kompozisyonu olacak.
- [ ] Marka, kısa değer önerisi ve `Yıldızını Seç` / `Sky Live` CTA'ları kullanılacak.
- [ ] Sahiplik varsa hero kullanıcının yıldızıyla kişiselleşecek.
- [ ] Sahiplik yoksa katalogdan doğrulanmış gökyüzü bölgesi gösterilecek.
- [ ] Görsel asset AVIF/WebP varyantları ve cihaz profiline göre çözünürlükle hazırlanacak.
- [ ] Hareket hafif yıldız titreşimi, çok yavaş parallax ve seyrek meteorla sınırlı olacak.
- [ ] Düşük güç ve azaltılmış hareket için statik alternatif bulunacak.
- [ ] Hero metni görselin üstünde olacak; karta kapatılmayacak.

**Çıkış kriteri:** Ürün beş saniyede yıldız sahiplenme ve gözlem deneyimi olarak anlaşılır; kripto izlenimi oluşmaz.

### Paket 4 - Mobil 2D Sky Live

**Amaç:** Mevcut astronomi motorunu sakin, gerçekçi gözlem arayüzüne taşımak.

- [ ] Skia, Alt/Az, LST, konum, sensör ve katalog kodu korunacak; sunum katmanı yeniden düzenlenecek.
- [ ] Üste yön/pusula şeridi eklenecek ve ekran yönü kalibrasyonuyla beslenecek.
- [ ] Sol üstte seçili yıldız; sol altta konum/tarih/saat paneli kullanılacak.
- [ ] Sağ araçlar `Takımyıldızları`, `Derin Uzay`, `Merkeze Al` olarak sadeleşecek.
- [ ] Diğer katmanlar ayar çekmecesine taşınacak.
- [ ] Alt merkezde azimut ve yükseklik gösterilecek.
- [ ] Seçili yıldız core/halo/outer-halo ile vurgulanacak; etiket çakışması önlenecek.
- [ ] Samanyolu/nebula gerçek yıldızların yerini almayacak; düşük opaklıklı yönlü arka katman olacak.
- [ ] Seçili takım çizgileri belirgin, diğer çizgiler zayıf olacak.
- [ ] Manuel, sensör ve kamera modları anlaşılır adlandırılacak.
- [ ] İzin reddi, çevrimdışı katalog ve kalibrasyon akışları tamamlanacak.

**Performans bütçesi:**

- Düşük: `30 FPS`, azaltılmış etiket/nebula/halo.
- Orta: `55-60 FPS`, tam yıldız ve seçili takım çizgileri.
- Yüksek: `60 FPS`, daha yüksek yoğunluk ve yumuşak halo.
- Skia node ve katman maliyeti geliştirici telemetrisinde ölçülecek; kullanıcıya gösterilmeyecek.

**Çıkış kriteri:** Görsel referansa yaklaşır; mevcut 18 astronomi/projeksiyon testi ve fiziksel cihaz testi geçer.

### Paket 5 - Web yaşayan evren motoru

**Amaç:** Basit `StarCanvas` arka planını tek canvas'lı üretim sistemiyle değiştirmek.

**Stack uyarlaması:** Proje Next.js/TypeScript değil; React 19 + CRA/CRACO, R3F, Drei, Three.js ve Framer Motion kullanıyor. Bu aşamada framework göçü yapılmayacak.

- [ ] Uygulama ömrü boyunca yaşayan tek `UniverseBackdrop` R3F canvas kurulacak.
- [ ] Route değişimlerinde ikinci WebGL context oluşturulmayacak.
- [ ] Mevcut HYG worker ve B-V renk hattı kullanılacak.
- [ ] İlk sürüm Gaia'nın tamamı yerine HYG + kontrollü Gaia-lite alt kümesi kullanacak.
- [ ] Yıldızlar `THREE.Points/BufferGeometry` ve özel shader ile az draw call içinde çizilecek.
- [ ] Magnitude, renk, seed, faz ve titreşim genliği buffer attribute olacak.
- [ ] Yıldızların `%90-95`i sabit; `%5-10`u yalnız `%0.5-3` parlaklık değişimi gösterecek.
- [ ] Titreşimler senkron olmayacak; görünür aç/kapa davranışı olmayacak.
- [ ] Üç derinlik katmanıyla birkaç piksellik mouse/scroll parallax uygulanacak.
- [ ] Meteor aralığı rastgele `20-45 saniye`; aynı anda en fazla bir meteor olacak.
- [ ] Nebula optimize görsel maske + hafif shader drift olacak; pahalı raymarch kullanılmayacak.
- [ ] 5-7 kahraman yıldızına kontrollü halo uygulanacak; tam ekran bloom olmayacak.
- [ ] Metin arkasında kontrast maskesi ve vignette bulunacak.
- [ ] Sekme görünmezken animasyon duracak; canvas viewport dışında yavaşlayacak.

**Kalite profilleri:**

- Masaüstü yüksek: `10.000-14.000` yıldız, DPR en fazla `1.5`.
- Dizüstü/orta: `6.000-8.000` yıldız, DPR en fazla `1.25`.
- Mobil web: `2.000-3.500` yıldız, seyrek meteor, basit nebula.
- Düşük güç/reduced motion: statik yıldızlar; meteor, parallax ve twinkle kapalı.

**Çıkış kriteri:** Hero 60 FPS hedefini korur, context kaybetmez, metin okunur ve particle demo gibi görünmez.

### Paket 6 - Web ana sayfa kompozisyonu

**Amaç:** Web referansının hissini mevcut satış ve hikaye akışına taşımak.

- [ ] Navbar daha sakin ve hero ile tek sahne gibi tasarlanacak.
- [ ] H1 korunacak: `Gökyüzünde Sonsuz Bir İz Bırak`.
- [ ] İki CTA korunacak: `Yıldızını Seç`, `StarVault Vizyonu`.
- [ ] Sol alt gezegen ufku ve sağ üst galaksi güvenli crop alanlı optimize asset olacak.
- [ ] Hero ilk viewport sinyali olacak; sonraki bölümden küçük bir ipucu görünür kalacak.
- [ ] Eski HUD metinleri, scan, glitch ve sürekli dönen halkalar kaldırılacak.
- [ ] Slider noktaları yalnız gerçek çoklu sahne varsa kullanılacak.
- [ ] Sonraki bölümler tam genişlik bantlar olacak; kart içinde kart kullanılmayacak.
- [ ] Kuantum güvenliği iddiaları doğrulanabilir ürün diliyle gözden geçirilecek.
- [ ] LCP asset preload edilecek; canvas içerik boyamasını engellemeyecek.

**Çıkış kriteri:** İlk viewport referans kadar güçlü ama StarClaim'e özgü; Lighthouse sınırları korunmuş.

### Paket 7 - 3D Evren uyumu

**Amaç:** Yeni mobil kabuk ve 2D tamamlandıktan sonra 3D'yi aynı dile almak.

- [ ] Blank sector ve tile hata durumları çözülmeden efekt artırılmayacak.
- [ ] Galaxy/Sector/Target kompakt seviyelendirme kontrolüne dönüşecek.
- [ ] FPS/tile debug bilgisi yalnız geliştirici modunda gösterilecek.
- [ ] Galaksi çekirdek, kol, toz şeridi ve uzak yıldız katmanlarına ayrılacak.
- [ ] Hedef yıldız core/halo/outer-halo/diffraction sistemi kalite profiline bağlanacak.
- [ ] 2D'den aktarılan `StarTarget` korunacak.
- [ ] Floating-origin ve uzun mesafe navigasyonu tamamlanacak.

**Çıkış kriteri:** 3D boş kalmaz, orta Android'de `30+ FPS` verir ve yeni arayüzle aynı ürüne ait görünür.

### Paket 8 - Yayın sertleştirmesi

- [ ] Expo Go Android testi.
- [ ] Android development build testi.
- [ ] iOS safe-area ve gesture testi.
- [ ] Web Chrome, Safari, Firefox ve düşük GPU testi.
- [ ] 10 dakikalık 2D sensör/kamera testi.
- [ ] 10 dakikalık 3D GL context/bellek testi.
- [ ] Web route, arka sekme ve WebGL context testi.
- [ ] Türkçe/İngilizce taşma ve glif testi.
- [ ] Reduced motion, ekran okuyucu ve kontrast testi.

## 5. Web İçin Projeye Uyumlu Teknik Brief

> StarClaim'in React 19 + CRA/CRACO web uygulamasında mevcut `@react-three/fiber`, `three`, `@react-three/drei` ve Framer Motion paketlerini kullanarak tek canvas'lı bir `UniverseBackdrop` geliştir. Yeni framework veya ikinci WebGL context ekleme. Mevcut HYG worker hattından RA, Dec, magnitude ve B-V verilerini kullan; Gaia DR3'ün tamamını istemciye yükleme. Yıldızları `THREE.Points + BufferGeometry + custom GLSL` ile çiz. Çoğu yıldız sabit kalsın; küçük bir alt küme benzersiz seed/faz ile yüzde 0.5-3 arasında yavaş parlaklık değişimi göstersin. Üç hafif parallax katmanı, 20-45 saniye aralığında tek gerçekçi meteor, düşük opaklıklı mavi/indigo/mor nebula ve metin arkasında kontrast maskesi uygula. Masaüstünde 10-14 bin, orta profilde 6-8 bin, mobil webde 2-3.5 bin yıldız kullan. DPR'yi sınırla, sekme görünmezken render'ı durdur, reduced-motion modunda meteor/parallax/twinkle kapat. Sonuç çocukça particle efekti, neon oyun HUD'u veya senkron yanıp sönen yıldızlar gibi değil; premium astronomi markasının sakin yaşayan evreni gibi görünmeli.

## 6. Veri ve Asset Politikası

- Gerçek yıldız konumu/rengi astronomik katalogdan gelir; rastgele yıldız yalnız uzak dolgu katmanında kullanılabilir.
- AI galaksi/gezegen/nebula görselleri bilimsel veri değil dekoratif sanat katmanıdır.
- Referans görseller kullanılmadan önce kaynak, lisans ve çözünürlük kontrolünden geçer.
- Üretim assetleri AVIF/WebP, çözünürlük varyantları ve koyu fallback ile hazırlanır.
- Web hero için ağır video yerine poster + GPU yıldız katmanı tercih edilir.
- Mobil 2D'de gerçek gökyüzü verisi sanat assetinden daima önceliklidir.

## 7. Test Kapıları

Bir paket aşağıdakiler olmadan tamamlandı sayılmaz:

1. İlgili otomatik testler yeşil.
2. En az iki gerçek viewport/cihaz ekran görüntüsü alındı.
3. Taşma, sistem barı veya alt navigasyon çakışması yok.
4. Loading, empty, offline ve error durumları doğrulandı.
5. Performans bütçesi ölçüldü; tahmin olarak bırakılmadı.
6. Kullanıcıya görünür geliştirici telemetrisi kalmadı.
7. Plan kutuları ve ilerleme yüzdesi güncellendi.

## 8. Önerilen Başlangıç

İlk cerrahi paket **Paket 1 - Mobil P0 kabuk ve Solana temizliği** olmalıdır. Yeni tasarımı sistem barı taşması, alt tab çakışması, bozuk glifler ve eski Solana dashboard'u üzerine kurmak yeniden iş üretir.

Sonraki sabit sıra: **Mobil kabuk -> Mobil ana ekran -> 2D Sky Live -> Web yaşayan evren -> Web hero -> 3D uyum**.
