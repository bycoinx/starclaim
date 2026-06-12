# StarClaim Strategic Vortex Plan

Bu belge StarClaim'in mevcut kod tabanına göre hazırlanmış uygulama planıdır. Öncelik, mobil uygulamada önce güvenilir bir 2D gökyüzü haritası, ardından aynı astronomik veri motorunu kullanan Celestia tarzı 3D yıldız yolculuğu geliştirmektir.

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
- [ ] HIP, HD, isim ve StarClaim kodu ile ortak arama indeksi kurulacak.
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

- [ ] Birim testleri Sirius, Vega ve Polaris gibi bilinen yıldızlarla yapılacak.

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
- [ ] Sensör kalibrasyon durumu kullanıcıya gösterilecek.

## 2.3 Star Walk Görsel Katmanları

- [x] Takımyıldızı çizgileri varsayılan olarak açık olacak.
- [ ] Takımyıldızı isimleri ve sınırları ayrı katmanlar olacak.
- [ ] Yıldız isimleri zoom seviyesine göre gösterilecek.
- [ ] Gezegenler, DSO'lar ve mitoloji görselleri katman menüsünden yönetilecek.
- [ ] Gece görüşü için kırmızı ışık modu eklenecek.
- [ ] Seçilen yıldız için alt bilgi paneli oluşturulacak.
- [ ] Sahip olunan yıldız altın işaret ve StarClaim koduyla vurgulanacak.

## 2.4 2D Performans

- [ ] Görüş alanı dışındaki yıldızlar çizim listesine alınmayacak.
- [ ] Zoom seviyesine göre magnitude eşiği uygulanacak.
- [ ] Dokunma seçimi için tüm kataloğu taramak yerine uzamsal indeks kullanılacak.
- [ ] Skia draw node sayısı ölçülecek ve cihaz sınıfına göre kalite profili seçilecek.
- [ ] Hedef: orta sınıf Android cihazda kararlı 60 FPS; düşük cihazda en az 30 FPS.

## 2.5 2D Tamamlanma Kriteri

- [ ] Sirius adı/HIP koduyla aranıp doğru noktaya gidilebiliyor.
- [ ] Takımyıldızı çizgileri pan ve zoom sırasında doğru kalıyor.
- [ ] Sensör modu açılıp kapandığında gereksiz abonelik kalmıyor.
- [ ] Kullanıcının sahip olduğu yıldız haritada tek dokunuşla bulunuyor.
- [ ] Android cihazda 10 dakikalık kullanımda crash veya ciddi FPS düşüşü olmuyor.

---

# Aşama 3: 2D ve 3D Arasındaki Köprü

**Amaç:** 3D geliştirmeye başlamadan önce hedef yıldız aktarımını sabitlemek.

- [ ] Ortak `StarTarget` veri modeli oluşturulacak.
- [ ] Deep link formatı belirlenecek:

```text
starclaim://star/{starClaimCode}
starclaim://hip/{hipId}
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
