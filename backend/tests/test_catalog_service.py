import json
from pathlib import Path

import pytest

from backend.catalog_reconcile import build_redirect_manifest
from backend.catalog_service import (
    CatalogQuery, CatalogVersionNotFoundError, CuratedCatalogService,
    LegacyRedirectNotFoundError,
)


ROOT = Path(__file__).parents[2]
MANIFEST = ROOT / "shared" / "catalog" / "curated-pilot-v1.json"
REDIRECTS = ROOT / "shared" / "catalog" / "legacy-redirects-pilot-v1.json"


@pytest.fixture(scope="module")
def service():
    return CuratedCatalogService(MANIFEST, REDIRECTS)


def test_list_and_count_share_the_exact_query_contract(service):
    queries = [
        CatalogQuery(),
        CatalogQuery(iau_code="Ori", magnitude_max=2.0),
        CatalogQuery(asterism="Big Dipper"),
        CatalogQuery(search="alpha", sort="brightest"),
        CatalogQuery(bayer="alpha", sellable=True),
    ]
    for query in queries:
        assert service.count(query) == len(service.query(query))


def test_version_filter_and_deterministic_pagination_source(service):
    with pytest.raises(CatalogVersionNotFoundError):
        service.query(CatalogQuery(catalog_version="missing-v9"))
    first = service.query(CatalogQuery(sort="brightest"))
    second = service.query(CatalogQuery(sort="brightest"))
    assert [star.canonical_id for star in first] == [star.canonical_id for star in second]
    assert first[0].photometry.apparent_magnitude_v <= first[-1].photometry.apparent_magnitude_v


def test_metadata_hash_matches_committed_manifest(service):
    metadata = service.metadata()
    assert metadata["catalog_version"] == "pilot-v1"
    assert metadata["star_count"] == 84
    assert len(metadata["catalog_hash_sha256"]) == 64
    assert metadata["commerce_embedded"] is False


def test_legacy_redirects_resolve_and_unknown_ids_do_not_guess(service):
    payload = json.loads(REDIRECTS.read_text(encoding="utf-8"))
    legacy_id = next(iter(payload["redirects"]))
    resolved = service.resolve_legacy(legacy_id)
    assert resolved["canonical_id"].startswith("hip:")
    with pytest.raises(LegacyRedirectNotFoundError):
        service.resolve_legacy("not-a-real-legacy-id")


def test_commerce_availability_is_an_overlay_not_catalog_state(service):
    payload = json.loads(REDIRECTS.read_text(encoding="utf-8"))
    legacy_id, redirect = next(iter(payload["redirects"].items()))
    star = service.get_star(redirect["canonical_id"])
    assert service.filter_by_availability([star], [], True) == []
    assert service.filter_by_availability([star], [], False) == [star]
    assert service.filter_by_availability([star], [{"star_id": legacy_id, "owner_id": None}], True) == [star]
    assert service.filter_by_availability([star], [{"star_id": legacy_id, "owner_id": "owner"}], True) == []
    assert "available" not in star.model_dump(mode="json")


def test_redirect_projection_preserves_merge_survivor_and_quarantine():
    report = {
        "records": [
            {"legacy_id": "proper", "status": "matched", "canonical_id": "hip:1", "reasons": []},
            {"legacy_id": "alias", "status": "merge", "canonical_id": "hip:1", "reasons": []},
            {"legacy_id": "dso", "status": "quarantine", "canonical_id": None, "reasons": ["not stellar"]},
        ],
        "merge_groups": [{"canonical_id": "hip:1", "survivor_legacy_id": "proper"}],
    }
    manifest = build_redirect_manifest(report, "pilot-v1", {"hip:1"})
    assert manifest["redirects"]["alias"]["survivor_legacy_id"] == "proper"
    assert manifest["redirects"]["alias"]["redirect_required"] is True
    assert manifest["quarantined"]["dso"]["reason"] == "not stellar"


def test_service_rejects_redirects_to_another_catalog(tmp_path):
    redirects = tmp_path / "redirects.json"
    redirects.write_text(json.dumps({
        "catalog_version": "pilot-v1",
        "redirects": {"legacy": {"canonical_id": "hip:999999", "survivor_legacy_id": "legacy"}},
    }), encoding="utf-8")
    with pytest.raises(ValueError, match="unknown canonical IDs"):
        CuratedCatalogService(MANIFEST, redirects)
