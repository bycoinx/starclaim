# StarClaim curated star catalog plan

## Objective

Build a commercially manageable catalog of prominent, verifiable stars without
breaking existing ownership, order, certificate, deep-link, or NFT references.
The target is approximately 600–800 sellable systems across the 88 IAU
constellations, but the final count is an output of the curation rules rather
than a hard quota.

## Non-negotiable decisions

1. Astronomical identity and commercial listing are separate records. Price,
   rarity, availability, and ownership never redefine a physical star.
2. A Bayer designation, proper name, HIP, HD, HR, and Gaia source are aliases or
   catalogue identifiers of one canonical object, not separate products.
3. The default product scope is the visible stellar system. Individual binary
   components are not separately sellable unless explicitly reviewed.
4. Constellations use IAU names, genitives, and three-letter codes. Asterisms
   such as the Big Dipper are separate group metadata.
5. Existing `star_id` references are never deleted in place. Migration uses
   legacy redirects and an auditable merge map.
6. Alpha is not assumed to be the brightest star. Bayer rank, apparent
   magnitude, asterism membership, and cultural prominence are separate facts.
7. HYG may assist cross-matching, but sellable records require source references
   from IAU/CDS and Gaia or Hipparcos-quality astrometry.

## Execution order

### Phase 1 — baseline and contracts

- Run the read-only catalog audit and preserve its JSON output as a release
  artifact, not as production data.
- Correct the default magnitude range so negative-magnitude stars are visible.
- Adopt `shared/catalog/star-catalog.schema.json` as the canonical import and
  API contract.
- Use `backend/catalog_domain.py` for canonical-ID validation and collision-safe
  alias resolution.
- Record the live backend and catalog version in diagnostics.

Acceptance: no database writes; current ownership/order counts are unchanged;
Sirius, Canopus, and Arcturus appear under default filters.

### Phase 2 — legacy reconciliation

- Cross-match all 53 legacy records against HR/HIP/Gaia identifiers.
- Produce an idempotent dry-run merge map for known duplicates.
- Quarantine records that are not confirmed stellar systems.
- Preserve legacy IDs as aliases and update references transactionally only
  after the dry-run report is approved.

Acceptance: every legacy record is `matched`, `merge`, or `quarantine`; no
unexplained deletion; ownership, orders, certificates, stories, and marketplace
links resolve through the map.

### Phase 3 — pilot curation

- Curate ten constellations representing northern, southern, zodiac, and
  asterism use cases.
- Select normally 5–12 stars per constellation using Bayer membership and a
  configurable visual-magnitude ceiling, with reviewed exceptions.
- Validate coordinates, identifiers, names, system/component scope, and source
  provenance.

Acceptance: deterministic output, no canonical-ID or coordinate duplicates,
schema validation passes, and each inclusion has a reason and source.

Pilot v1 covers Orion, Ursa Major, Cassiopeia, Scorpius, Taurus, Leo,
Sagittarius, Crux, Centaurus, and Lyra. `backend/catalog_curate.py` uses HYG v4.1
for Bayer/name cross-matching but replaces its positional and visual-magnitude
values with the CDS Hipparcos Main Catalogue. The generated, versioned manifest
is `shared/catalog/curated-pilot-v1.json`.

### Phase 4 — catalog service

- Import versioned canonical astronomy records separately from listings.
- Add curated-only, IAU code, Bayer, asterism, magnitude, availability, and
  version filters to the backend.
- Make `/stars/count` and pagination use the exact same query contract.
- Expose legacy redirects and catalog-version metadata.

Acceptance: count equals paginated results; old star URLs still resolve; API
responses validate against the canonical projection.

Implemented by `backend/catalog_service.py` and the `/api/catalog/*` routes.
The immutable pilot manifest remains separate from MongoDB commerce data;
availability is an optional read-only overlay. Legacy resolution is versioned
in `shared/catalog/legacy-redirects-pilot-v1.json`.

### Phase 5 — commercial policy

- Define rarity with a versioned, deterministic score. Inputs may include
  brightness band, constellation rank, reviewed cultural prominence, and
  asterism membership.
- Keep pricing in a separate policy table so astronomy imports cannot silently
  change prices.
- Freeze price-policy versions for already purchased assets.

Acceptance: identical inputs produce identical rarity and price; Alpha alone
does not force the highest tier; purchased assets do not reprice retroactively.

Implemented by `backend/catalog_commerce.py` with the versioned policy
`shared/catalog/commerce-policy-v1.json`. The generated 84-star quote projection
is `shared/catalog/curated-commerce-pilot-v1.json`; purchase snapshots remain
authoritative after later policy releases.

### Phase 6 — product experience

- Group cards by constellation and show proper name plus Bayer designation.
- Add constellation/asterism progress without making the badge itself a second
  claim on the same star.
- Preserve selection and camera targets between web 2D/3D and mobile.
- Display available, owned, locked, and quarantined states from the same API.

### Phase 7 — AR and chain integration

- Drive constellation lines and AR highlights from canonical IDs and versioned
  asterism geometry.
- Mint on purchase rather than pre-minting the full catalogue where possible.
- Put canonical ID, catalogue version, and metadata hash in NFT metadata; keep
  mutable price/availability outside immutable astronomy metadata.

### Phase 8 — rollout

- Release the ten-constellation pilot behind a catalogue-version flag.
- Run web/mobile/API/AR acceptance and ownership reconciliation.
- Expand constellation batches only after data-quality gates pass.

The controlled all-sky candidate is generated by `backend/catalog_rollout.py`.
It preserves every pilot canonical ID, expands coverage to all 88 IAU
constellations, and keeps the result unpublished until review. The versioned
candidate contains 740 systems selected at V≤5.5 with a maximum of ten per
constellation. Batch and gate decisions are stored in
`all-sky-batches-v1.json` and `all-sky-rollout-report-v1.json`.

Eight small constellations currently have fewer than five eligible
Bayer-designated Hipparcos systems: CVn, Cae, Cam, Com, LMi, Lac, Lyn, and Vul.
They remain visible for review but are explicitly non-sellable. Publication is
a separate release action after exception review, ownership reconciliation,
commerce/NFT projection, and cross-platform acceptance.

## Immediate commands

```text
python -m backend.catalog_audit --api-base https://starclaim.onrender.com/api
python -m backend.catalog_reconcile --api-base https://starclaim.onrender.com/api
python -m backend.catalog_curate
pytest backend/tests/test_catalog_audit.py
cd frontend && npm run test:ci -- src/stores/celestialStore.test.js
```

The reconciliation command is a strict dry-run: it does not open a database
connection. It reports strong HYG cross-matches, canonical-ID merge groups,
reviewed non-stellar quarantine exceptions, unresolved records, and the legacy
commerce references that a future reviewed migration must preserve.
