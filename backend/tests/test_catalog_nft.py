import copy
import json
from pathlib import Path

import pytest

from backend.catalog_commerce import CatalogCommercePolicy
from backend.catalog_nft import CatalogNftMetadataService, NftMetadataIntegrityError
from backend.catalog_service import CatalogQuery, CuratedCatalogService


ROOT = Path(__file__).parents[2]
CATALOG = ROOT / "shared" / "catalog" / "curated-pilot-v1.json"
REDIRECTS = ROOT / "shared" / "catalog" / "legacy-redirects-pilot-v1.json"
POLICY = ROOT / "shared" / "catalog" / "commerce-policy-v1.json"
MANIFEST = ROOT / "shared" / "catalog" / "nft-metadata-manifest-pilot-v1.json"


@pytest.fixture(scope="module")
def service():
    return CatalogNftMetadataService(
        CuratedCatalogService(CATALOG, REDIRECTS),
        CatalogCommercePolicy(POLICY),
    )


def test_document_contains_verifiable_catalog_and_policy_anchors(service):
    star = service.catalog.query(CatalogQuery(sort="brightest"))[0]
    document = service.document(star)
    verified = service.verify(document)
    core = document["properties"]["starclaim"]["immutable_core"]
    assert document["symbol"] == "STAR"
    assert core["canonical_id"] == star.canonical_id
    assert core["catalog_hash_sha256"] == service.catalog.catalog_hash
    assert core["commerce_reference"]["policy_hash_sha256"] == service.commerce.policy_hash
    assert "primary_price" not in json.dumps(core)
    assert verified["valid"] is True


def test_mutable_vault_extension_does_not_change_immutable_hash(service):
    star = service.catalog.query(CatalogQuery())[0]
    document = service.document(star)
    expected_hash = service.verify(document)["immutable_metadata_hash_sha256"]
    document["properties"]["starclaimVault"] = {
        "transactionId": "arweave-tx",
        "encrypted": True,
    }
    document["attributes"].append({"trait_type": "Vault", "value": "arweave-tx"})
    assert service.verify(document)["immutable_metadata_hash_sha256"] == expected_hash


def test_tampered_astronomy_or_hash_is_rejected(service):
    star = service.catalog.query(CatalogQuery())[0]
    document = service.document(star)
    tampered = copy.deepcopy(document)
    tampered["properties"]["starclaim"]["immutable_core"]["astronomy"]["astrometry"]["ra_deg"] += 1
    with pytest.raises(NftMetadataIntegrityError, match="hash mismatch"):
        service.verify(tampered)


def test_manifest_is_complete_deterministic_and_matches_committed_file(service):
    generated = service.manifest()
    committed = json.loads(MANIFEST.read_text(encoding="utf-8"))
    assert generated == committed
    assert generated["star_count"] == 84
    assert len({entry["canonical_id"] for entry in generated["entries"]}) == 84
    assert service.verify_manifest(generated) is True
    assert generated == service.manifest()
