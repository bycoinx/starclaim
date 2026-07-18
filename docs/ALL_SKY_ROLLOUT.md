# All-sky catalogue rollout

## Outcome

`all-sky-candidate-v1` is a review artifact, not the production catalogue. It
extends the approved 84-system pilot to 740 Bayer-designated systems across all
88 IAU constellations while preserving the pilot's canonical IDs and astronomy.

The IAU registry is stored in `shared/catalog/iau-constellations-v1.json`. The
selection uses the CDS Hipparcos Main Catalogue for ICRS astrometry and visual
magnitude; HYG v4.1 is only the Bayer/name cross-match. The candidate is capped
at ten systems per constellation and V≤5.5, producing a commercial target
inside the planned 600–800 range without treating that range as a scientific
quota.

## Release gates

The generated report verifies:

- all 88 registry codes are represented;
- the total remains inside the 600–800 target;
- canonical IDs and rounded ICRS coordinates are unique;
- all 84 pilot identities and astronomy fields remain unchanged;
- every record has a Bayer designation and source provenance;
- constellations below the reviewed minimum cannot be sold.

`CVn`, `Cae`, `Cam`, `Com`, `LMi`, `Lac`, `Lyn`, and `Vul` have fewer than five
eligible systems under the policy. They are `review-required`; their records
remain visible to curators and have `curation.sellable=false`.

## Batch sequence

The pilot is batch zero. The remaining 78 constellations are split into six
deterministic batches of thirteen. A batch containing an exception is marked
`review-required`; this prevents broad publication from hiding a local data
quality decision.

Before publishing a batch:

1. Review every exception and any cultural/asterism metadata needed by product.
2. Reconcile existing ownership and legacy redirects against the manifest hash.
3. Generate the matching commerce and NFT projections for the exact hash.
4. Exercise API, web, mobile, AR, certificate, and deep-link acceptance.
5. Enable that catalogue version for the approved batch only.

Regenerate the candidate with:

```text
python -m backend.catalog_rollout
pytest backend/tests/test_catalog_rollout.py
```

The generator intentionally does not alter the backend's active catalogue
path. Publication therefore cannot happen accidentally during curation.

## Expansion batch 1 projections

The first expansion batch has 108 candidates across thirteen constellations.
Six systems in CVn and Cae inherit their constellation's review hold, leaving
102 systems eligible for commerce and NFT metadata projection. The excluded
canonical IDs and the `constellation-review-required` reason are embedded in
both projection bindings.

`commerce-policy-all-sky-v1.json` preserves the pilot scoring, rarity, and USD
price bands exactly; only the policy version and catalogue binding change. The
generated artifacts are:

- `commerce-projection-expansion-1-v1.json`
- `nft-metadata-projection-expansion-1-v1.json`

Both artifacts bind the candidate catalogue hash, rollout manifest hash, batch
ID, constellation list, eligible count, and exclusions. The NFT projection
also binds the commerce projection hash, preventing metadata from being paired
with a different price/rarity calculation.

The web catalogue release bundles the 84 approved pilot systems with the 102
eligible expansion-1 systems. This 186-system slice is compiled into the web
application as a resilience source. Remote ownership rows still overlay the
canonical records, but an unavailable `/api/catalog/*` deployment can no longer
silently send the user back to the 53-row legacy commercial catalogue.

Regenerate and verify this slice with:

```text
python -m backend.catalog_batch_projection
pytest backend/tests/test_catalog_batch_projection.py
```
