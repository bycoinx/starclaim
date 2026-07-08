# Emergent Mobile 2D Execution Plan

Tarih: 2026-07-07
Durum: Aktif
Amac: Mobil uygulamayi calisir, test edilir ve 2D Sky Live'i planlanan uretim seviyesine tasimak.

---

## 1) Kaynak ve Oncelik Sirasi

Bu plan, asagidaki dokumanlar okunarak olusturuldu ve celiski durumunda su sirayi takip eder:

1. STARCLAIM_UNIFIED_EXECUTION_PLAN.md (tek ana kaynak)
2. MOBILE_2D_ACCEPTANCE_CHECKLIST.md (kabul kapisi)
3. docs/STARCLAIM_EXPERIENCE_REDESIGN_PLAN.md (UI/UX yonu)
4. STARCLAIM_PLATFORM_ARCHITECTURE_PLAN.md (uzun vadeli veri kontrati)
5. P0_8_2_3D_STAR_RENDERING_SPECIFICATION.md, P0_8_3D_VOYAGE_SPECIFICATION.md, P0_8_4_DSO_SPECIFICATION.md, P0_8_4b_INTEGRATION_GUIDE.md, P0_8_5a_INTEGRATION_GUIDE.md, P0_8_5b_DSO_EXPANSION_PLAN.md (3D referans, simdilik ikincil)
6. MISSION_PLAN.md (arsiv)

Karar: 3D ana gelistirme simdilik beklemede. Once mobil 2D uretim kalitesi ve fiziksel cihaz kabul kapisi kapanacak.

---

## 2) Hedef Cikti (Business + Teknik)

### Business hedefleri
- Kullanici uygulamayi acinca crash almadan ana akislara ulasir.
- 2D Sky Live, planetarium benzeri stabil ve okunabilir olur.
- Satin alma -> sahiplik -> StarVault -> Sky Live isaretleme akisi tutarli calisir.

### Teknik hedefler
- Route/Deep link, tile cache, offline fallback, sensor lifecycle sorunsuz.
- Otomatik testler temiz, fiziksel cihaz testleri belgeli.
- Kod tabani repository/store kontratlarina sadik, ekranlar dogrudan daginik API baglantisi yapmaz.

---

## 3) Emergent'e Verilecek Net Gorev Tanimi

Asagidaki metni Emergent'e oldugu gibi verebilirsin:

"""
You are working on StarClaim mobile (Expo Router, React Native, Skia).
Your mission is NOT to redesign from scratch. Your mission is to harden and complete the existing mobile 2D Sky Live production path.

Hard constraints:
- Source of truth: STARCLAIM_UNIFIED_EXECUTION_PLAN.md and MOBILE_2D_ACCEPTANCE_CHECKLIST.md.
- Keep existing architecture and naming (routes, stores, repositories) unless a bug forces a focused refactor.
- Do not restart 3D work before 2D acceptance gates are fully closed.
- Preserve deep link contracts and ownership flow.

Primary outcomes:
1) App boots reliably and key tabs work: Claim, Sky Live, Universe, Vault, Profile.
2) Sky Live is stable on real devices (permission denied fallback, lifecycle resume, offline tile fallback, 10-minute run).
3) All automated checks pass and physical-device evidence is documented.

Execution style:
- Work in small, reviewable commits.
- After each milestone, run tests and append evidence to MOBILE_2D_ACCEPTANCE_CHECKLIST.md.
- If a tradeoff appears, choose stability and deterministic behavior over visual complexity.
"""

---

## 4) Uygulanacak Fazlar (Detayli)

## Faz 0 - Baseline ve Calisma Ortami Sertlestirme (0.5 gun)

Amac: "calismiyor" durumunu ortadan kaldirmak ve tekrar uretilebilir bir baseline almak.

Adimlar:
1. Mobil bagimliliklari temiz kur:
   - cd mobile
   - npm ci
2. Baslangic kontrolleri:
   - npm run test:astronomy
   - npx expo-doctor
3. Android calisma dogrulamasi:
   - npm run android
4. Sorun varsa once build/runtime blocker fix et, UI polish beklesin.

Tamamlanma kriteri:
- test:astronomy yesil
- expo-doctor temiz
- uygulama emulator/cihazda aciliyor

## Faz 1 - Navigasyon ve Deep Link Guvencesi (0.5-1 gun)

Amac: Tum ana akislari route builder ile deterministic hale getirmek.

Kontrol alanlari:
- mobile/src/platform/navigation/routes.js
- mobile/app/(tabs)/_layout.js
- mobile/app/(tabs)/sky.js
- mobile/app/(tabs)/universe.js
- mobile/app/(tabs)/claim.js
- mobile/app/(tabs)/vault/home.js

Adimlar:
1. Tab keyleri ve active tab resolve kurallari testlerle dogrula.
2. Sky ve starmap path eslesmelerini tek kural setine indir.
3. Deep link acilislarinda hedef resolve fallback ekle (star code, hip, vault item).

Tamamlanma kriteri:
- navigation testleri gecer
- web->mobile deep link ile dogru ekran acilir

## Faz 2 - Sky Live Runtime Stabilizasyonu (1-1.5 gun)

Amac: Sky Live ekraninda crash/donma/jitter azaltmak.

Kontrol alanlari:
- mobile/app/(tabs)/explore/starmap.js
- mobile/src/sky/skyRuntime.js
- mobile/src/sky/skyRenderPlan.js
- mobile/src/sky/skyLayerRenderSet.js
- mobile/src/utils/skyProjection.js
- mobile/src/components/SkyTelemetryPanel.js

Adimlar:
1. Sensor smoothing + hiz limiti + dead-zone davranisini sabitle.
2. Arka plan/one donus lifecycle'da sensor aboneliklerini guvenli kapat/ac.
3. Izin reddi durumunda manuel haritaya temiz gecis yap.
4. Render budget ve katman ac/kapa kararlarini kalite profiline gore netlestir.

Tamamlanma kriteri:
- Sky Live acilis crash yok
- sensor/manual mod gecisleri stabil
- jitter belirgin sekilde azalmis

## Faz 3 - Katalog, Tile ve Offline Dayaniklilik (1 gun)

Amac: Ag sorunu olsa da harita bos kalmamali.

Kontrol alanlari:
- mobile/src/data/skyCatalogWindow.js
- mobile/src/data/starSectorTileStore.js
- mobile/src/data/remoteStarTileProvider.js
- mobile/src/data/starSectorCatalog.js

Adimlar:
1. Gaia tile + HYG fallback birlesimini duplicate olmadan dogrula.
2. Bozuk cache tespiti ve temiz yeniden dene mekanizmasi ekle/guclendir.
3. Offline acilista son saglam snapshot geri yukleme davranisini sertlestir.

Tamamlanma kriteri:
- ag kapaliyken Sky Live gorunur veriyle acilir
- tile hatasi uygulamayi dusurmez

### 2026-07-08 Faz 3 Sonucu
- `loadSkyCatalogWindow` içindeki Gaia + HYG fallback akışı doğrulandı.
- `remoteGaiaCatalog.js` için cache-only manifest ve disk cache doğrulama yolu incelendi.
- `starmap.js` konum izni reddi durumunda manuel harita fallback ve sensor mod açma davranışı güçlendirildi.

## Faz 4 - Sahiplik Akisi ve Sky Isaretleme (0.5-1 gun)

Amac: Satin alma sonrasi sahiplik verisi tum ekranlarda ayni.

Kontrol alanlari:
- mobile/src/platform/ownership/*
- mobile/src/platform/vault/*
- mobile/app/(tabs)/claim.js
- mobile/app/(tabs)/vault/home.js
- mobile/app/(tabs)/explore/starmap.js

Adimlar:
1. Purchase sonrasi OwnershipStore/VaultStore refresh tek event ile tetiklenmeli.
2. Sky Live secili/sahipli yildiz gosterimi canonical id ile eslenmeli.
3. Mock sayilar kaldirilip store-turetilmis istatistik gosterilmeli.

Tamamlanma kriteri:
- satin alma sonrasi Sky ve Vault senkron
- sahiplik mismatch yok

## Faz 5 - Fiziksel Cihaz Kabul Turu (1 gun)

Amac: Dokümanda bekleyen fiziksel testleri kapatmak.

Test senaryolari (sirayi bozma):
1. Soguk acilis
2. Ana navigasyon
3. Izin reddi
4. Sensor lifecycle
5. Tile cache + offline fallback
6. 10 dk dayaniklilik
7. Motor hissi (90 derece donus)
8. Web->mobile deep link
9. StarVault deep link

Cikti zorunlulugu:
- Her senaryo icin: tarih, cihaz, OS, sonuc, not, issue/log linki
- MOBILE_2D_ACCEPTANCE_CHECKLIST.md icine isleme

## Faz 6 - Yayin Oncesi Hardening (0.5 gun)

Amac: Son riskleri kapatip "calisir" etiketi vermek.

Adimlar:
1. Gereksiz warning ve error loglarini azalt.
2. Hata ekranlarinda kullaniciya anlasilir retry CTA koy.
3. Reduced motion + dusuk kalite profilinde kabul goruntuleri al.
4. Son smoke:
   - npm run test:astronomy
   - npx expo-doctor
   - npm run android

Tamamlanma kriteri:
- kritik blocker yok
- kabul checklist'i guncel

---

## 5) Emergent Için Gorev Paketleri (Copy/Paste)

## Paket A - Runtime Stabilite
"Sky Live runtime stabilite paketini uygula: starmap/sensor lifecycle/permission fallback/camera mode gecisleri. Sonunda test:astronomy ve expo-doctor calistir, degisiklikleri ve riskleri raporla."

## Paket B - Tile ve Offline
"Sky catalog ve tile cache dayanıkliligini arttir: bozuk tile recovery, offline fallback, duplicate engelleme. remoteGaiaCatalog testlerini gecer hale getir."

## Paket C - Ownership Senkron
"Purchase->OwnershipStore->VaultStore->Sky marker hattini tek event zinciri ile deterministic hale getir. Mock istatistikleri kaldir, store-derived deger kullan."

## Paket D - Device Acceptance
"MOBILE_2D_ACCEPTANCE_CHECKLIST fiziksel cihaz senaryolarini adim adim uygula ve kanit notlarini dosyaya isle."

---

## 6) Definition of Done (Kesin)

Bir sprint "bitti" sayilmasi icin hepsi true olmalidir:

- [ ] Mobil uygulama acilisi stabil
- [ ] Claim, Sky Live, Vault, Profile tab gecisleri stabil
- [ ] Deep link akislari calisiyor
- [ ] test:astronomy yesil
- [ ] expo-doctor temiz
- [ ] Fiziksel cihaz 9/9 senaryo kayitli
- [ ] Kabul checklist dosyasi guncel
- [ ] Kritik crash/regression yok

---

## 7) Riskler ve Koruma

1. Risk: Sky Live'da performans dususu.
   Koruma: kalite profili bazli layer budget + telemetry panel ile olcum.

2. Risk: Deep link path kirilmasi.
   Koruma: route helper tek kaynak + navigation testleri.

3. Risk: Ownership mismatch.
   Koruma: canonical id + tek sync event + store normalizer.

4. Risk: Fiziksel cihazda sensor farkliliklari.
   Koruma: dead-zone, smoothing, fallback ve cihaz bazli kanit.

---

## 8) Notlar

- 3D fazlar (P0.8.x) dokumanlari korunacak ama 2D kabul kapanmadan ana is kalemi olmayacak.
- MISSION_PLAN.md arsiv niteliginde; guncel kararlar bu dosya ve unified plan ile ilerletilecek.
- Gerektiginde web tarafi yalnizca deep link/QR ve ownership uyumu icin dokunulacak.
