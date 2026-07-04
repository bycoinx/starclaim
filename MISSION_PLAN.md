# Superseded Notice

This file is now an archived historical roadmap. The current source of truth is `STARCLAIM_UNIFIED_EXECUTION_PLAN.md`.

---

# 🛰️ StarCalimX: Mission Plan (Infinite Voyage Edition)

Bu döküman, projenin "Hatasız ve Kusursuz" ilerlemesi için hazırlanan ana yol haritasıdır. Yeni vizyonumuzla birlikte Web tarafı sinematik bir "Gözlemci", Mobil tarafı ise yüksek kaliteli bir "3D Kokpit" olarak konumlandırılmıştır.

---

## ✅ Tamamlanan Aşamalar (Current Status)

### Phase 1-6: Temel Altyapı & Backend
- [x] **Backend & API:** FastAPI tabanlı ölçeklenebilir sunucu mimarisi kuruldu.
- [x] **Database:** MongoDB üzerinde 10.000+ gerçekçi yıldız verisi (HIP/HD) indexlendi.
- [x] **AI Support (Aegis):** Gemini 1.5 Pro entegreli akıllı destek terminali (J.A.R.V.I.S.) yayına alındı.
- [x] **Stellar Blockchain:** Solana/Anchor akıllı sözleşmeleri (Royalty, Refund, Purchase) hazır.

### Phase 10-15: Mobil Geliştirme (AAA Polish)
- [x] **Aegis HUD UI:** Landscape (yatay) modda çalışan, kavisli HUD ve cam efektli kokpit tasarımı tamamlandı.
- [x] **Hybrid Mapping:** 2D harita üzerinde Güneş Sistemi nesneleri ve Derin Uzay Nesneleri (DSO) aktif.
- [x] **StarDetail 2.0:** Sahiplenilen yıldızlar için telemetri verileri, ebedi mesaj mühürleme ve paylaşım özelliği eklendi.
- [x] **Discovery Hub:** Profesyonel keşif ekranı ve kategori bazlı navigasyon sistemi kuruldu.

---

## 🚀 Yeni Strateji: Project Aegis 2.0

**Vizyon:** Web bir "Pencere" (Demo/Stratejik Görünüm), Mobil ise bir "Kokpit" (Tam Deneyim/Satın Alma Merkezi).

### Phase 20: Core Space Engine (Ortak 3D Altyapı)
- [ ] **Task 20.1: Universal Coordinate System**
    - [ ] RA/Dec/Distance verilerini X, Y, Z uzay koordinatlarına çeviren matematiksel motorun stabilizasyonu.
- [ ] **Task 20.2: Procedural Star Shaders**
    - [ ] React Three Fiber için hafif, Spectral Type bazlı (O, B, A, F, G, K, M) yıldız shader'larının yazılması.
- [ ] **Task 20.3: Performance Tuning**
    - [ ] 10.000+ yıldızın akıcı render edilmesi için Frustum Culling ve Instanced Mesh optimizasyonu.

### Phase 21: Web Reconstruction (The Strategic Observer)
- [ ] **Task 21.1: Web Harita Temizliği**
    - [ ] Mevcut düşük performanslı 3D haritanın kaldırılması ve Three.js altyapısının sıfırdan kurulması.
- [ ] **Task 21.2: Cinematic Star Browser**
    - [ ] Web ana sayfasında kullanıcıyı "büyüleyecek" ve mobili indirmeye teşvik edecek sinematik 3D sekanslar.
- [ ] **Task 21.3: Bridge to Mobile**
    - [ ] Web üzerinden yıldız seçen kullanıcının, QR kod veya derin link (Deep Link) ile mobildeki satın alma noktasına yönlendirilmesi.

### Phase 22: Mobile Hub (The Tactical Cockpit 3D)
- [ ] **Task 22.1: 3D Navigation Module**
    - [ ] `explore/3dmap.js` ile "Celestia" tarzı interaktif 3D navigasyonun mobil uygulamaya entegre edilmesi.
- [ ] **Task 22.2: The Warp Jump Experience**
    - [ ] Satın alma/İnceleme anında yıldıza doğru yapılan ışık hızı (Warp) animasyonunun geliştirilmesi.
- [ ] **Task 22.3: Audio-Visual Immersion**
    - [ ] Uzay ambiyansı ses motoru (Ambient Engine) ve haptik geri bildirimlerin eklenmesi.

### Phase 23: Production Hardening & Launch
- [ ] **Task 23.1: Final Optimization**
    - [ ] Uygulama boyutunun (Bundle Size) 50MB altında tutulması için asset sıkıştırma.
- [ ] **Task 23.2: Multi-Platform Sync**
    - [ ] Web ve Mobil arasındaki sahiplik verilerinin WebSocket/Real-time DB ile senkronizasyonu.
- [ ] **Task 23.3: Grand Deployment**
    - [ ] Google Play ve App Store hazırlıklarının tamamlanması.

---

*Not: Bu dosya her başarılı görevden sonra cerrahi bir titizlikle güncellenecektir.*

---

## **StarVault — Görsel Mimari (MVP)**

Amaç: Web tarafında `StarVault` bölümünün görsel mimarisini tamamlamak; kullanıcı oturum/konneksiyon durumlarına göre gösterimleri planlamak ve UI bileşenlerini oluşturmak. Blockchain ve tam on-chain entegrasyonları daha sonra bağlanacak şekilde, MVP olarak görsel katmanı ve etkileşim yer tutucularını hazır hale getireceğiz.

### 1) Temel UX Durumları
- **Ziyaretçi / Oturum Açılmamış (Guest):**
    - Hero bölümünde kısa tanıtım, `Sign in with Google` CTA ve `Marketplace` erişimi.
    - İstatistikler örnek/placeholder değerlerle gösterilir.
    - Yıldız kartlarında aksiyon düğmeleri yerdeyken butonlar `Sign in to claim/view` gibi yönlendirici mesaj içerir.

- **Oturum Açmış / Cüzdan Bağlı Değil:**
    - Hesap bilgisi (avatar, isim/email) görünür.
    - Sağ tarafta `VaultWalletPanel` ile `Connect Wallet` butonu ve desteklenen cüzdan ikonları (Phantom, Solflare, MetaMask) gösterilir.
    - Zincir-üst (on-chain) aksiyonlar (Mint, Transfer) devre dışı olur; tooltip ile `Connect wallet to enable` gösterilir.

- **Cüzdan Bağlı (Wallet Connected):**
    - Cüzdan adresi (kısaltılmış), ağ bilgisi ve bakiye (SOL/XCX) gösterilir.
    - `VaultNFTGrid` sahibi olunan NFTleri/ yıldızları listeler; her kartta on-chain durum (minted / not minted), sertifika ve listeleme aksiyonları görünür.
    - `VaultActions` tamamen etkinleşir: Secure Vault, Time Capsule, Publish Certificate, Authorize Transfer, Invite Keeper.

- **Gelişmiş: Cüzdan + Backend Hesap Eşlenmiş:**
    - Cüzdan ve kullanıcı hesabı linklenmiş gösterilir; `Sync ownership` butonu ile on-chain ve backend sahiplik kaydı senkronize edilebilir.

### 2) Masaüstü Görünüm Düzeni
- Üst: `VaultHero` (geniş görsel + istatistik satırı).
- Ana alan: iki kolonlu düzen (sol: NFT ızgarası ve içerik; sağ: sticky `VaultWalletPanel`, Featured Star, quick-links).
- Alt bölümler: Sertifikalar carousel, Hikayeler/Timeline, Legacy Actions kart grubu.

### 3) Mobil Uyarlama
- Tek sütun: Hero → Wallet Panel → NFT Grid → Sertifikalar (yatay scroller) → Actions.
- Ekranın altında yüzen bir CTA (floating) — `Connect Wallet` veya `Open Vault Actions`.

### 4) Gerekli Bileşenler (MVP)
- `VaultHero` (mevcut geliştirme: CTA durumları ile)
- `VaultWalletPanel` (connect / status / balances)
- `VaultNFTGrid` ve `VaultNFTCard` (on-chain durum, sertifika, listeleme)
- `VaultActions` (legacy action düğmeleri, tooltip ve durum kontrolleri)
- `VaultEmptyState` (kullanıcıya ne yapacağı anlatan rehber)
- `WalletConnectModal` (MVP için mock-connect özellikli)

### 5) Veri Şeması (frontend mock)
- Star/NFT: `{ starId, name, code, tier, previewImage, isClaimed, ownerName, price, forSale, askingPrice, certificateUrl, storyCount, raw }`
- Wallet: `{ provider, address, network, balances: { sol, xcx }, connectedAt }`

### 6) Entegrasyon Yer Tutucuları (API'ler)
- `GET /api/stars/mine/list` — sahip olunan yıldızlar (var)
- `POST /api/vault/upload` — vault blob yükleme (demo endpoint eklendi)
- `POST /api/marketplace/list` — listeleme (var)
- `GET /api/orders/certificate/{orderId}` — sertifika indir (var)

### 7) Adım Adım Uygulama Planı (önceliklendirilmiş)
1. `VaultWalletPanel`, `VaultNFTGrid`, `VaultActions` bileşenlerinin iskeletini oluştur (mock verilerle). (1-2 saat)
2. `WalletConnectModal` ekle ve lokal mock bağlanma (localStorage/session) sağlayarak üç durumu test et (guest / signed-in / wallet-connected). (1 saat)
3. `Vault.jsx` içinde yeni bileşenleri entegre et; `StarRepository.getOwnedStars()` ile gerçek veri bağla (fallback sample varsa kullan). (1 saat)
4. Stil ve responsive düzenlemeler, erişilebilirlik kısa kontrolleri. (2 saat)
5. Manuel QA — seninle birlikte görsel onay + küçük düzeltmeler. (1 saat)

Tahmini MVP toplam çalışma: 6–8 saat (parçalanabilir sprintlere bölünebilir).

---

Eğer onaylarsan, 1. adımı şimdi uygulamaya başlıyorum: `VaultWalletPanel`, `VaultNFTGrid`, `WalletConnectModal` iskeletlerini oluşturacağım ve `Vault.jsx` içine yerleştirip mock durumlarla test edeceğim. İlerlemesini adım adım paylaşırım.
