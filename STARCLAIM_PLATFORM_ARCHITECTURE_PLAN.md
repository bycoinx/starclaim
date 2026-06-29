# StarClaim Platform Architecture Plan

## Purpose

This plan defines the long-term architecture for StarClaim as a scalable digital astronomy platform. The goal is not to generate 10,000 images immediately. The goal is to build the identity, asset, rendering, ownership, story, vault, marketplace, and future 3D foundations so that 10,000+ stars can share one professional system.

StarClaim should evolve around this flow:

```text
Astronomy Data
  -> Star Identity Model
  -> Star Asset Architecture
  -> Star Registry & Versioning
  -> 2D Sky Map
  -> Ownership / NFT Layer
  -> Stories / Vault / Certificates
  -> Marketplace
  -> Future 3D Universe
```

## Product Direction

StarClaim should feel like a premium astronomy ownership platform:

- Interstellar-scale cosmic atmosphere
- Stellarium / Sky Guide level sky-map credibility
- Apple-grade restrained interface design
- Luxury gold accents with deep blue and violet cosmic depth
- Scientific star identity under a story, vault, and marketplace layer

The product must avoid becoming a collection of disconnected pages. Every star should have one canonical identity and one canonical asset source that feeds every surface.

## Phase 1 - Star Identity Model

Create a shared star identity model before expanding visuals or marketplace logic.

Canonical fields:

```text
id
slug
catalogId
hip
gaiaId
name
displayName
constellation
ra
dec
magnitude
distance
spectralType
temperature
colorIndex
luminosity
category
rarity
ownershipStatus
ownerCount
storyCount
certificateCount
assetVersion
createdAt
updatedAt
```

Rules:

- `id` must be stable and never depend on display order.
- `slug` should be human-readable and URL-safe.
- `hip` and `gaiaId` should remain optional but standardized.
- Astronomy fields must be renderer-independent.
- Ownership and story counters should not live only inside UI components.

## Phase 2 - Star Asset Architecture

Build a renderer-independent asset model. This model should support today's 2D cards and tomorrow's 3D textures without changing paths or contracts.

Implemented contract:

```text
shared/starAsset.js
```

Canonical asset fields:

```text
starId
slug
previewImage
heroImage
deepImage
textureImage
certificateImage
storyCoverImage
fallbackImage
model3D
metadataPath
version
cacheKey
cdnBaseUrl
lastUpdated
```

Recommended local structure:

```text
assets/
  stars/
    catalog/
      sirius-hip-32349/
        metadata.json
        preview.webp
        hero.webp
        deep.webp
        texture.webp
        certificate.webp
        story-cover.webp
        fallback.webp
        model.glb
      vega-hip-91262/
        metadata.json
        preview.webp
        hero.webp
        deep.webp
        texture.webp
        certificate.webp
        story-cover.webp
        fallback.webp
        model.glb
```

Path convention:

```text
assets/stars/catalog/{slug}/preview.webp
assets/stars/catalog/{slug}/hero.webp
assets/stars/catalog/{slug}/deep.webp
assets/stars/catalog/{slug}/texture.webp
assets/stars/catalog/{slug}/certificate.webp
assets/stars/catalog/{slug}/story-cover.webp
assets/stars/catalog/{slug}/fallback.webp
assets/stars/catalog/{slug}/model.glb
assets/stars/catalog/{slug}/metadata.json
```

Rules:

- Do not generate real 10,000-star artwork yet.
- Placeholder assets are allowed only to test contracts.
- The asset system must support CDN migration.
- Asset paths should be stable enough to survive future UI redesigns.
- `preview`, `hero`, `deep`, and `texture` must be treated as different variants of the same star asset.
- `cacheKey` must combine stable star id, slug, and asset version.
- `cdnBaseUrl` must be optional and must not change slug or variant naming.
- UI, renderer, and marketplace code must not manually assemble asset filenames once StarAssetManager exists.

## Phase 2.5 - Star Registry & Versioning

Create a lightweight registry layer between astronomy catalogs, identity, assets, ownership, stories, and certificates.

The registry is not a renderer and not a UI model. It is the master linking table that answers:

```text
Which catalog record is this star?
Which canonical identity does it use?
Which asset bundle belongs to it?
Which ownership record is active?
Which stories and certificates reference it?
Which schema and asset versions are currently valid?
```

Target flow:

```text
Gaia / HYG / Hipparcos
  -> Star Registry
  -> Star Identity
  -> Star Assets
  -> Ownership
  -> Stories
  -> Certificates
  -> UI / Renderer
```

Canonical registry fields:

```text
registryId
starId
canonicalId
slug
catalogRefs
assetRef
ownershipRef
storyRefs
certificateRefs
registryVersion
identityVersion
assetVersion
ownershipVersion
storyVersion
certificateVersion
status
createdAt
updatedAt
```

Rules:

- Registry IDs must be stable and must not depend on display order.
- Registry must link systems; it must not duplicate full astronomy or asset metadata.
- UI components should eventually receive registry-backed star records instead of assembling links manually.
- Ownership, story, certificate, and asset systems must be versioned independently.
- Blockchain references must remain optional until the ownership layer is finalized.
- 3D references must remain optional until 2D map stability is complete.

Versioning contract:

```text
StarIdentity schemaVersion
StarAsset schemaVersion
StarRegistry registryVersion
Ownership ownershipVersion
Certificate certificateVersion
Story storyVersion
```

This protects older certificates, stories, and assets when the platform evolves.

## Phase 3 - Star Asset Manager

Create a central StarAssetManager layer.

Responsibilities:

- Resolve an asset by registry-backed star id or slug.
- Provide fallback assets.
- Cache resolved asset metadata.
- Validate missing assets.
- Return web/mobile-safe paths.
- Keep renderer and UI components independent from file layout.
- Prepare for future CDN base URL replacement.

Non-responsibilities:

- It must not render UI.
- It must not perform 2D or 3D drawing.
- It must not contain ownership business logic.

Target API shape:

```text
getStarAsset(starIdOrSlug)
getStarAssetVariant(starIdOrSlug, variant)
preloadStarAssets(starIds, variants)
validateStarAsset(starIdOrSlug)
getFallbackAsset(variant)
```

## Phase 4 - Shared Star Card System

Unify repeated card logic across Stars, Marketplace, Stories, StarVault, and future Cosmos object cards.

Component family:

```text
StarCardBase
StarCatalogCard
MarketplaceStarCard
VaultStarCard
StoryStarCard
CosmosObjectCard
```

Rules:

- Cards should consume `StarIdentity` and `StarAsset`.
- Cards should not hardcode image paths.
- Cards should not duplicate price/status/ownership formatting.
- Card variants should share layout primitives and visual language.

Visual direction:

- Premium dark panels
- Gold highlights
- Real star imagery or procedural star previews
- Compact astronomy facts
- Ownership/status badge
- Clear action area

## Phase 5 - Web Visual System

Bring the website closer to the target visual direction shown in the reference concepts.

Shared web primitives:

```text
CosmicBackgroundLayer
LuxuryPanel
PremiumFilterSidebar
CatalogGrid
ObjectDetailPanel
StarAssetImage
StatusBadge
AstronomyMetric
```

Priority pages:

1. Stars / Yildizini Sec
2. StarVault
3. Stories / Hikayeler
4. Marketplace
5. Cosmos
6. Star Detail

Design goals:

- Reduce empty black space.
- Add real content density without visual noise.
- Use premium star/nebula/card imagery.
- Keep the same brand language across pages.
- Preserve living background effects where they are tasteful.

## Phase 6 - 2D Sky Map Foundation

Finish the 2D map before reconnecting or expanding the 3D map.

Target architecture:

```text
UI Layer
  -> SkyRuntimeStore
  -> AstronomyEngine
  -> SkyRenderPlan
  -> Skia Renderer
```

Rules:

- React should not calculate every star during interaction.
- Sensor updates must be throttled and thresholded.
- Star catalog loading must stay independent from StarCanvas.
- Constellations, DSO, planets, Milky Way, labels, and grid must have separate render budgets.
- Touch selection must use spatial indexing, not full catalog scanning.
- The renderer must support graceful quality degradation.

2D completion criteria:

- Stable sensor/manual navigation
- No app crash on touch or toggle
- Constellation lines toggle reliably
- Smooth panning and zooming
- Downward sky view still shows valid celestial content
- 60 FPS target on capable devices
- Low/medium/high quality profiles behave predictably

## Phase 7 - AI Asset Pipeline

Do not manually produce thousands of images.

Future pipeline:

```text
Star metadata
  -> Prompt generator
  -> AI image generation
  -> Upscale
  -> WebP compression
  -> Metadata update
  -> Asset validation
  -> CDN upload
```

Prompt inputs:

```text
name
spectralType
temperature
magnitude
colorIndex
constellation
rarity
distance
story tone
asset variant
```

Spectral visual rules:

```text
O / B: blue-white, strong glow
A / F: white or cool white
G: solar gold
K: orange
M: red-orange
Nebula / cluster: custom atmospheric variant
```

Generated variants:

```text
preview.webp
hero.webp
deep.webp
texture.webp
certificate.webp
story-cover.webp
```

## Phase 8 - Ownership / NFT Layer

Ownership state should be shared by cards, marketplace, certificates, StarVault, and future 3D selection.

Possible states:

```text
available
reserved
owned
locked
featured
legendary
```

Rules:

- Ownership state must not be encoded only in button text.
- Certificates should reference the same star identity and asset.
- Marketplace listing should reference the same canonical star record.
- StarVault should not duplicate star metadata.

## Phase 9 - Future 3D Map Preparation

Do not rebuild 3D now. Keep it isolated until the 2D map is stable.

Future mapping:

```text
StarIdentity.ra / dec / distance -> 3D position
StarAsset.textureImage -> 3D material
StarAsset.previewImage -> search result
StarAsset.heroImage -> detail panel
StarAsset.deepImage -> deep inspection view
```

3D map should later support:

- Galaxy view
- Sector view
- Star system view
- Target star focus
- Texture-based star/planet presentation
- LOD and instancing

## Implementation Order

1. Standardize `StarIdentity`.
2. Add `StarAsset` model and path conventions.
3. Add lightweight `StarRegistry` and versioning contract.
4. Add `StarAssetManager`.
5. Add shared `StarAssetImage` resolver.
6. Refactor web star cards onto shared card primitives.
7. Refactor Stars page to use shared catalog/card architecture.
8. Refactor StarVault, Stories, Marketplace, and Cosmos cards.
9. Finish 2D Sky Map architecture and performance.
10. Define AI prompt generator contracts.
11. Add placeholder asset validation.
12. Prepare CDN migration switches.
13. Revisit 3D only after 2D map is stable.

## Do Not Do Yet

- Do not generate 10,000 real images yet.
- Do not reconnect the full 3D map yet.
- Do not redesign every UI page before the asset model exists.
- Do not hardcode image paths inside cards.
- Do not duplicate star metadata per page.

## Success Criteria

The architecture is considered ready when:

- One star identity feeds web, mobile, cards, vault, stories, marketplace, and map.
- One asset contract can serve preview, hero, deep, certificate, and future texture use cases.
- One registry contract links identity, asset, ownership, story, certificate, and future chain references.
- Cards can change visual style without changing data contracts.
- 2D map can consume astronomy data without UI-layer catalog logic.
- Future AI asset generation can write into a known file and metadata structure.
- Future 3D can reuse the same star identity and asset contract.
