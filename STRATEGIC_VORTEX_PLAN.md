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

## P0 Uygulama Kilidi: Önce 2D Render ve Veri Katmanı

Bu bölüm, diğer bütün geliştirme maddelerinden daha yüksek önceliklidir.

- **3D geliştirme donduruldu:** Mobil 2D harita aşağıdaki tamamlanma kapısını yüzde yüz geçmeden 3D haritaya yeni özellik, görsel efekt, katalog veya navigasyon geliştirmesi yapılmayacak.
- **Web görsel geliştirmesi ertelendi:** 2D render ve veri katmanı üretim güvenine ulaşana kadar yaşayan evren/web arka plan paketi başlatılmayacak.
- **Tek paket, tek doğrulama:** Her adım kodlanacak, otomatik testten geçirilecek, fiziksel cihazda doğrulanacak ve kabul kriteri kapatıldıktan sonra sonraki adıma geçilecek.
- **Yüzde tahmini yeterli değildir:** Bir aşama ancak veri bütünlüğü, çevrimdışı davranış, render kararlılığı ve cihaz testi kanıtlandığında tamamlanmış sayılacak.

### Zorunlu Uygulama Sırası

#### P0.1 - 2D Render Motoru Üretim Kararlılığı

- [ ] Harita, sensör ve kamera modları arasında art arda geçişlerde donma veya render kaybı yok.
- [ ] Uygulama ön plan/arka plan geçişi ve ekran döndürme sonrasında çizim yüzeyi geri geliyor.
- [ ] Skia/Reanimated abonelikleri ekran kapanırken eksiksiz temizleniyor.
- [ ] 10 dakikalık Harita/Sensör/Kamera testinde crash, bellek artışı veya kontrol kaybı yok.
- [ ] Düşük, orta ve yüksek cihaz profillerinde yıldız/düğüm sayısı otomatik ve güvenli ayarlanıyor.
- [ ] Orta sınıf fiziksel Android cihazda hedef FPS, açılış süresi, bellek ve ısı ölçümleri kaydediliyor.

#### P0.2 - Kanonik Astronomik Veri Sözleşmesi

- [ ] Bütün kaynaklar için ortak kayıt şeması kesinleştirilecek: `source`, `sourceId`, `gaiaSourceId`, `hip`, `hd`, `ra`, `dec`, `parallax`, `distanceParsec`, `magnitude`, `colorIndex`, `spectralType`, `epoch`.
- [ ] Birim, epoch ve koordinat kuralları J2000/ICRS temelinde belgelenip otomatik testlerle korunacak.
- [ ] Aynı yıldızın HYG, Hipparcos ve Gaia kayıtları tek kanonik kimlik altında birleştirilecek.
- [ ] Eksik, geçersiz ve çelişkili paralaks/mesafe kayıtları için açık normalizasyon politikası uygulanacak.

#### P0.3 - Gaia DR3 + Hipparcos Veri Hattı

- [ ] Gaia DR3 için tarayıcıya veya telefona ham katalog yüklemeyen çevrimdışı build/import hattı kurulacak.
- [ ] Hipparcos, ayrı kopya katalog yerine Gaia ile çapraz kimlik ve geriye dönük arama kaynağı olarak kullanılacak.
- [ ] İlk Gaia alt kümesi; parlak, yakın, HIP eşleşmeli ve StarClaim kataloğunda kullanılan yıldızlardan üretilecek.
- [ ] Gaia `source_id`, RA/Dec, paralaks, G magnitude, BP-RP renk indisi ve kalite alanları normalize edilecek.
- [ ] HYG çekirdek katalog güvenli fallback olarak korunacak; Gaia yüklenemezse 2D harita boş kalmayacak.
- [ ] Kaynak sürümü, kayıt sayısı, SHA-256 bütünlüğü ve üretim tarihi manifestte tutulacak.

#### P0.4 - Mobil Binary Katalog ve Tile Sistemi

- [ ] JSON çalışma formatı yerine `Float32Array`/typed-array tabanlı sıkıştırılmış mobil katalog üretilecek.
- [ ] Gökyüzü sektörleri görüş alanına göre yüklenip boşaltılacak; bütün katalog RAM'e alınmayacak.
- [ ] Çekirdek katalog çevrimdışı gömülü, geniş katalog sürümlü ve doğrulanmış tile'lar halinde sunulacak.
- [ ] Cache boyutu, LRU tahliyesi, bozuk tile kurtarma ve sürüm yükseltme davranışları test edilecek.
- [ ] Ad, HIP, HD, Gaia source ID ve StarClaim kodu aynı arama indeksinden çözülecek.

#### P0.5 - Gaia/HIP Verisinin 2D Motora Tam Bağlanması

- [ ] Yıldız konumu gerçek RA/Dec, gözlemci konumu ve zamandan doğru Alt/Az değerine çevrilecek.
- [ ] Yıldız boyutu katalog magnitude değerinden; renk Gaia BP-RP veya güvenilir spektral veriden üretilecek.
- [ ] Pan, zoom, seçim, etiket, takım yıldızı ve ufuk filtreleri yeni kanonik kimliklerle çalışacak.
- [ ] Harita, sensör ve kamera modları aynı yıldızı aynı konum ve kimlikle gösterecek.
- [ ] Katalog yükleme sürerken düşük maliyetli çekirdek görünüm kesintisiz kalacak.

#### P0.6 - Messier ve NGC Derin Uzay Katmanı

- [ ] Elle yazılmış altı nesnelik liste yerine sürümlü Messier kataloğu eklenecek.
- [ ] Mobil için kontrollü ve doğrulanmış NGC alt kümesi hazırlanacak.
- [ ] DSO kayıtları tür, RA/Dec, açısal boyut, magnitude, yönelim ve katalog kimliği taşıyacak.
- [ ] Yıldız ve DSO seçim/arama sonuçları kimlik çakışması olmadan birlikte çalışacak.
- [ ] DSO görünürlüğü zoom, yüzey parlaklığı ve cihaz kalite profiline göre sınırlandırılacak.

#### P0.7 - 2D Üretim Tamamlanma Kapısı

- [ ] Astronomik referans yıldızları farklı tarih, konum ve saatlerde doğrulanmış.
- [ ] Gaia/HIP çapraz eşleşme, tekrar kayıt ve kimlik çözümleme testleri geçiyor.
- [ ] Çevrimiçi, çevrimdışı, ilk kurulum ve bozuk cache senaryoları geçiyor.
- [ ] Harita/Sensör/Kamera geçişleri fiziksel Android ve iOS cihazlarda doğrulanmış.
- [ ] Düşük, orta ve yüksek cihazlarda kabul edilen FPS, bellek ve ısı sınırları sağlanmış.
- [ ] Kullanıcı tarafından 2D görsel kalite ve temel gözlem akışı onaylanmış.

**3D geçiş kuralı:** Yukarıdaki P0.1-P0.7 başlıklarının tamamı `[x]` olmadan 3D geliştirme sırasına geçilmeyecek.

**Exoplanet Archive kararı:** Exoplanet verisi `Star System → Planet` aşamasına aittir. 2D tamamlandıktan ve 3D yıldız sistemi alt sahnesi kurulmaya başlandıktan sonra entegre edilecek; mevcut P0 sırasını bölmeyecek.

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
- **Blockchain:** Mobil entegrasyon geçici olarak devre dışı; backend geçmiş uyumluluğu korunuyor.
- **AI:** Gemini, yalnızca hedef yıldız bağlamıyla

Bu planın temel ilkesi şudur: **Önce doğru ve hızlı 2D gökyüzü, sonra aynı motor üzerinde gerçek 3D yolculuk.**

---

# 18 Haziran 2026 Harita Durum Raporu ve Güncel İş Listesi

Bu bölüm kod tabanının güncel incelemesine göre hazırlanmıştır ve yukarıdaki eski durum kutularından daha günceldir. Yüzdeler yaklaşık ilerleme göstergesidir; fiziksel cihaz kabul testleri yapılmadan hiçbir harita "tamamlandı" sayılmaz.

## 2D Sky Map Durumu

**İşlevsel MVP:** yaklaşık `%90`

**Üretim ve cihaz güveni:** yaklaşık `%72`

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
- [ ] Kamera yönü ile yıldız projeksiyonu arasındaki cihaz rotasyonu/ekran yönü ofseti yazılımda eklendi; fiziksel cihaz kalibrasyonu doğrulanacak.
- [ ] Konum, kamera veya sensör izni reddedildiğinde dokunmatik haritaya fallback eklendi; fiziksel cihazda izin senaryoları doğrulanacak.

#### P1 - Performans ve Cihaz Profili

- [x] Skia draw-node sayısı yıldız, ızgara, takımyıldızı, sınır, DSO, gezegen, mitoloji ve arka plan katmanları için tahmin edilip geliştirici telemetrisine eklendi.
- [x] Kalite profili PixelRatio/katalog yoğunluğuna ek olarak ölçülen FPS ve kullanılabildiğinde JS heap baskısına bağlandı; düşürme/yükseltme histerezisi eklendi.
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

1. 2D Harita/Sensör/Kamera donma ve yaşam döngüsü testlerini kapat.
2. Kanonik astronomik veri sözleşmesini ve regresyon testlerini tamamla.
3. Gaia DR3 + Hipparcos çapraz eşleştirme build/import hattını kur.
4. Sıkıştırılmış binary katalog, manifest ve sektör/tile sistemini tamamla.
5. Gaia/HIP verisini 2D konum, magnitude, renk, arama ve seçim akışına bağla.
6. Messier ve kontrollü NGC derin uzay katmanını tamamla.
7. Çevrimdışı/cache senaryoları ile Android/iOS fiziksel cihaz kabul testlerini kapat.
8. P0.1-P0.7 tamamlanma kapısını kullanıcı onayıyla kapat.
9. Yalnızca bundan sonra 3D veri ve render geliştirmesine dön.
10. 3D Star System aşamasında NASA Exoplanet Archive entegrasyonunu başlat.

## Bir Sonraki Cerrahi Paket

**19 Haziran 2026 arayüz önceliği:** Mobil, web ve 2D Sky Live referanslarının projeye uyarlanmış ayrıntılı uygulama planı [docs/STARCLAIM_EXPERIENCE_REDESIGN_PLAN.md](docs/STARCLAIM_EXPERIENCE_REDESIGN_PLAN.md) dosyasına eklendi.

**Tamamlandı:** Mobil P0 kabuk ve Solana görünürlük temizliği; safe-area/system bar koruması, çift alt menü temizliği, responsive marketplace ve açık 3D yükleme/hata durumları eklendi. Beş hedefli mobil navigasyon, profil merkezi, ortak header ölçüleri ve premium gözlem kabuğu kuruldu. Finansal dashboard kaldırılarak sahipliğe göre kişiselleşen sinematik mobil ana ekran eklendi. 2D Sky Live, mevcut Skia ve astronomi motoru korunarak pusula, gözlem araçları ve katmanlı yıldız vurgusuyla yenilendi.

**20 Haziran 2026 katalog hotfix'i:** Android AsyncStorage tek-kayıt sınırına takılan şişirilmiş `10.000` yıldız önbelleği kaldırıldı. 2D Sky Live ve 3D Evren artık doğrudan uygulamaya gömülü HYG çekirdek kataloğuyla çevrimdışı açılır; uzak API boş veya erişilemez olduğunda geçerli yerel veri korunur. Tamamlanmamış AR ve doğrudan satın alma girişleri katalog arayüzünden gizlendi.

**20 Haziran 2026 cihaz güveni paketi:** 2D Skia ve 3D GL yüzeylerine ilk gerçek frame, FPS, kalite, açılış süresi, katalog/render yıldız sayısı ve mevcutsa JS heap ölçümü eklendi. Ölçümler cihazda son `20` oturumla sınırlandırıldı. İlk sürümde 2D için `8 sn`, 3D için `12 sn` render gözcüsü eklenmişti; fiziksel cihazda çalışan 2D yüzeyi yanlışlıkla kapattığı görülen süre tabanlı 2D gözcüsü daha sonra kaldırıldı. Gerçek render hataları hata sınırıyla, 3D açılış sorunları kontrollü yeniden deneme durumuyla ele alınır.

**20 Haziran 2026 fiziksel cihaz düzeltmeleri:** Skia `2.2.12` tarafından sunulmayan `useFrameCallback`, Reanimated `4.1.7` kaynağına taşınarak Sky Live render çökmesi giderildi. Hata halinde gözlem kontrollerinin hata paneline binmesi engellendi. Mobil katalog filtreleri HYG verisine uygun `Tümü / İsimli / 20 pc içi` seçeneklerine çevrildi; Güneş mesafesi yerel sistem olarak gösterildi. 3D sektör pozlaması düşürüldü, sahne kontrolleri merkezden sol alta taşındı ve StarVault boş durum eylemi kısa yatay ekrana sığdırıldı.

Sıradaki cerrahi paket **P0.1 - 2D Render Motoru Üretim Kararlılığı**dır. Önce son Harita/Sensör/Kamera düzeltmesi fiziksel cihazda doğrulanacak; ardından yaşam döngüsü ve 10 dakikalık stres testi kapatılacaktır.

**Ertelenen paketler:** Web yaşayan evren motoru, 3D floating-origin, 3D görsel kalite ve Star System/Planet geliştirmeleri P0.1-P0.7 tamamlanma kapısından sonra ele alınacaktır.
