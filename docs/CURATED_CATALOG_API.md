# Curated catalog API

The curated astronomy catalog is read-only and separate from MongoDB commerce
records. Its default release state is `preview`; set
`CURATED_CATALOG_PUBLICATION=disabled` to disable catalog data routes or
`published` when the client rollout is approved.

## Endpoints

- `GET /api/catalog` returns version, SHA-256 hash, source policy, counts, and
  publication state.
- `GET /api/catalog/nft-manifest` returns the deterministic pilot NFT integrity
  manifest.
- `GET /api/catalog/nft-metadata/{canonical_id}` returns a Metaplex-compatible
  off-chain document with a verifiable immutable StarClaim core.
- `POST /api/catalog/nft-metadata/verify` verifies the immutable hash and exact
  match against the published catalog and commerce policy.
- `GET /api/catalog/stars` returns canonical records with deterministic
  pagination.
- `GET /api/catalog/stars/count` applies the exact same filters without
  pagination.
- `GET /api/catalog/stars/{canonical_id}` returns one canonical record.
- `GET /api/catalog/constellations` returns pilot policy summaries.
- `GET /api/catalog/redirects/{legacy_id}` resolves reviewed legacy IDs or
  reports quarantine state.
- `GET /api/catalog/policy` returns the active rarity/primary-price policy.
- `GET /api/catalog/pricing` and `/api/catalog/pricing/count` expose the same
  deterministic commercial quote filters.
- `GET /api/catalog/pricing/{canonical_id}` returns one versioned quote.

Shared list/count filters are `catalog_version`, `iau_code`, `bayer`,
`asterism`, `magnitude_min`, `magnitude_max`, `sellable`, `visible`, `search`,
`sort`, and `available`. Sort values are `rank`, `brightest`, `name`, and
`nearest`. List-only pagination parameters are `limit` (1-200) and `offset`.

`available` is a commerce overlay. It checks mapped legacy MongoDB records but
never writes owner, price, or listing state into the immutable astronomy
manifest. Queries without that filter remain available when MongoDB is down.

The old bulk HYG commerce seed is disabled by default. It can only read the
local v4.1 file when `ENABLE_LEGACY_HYG_SEED=1`; startup never downloads a
catalog or creates random fallback stars. New curated imports remain a separate,
reviewed operation.

## Legacy compatibility

`shared/catalog/legacy-redirects-pilot-v1.json` is generated from the read-only
reconciliation report. If a merged legacy row is removed in a later reviewed
migration, `GET /api/stars/{star_id}` falls back to its recorded survivor and
includes a `legacy_redirect` explanation. Unknown IDs are never guessed.
