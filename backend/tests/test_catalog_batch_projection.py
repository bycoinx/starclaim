import json
from pathlib import Path

from backend.catalog_batch_projection import build_all_sky_policy, build_batch_projections
from backend.catalog_commerce import CatalogCommercePolicy
from backend.catalog_domain import canonical_payload_hash
from backend.catalog_nft import CatalogNftMetadataService
from backend.catalog_service import CatalogQuery, CuratedCatalogService


ROOT = Path(__file__).parents[2]
CATALOG_DIR = ROOT / "shared" / "catalog"


def _load(name: str):
    return json.loads((CATALOG_DIR / name).read_text(encoding="utf-8"))


def test_all_sky_policy_changes_only_version_binding():
    base = _load("commerce-policy-v1.json")
    expanded = build_all_sky_policy(base, "all-sky-candidate-v1")
    assert expanded["policy_version"] == "commerce-all-sky-v1"
    assert expanded["catalog_version"] == "all-sky-candidate-v1"
    for field in ("currency", "score_policy", "rarity_bands", "price_bands"):
        assert expanded[field] == base[field]


def test_committed_first_batch_projections_are_deterministic_and_bound():
    commerce, nft = build_batch_projections(
        CATALOG_DIR / "curated-all-sky-candidate-v1.json",
        CATALOG_DIR / "commerce-policy-all-sky-v1.json",
        batch_id="expansion-1",
    )
    assert commerce == _load("commerce-projection-expansion-1-v1.json")
    assert nft == _load("nft-metadata-projection-expansion-1-v1.json")
    assert commerce["binding"] == nft["binding"]
    assert commerce["binding"]["candidate_star_count"] == 108
    assert commerce["binding"]["eligible_star_count"] == 102
    assert commerce["binding"]["excluded_star_count"] == 6
    assert {row["iau_code"] for row in commerce["binding"]["excluded"]} == {"CVn", "Cae"}

    commerce_scope = {key: value for key, value in commerce.items() if key != "projection_hash_sha256"}
    nft_scope = {key: value for key, value in nft.items() if key != "projection_hash_sha256"}
    assert canonical_payload_hash(commerce_scope) == commerce["projection_hash_sha256"]
    assert canonical_payload_hash(nft_scope) == nft["projection_hash_sha256"]


def test_commerce_and_nft_project_exactly_the_same_eligible_stars():
    commerce = _load("commerce-projection-expansion-1-v1.json")
    nft = _load("nft-metadata-projection-expansion-1-v1.json")
    quote_ids = {quote["canonical_id"] for quote in commerce["quotes"]}
    nft_ids = {entry["canonical_id"] for entry in nft["nft_manifest"]["entries"]}
    excluded_ids = {row["canonical_id"] for row in commerce["binding"]["excluded"]}
    assert quote_ids == nft_ids
    assert quote_ids.isdisjoint(excluded_ids)
    assert len(quote_ids) == 102
    assert CatalogNftMetadataService.verify_manifest(nft["nft_manifest"])


def test_projected_metadata_document_verifies_against_candidate():
    catalog = CuratedCatalogService(CATALOG_DIR / "curated-all-sky-candidate-v1.json")
    policy = CatalogCommercePolicy(CATALOG_DIR / "commerce-policy-all-sky-v1.json")
    service = CatalogNftMetadataService(catalog, policy)
    projected_ids = {
        entry["canonical_id"]
        for entry in _load("nft-metadata-projection-expansion-1-v1.json")["nft_manifest"]["entries"]
    }
    star = next(
        item for item in catalog.query(CatalogQuery(sellable=True, visible=True, sort="rank"))
        if item.canonical_id in projected_ids
    )
    result = service.verify(service.document(star))
    assert result["valid"] is True
    assert result["canonical_id"] == star.canonical_id
