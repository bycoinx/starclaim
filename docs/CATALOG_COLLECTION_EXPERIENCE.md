# Catalog Collection Experience

## Purpose

The web and mobile catalogs expose the curated pilot as constellation sets and
asterism badges without creating a second commercial product for the same star.
Every card, set and badge resolves to the same canonical star identity.

## Progress contract

- `total` is the number of canonical stars included in the group.
- `owned` is the number owned by the signed-in viewer. This is the only value
  used to calculate set completion.
- `claimed` is the number claimed globally, including stars owned by another
  account. It must never be treated as viewer progress.
- `available` is the number backed by an active commercial listing.
- `unlisted` is curated and visible, but cannot be purchased yet.
- `completionPercent` is `owned / total`, rounded to the nearest integer.

Constellation cards filter the catalog by IAU code. Asterism badges are
descriptive subsets (for example, the Big Dipper); they do not duplicate or
replace constellation products.

## Availability states

The shared presentation policy uses four states:

1. `owned`: the viewer owns the canonical star.
2. `claimed`: another account owns it.
3. `available`: a commercial listing exists and can be claimed.
4. `unlisted`: the star is part of the curated pilot but does not yet have a
   commercial listing.

Claim actions must be disabled for `claimed` and `unlisted` records. The legacy
catalog remains a temporary fallback only when the versioned curated endpoints
are unavailable.

## Data joins

The client joins these sources by canonical ID, with HIP as the migration
fallback:

- `/api/catalog/stars` for canonical astronomy and grouping data.
- `/api/catalog/pricing` for deterministic rarity and price quotes.
- `/api/stars` for commercial listing and global ownership state.
- Viewer ownership records for personal set progress.

The UI must not infer personal ownership from a global claimed flag.

## Sky and AR presentation

The camera AR overlay and the sensor-driven Sky Live renderer share one visual
state contract. Curated catalog metadata is joined onto astronomy rows by
canonical ID or HIP; RA/Dec values always remain sourced from the astronomy
record.

- `owned` uses gold and counts toward the viewer's set progress.
- `claimed` uses red and represents a globally locked star.
- `available` uses green and permits the claim action.
- `unlisted` uses muted slate and remains view-only.
- The selected constellation uses the renderer's blue focus treatment.

Constellation line features are matched to collection summaries by IAU code.
The camera overlay only emits segments for curated pilot constellations, applies
a fixed segment budget, rejects RA-wrap discontinuities and leaves all
non-curated sky features on the normal renderer policy.
