# StarCalimX Strategic Vortex Plan

Bu belge StarCalimX'in mevcut kod tabanına göre hazırlanmış uygulama planıdır. Öncelik, mobil uygulamada önce güvenilir bir 2D gökyüzü haritası, ardından aynı astronomik veri motorunu kullanan Celestia tarzı 3D yıldız yolculuğu geliştirmektir.

## Ürün Kararı

- **Web Cosmos:** Premium gözlem vitrini. Yıldız satın alma veya yıldız seçme motoru değildir.
- **Mobil 2D Sky Map:** Star Walk benzeri gerçek gökyüzü gözlem ekranıdır.
- **Mobil 3D Voyage:** Kullanıcının yıldız adı, HIP/HD veya StarClaim koduyla hedefe uçtuğu Celestia tarzı deneyimdir.
- **Yıldız satın alma:** Mobil katalog ve mevcut `stars` akışı üzerinden yürür.
- **Yıldızlarım:** Sahip olunan yıldızı tek dokunuşla 2D veya 3D haritada açar.
- **Tek veri kaynağı:** 2D, 3D, katalog ve sahiplik ekranları aynı yıldız kimliği ve koordinat sözleşmesini kullanır.

---

## Mevcut Durum

### Tamamlanan Temel İşler

- [x] Web Cosmos premium observer deneyimi oluşturuldu.
- [x] Web Cosmos çift WebGL render sorunu giderildi.
- [x] Mobil bağımlılıklar Expo SDK 54 ile hizalandı.
- [x] `expo-doctor` 18/18 temiz duruma getirildi.
- [x] Android Hermes bundle üretimi doğrulandı.
- [x] Mobil root Stack, Tabs ve nested Stack navigasyonu kuruldu.

### Mevcut Mobil Prototipler

- [x] Skia tabanlı 2D yıldız çizimi mevcut.
- [x] Pan, pinch zoom ve yıldız dokunma prototipi mevcut.
- [x] Takımyıldızı çizgileri, gezegenler ve DSO veri katmanları mevcut.
- [x] Expo GL ve Three.js tabanlı 3D yıldız prototipi mevcut.
- [x] Basit warp efekti mevcut.
- [ ] 2D harita gerçek gözlem koşullarına göre doğru değildir.
- [ ] 3D harita gerçek mesafeleri ve hedef navigasyonunu kullanmamaktadır.

---

# Aşama 1: Ortak Astronomik Veri Sözleşmesi

**Amaç:** Bütün mobil yüzeylerin yıldızları aynı kimlik ve birimlerle kullanması.

## 1.1 Yıldız Kimliği

Her yıldız kaydı aşağıdaki alanları taşımalıdır:

```text
id
hip
hd
properName
starClaimCode
raHours
raDegrees
decDegrees
distanceParsec
magnitude
spectralType
constellation
```

- [x] HYG loader bu sözleşmeye göre normalize edilecek.
	- [ ] HIP, HD, isim ve StarCalimX kodu ile ortak arama indeksi kurulacak.
- [ ] 2D ve 3D arasında yıldız aktarımı sadece bu kimlik üzerinden yapılacak.
- [ ] Cache sürümü eklenecek; veri formatı değişince eski AsyncStorage kaydı temizlenecek.

## 1.2 Koordinat Motoru

- [x] RA saat/derece dönüşümü tek yardımcı modülde tutulacak.
- [x] Dec değeri `-90..90` aralığında doğrulanacak.
- [ ] 2D için RA/Dec projeksiyonu standartlaştırılacak.
- [ ] 3D için parsec tabanlı Kartezyen koordinatlar üretilecek:

```text
x = d * cos(dec) * cos(ra)
y = d * sin(dec)
z = -d * cos(dec) * sin(ra)
```

- [x] Birim testleri Sirius, Vega, Polaris ve Achernar gibi bilinen yıldızlarla yapılıyor.

---

# Aşama 2: Mobil 2D Sky Map

**Amaç:** Önce doğru, hızlı ve kullanılabilir Star Walk benzeri haritayı tamamlamak.

## 2.1 Teknik Stabilizasyon

- [x] Kamera izni yalnızca kamera modu açılırken istenecek.
- [x] Magnetometre ve ivmeölçer yalnızca sensör modu aktifken çalışacak.
- [ ] Ekran kapanınca veya arka plana geçince sensör abonelikleri durdurulacak.
- [x] RA saat/derece karışıklıkları giderilecek.
- [x] Arama sonucu seçildiğinde yıldız doğru koordinata merkezlenecek.

## 2.2 Gerçek Gökyüzü

- [x] Kullanıcı konumu için açık izin akışı hazırlanacak.
- [x] Tarih, saat, enlem ve boylama göre Local Sidereal Time hesaplanacak.
- [x] RA/Dec verileri gerçek Altitude/Azimuth koordinatlarına dönüştürülecek.
- [x] Ufuk altındaki yıldızlar gizlenecek.
- [x] Kuzey, doğu, güney, batı ve ufuk çizgisi gösterilecek.
- [x] Sensör kalibrasyon durumu kullanıcıya gösterilecek.

## 2.3 Star Walk Görsel Katmanları

- [x] Takımyıldızı çizgileri varsayılan olarak açık olacak.
- [x] Takımyıldızı isimleri ve sınırları ayrı katmanlar olacak.
- [x] Yıldız isimleri zoom seviyesine göre gösterilecek.
- [x] Gezegenler, DSO'lar ve mitoloji görselleri katman menüsünden yönetilecek.
- [x] Gece görüşü için kırmızı ışık modu eklenecek.
- [x] Seçilen yıldız için alt bilgi paneli oluşturulacak.
- [x] Sahip olunan yıldız altın işaret ve StarClaim koduyla vurgulanacak.

## 2.4 2D Performans

- [x] Görüş alanı dışındaki yıldızlar çizim listesine alınmayacak.
- [x] Zoom seviyesine göre magnitude eşiği uygulanacak.
- [x] Dokunma seçimi için tüm kataloğu taramak yerine uzamsal indeks kullanılacak.
- [ ] Skia draw node sayısı ölçülecek ve cihaz sınıfına göre kalite profili seçilecek.
- [ ] Hedef: orta sınıf Android cihazda kararlı 60 FPS; düşük cihazda en az 30 FPS.

## 2.5 2D Tamamlanma Kriteri

- [x] Sirius adı/HIP koduyla aranıp doğru noktaya gidilebiliyor.
- [ ] Takımyıldızı çizgileri pan ve zoom sırasında doğru kalıyor.
- [ ] Sensör modu açılıp kapandığında gereksiz abonelik kalmıyor.
- [x] Kullanıcının sahip olduğu yıldız haritada tek dokunuşla bulunuyor.
- [ ] Android cihazda 10 dakikalık kullanımda crash veya ciddi FPS düşüşü olmuyor.

---

# Aşama 3: 2D ve 3D Arasındaki Köprü

**Amaç:** 3D geliştirmeye başlamadan önce hedef yıldız aktarımını sabitlemek.

- [ ] Ortak `StarTarget` veri modeli oluşturulacak.
- [ ] Deep link formatı belirlenecek:

```text
starcalimx://star/{starClaimCode}
starcalimx://hip/{hipId}
```

- [ ] Yıldız detayı ekranına `2D Haritada Aç` ve `3D Yolculuk` eylemleri eklenecek.
- [ ] Yıldızlarım ekranı aynı hedef modeliyle çalışacak.
- [ ] 2D ekranından 3D ekrana geçişte seçili yıldız korunacak.

---

# Aşama 4: Mobil 3D Voyage

**Amaç:** Aynı veri motoruyla gerçek koordinatlı Celestia tarzı yıldız keşfi.

## 4.1 3D Veri Motoru

- [ ] Rastgele yıldız mesafeleri kaldırılacak.
- [ ] HYG mesafeleri parsec olarak kullanılacak.
- [ ] Geçersiz veya aşırı uzak mesafeler için açık veri politikası belirlenecek.
- [ ] İlk sürümde 10.000 doğrulanmış yıldız kullanılacak.
- [ ] 120.000 yıldız hedefi ancak performans ölçümünden sonra açılacak.

## 4.2 Render Motoru

- [ ] Yıldızlar tek `THREE.Points` ve `BufferGeometry` ile çizilecek.
- [ ] Konum, spektral renk, magnitude ve sahiplik buffer attribute olarak tutulacak.
- [ ] GLSL ile fiziksel renk, parlaklık ve ekrana göre boyut uygulanacak.
- [ ] Cihaz kalite profiline göre yıldız sayısı ve efekt kalitesi değişecek.
- [ ] GL kaynakları ekran kapanırken açıkça dispose edilecek.

## 4.3 Celestia Kamera

- [ ] Pan, orbit, pinch zoom ve hedef takip kamerası geliştirilecek.
- [ ] Yıldız adı, HIP/HD ve StarClaim kodu araması eklenecek.
- [ ] Seçilen hedef için kamera rotası hesaplanacak.
- [ ] Warp yalnızca görsel efekt değil, hedefe ulaşan gerçek kamera hareketi olacak.
- [ ] Büyük mesafelerde precision jitter için floating-origin uygulanacak.
- [ ] Kullanıcı yolculuğu iptal edebilecek ve başlangıç konumuna dönebilecek.

## 4.4 Sahiplik Deneyimi

- [ ] Kullanıcının yıldızı özel halo ve işaretle gösterilecek.
- [ ] Hedefe varıldığında bilimsel bilgiler ve ebedi mesaj açılacak.
- [ ] 2D konum, 3D konum ve sahiplik kaydı aynı yıldız kimliğini kullanacak.

## 4.5 3D Tamamlanma Kriteri

- [ ] Kullanıcı kendi StarClaim kodunu yazarak yıldızını bulabiliyor.
- [ ] Warp sonunda kamera doğru yıldızın yakınında duruyor.
- [ ] Gerçek yıldız koordinatları rastgele değiştirilmeden kullanılıyor.
- [ ] GL context ekran geçişlerinde sızmıyor.
- [ ] Orta sınıf Android cihazda kararlı en az 30 FPS sağlanıyor.

---

# Aşama 5: Veri Dağıtımı ve Ölçekleme

- [ ] HYG verisi backend import pipeline ile MongoDB'ye aktarılacak.
- [ ] Mobil istemciye sürümlü ve sıkıştırılmış katalog sunulacak.
- [ ] İlk açılışta küçük temel katalog, arka planda geniş katalog indirilecek.
- [ ] JSON yerine binary `Float32Array` paketleri değerlendirilecek.
- [ ] Cache boyutu, indirme ilerlemesi ve çevrimdışı kullanım yönetilecek.
- [ ] 120.000 yıldız yalnızca ölçülmüş cihaz profillerinde etkinleştirilecek.

---

# Aşama 6: Aegis AI ve Ses

Bu aşama 2D ve 3D haritalar tamamlanmadan başlamaz.

- [ ] Aegis yalnızca seçili yıldızın bağlamını alacak.
- [ ] “Beni Sirius'a götür” komutu ortak hedef modeline çevrilecek.
- [ ] Sesli komutlar 2D merkezleme ve 3D warp eylemlerini tetikleyecek.
- [ ] Prosedürel ses ve haptik geri bildirim performans profiline bağlı olacak.

---

# Aşama 7: Satın Alma ve Sahiplik Sertleştirmesi

- [ ] Mobil satın alma gerçek checkout/payment intent akışına bağlanacak.
- [ ] AsyncStorage sahipliğin ana kaynağı olmaktan çıkarılacak.
- [ ] Backend sahiplik kaydı tek doğru kaynak olacak.
- [ ] Solana işlemleri backend siparişleriyle idempotent şekilde eşleştirilecek.
- [ ] Sertifika ve Vault kayıtları doğrulanmış siparişten sonra üretilecek.

---

## Uygulama Sırası

1. Ortak yıldız veri ve koordinat sözleşmesi
2. 2D sensör ve koordinat stabilizasyonu
3. 2D Star Walk katmanları
4. 2D performans ve cihaz testleri
5. 2D-3D hedef köprüsü
6. Gerçek koordinatlı 3D render motoru
7. Celestia kamera ve hedefe warp
8. Sahiplik, AI, ses ve ödeme sertleştirmesi

## Teknik Stack

- **Mobil:** Expo SDK 54, React Native 0.81, Expo Router
- **2D:** React Native Skia, Reanimated, Gesture Handler
- **3D:** Expo GL, Three.js, Custom GLSL
- **Astronomi:** HYG, J2000/ICRS, konum ve zaman tabanlı Alt/Az
- **Backend:** FastAPI, MongoDB
- **Blockchain:** Solana
- **AI:** Gemini, yalnızca hedef yıldız bağlamıyla

Bu planın temel ilkesi şudur: **Önce doğru ve hızlı 2D gökyüzü, sonra aynı motor üzerinde gerçek 3D yolculuk.**

---

# 18 Haziran 2026 Harita Durum Raporu ve Güncel İş Listesi

Bu bölüm kod tabanının güncel incelemesine göre hazırlanmıştır ve yukarıdaki eski durum kutularından daha günceldir. Yüzdeler yaklaşık ilerleme göstergesidir; fiziksel cihaz kabul testleri yapılmadan hiçbir harita "tamamlandı" sayılmaz.

## 2D Sky Map Durumu

**İşlevsel MVP:** yaklaşık `%80`

**Üretim ve cihaz güveni:** yaklaşık `%60`

### 2D Tamamlananlar

- [x] Skia tabanlı yıldız çizim motoru, pan, pinch zoom ve dokunarak seçim.
- [x] HYG kataloğundan normalize edilen yıldız kimliği, RA/Dec, magnitude ve spektral renk kullanımı.
- [x] Ekvatoryal harita ile konum, tarih ve saate bağlı yatay Alt/Az görünümü.
- [x] Local Sidereal Time hesabı ve ufuk altındaki nesnelerin gizlenmesi.
- [x] Kamera üstü gözlem modu; kamera izninin yalnızca ihtiyaç anında istenmesi.
- [x] Magnetometre/heading ve DeviceMotion takibi; uygulama arka plana geçtiğinde aboneliklerin kaldırılması.
- [x] Sensör kalibrasyon durumu ve gerçek/manyetik/fallback heading ayrımı.
- [x] Takımyıldızı çizgileri, isimleri, IAU sınırları, koordinat ızgarası ve yön/ufuk katmanı.
- [x] Gezegen, DSO, mitoloji, nebula ve gece görüşü katmanları.
- [x] Zoom seviyesine göre magnitude filtresi ve görüş alanı dışında çizim eleme.
- [x] Dokunma seçiminde ekran hücreli uzamsal indeks.
- [x] Basit cihaz/yıldız yoğunluğu kalite profili ve ekranda FPS ölçümü.
- [x] HIP/HD/ad/StarClaim kimliğiyle hedef bulma ve haritaya merkezleme.
- [x] Sahip olunan yıldız için altın işaret, sahiplik kodu ve 2D/3D geçişi.

### 2D Yapılacaklar

#### P0 - Doğruluk ve Hata Güvenliği

- [x] Sirius, Vega, Polaris ve Güney yarımküre örnekleriyle RA/Dec → Alt/Az regresyon testleri yazıldı.
- [x] Tarih değişimi, saat dilimi, gün dönümü ve kutup enlemleri test edildi.
- [x] Takımyıldızı çizgileri ve IAU sınırlarının RA `0/24h` geçişi ortak segment projeksiyonu ve viewport testleriyle doğrulandı.
- [ ] Kamera yönü ile yıldız projeksiyonu arasındaki cihaz rotasyonu/ekran yönü ofseti kalibre edilecek.
- [ ] Konum, kamera veya sensör izni reddedildiğinde eksiksiz fallback akışı doğrulanacak.

#### P1 - Performans ve Cihaz Profili

- [ ] Skia draw-node sayısı katman bazında ölçülecek ve geliştirici telemetrisine eklenecek.
- [ ] Kalite profili yalnızca PixelRatio/yıldız sayısına değil, ölçülen FPS ve cihaz belleğine bağlanacak.
- [ ] Takımyıldızı, sınır, DSO ve mitoloji katmanları için görünür alan elemesi genişletilecek.
- [ ] Düşük/orta/yüksek Android cihazlarda 10 dakikalık ısı, bellek, FPS ve crash testi yapılacak.
- [ ] Kabul hedefi: orta sınıf Android'de `55-60 FPS`, düşük sınıfta kararlı `30 FPS`.

#### P2 - Görsel ve Kullanım Kalitesi

- [ ] Yıldız parlaklığı, halo ve etiket yoğunluğu fiziksel cihaz ekranında ayarlanacak.
- [ ] Takımyıldızı çizgileri için seçili/seçili olmayan görsel hiyerarşi iyileştirilecek.
- [ ] Arama, katman paneli ve seçili yıldız paneli küçük ekranlarda taşma testinden geçirilecek.
- [ ] Gözlem konumu ve zamanını elle değiştirme/zaman simülasyonu eklenecek.
- [ ] Erişilebilirlik etiketleri, dokunma alanları ve gece görüşü kontrastı tamamlanacak.

### 2D Tamamlanma Kriteri

- [ ] Astronomik regresyon testleri yeşil.
- [ ] En az bir düşük, bir orta ve bir yüksek Android cihaz profili ölçülmüş.
- [ ] 10 dakikalık kamera/sensör kullanımında abonelik, GL/Skia veya bellek sızıntısı yok.
- [ ] Takımyıldızı çizgileri pan, zoom, yatay görünüm ve RA sınırında doğru.
- [ ] İzin reddi ve çevrimdışı katalog senaryoları kullanılabilir durumda.

## 3D Voyage Durumu

**İşlevsel MVP:** yaklaşık `%70`

**Tam katalog + hedef görsel kalite:** yaklaşık `%45`

### 3D Tamamlananlar

- [x] Expo GL + Three.js + custom GLSL tabanlı temiz 3D motor.
- [x] `Galaxy → Sector → Target` sahne hiyerarşisi ve animasyonlu geçişler.
- [x] HYG parsec mesafelerinden Kartezyen yıldız konumları.
- [x] `THREE.Points`, `BufferGeometry`, spektral renk, magnitude boyutu ve adaptif kalite.
- [x] Prosedürel spiral galaksi ve kaliteye göre 1-3 katmanlı nebula atmosferi.
- [x] Orbit, pan, pinch zoom, sektör yıldızı seçimi ve hedefe odaklanan kamera.
- [x] Ad, HIP, HD ve StarClaim koduyla arama.
- [x] Hedefe gerçek kamera hareketi yapan warp ve varış görünümü.
- [x] Adaptif yıldız etiketleri ve hedef kilidi.
- [x] `Yıldızlarım`, son hedefler ve kalıcı yerel hedef geçmişi.
- [x] Sahip olunan yıldızlarda altın işaret, sertifikaya dokunma ve altın-beyaz certified warp.
- [x] GL kaynaklarının ekran kapanırken dispose edilmesi ve FPS tabanlı kalite düşürme/yükseltme.

### 3D Katalog Gerçeği

- Mevcut loader HYG v4.1 indiriyor, `magnitude < 6.5` filtresi uyguluyor ve `10.000` kayıtta duruyor.
- 3D ekran en fazla `10.000` yıldız alıyor.
- Cihaz kalite profilleri aynı sahnede `3.500 / 7.000 / 10.000` yıldız çiziyor.
- Bu nedenle tüm HYG kataloğu veya Gaia yıldızları henüz 3D haritada değildir.

### 3D Yapılacaklar

#### P0 - Katalog ve Uzamsal Akış

- [x] Loader içindeki erken `10.000` sınırı kaldırıldı; tüm geçerli HYG satırları normalize edilip en parlak `10.000` çekirdek katalog olarak seçiliyor.
- [x] HYG kayıtlarına RA/Dec/logaritmik mesafe kabuğu tabanlı sektör kimliği veriliyor ve sürümlü sektör manifesti üretiliyor.
- [x] Tam HYG sektör içeriklerini gzip tile dosyalarına ve SHA-256 manifestine dönüştüren build aracı eklendi (`119.626` yıldız / `3.155` tile / `7,59 MB`).
- [x] Çekirdek katalogda hedef sektör ve komşularını seçen; eski GPU geometrisini dispose edip aktif pencereyi yükleyen LOD sistemi kuruldu.
- [x] Tam HYG tile'ları için hedef tabanlı uzak indirme, 24 tile bellek cache'i ve 96 tile kalıcı LRU cache/tahliye politikası eklendi.
- [ ] Mobil için sürümlü, sıkıştırılmış binary katalog (`Float32Array`) üretilecek.
- [x] Sürümlü uzak manifest, kalıcı manifest fallback'i ve tile endpoint'i eklendi.
- [x] Kullanıcıya kalıcı çevrimdışı mod, hazır tile sayısı, cache boyutu ve cache temizleme yönetimi gösteriliyor.
- [x] En parlak `10.000` HYG yıldızı kompakt katalog olarak uygulamaya gömüldü; ilk açılış ağ olmadan çalışıyor.
- [x] Backend doğrulamalı sahiplik/sertifika snapshot'ı SHA-256 bütünlük kontrolüyle yerelde saklanıyor.
- [x] Snapshot uygulama açılışında, öne dönüşte ve bağlantı yeniden kurulabildiğinde otomatik eşitleniyor.
- [ ] İlk ölçek hedefi tam HYG; Gaia için parlaklık/mesafe tabanlı kontrollü alt küme kullanılacak.

#### P1 - Büyük Uzay Hassasiyeti ve Navigasyon

- [ ] Büyük mesafelerde precision jitter'ı önlemek için floating-origin uygulanacak.
- [ ] Sektör geçişleri gerçek uzamsal komşuluk ve mesafe ölçeğine bağlanacak.
- [ ] Warp iptali, başlangıç noktasına dönüş ve yolculuk ilerleme durumu eklenecek.
- [x] Hedef seçim/raycast sistemi çekirdek katalogdaki aktif sektör geometrisiyle çalışacak şekilde güncellendi.
- [ ] Raycast ve seçim sistemi uzaktan yüklenen tam HYG tile'larıyla doğrulanacak.
- [ ] Yıldız kodu bulunup sektörü cihazda yoksa ilgili tile otomatik indirilecek.

#### P2 - Görsel Kalite

- [ ] Yıldız core/halo/outer-halo/diffraction görünümü cihaz profiline göre iyileştirilecek.
- [ ] Bloom benzeri kontrollü post-process, tone mapping ve pozlama sistemi değerlendirilecek.
- [ ] Nebula katmanları derinlik/parallax veya düşük maliyetli volumetrik yaklaşım ile geliştirilecek.
- [ ] Yakın hedef yıldızlarında spektral sınıfa göre farklı yüzey hareketi ve korona eklenecek.
- [ ] Galaksi görünümünde çekirdek, kollar, toz şeritleri ve uzak galaksi çeşitliliği artırılacak.
- [ ] Efektler düşük cihazlarda otomatik kapanacak; okunabilirlik efekt yoğunluğuna tercih edilecek.

#### P3 - Yıldız Sistemi ve Gezegenler

- [ ] Hedef yıldız için `Star System` alt sahnesi kurulacak.
- [ ] Bilinen exoplanet verisi varsa gerçek sistem; yoksa açıkça etiketlenmiş prosedürel sistem politikası uygulanacak.
- [ ] Gezegen LOD, atmosfer, halka, gece tarafı ve yörünge çizgileri geliştirilecek.
- [ ] `Universe/Galaxy/Sector/Star System/Planet` ölçek geçişleri tamamlanacak.

#### P4 - Üretim Doğrulaması

- [ ] Düşük/orta/yüksek cihazlarda yıldız sayısı, shader kalitesi, ısı ve bellek ölçülecek.
- [ ] GL context kaybı, uygulama arka planı ve ekran geçişleri stres testinden geçirilecek.
- [ ] Android ve iOS dokunma/pinch/orbit davranışları karşılaştırılacak.
- [ ] En az 10 dakikalık 3D kullanımda crash olmaması ve orta cihazda kararlı `30+ FPS` doğrulanacak.

### 3D Tamamlanma Kriteri

- [ ] Tam HYG katalog sektörlerden akıyor; tek seferde tüm katalog RAM/GL belleğine yüklenmiyor.
- [ ] StarClaim kodu cihazda olmayan sektörü bulup indiriyor ve doğru yıldıza götürüyor.
- [ ] Galaxy, Sector, Target ve Star System geçişleri aynı koordinat sistemini koruyor.
- [ ] Orta sınıf Android cihazda kararlı `30+ FPS`, kabul edilebilir ısı ve bellek kullanımı var.
- [ ] Fiziksel cihaz ekran görüntüleri ve ölçümleriyle görsel kalite onaylanmış.

## Güncel Uygulama Sırası

1. 3D katalog normalizasyonu ve sektör/tile veri formatı.
2. 3D kamera tabanlı LOD yükleme/boşaltma.
3. 2D astronomik regresyon testleri ve RA sınırı düzeltmeleri.
4. 2D/3D fiziksel cihaz performans profilleri.
5. 3D floating-origin ve uzun mesafe navigasyonu.
6. 3D görsel kalite geçişi: yıldız, nebula, pozlama ve galaksi.
7. Star System/Planet alt sahnesi.
8. Backend sahiplik senkronizasyonu, çevrimdışı katalog ve mağaza kabul testleri.

## Bir Sonraki Cerrahi Paket

**Floating-origin navigasyon paketi:** Büyük parsec mesafelerinde kamera ve yıldız konumlarını aktif hedef çevresinde yeniden merkezleyerek precision jitter'ı azaltmak; warp, orbit ve sektör geçişlerini aynı koordinat sözleşmesinde tutmak.
