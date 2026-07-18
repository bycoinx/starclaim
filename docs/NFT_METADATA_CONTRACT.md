# StarClaim NFT Metadata Contract

## Scope

NFTs are minted on purchase and reference a versioned canonical star. The NFT
is proof of the StarClaim product record; it does not grant official
astronomical naming rights or ownership of a physical celestial object.

The contract has three integrity anchors:

1. `catalog_hash_sha256` identifies the complete curated catalog version.
2. `astronomy_hash_sha256` identifies the exact canonical star record.
3. `immutable_metadata_hash_sha256` identifies the complete immutable core,
   including catalog and commerce-policy references.

All hashes use UTF-8 JSON with recursively sorted keys, compact separators and
unescaped Unicode (`StarClaim sorted compact JSON v1`). Formatting and line
ending changes therefore do not change a hash.

## Immutable core

`properties.starclaim.immutable_core` contains:

- Canonical star ID and catalog version.
- Catalog hash and full canonical astronomy record.
- Astronomy-record hash.
- Commerce policy version and policy hash.
- The frozen rarity band and score derived by that policy.

The integrity hash is stored at
`properties.starclaim.integrity.immutable_metadata_hash_sha256`.

The following mutable values are deliberately excluded:

- Purchase price and future marketplace price.
- Availability, listing state and current owner.
- Dedication message, certificate state and shipping state.
- Encrypted Vault transaction IDs and URLs.
- Dynamic visual or media delivery state.

Vault updates may add `properties.starclaimVault` and a `Vault` attribute. They
must preserve `properties.starclaim` byte-for-semantic-byte.

## Publication artifacts and API

- Schema: `shared/catalog/star-nft-metadata.schema.json`
- Pilot manifest: `shared/catalog/nft-metadata-manifest-pilot-v1.json`
- `GET /api/catalog/nft-manifest`
- `GET /api/catalog/nft-metadata/{canonical_id}`
- `POST /api/catalog/nft-metadata/verify`

The manifest contains one entry per visible pilot star, its astronomy and
immutable metadata hashes, and the deterministic API source URI. The source URI
is not the URI written on-chain; the verified document must first be uploaded
to immutable storage. The manifest's own
`manifest_hash_sha256` is calculated after removing `manifest_hash_sha256` and
`manifest_hash_scope` from the document.

## Mint workflow

1. Resolve a commercial listing to its canonical ID.
2. Freeze the purchase price separately with policy version and hash.
3. Fetch the canonical NFT metadata document and verify it.
4. Upload the document to immutable storage.
5. Mint the NFT with the resulting metadata URI.
6. Store the mint address, metadata URI, canonical ID, catalog hash and
   immutable metadata hash in the order/ownership record.

Pre-minting the whole catalog is not part of the pilot policy.
