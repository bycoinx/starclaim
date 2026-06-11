# 🌌 StarClaim: Strategic Vortex Plan (Aegis 2.0)

Bu plan, StarClaim projesini "Celestia" kalitesinin üzerine çıkarmak için hazırlanan, yüksek performanslı 3D motoru, gerçek astronomik veriler ve Gemini AI entegrasyonunu hedefleyen radikal bir yol haritasıdır.

---

## 🧭 Vizyon: "Seamless Universal Exploration"
Web bir stratejik pencere, Mobil ise bir "3D Kuantum Kokpit" olarak çalışır. Hedef: 120.000+ yıldızı 60 FPS'de mobil cihazlarda akıcı şekilde render etmek ve Gemini AI ile interaktif bir planetaryum deneyimi sunmak.

---

## 🛠️ Faz 1: Astronomik Veri Katmanı (HYG 4.2 Integration)
- **Hedef:** 120.000 gerçek yıldız verisinin (HIP/HD) sisteme entegrasyonu.
- [ ] **Task 1.1: MongoDB Pipeline**
    - `scripts/importHYG.js` ile CSV verilerini MongoDB'ye aktaracak scriptin yazılması.
    - `ra_hours * 15` dönüşümü ve `dist >= 100000` filtrelemesi.
- [ ] **Task 1.2: Coordinate Transformation Engine**
    - Astronomik koordinat sistemini Three.js sistemine (`x=xa, y=za, z=-ya`) çeviren matematiksel motorun kurulması.
    - Ölçekleme: 1 Parseck = 0.1 Three.js Birimi.

## 🎇 Faz 2: 3D Render Motoru (High-Performance Engine)
- **Hedef:** Minimum Draw Call ile maksimum görsel kalite.
- [ ] **Task 2.1: THREE.Points Optimization**
    - Binlerce yıldızı tek bir draw call ile çizmek için `BufferGeometry` ve `Points` kullanımı.
- [ ] **Task 2.2: Custom GLSL Shaders**
    - Yıldız ışıltısı (Glow) ve mesafeye göre boyutlanma (`gl_PointSize`) için vertex/fragment shader yazımı.
- [ ] **Task 2.3: Spectral Color Mapping**
    - Spektral tiplere (O, B, A, F, G, K, M) göre yıldızların fiziksel renklerinin (O: Mavi, M: Kırmızı vb.) shader seviyesinde işlenmesi.
- [ ] **Task 2.4: Additive Blending & Bloom**
    - Yoğun yıldız bölgelerinde gerçekçi parlaklık için `AdditiveBlending` ve `@react-three/postprocessing` Bloom entegrasyonu.

## 🛸 Faz 3: Navigasyon & Logaritmik Kamera (The Celestia Experience)
- **Hedef:** Galaksiler arası boyuttan metre seviyesine kesintisiz (seamless) zoom.
- [ ] **Task 3.1: Logarithmic Camera Controller**
    - Standart OrbitControls yerine, devasa ölçek farklarını yönetebilen özel bir `CameraController` yazılması.
- [ ] **Task 3.2: Warp Jump Experience**
    - Bir yıldıza tıklandığında yapılan ışık hızı seyahat animasyonunun 3D sahneye entegre edilmesi.

## 🧠 Faz 4: Gemini AI Entegrasyonu (Aegis Star Guide)
- **Hedef:** J.A.R.V.I.S. benzeri akıllı asistanın yıldız verileriyle eğitilmesi.
- [ ] **Task 4.1: HYG Context Injection**
    - Gemini API'ye 120.000 yıldızın meta verilerini enjekte ederek "Canlı Planetaryum Rehberi" oluşturulması.
- [ ] **Task 4.2: Multimodal Interaction**
    - Sesli veya yazılı komutlarla ("Aegis, beni Sirius'a götür") harita kontrolü.

## ⛓️ Faz 5: StarClaim Unique Ecosystem
- **Hedef:** Blockchain ve Web-Mobile köprüsünün tamamlanması.
- [ ] **Task 5.1: Stellar Proof of Ownership**
    - Sahiplenilen yıldızların 3D haritada özel olarak işaretlenmesi (InstancedMesh ile yüksek detaylı render).
- [ ] **Task 5.2: Web-Mobile Bridge (QR/DeepLink)**
    - Web üzerinden seçilen yıldızın mobildeki 3D sahneye doğrudan aktarılması.

## ⚙️ Faz 6: İleri Seviye Optimizasyon & İmmersiyon
- **Hedef:** Mobil cihazlarda kusursuz performans ve derin atmosfer.
- [ ] **Task 6.1: Binary Star Stream (Fast Data)**
    - 120k yıldız verisinin JSON yerine `Float32Array` (Binary) formatında transfer edilmesi (%70 bant genişliği tasarrufu).
- [ ] **Task 6.2: Floating Origin System**
    - Uzay seyahatlerinde yaşanan titremeleri (precision jitter) önlemek için koordinat sisteminin periyodik olarak sıfırlanması.
- [ ] **Task 6.3: Hybrid RAG for Aegis AI**
    - Tüm veriyi göndermek yerine, sadece tıkladığın yıldızın bilgisini Gemini'ye aktaran akıllı RAG yapısı.
- [ ] **Task 6.4: Cockpit Soundscape (Procedural Audio)**
    - Yıldızların spektral tiplerine göre (O: Tiz, M: Pes) prosedürel uzay ambiyans ses motorunun entegrasyonu.

---

## 📈 Teknik Stack Özeti
- **Data:** HYG 4.2 / MongoDB
- **3D:** React Three Fiber / Three.js / Custom GLSL
- **Mobile:** Expo (Dev Client)
- **AI:** Gemini 2.0
- **Blockchain:** Solana (Anchor)

*Bu plan, projenin yeni 'Anayasası' olarak kabul edilmiştir.*
