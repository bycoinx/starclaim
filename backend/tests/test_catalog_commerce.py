import json
from copy import deepcopy
from pathlib import Path

import pytest

from backend.catalog_commerce import CatalogCommercePolicy, CommerceQuery
from backend.catalog_domain import CanonicalStar


ROOT = Path(__file__).parents[2]
CATALOG_PATH = ROOT / "shared" / "catalog" / "curated-pilot-v1.json"
POLICY_PATH = ROOT / "shared" / "catalog" / "commerce-policy-v1.json"
COMMERCE_PATH = ROOT / "shared" / "catalog" / "curated-commerce-pilot-v1.json"


@pytest.fixture(scope="module")
def policy():
    return CatalogCommercePolicy(POLICY_PATH)


@pytest.fixture(scope="module")
def stars():
    payload = json.loads(CATALOG_PATH.read_text(encoding="utf-8"))
    return [CanonicalStar.model_validate(star) for star in payload["stars"]]


def test_identical_inputs_produce_identical_score_rarity_and_price(policy, stars):
    first = policy.quote(stars[0])
    second = policy.quote(CanonicalStar.model_validate(stars[0].model_dump()))
    assert first == second
    assert first["primary_price"].endswith(".00")
    assert sum(first["score_breakdown"].values()) == first["rarity_score"]


def test_alpha_designation_alone_cannot_create_legendary_rarity(policy, stars):
    payload = stars[-1].model_dump()
    payload["designations"]["bayer_letter"] = "alpha"
    payload["designations"]["bayer_latin"] = "Alpha Lyrae"
    payload["display_name"] = "Alpha Lyrae"
    payload["photometry"]["apparent_magnitude_v"] = 5.0
    payload["curation"]["rank_in_constellation"] = 12
    payload["asterisms"] = []
    star = CanonicalStar.model_validate(payload)
    quote = policy.quote(star)
    assert quote["score_breakdown"]["alpha_bayer"] == 4
    assert quote["rarity_band"] != "legendary"


def test_purchase_snapshot_never_reprices_under_current_policy(policy, stars):
    quote = policy.quote(stars[0])
    snapshot = {
        **quote,
        "primary_price": "123.45",
        "policy_version": "commerce-legacy-v0",
        "policy_hash_sha256": "frozen-hash",
        "purchased_at": "2026-07-18T00:00:00Z",
    }
    resolved = policy.resolve_price(stars[0], snapshot)
    assert resolved["primary_price"] == "123.45"
    assert resolved["policy_version"] == "commerce-legacy-v0"
    assert resolved["frozen"] is True


def test_policy_rejects_catalog_version_drift(policy, stars):
    payload = deepcopy(stars[0].model_dump())
    payload["catalog_version"] = "pilot-v2"
    with pytest.raises(ValueError, match="does not match policy"):
        policy.quote(CanonicalStar.model_validate(payload))


def test_committed_commerce_manifest_matches_policy(policy, stars):
    committed = json.loads(COMMERCE_PATH.read_text(encoding="utf-8"))
    generated = policy.build_manifest(stars)
    assert committed == generated
    assert committed["star_count"] == 84
    assert sum(committed["rarity_counts"].values()) == 84
    assert len({quote["canonical_id"] for quote in committed["quotes"]}) == 84


def test_price_filters_share_one_quote_source(policy, stars):
    all_quotes = policy.query_quotes(stars, CommerceQuery())
    epic = policy.query_quotes(stars, CommerceQuery(rarity_band="epic"))
    assert epic
    assert all(quote in all_quotes for quote in epic)
    assert all(quote["rarity_band"] == "epic" for quote in epic)
