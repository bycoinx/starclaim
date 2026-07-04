# Superseded Notice

This file is now an archived reference for the Stars data-flow work. The current source of truth is `STARCLAIM_UNIFIED_EXECUTION_PLAN.md`.

---

# StarClaim - Star Data Flow Refactor Plan

## Purpose

This plan turns the `Yildizini Sec` / Stars Catalog page from an isolated UI page into the first consumer of the shared StarClaim platform data flow.

The current visual direction is accepted as a strong step forward. The next goal is not another redesign. The goal is to connect the page to reusable data, asset, registry, card, and action layers so future StarVault, Marketplace, Stories, Cosmos, Star Detail, and 3D features can reuse the same system.

Target flow:

```text
Star Registry
  -> Star Repository
  -> Star Asset Manager
  -> Catalog Store
  -> Catalog Components
  -> Stars Page
```

Future pages must consume the same flow instead of duplicating star data or asset path logic.

## Non-Goals

- Do not redesign the current Stars page visual language.
- Do not change brand colors, typography, or spacing unless required by broken layout.
- Do not implement blockchain.
- Do not implement backend.
- Do not implement AI image generation.
- Do not reconnect or redesign the 3D map.
- Do not start StarVault redesign in this sprint.

## Current UI Checkpoint

The Stars page now has a stronger premium catalog direction:

- Left filter sidebar
- Top quick category filters
- Sort control
- Star cards with procedural star visuals
- Ownership/status badges
- Premium dark/gold visual system

Before coding the next layer, inspect the implementation and identify:

- Hardcoded star data
- Duplicated star card logic
- Image paths resolved inside UI components
- Filters stored only inside page state
- Sorting/pagination logic coupled to the page
- Ownership/status formatting repeated in multiple places
- Star detail/action behavior embedded directly inside cards

## Phase 1 - Implementation Audit

Goal: understand Gemini's Stars UI changes without rewriting them.

Tasks:

1. Locate the Stars page entry point.
2. Locate catalog components such as layout, toolbar, filters, grid, card, detail drawer, and image renderer.
3. Map where star data currently comes from.
4. Map where asset paths are currently resolved.
5. Map where search/filter/sort/page state lives.
6. Identify duplicated formatting helpers.
7. Produce a short technical debt list before edits.

Output:

```text
Stars UI data flow audit
Duplicated logic list
Files to refactor first
Risk notes
```

## Phase 2 - Star Repository Contract

Goal: create a source-agnostic repository layer.

The UI must not know whether stars come from local JSON, REST API, MongoDB, Gaia, offline cache, or future blockchain metadata.

Responsibilities:

```text
loadStars()
getStarById(id)
getStarBySlug(slug)
queryStars(params)
searchStars(query)
filterStars(filters)
sortStars(sortKey)
getFeaturedStars()
getOwnedStars()
```

Rules:

- Repository returns normalized StarIdentity-compatible records.
- Repository does not render UI.
- Repository does not know component layout.
- Repository should prepare for StarRegistry integration.
- Repository may use local data first, then API later.

Initial folder direction:

```text
frontend/src/platform/stars/
  starRepository.js
  starRepository.types.js
  starRepository.fixtures.js
```

## Phase 3 - Catalog Store

Goal: move catalog state out of the Stars page.

Catalog state:

```text
searchQuery
selectedFilters
sortKey
page
pageSize
selectedStarId
loading
error
favorites
viewMode
resultIds
totalCount
```

Responsibilities:

- Own search/filter/sort/pagination state.
- Call StarRepository for derived results.
- Expose small actions for UI components.
- Keep Stars page mostly presentational.

Possible folder:

```text
frontend/src/platform/catalog/
  catalogStore.js
  catalogSelectors.js
  catalogActions.js
```

## Phase 4 - StarCard Contract

Goal: cards consume platform data, not hand-built prop bundles.

Preferred contracts:

```jsx
<StarCard starId="sirius-hip-32349" />
```

or:

```jsx
<StarCard star={star} />
```

Rules:

- Card must not manually assemble image paths.
- Card must not duplicate astronomy formatting.
- Card must not hardcode ownership/status labels.
- Card may receive layout variant, but not raw business fragments.

Shared helpers:

```text
formatDistance()
formatMagnitude()
formatSpectralType()
formatOwnershipStatus()
formatStarPrice()
getStarRarityLabel()
getStarCategoryLabel()
```

## Phase 5 - StarAssetImage Contract

Goal: one image gateway for all star visuals.

No component should know:

```text
preview.webp
hero.webp
deep.webp
texture.webp
certificate.webp
story-cover.webp
```

All image variants must resolve through:

```text
StarAssetManager
```

Expected usage:

```jsx
<StarAssetImage starId="sirius-hip-32349" variant="preview" />
```

Rules:

- Support fallback image.
- Support lazy loading.
- Support skeleton state.
- Support future CDN URLs.
- Avoid layout shift.

## Phase 6 - Detail Drawer / Star Detail Preparation

Goal: detail UI receives only selected identity.

Preferred contract:

```jsx
<DetailDrawer selectedStarId={selectedStarId} />
```

Detail panel resolves:

- StarIdentity
- StarAsset
- Ownership summary
- Certificate references
- Story references
- Future blockchain placeholder
- Future 3D placeholder

This phase prepares the future Star Detail page without building the full page yet.

## Phase 7 - Shared Action Bar

Goal: remove hardcoded action buttons from cards and detail panels.

Actions to support:

```text
claim
viewDetail
favorite
viewCertificate
writeStory
openVault
openMap
share
mintPlaceholder
transferPlaceholder
```

Rules:

- Actions are generated from star state.
- Disabled/future actions are represented consistently.
- Cards and detail drawer share the same action definitions.

Possible folder:

```text
frontend/src/platform/actions/
  starActions.js
  starActionLabels.js
```

## Phase 8 - Performance Preparation

Goal: prepare for 10,000+ stars without reducing visual quality.

Tasks:

- Memoize derived catalog results.
- Keep cards pure.
- Add pagination boundaries.
- Prepare virtual grid integration.
- Lazy-load images.
- Use stable keys.
- Avoid filtering/sorting inside render.
- Avoid passing large mutable objects through many components.

Completion criteria:

- Search/filter/sort does not cause full-page unnecessary rerenders.
- Catalog can scale beyond current fixture size.
- UI remains responsive while switching filters.

## Phase 9 - Future Page Reuse

Once Stars uses the shared data flow, spread the same foundation in this order:

1. Star Detail Page
2. StarVault
3. Stories
4. Marketplace
5. Cosmos

Each future page should reuse:

```text
StarRepository
CatalogStore where relevant
StarAssetManager
StarAssetImage
StarCard primitives
StarActionBar
formatting helpers
```

## AI Agent Responsibility Split

To reduce conflicts:

```text
Codex:
  platform core
  registry
  repository
  asset manager
  data contracts
  2D/3D renderer
  performance

Gemini:
  presentation layer
  page layout
  responsive UI
  visual polish
  shared UI composition
```

Both agents must avoid editing the same layer at the same time.

## Immediate Next Step

Start with Phase 1 only:

```text
Audit the current Stars page implementation.
Do not rewrite the page yet.
Identify where data, assets, filters, card props, and actions are coupled.
```

After the audit, implement Phase 2 with the smallest possible repository contract.
