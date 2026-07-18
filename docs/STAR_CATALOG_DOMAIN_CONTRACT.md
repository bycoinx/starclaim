# Star catalog domain contract

## Identity

`canonical_id` identifies one physical sellable scope and is derived in this
order:

1. `hip:<HIP>`
2. `gaia-dr3:<source_id>`
3. `hr:<HR>`

Component records append a normalized component suffix. A visible stellar
system is the default product scope; a component must be explicitly identified
and reviewed.

## Names and aliases

Proper names, Bayer designations, Flamsteed designations, legacy StarClaim IDs,
and prefixed catalogue IDs resolve to the same canonical ID. Greek Bayer
letters normalize to their Latin names, so `β Orionis`, `Beta Orionis`, and
`Beta-Orionis` resolve identically.

Alias collisions are never resolved by insertion order. They are reported as
ambiguous and must be corrected during curation.

## Separation from commerce

The canonical model contains astronomical identity, astrometry, photometry,
stellar metadata, source provenance, and curation eligibility. It deliberately
does not contain price, owner, listing state, certificate state, or NFT
transaction data. Those records reference `canonical_id` and retain their own
versioned policies.

## Implementations

- JSON interchange contract: `shared/catalog/star-catalog.schema.json`
- Backend domain and alias resolver: `backend/catalog_domain.py`
- Legacy quality audit: `backend/catalog_audit.py`
- Legacy reconciliation dry-run: `backend/catalog_reconcile.py`
- Ten-constellation pilot curator: `backend/catalog_curate.py`
- Versioned pilot manifest: `shared/catalog/curated-pilot-v1.json`
