# StarClaim Web Shell Architecture Plan

## Purpose

This sprint defines the shared presentation architecture for the StarClaim web application.

The goal is not to build another page. The goal is to create the reusable shell, layout primitives, card foundations, and responsive rules that every web surface will use.

Target flow:

```text
StarIdentity / StarRegistry / StarAsset
  -> StarAssetManager
  -> Shared UI Primitives
  -> Page Shells
  -> Stars / StarVault / Marketplace / Stories / Cosmos
```

The data architecture already being built must stay below the UI shell. The shell must not own business logic.

## Product Direction

Every page should feel like one premium astronomy platform:

- Apple dashboard discipline
- Stellarium / Celestia astronomy credibility
- NASA deep-space atmosphere
- Luxury dark + gold StarClaim identity
- Dense but calm operational layouts
- Strong visual hierarchy with minimal empty black areas

No page should invent its own layout language.

## Non-Goals

Do not implement:

- Backend
- API contracts
- Blockchain / NFT logic
- Wallet flows
- AI image generation
- 3D map reconnection
- New brand colors
- New typography system
- Page-specific redesigns without shared primitives

This sprint is presentation architecture only.

## Architecture Principle

Pages should be assembled from shared primitives:

```text
PageShell
  -> PageHero
  -> Metrics
  -> Toolbar
  -> Sidebar / Filters
  -> ContentGrid / ContentList
  -> DetailDrawer
  -> Timeline
  -> PageFooter
```

Each component must have one responsibility and must not fetch data, resolve assets directly, or own business rules.

## Shared Components To Establish

### Page Structure

- `PageShell`
- `PageHero`
- `SectionContainer`
- `SectionHeader`
- `PageFooter`

### Navigation And Controls

- `Sidebar`
- `StickySidebar`
- `PageToolbar`
- `SearchBar`
- `FilterBar`
- `SortBar`
- `Pagination`
- `BottomActionBar`
- `FloatingActions`

### Content Display

- `MetricCard`
- `ContentGrid`
- `ContentList`
- `DetailDrawer`
- `InfoPanel`
- `StatusBadge`
- `EmptyState`
- `LoadingSkeleton`
- `ActionBar`

### Card System

The card system should evolve like this:

```text
CardBase
  -> StarCardBase
      -> CatalogCard
      -> VaultCard
      -> MarketplaceCard
      -> StoryCard
      -> CosmosCard
```

Rules:

- Cards must not know image file paths.
- Cards must consume resolved asset props or `StarAssetImage`.
- Badges, metadata rows, prices, owners, and actions should use shared subcomponents.
- Page-specific variants may exist, but they must inherit the same base spacing, image slot, metadata slot, and action slot.

## Component Responsibilities

### PageShell

Responsible for:

- page background
- max width
- vertical rhythm
- route-level spacing
- optional side regions

Not responsible for:

- data loading
- search state
- card rendering details

### PageHero

Responsible for:

- title
- subtitle
- eyebrow/status label
- hero actions
- optional metrics slot
- optional background slot

Not responsible for:

- filters
- search
- pagination
- grid state

### PageToolbar

Responsible for:

- arranging search, sort, view toggle, and quick filters
- responsive wrapping

Not responsible for:

- deciding result data
- API calls
- repository filtering

### ContentGrid

Responsible for:

- responsive columns
- spacing
- future virtualization compatibility

Not responsible for:

- fetching items
- sorting
- pagination rules

### DetailDrawer

Responsible for:

- displaying selected entity details
- desktop side panel behavior
- mobile bottom sheet behavior

Not responsible for:

- finding selected entity
- resolving asset URLs
- calling APIs

## Page Templates

### Stars

```text
PageShell
  -> PageHero
  -> Metrics
  -> PageToolbar
  -> Sidebar filters
  -> ContentGrid
  -> DetailDrawer
  -> Pagination
```

### StarVault

```text
PageShell
  -> PageHero
  -> Metrics
  -> Sidebar
  -> Owned Stars Grid
  -> Certificates Panel
  -> Stories Panel
  -> Achievements Panel
  -> Timeline
  -> Security Module
```

### Marketplace

```text
PageShell
  -> PageHero
  -> Metrics
  -> PageToolbar
  -> Sidebar filters
  -> Marketplace Grid
  -> Listing DetailDrawer
  -> Pagination
```

### Stories

```text
PageShell
  -> PageHero
  -> Category filters
  -> PageToolbar
  -> Story Grid
  -> Story DetailDrawer
  -> Pagination
```

### Cosmos

```text
PageShell
  -> PageHero
  -> Explorer Toolbar
  -> Category Sidebar
  -> Object Grid
  -> Object DetailDrawer
```

## Responsive Rules

### Desktop

- persistent sidebar
- optional right detail drawer
- wide grid
- compact dense controls

### Tablet

- collapsible sidebar
- adaptive grid
- drawer may become overlay

### Mobile

- no duplicated components
- sidebar becomes drawer
- detail drawer becomes bottom sheet
- toolbar wraps into compact controls
- grids become single or two-column depending on card density

## Visual Density Rules

- Avoid empty black hero areas unless intentionally cinematic.
- Keep cards dense enough for scanning.
- Use gold only for hierarchy and key actions.
- Use nebula/space imagery as depth, not decoration overload.
- Page sections should feel connected, not like unrelated cards.
- Do not nest cards inside cards.

## Performance Requirements

The shell must be ready for:

- 10,000+ stars
- pagination
- virtual grids
- lazy loaded assets
- skeleton states
- future infinite scroll
- detail drawers without rerendering full grids

Implementation rules:

- layout primitives must be pure presentation components
- expensive filtering/sorting stays outside visual components
- cards should be memo-friendly
- image resolution must stay behind `StarAssetImage` / asset resolvers

## Phase 1 - Audit Current Web Layouts

Goal: identify duplicated layout structures before building primitives.

Tasks:

1. Inspect Stars, StarVault, Marketplace, Stories, Cosmos.
2. List repeated hero, toolbar, grid, sidebar, card, drawer patterns.
3. Identify page-specific CSS or layout logic that should become shared.
4. Identify components that already match the target system.
5. Identify risky files that should not be touched during shell extraction.

Output:

```text
Web shell audit
Reusable patterns found
Duplication map
Risk notes
First extraction candidates
```

### Phase 1 Audit Result

Status: completed.

#### Current Page Maturity

| Page | Current shape | Shell readiness | Notes |
| --- | --- | --- | --- |
| Stars / `StarPicker.jsx` | Uses `CatalogProvider`, `CatalogLayout`, `CatalogHero`, `CatalogToolbar`, `CatalogGrid`, `FilterSidebar`, `DetailDrawer`, `CatalogPagination` | High | This is the closest page to the target shell model. It should be the reference for route composition, but component names should become more generic before other pages depend on them. |
| StarVault / `Vault.jsx` | Dashboard layout with local `SectionHeader`, `VaultPanel`, `OwnedStarCard`, local arrays and page-specific layout regions | Medium | Visual direction is close to the desired dashboard references, but too much shell structure lives inside the page. Extract section/panel/card primitives before adding data. |
| Marketplace / `Marketplace.jsx` | Page-local hero, metrics, ticker/sort bar, loading state and listing card | Low | Uses direct API loading and bespoke cards. Needs shell adoption after Stars and Vault, but not before shared primitives exist. |
| Stories / `Stories.jsx` | Page-local cinematic hero, lore cards, story cards, CTA | Low | Rich visual sections, but not using shared `PageHero`, `SectionHeader`, `ContentGrid`, or card foundation. Also contains mojibake text that should be handled separately from shell work. |
| Cosmos / `Cosmos.jsx` | Full-screen experiential scene with overlay panels | Special case | Cosmos should consume the shell only for header/panel/action language. Its immersive canvas/scene behavior should remain page-specific. |

#### Reusable Patterns Found

- Page background with cosmic/nebula layers.
- Hero region with eyebrow, large display title, subtitle and optional actions.
- Metrics row or dashboard counters.
- Sidebar navigation/filter rail.
- Toolbar with search, sort, view controls and quick filters.
- Responsive grid/list content regions.
- Card image slot, metadata slot, badge slot, action slot.
- Detail drawer / right information panel.
- Section header with title and "view all" action.
- Panel/card frame with dark translucent background, thin border and subtle glow.
- Empty/loading/error states.

#### Duplication Map

| Pattern | Current locations | Extraction target |
| --- | --- | --- |
| Page background and max-width container | `CatalogLayout`, `Vault.jsx`, `Marketplace.jsx`, `Stories.jsx`, `Cosmos.jsx` | `components/shell/PageShell.jsx` |
| Hero title/eyebrow/subtitle/action area | `CatalogHero.jsx`, `VaultHero.jsx`, `Marketplace.jsx`, `Stories.jsx`, `Cosmos.jsx` | `components/shell/PageHero.jsx` |
| Section title + action | `Vault.jsx`, `Stories.jsx`, planned marketplace/cosmos sections | `components/shell/SectionHeader.jsx` |
| Dark panel frame | `VaultPanel` in `Vault.jsx`, marketplace listing cards, story cards | `components/shell/SurfacePanel.jsx` or `CardBase.jsx` |
| Metrics cards | `CatalogStats.jsx`, `VaultHero.jsx`, marketplace metrics | `components/shell/MetricCard.jsx` and `MetricStrip.jsx` |
| Grid layout | `CatalogGrid.jsx`, `Vault.jsx`, `Marketplace.jsx`, `Stories.jsx` | `components/shell/ContentGrid.jsx` |
| Search/sort/filter toolbar | `CatalogToolbar.jsx`, `Marketplace.jsx`, future vault toolbar | `components/shell/PageToolbar.jsx` |
| Star image handling | `catalog/StarCard.jsx`, `Vault.jsx` | keep behind `StarAssetImage`, then reuse in `StarCardBase` |

#### Risk Notes

- Do not change `CatalogStore`, `StarRepository`, `StarAssetManager`, `StarIdentity`, or registry contracts during shell extraction.
- Do not bind live ownership/market/story data while moving presentation primitives.
- Keep `Cosmos.jsx` immersive scene-specific; do not force it into the same grid dashboard structure.
- `Marketplace.jsx` currently performs API calls inside the page. Shell extraction must not move API responsibilities into shared components.
- `Stories.jsx` contains visible encoding/mojibake issues. Fixing copy encoding is useful, but it is separate from shell architecture and should not be mixed into the first extraction.
- Existing `components/catalog/*` are useful, but several names are too catalog-specific for cross-page usage. Prefer introducing `components/shell/*` first, then migrate gradually.

#### First Extraction Candidates

1. `PageShell`
2. `PageHero`
3. `SectionHeader`
4. `SurfacePanel`
5. `MetricCard` / `MetricStrip`
6. `ContentGrid`
7. `PageToolbar`
8. `CardBase`

Recommended first code step: create `components/shell/` with pure presentation primitives and migrate only one low-risk usage first. The best first migration is replacing `Vault.jsx` local `SectionHeader` and `VaultPanel` with shared `SectionHeader` and `SurfacePanel`.

## Phase 2 - Create Shared Shell Primitives

Goal: add shared layout primitives without changing page behavior.

Tasks:

1. Create `components/shell/` directory.
2. Add `PageShell`, `PageHero`, `SectionHeader`, `MetricCard`, `ContentGrid`, `PageToolbar`, `StatusBadge`, `EmptyState`, `LoadingSkeleton`.
3. Keep components presentation-only.
4. Do not migrate all pages yet.
5. Build after each small extraction.

## Phase 3 - Card Foundation

Goal: make card variants share the same foundation.

Tasks:

1. Define `CardBase`.
2. Define `StarCardBase`.
3. Extract reusable image slot, metadata slot, badge slot, and action slot.
4. Keep `StarAssetImage` as the only visual star asset resolver.
5. Do not connect backend or blockchain actions.

## Phase 4 - Migrate Stars Page To Shell

Goal: make Stars the first complete consumer of the web shell.

Tasks:

1. Replace page-local hero/toolbar/grid wrappers with shell primitives.
2. Keep current visual direction.
3. Preserve StarRepository / CatalogStore behavior.
4. Verify filters, sort, and cards still work.
5. Build and visually inspect.

## Phase 5 - Migrate StarVault Page To Shell

Goal: convert the current StarVault dashboard architecture into shared shell primitives.

Tasks:

1. Replace local section wrappers with `PageShell` and `SectionHeader`.
2. Use shared `MetricCard`.
3. Convert owned star cards toward `VaultCard` using `StarCardBase`.
4. Keep encryption/decryption module isolated as a security module.
5. Do not bind live ownership data yet.

## Phase 6 - Migrate Marketplace, Stories, Cosmos

Goal: make remaining pages share the same page DNA.

Order:

1. Marketplace
2. Stories
3. Cosmos

Rules:

- No new feature logic.
- No visual detours.
- Use shell primitives first.
- Only create page-specific components when the shared primitive is insufficient.

## Phase 7 - Documentation And Guardrails

Goal: prevent future pages from drifting.

Tasks:

1. Document how to compose a StarClaim page.
2. Document when to create a page-specific component.
3. Document card variant rules.
4. Document responsive behavior.
5. Add examples for Stars, Vault, Marketplace, Stories, Cosmos.

## Completion Criteria

This sprint is complete when:

- Shared shell components exist.
- At least Stars and StarVault consume the shell.
- Remaining pages have clear migration targets.
- Build passes.
- No StarIdentity, StarRegistry, StarAsset, or StarAssetManager contracts are changed.
- No business logic is added to shell components.
- Future feature work can plug into shared layout primitives.

## Implementation Log

### 2026-07-01 - Shell Primitive Foundation

Added the first shared shell primitives without changing business logic:

- `PageShell`
- `PageHero`
- `SectionHeader`
- `SurfacePanel`
- `MetricCard`
- `PageToolbar`
- `ContentGrid`
- `StatusBadge`
- `EmptyState`
- `LoadingSkeleton`

First low-risk migration:

- StarVault now uses `PageShell`, `SectionHeader`, and `SurfacePanel`.
- StarVault metrics now use shared `MetricCard`.

Guardrails:

- No API, blockchain, registry, asset manager, or 3D behavior changed.
- `StarAssetImage` remains the current image resolver.
- Remaining page migrations should continue in small cuts.
