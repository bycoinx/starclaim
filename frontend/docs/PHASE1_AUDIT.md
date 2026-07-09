Phase 1 — Stars UI Data Flow Audit

Summary
- Goal: Audit the existing Stars UI and supporting layers to identify data flow, duplicated logic, and quick refactor targets without rewriting pages.
- Scope: frontend catalog pages/components, lib/repository/registry, asset manager, and backend endpoints supporting `/api/stars` and `/api/stars/count`.

Findings (high level)
- Entry point: `frontend/src/pages/StarPicker.jsx` (wraps `CatalogProvider`).
- Catalog state: `frontend/src/lib/CatalogStore.jsx` (builds server query, paginates, memoizes filtered/sorted lists).
- Data access: `StarRepository` (cache/normalize/loadPage) → `StarRegistry` (HTTP → `/api/stars`, `/api/stars/count`).
- Asset resolution: `frontend/src/lib/StarAssetManager.js` (fallbacks, preview/hero resolution).
- UI consumers: `frontend/src/components/catalog/*` (Grid, Toolbar, Pagination, StarCard, StarAssetImage).

Concrete duplicated/overlapping logic
1. Two `StarCard` components
   - `frontend/src/components/StarCard.jsx` (top-level)
   - `frontend/src/components/catalog/StarCard.jsx` (catalog-specific)
   - Only the catalog `StarCard` is imported by `CatalogGrid` — the other appears unused; merge or remove to avoid duplication.

2. Normalization happens in two layers
   - `StarRepository.mapRawStarFields` maps raw registry payloads to a partial shape.
   - `StarAssetManager.getStarAsset` then maps/derives asset fields (preview/hero, spectralType, distance conversion, tier metadata).
   - Overlap: `tier`, `price`, `owner_*`, `magnitude`, `distance`, `spect`/`spectralType`, preview/hero urls.
   - Suggestion: create a single canonical mapper that emits normalized model fields; reserve `StarAssetManager` for asset-specific fallbacks/variant resolution.

3. Field name inconsistencies
   - `star_id` vs `starId` vs `starId` in different layers.
   - `spect` vs `spectralType` vs `spectral_type`.
   - `preview_url`/`previewImage` variants across layers.
   - These lead to repeated guards and mapping code across repo and components.

Backend / API behavior notes
- `frontend/src/lib/CatalogStore.jsx` appends `viewer_ra` and `viewer_dec` to the page query only when `sort==='nearest'` (good).
- Backend `/api/stars` supports `viewer_ra/viewer_dec` and runs a `$geoNear` aggregation when `sort=='nearest'`.
- Backend `/api/stars/count` currently builds `q` and calls `count_documents(q)`; it does not account for `viewer_ra/viewer_dec` geospatial constraints. Result: when `sort=nearest`, `totalCount` returned to frontend may not reflect spatial filtering.
  - Recommendation: either (A) document that `count` is not spatial (and disable nearest count UI), or (B) extend `/api/stars/count` to perform an aggregation pipeline using `$geoNear` when `viewer_ra/dec` is provided and spatial filter is desired (note: `$geoNear` produces documents, so wrap with `$count`).

Performance & UX risks
- Frequent updates to `observerCoords` (e.g., from a 3D camera or rapid presets) will cause `CatalogStore.loadCatalog()` to re-run when `sort==='nearest'` and may trigger two parallel requests (`loadPage` + `countStars`). Throttle observer updates client-side to 200-500ms and debounce store reloads.
- Re-enabling `GalaxyScene` (3D) on low-RAM/dev machines causes build/run instability — keep it lazy-loaded and gated behind a feature flag.

Quick wins (low-effort, high-impact)
- Remove / consolidate the unused `frontend/src/components/StarCard.jsx` into the catalog variant.
- Create a single canonical `normalizeStar(raw)` exported from `frontend/src/lib/models.js` (or move `mapRawStarFields` into `StarAssetManager` and ensure it returns consistent keys) to remove duplication.
- Add a small throttle/debounce wrapper inside `CatalogStore.updateObserverCoords` or inside the 3D camera to limit refresh frequency.
- Update docs: `frontend/docs/REENABLE_COSMOS_3D.md` already exists — add a note to gate observer-driven catalog reloads.

Files to refactor first (priority order)
1. `frontend/src/lib/StarRepository.js` — centralize normalization and avoid dual-mapping.
2. `frontend/src/lib/StarAssetManager.js` — limit to asset resolution; consume canonical model instead of raw.
3. `frontend/src/components/catalog/StarCard.jsx` & `frontend/src/components/StarCard.jsx` — merge and remove duplicates.
4. `frontend/src/lib/CatalogStore.jsx` — add throttling on `observerCoords` updates and document count behavior for nearest.
5. `backend/server.py` — consider implementing geo-aware `/stars/count` if spatial counts are required.

Recommended next steps (conservative)
- Implement the canonical mapper and adapt `StarRepository.normalize` to rely on it (1–2 hours).
- Add a client-side debounce (200–400ms) for `updateObserverCoords` and re-test `sort=nearest` flow (30–60 minutes).
- If exact spatial counts are required for UX, extend backend `/api/stars/count` with an aggregation that uses `$geoNear` when `viewer_ra/dec` provided (30–90 minutes, plus DB index verification).

Notes / Assumptions
- I inspected code in `frontend/src` and `backend/server.py` for the data flow and API behavior.
- I did not modify code in this audit — only read and reported.

Artifacts
- Audit created: `frontend/docs/PHASE1_AUDIT.md` (this file)

Next: I can (A) implement the canonical mapper and merge `StarCard` (PR-style change), or (B) run a lightweight test baseline (`pytest`) to catch regressions. Which should I do next?