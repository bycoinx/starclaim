# Curated catalog commerce policy

Astronomy records never contain rarity, price, ownership, or listing state.
`shared/catalog/commerce-policy-v1.json` is a separate, versioned commercial
policy applied to `pilot-v1` canonical stars.

## Rarity score

The score is the sum of explicit policy inputs: visual-magnitude band,
brightness rank inside the curated constellation set, asterism membership,
proper-name presence, a small Bayer Alpha contribution, a small zodiac tag
contribution, and reviewed cultural overrides. Pilot v1 has no subjective
cultural overrides.

Rarity bands are `standard`, `rare`, `epic`, and `legendary`. `zodiac` remains
an astronomy/product tag and is not a rarity. A legacy tier projection is
included temporarily for current web/mobile clients.

## Primary price

Each rarity band has a USD base and a deterministic increment per score point.
The generated quotes are stored in
`shared/catalog/curated-commerce-pilot-v1.json`. Formatting, key order, and line
endings do not affect policy or catalog hashes because hashes use canonical
JSON semantics.

Package multipliers, resale asking prices, promotions, taxes, and payment fees
are outside this primary-price policy.

## Purchase freeze

A purchase snapshot must retain `canonical_id`, `catalog_version`,
`policy_version`, `policy_hash_sha256`, `currency`, and `primary_price`, plus the
actual charged amount and purchase timestamp in the order. Snapshot resolution
always returns the stored price, even after a new policy is published. Existing
legacy orders already preserve their authoritative `amount` and are not
retroactively evaluated by this policy.

## API

- `GET /api/catalog/policy`
- `GET /api/catalog/pricing`
- `GET /api/catalog/pricing/count`
- `GET /api/catalog/pricing/{canonical_id}`

Pricing list/count share `rarity_band`, `min_price`, and `max_price` filters.
Both catalog and policy versions can be pinned by clients.
