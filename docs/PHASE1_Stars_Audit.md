Phase 1 — Stars UI Data Flow Audit

Scope
- Entry page: `frontend/src/pages/StarPicker.jsx`
- Catalog state/provider: `frontend/src/lib/CatalogStore.jsx`
- Repository/registry: `frontend/src/lib/StarRepository.js`, `frontend/src/lib/StarRegistry.js`
- Asset manager: `frontend/src/lib/StarAssetManager.js`
- Image renderer: `frontend/src/components/catalog/StarAssetImage.jsx`
- Card/orchestration: `frontend/src/components/catalog/StarCard.jsx`
- Format helpers: `frontend/src/lib/formatters.js`

Findings (concise)
1) Asset host/fallback: `StarAssetManager` references `/assets/stars/*` fallback files but repository doesn't include `public/assets/stars`. This causes inconsistent visuals unless a hosting strategy is chosen.
2) `StarAssetImage` currently draws star visuals via CSS/gradients and does not render `previewImage`/`heroImage` as actual `<img>` content; no `alt` text or lazy-loading exists.
3) Mapping/normalization responsibilities are split between `StarRepository.normalize` and `StarAssetManager.getStarAsset`, producing duplicated mapping logic and fragile field-name handling.
4) Raw registry payloads use inconsistent field names (`star_id` vs `starId`, `spect` vs `spectralType`, `preview_url` vs `preview_image`), increasing risk of nulls and UI bugs.
5) `CatalogStore` currently performs full client-side filtering, sorting and pagination on `StarRepository.loadAll()` — this will not scale to large catalogs and risks high memory usage.
6) `formatters.js` centralizes formatting (good), but small inline format ad-hoc transformations remain in some components.
7) Asset preloading is a placeholder; no real image prefetch/cache strategy exists.
8) Accessibility: images lack `alt` and some interactive controls miss ARIA improvements.

Risks & Priorities
- High: client-side pagination for large datasets (performance and UX). Recommend backend-assisted paging or incremental loading.
- Medium: inconsistent field mapping and asset hosting (data correctness, broken images). Recommend adapter and asset hosting plan.
- Low: accessibility and missing lazy-loading (quick fixes yield immediate UX benefits).

Recommended Plan (short term -> medium term)
Short term (quick wins)
- Add `<img>` fallback + `alt` + `loading="lazy"` in `StarAssetImage` to surface real images when present.
- Provide or point fallback assets: add `frontend/public/assets/stars/fallback-*.{webp,jpg,pdf}` or update fallback to CDN.
- Create `mapRawStarFields(raw)` adapter in `StarRepository` and call it during `loadAll()` to normalize input shapes.
- Add unit tests for `mapRawStarFields` using sample payloads.

Medium term
- Separate responsibilities: keep `StarRepository.normalize` to domain shape; keep `StarAssetManager` to asset/visual concerns.
- Implement `StarAssetManager.preloadStarAssets` to actually prefetch images for hero/preview variants.
- Plan server-side pagination or cursor endpoints and adapt `CatalogStore` to request pages.

Deliverables I can help implement now (pick subset to execute)
- (A) Detailed audit (this file) — done.
- (B) Quick PR: `StarAssetImage.jsx` image fallback + lazy loading + alt text.
- (C) Add `mapRawStarFields` adapter and wire-in to `StarRepository.loadAll()`.

Next actions I will take after your confirmation:
- Implement B then C as code changes and create commits. (You already asked to run A→B→C; I'll proceed unless you opt out.)

