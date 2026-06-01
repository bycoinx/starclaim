# StarClaim — Mobile Lobby UI Spec (Cosmic Engine)

Versiyon: 0.1
Yazar: GitHub Copilot (taslak)
Tarih: 2026-06-01

Bu doküman StarClaim mobil uygulamasının "lobby" (Cosmic Engine) arayüzü için ayrıntılı tasarım spesifikasyonudur. Hedef: kullanıcının uygulamayı bir oyun lobisiymiş gibi deneyimlemesi; ana ekran 3D, yatay (landscape) ve katmanlı bir mimari sunacak.

---

## 1. Kısa Özet
- "Galactic Hub": Uygulamanın ana ekranı, full-bleed 3D arka plan (galaksi) ve kenarlarda frosted-glass paneller.
- Her ana ikon bir "page layer" açar; layer'lar ana 3D sahnenin üzerinde animasyonla belirir/ kaybolur.
- İleri seviye transitions: "Kozmik İnisiyasyon" (matchmaking) + NebulaTransition (shader/particles).
- Hedef platformlar: iOS / Android (ilk aşamada TestFlight / Internal Test), teknoloji tercihi aşağıda.

---

## 2. Ekran Akışları (High-level)
1. Launch → IMAX Intro (warp zoom) → Galactic Hub
2. User taps `STARRY MAP` → NebulaTransition → Starry Map (full-screen 3D atlas)
3. User taps `STAR VAULT` → Vault Layer opens (3D cards, inventory)
4. User taps `COSMIC MARKET` → Market Layer opens (listings + 3D preview)
5. Profile/Stories → Book-like UI layer (private content)
6. From any layer, back gesture or `Close` animates layer out and refocus to Galactic Hub
7. Special: `Kozmik İnisiyasyon` (Matchmaking) sequence — LoadingScene runs, then camera warp to destination

---

## 3. Landscape Layout & Safe Areas
- App forces landscape orientation for lobby screens. Mobile portrait allowed for some detail pages (optional).
- Layout grid: 12-column virtual grid across width (responsive for tablets).
- Safe margins: 16-24 px from short edges, account for notches.

Placement:
- Center: `ThreeScene` (3D canvas) occupying full viewport but visually framed by UI.
- Left edge (vertical band, width ~18%): Profile, quick actions (stacked icons).
- Right edge (vertical band, width ~18%): Vault, Market quick buttons, notifications.
- Bottom center: Floating action bar (icon wheel): Map, Market, Vault, Stories, Settings.

---

## 4. Primary Components
- `AppShell` — App root: handles orientation, audio, global state, transition manager.
- `ThreeScene` — React Three Fiber / Unity scene hosting 3D galaxy, camera and orbs.
- `HUDPanel` — Reusable frosted glass panel with header, body and action slots.
- `FloatingWheel` — Bottom action bar with 5 primary icons.
- `LayerModal` — Full-screen or partial overlay layer that animates in/out with blur and NebulaTransition.
- `NebulaTransition` — Particle/shader effect for page transitions.
- `LoadingScene` — Matchmaking / warp intro component with progress bar & console text.
- `StarCard3D` — 3D interactable card model used in Vault and Market.
- `OrbitOrb` — Small interactive orb representing notifications/tasks/quick actions.
- `CameraController` — Smooth camera animation & dolly for IMAX intro and layer focuses.

---

## 5. Starry Map (Module) Requirements
- Full-screen 3D atlas with pan/zoom/rotate gestures.
- Filters: `constellation`, `tier`, `available`, `price`.
- LOD: render high-detail models close-up, low-detail points far away.
- Click/tap on star → open `StarDetail` sheet with metadata, ai_story preview and action buttons (claim/share).
- Optional: AR preview modal (later phase).

---

## 6. Vault & Market Requirements
Vault:
- Grid or 3D "shelf" of `StarCard3D` items.
- Tap opening shows full stats, owner, story, and certificate preview.

Market:
- Listings feed with filter/sort, each item previews as a 3D thumbnail.
- Item detail supports rotate, zoom, and open purchase flow (deferred to backend).

---

## 7. Matchmaking (Kozmik İnisiyasyon) & Nebula Transition
- `LoadingScene`:
  - Visual: large centered progress bar (glow), animated console text lines above/below.
  - Sound: subtle rising synth + whoosh when finish.
  - Duration: variable — show until assets ready (min 1.2s, recommended < 6s).
- `NebulaTransition`:
  - Shader-based volumetric particle field, triggered by icon tap.
  - Timeline: spawn(0-300ms) -> expand(300-700ms) -> settle(700-1000ms) -> reveal(1000-1300ms).
  - Easing: cubic-out for expand, expo-in for reveal.

---

## 8. Visual Language (Colors, Typography, Effects)
- Palette:
  - Background: #03040A (deep space)
  - Neon Blue (primary): #00F3FF
  - Cosmic Gold (accent): #FFD166 or #F5C06D
  - Frosted glass tint: rgba(255,255,255,0.06)
  - Secondary text: #9AA6B2
- Typography: 'Inter' / 'Antonio' for display (bold), sizes scaled for landscape
- Effects:
  - Bloom on bright elements, subtle film grain on 3D
  - Frosted glass blur: backdrop-filter blur(8px) + border: 1px solid rgba(255,255,255,0.04)
  - Shadows: soft, bluish

---

## 9. Motion & Interaction Specs
- Global timing scale: base = 1
- Short UI transitions: 240ms-360ms, easing: cubic-bezier(0.22,1,0.36,1)
- Nebula / Scene transitions: 800ms-1400ms
- Camera dolly (IMAX intro): 1200ms-1800ms, smooth spring (mass: 0.75, damping: 12)
- Haptics: light impact on taps, medium on important actions

---

## 10. Performance Constraints & Fallbacks
- Target: 60fps on mid-range devices; degrade gracefully to 30fps.
- Optimizations:
  - Use LODs for 3D assets, GPU particle systems where possible.
  - Use texture atlases + compressed textures (ASTC/ETC2) for mobile.
  - Limit draw calls, batch meshes.
  - Allow "Low Graphics" toggle to disable volumetrics and real-time shadows.
- Fallback UI: if WebGL/3D unsupported, show a 2D animated starfield with key interactions.

---

## 11. Accessibility & Localization
- Support TR and EN strings; dark-mode friendly color contrast checks
- Provide readable focus and large-target tappable areas (min 44x44 dp)
- Motion-reduced mode option for users who prefer less animation

---

## 12. Assets Catalogue (initial)
- 3D models: Galaxy background (low-poly), StarCard, Star model (LOD), Vault shelf
- Textures: nebula sprite sheets, particle textures, bloom maps
- Shaders: nebula volumetric shader, blur shader for frosted glass
- Audio: warp whoosh, UI click, loading hum, success chime
- Fonts: Inter (variable), Display for headings

---

## 13. Tech Recommendations
Option A — Cross-platform React approach (recommended for fast integration):
- React Native (or Expo) + `react-three-fiber` + `expo-gl`/`react-native-webgl` for 3D canvas
- Pros: reuse web frontend code patterns, faster iteration, smaller team
- Cons: mobile 3D limitations, need careful tuning for performance

Option B — Unity (C#)
- Pros: industry-grade mobile 3D performance, advanced shader/particle toolset
- Cons: separate codebase from web frontend, larger build sizes, steeper release/handoff

Recommendation: start with Option A (React Native + R3F) for MVP lobby + map; move heavy volumetrics/particles to native modules or Unity submodules later if needed.

---

## 14. Deliverables for next milestone
- Wireframes for Galactic Hub, Starry Map, Vault, Market, Profile (Figma).
- Interactive prototype of `LoadingScene` and `NebulaTransition` (Framer / Lottie fallback)
- Asset list with placeholders (GLTF/GLB) and SFX
- Minimal scaffold: RN app with `ThreeScene` placeholder and bottom `FloatingWheel` navigation

---

## 15. Next Actions (short-term)
1. Finalize wireframes and interaction notes (UX flows) — assigned to `Define UX Flows & Wireframes`.
2. Build minimal RN scaffold and sanity-check `ThreeScene` rendering on device.
3. Create low-poly assets for Galaxy + StarCard and test LOD.

---

## 16. Open Decisions / Questions
- Confirm target minimum devices (Android baseline, iPhone baseline).
- Decide whether to use Expo (fast dev) or plain RN (more native control).
- Confirm if AR preview is in scope for first milestone.

---

End of spec v0.1

