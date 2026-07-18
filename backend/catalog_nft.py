"""Deterministic NFT metadata envelopes for versioned canonical stars."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any, Iterable
from urllib.parse import quote

try:
    from backend.catalog_commerce import CatalogCommercePolicy
    from backend.catalog_domain import CanonicalStar, canonical_payload_hash
    from backend.catalog_service import CatalogQuery, CuratedCatalogService
except ModuleNotFoundError:
    from catalog_commerce import CatalogCommercePolicy
    from catalog_domain import CanonicalStar, canonical_payload_hash
    from catalog_service import CatalogQuery, CuratedCatalogService


NFT_METADATA_SCHEMA = "starclaim-nft-metadata-v1"
NFT_SYMBOL = "STAR"


class NftMetadataIntegrityError(ValueError):
    pass


class CatalogNftMetadataService:
    def __init__(
        self,
        catalog: CuratedCatalogService,
        commerce: CatalogCommercePolicy,
        *,
        metadata_base_uri: str = "https://starclaimx.com/api/catalog/nft-metadata",
        external_base_uri: str = "https://starclaimx.com/stars",
        image_uri: str = "https://starclaimx.com/assets/stars/fallback-preview.webp",
    ):
        if catalog.catalog_version != commerce.catalog_version:
            raise ValueError("NFT metadata catalog and commerce policy versions must match")
        self.catalog = catalog
        self.commerce = commerce
        self.metadata_base_uri = metadata_base_uri.rstrip("/")
        self.external_base_uri = external_base_uri.rstrip("/")
        self.image_uri = image_uri

    def immutable_core(self, star: CanonicalStar) -> dict[str, Any]:
        quote_payload = self.commerce.quote(star)
        astronomy = star.model_dump(mode="json")
        return {
            "schema": NFT_METADATA_SCHEMA,
            "canonical_id": star.canonical_id,
            "catalog_version": star.catalog_version,
            "catalog_hash_sha256": self.catalog.catalog_hash,
            "astronomy_hash_sha256": canonical_payload_hash(astronomy),
            "astronomy": astronomy,
            "commerce_reference": {
                "policy_version": quote_payload["policy_version"],
                "policy_hash_sha256": quote_payload["policy_hash_sha256"],
                "rarity_band": quote_payload["rarity_band"],
                "rarity_score": quote_payload["rarity_score"],
            },
        }

    def document(self, star: CanonicalStar) -> dict[str, Any]:
        core = self.immutable_core(star)
        core_hash = canonical_payload_hash(core)
        encoded_id = quote(star.canonical_id, safe="")
        attributes = [
            {"trait_type": "Canonical ID", "value": star.canonical_id},
            {"trait_type": "Catalog Version", "value": star.catalog_version},
            {"trait_type": "Constellation", "value": star.constellation.name},
            {"trait_type": "IAU Code", "value": star.constellation.iau_code},
            {"trait_type": "Bayer Designation", "value": star.designations.bayer_latin or "Unassigned"},
            {"trait_type": "Apparent Magnitude", "value": star.photometry.apparent_magnitude_v},
            {"trait_type": "Spectral Type", "value": star.stellar.spectral_type or "Unknown"},
            {"trait_type": "Rarity", "value": core["commerce_reference"]["rarity_band"]},
        ]
        return {
            "name": f"StarClaim · {star.display_name}",
            "symbol": NFT_SYMBOL,
            "description": (
                f"A StarClaim canonical record for {star.display_name} in "
                f"{star.constellation.name}. Ownership does not confer astronomical naming rights."
            ),
            "image": self.image_uri,
            "external_url": f"{self.external_base_uri}/{encoded_id}",
            "attributes": attributes,
            "properties": {
                "category": "image",
                "files": [{"uri": self.image_uri, "type": "image/webp"}],
                "starclaim": {
                    "immutable_core": core,
                    "integrity": {
                        "algorithm": "SHA-256",
                        "canonicalization": "StarClaim sorted compact JSON v1",
                        "immutable_metadata_hash_sha256": core_hash,
                    },
                },
            },
        }

    def verify(self, document: dict[str, Any]) -> dict[str, Any]:
        starclaim = document.get("properties", {}).get("starclaim", {})
        core = starclaim.get("immutable_core")
        integrity = starclaim.get("integrity", {})
        if not isinstance(core, dict):
            raise NftMetadataIntegrityError("NFT metadata is missing immutable_core")
        expected_hash = integrity.get("immutable_metadata_hash_sha256")
        actual_hash = canonical_payload_hash(core)
        if expected_hash != actual_hash:
            raise NftMetadataIntegrityError("NFT immutable metadata hash mismatch")
        canonical_id = core.get("canonical_id")
        star = self.catalog.get_star(str(canonical_id))
        expected_core = self.immutable_core(star)
        if core != expected_core:
            raise NftMetadataIntegrityError("NFT immutable core does not match the published catalog")
        return {
            "valid": True,
            "canonical_id": canonical_id,
            "catalog_version": core["catalog_version"],
            "catalog_hash_sha256": core["catalog_hash_sha256"],
            "immutable_metadata_hash_sha256": actual_hash,
        }

    def manifest(self, stars: Iterable[CanonicalStar] | None = None) -> dict[str, Any]:
        entries = []
        selected = (
            self.catalog.query(CatalogQuery(visible=True, sort="rank"))
            if stars is None else sorted(
                stars,
                key=lambda star: (
                    star.constellation.iau_code,
                    star.curation.rank_in_constellation,
                    star.canonical_id,
                ),
            )
        )
        for star in selected:
            core = self.immutable_core(star)
            encoded_id = quote(star.canonical_id, safe="")
            entries.append({
                "canonical_id": star.canonical_id,
                "astronomy_hash_sha256": core["astronomy_hash_sha256"],
                "immutable_metadata_hash_sha256": canonical_payload_hash(core),
                "metadata_source_uri": f"{self.metadata_base_uri}/{encoded_id}",
            })
        payload = {
            "schema": "starclaim-nft-metadata-manifest-v1",
            "catalog_version": self.catalog.catalog_version,
            "catalog_hash_sha256": self.catalog.catalog_hash,
            "policy_version": self.commerce.policy_version,
            "policy_hash_sha256": self.commerce.policy_hash,
            "star_count": len(entries),
            "entries": entries,
        }
        return {
            **payload,
            "manifest_hash_sha256": canonical_payload_hash(payload),
            "manifest_hash_scope": "document_without_manifest_hash_sha256_and_manifest_hash_scope",
        }

    @staticmethod
    def verify_manifest(manifest: dict[str, Any]) -> bool:
        payload = {
            key: value for key, value in manifest.items()
            if key not in {"manifest_hash_sha256", "manifest_hash_scope"}
        }
        return manifest.get("manifest_hash_sha256") == canonical_payload_hash(payload)


def main() -> None:
    root = Path(__file__).parents[1]
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--catalog", default=str(root / "shared" / "catalog" / "curated-pilot-v1.json"))
    parser.add_argument("--redirects", default=str(root / "shared" / "catalog" / "legacy-redirects-pilot-v1.json"))
    parser.add_argument("--policy", default=str(root / "shared" / "catalog" / "commerce-policy-v1.json"))
    parser.add_argument("--output", default=str(root / "shared" / "catalog" / "nft-metadata-manifest-pilot-v1.json"))
    args = parser.parse_args()
    service = CatalogNftMetadataService(
        CuratedCatalogService(args.catalog, args.redirects),
        CatalogCommercePolicy(args.policy),
    )
    manifest = service.manifest()
    output = Path(args.output)
    output.write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(json.dumps({
        "output": str(output),
        "star_count": manifest["star_count"],
        "manifest_hash_sha256": manifest["manifest_hash_sha256"],
    }, indent=2))


if __name__ == "__main__":
    main()
