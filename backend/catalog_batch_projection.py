"""Generate commerce and NFT projections for a reviewed rollout batch."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any

from backend.catalog_commerce import CatalogCommercePolicy
from backend.catalog_domain import CanonicalStar, canonical_payload_hash
from backend.catalog_nft import CatalogNftMetadataService
from backend.catalog_service import CuratedCatalogService


PROJECTION_SCHEMA = "starclaim-catalog-batch-projection-v1"


def build_all_sky_policy(base_policy: dict[str, Any], catalog_version: str) -> dict[str, Any]:
    """Reuse frozen scoring/prices while creating a new catalog-bound policy."""
    return {
        **base_policy,
        "policy_version": "commerce-all-sky-v1",
        "catalog_version": catalog_version,
        "derived_from_policy_version": base_policy["policy_version"],
        "change_scope": "catalog-version binding only; score and price bands unchanged",
    }


def _batch(candidate: dict[str, Any], batch_id: str) -> dict[str, Any]:
    try:
        return next(batch for batch in candidate["batches"] if batch["batch_id"] == batch_id)
    except StopIteration as exc:
        raise ValueError(f"Unknown rollout batch: {batch_id}") from exc


def build_batch_projections(
    catalog_path: str | Path,
    policy_path: str | Path,
    *,
    batch_id: str,
) -> tuple[dict[str, Any], dict[str, Any]]:
    candidate = json.loads(Path(catalog_path).read_text(encoding="utf-8"))
    batch = _batch(candidate, batch_id)
    catalog = CuratedCatalogService(catalog_path)
    policy = CatalogCommercePolicy(policy_path)
    if catalog.catalog_version != policy.catalog_version:
        raise ValueError("Batch projection catalog and commerce policy versions must match")

    batch_codes = set(batch["constellations"])
    batch_stars = [
        CanonicalStar.model_validate(payload) for payload in candidate["stars"]
        if payload["constellation"]["iau_code"] in batch_codes
    ]
    eligible = [star for star in batch_stars if star.curation.visible and star.curation.sellable]
    excluded = [star for star in batch_stars if star not in eligible]
    exclusion_rows = [
        {
            "canonical_id": star.canonical_id,
            "iau_code": star.constellation.iau_code,
            "reason": "constellation-review-required",
        }
        for star in sorted(excluded, key=lambda item: item.canonical_id)
    ]
    binding = {
        "catalog_version": catalog.catalog_version,
        "catalog_hash_sha256": catalog.catalog_hash,
        "rollout_manifest_sha256": candidate["manifest_sha256"],
        "batch_id": batch_id,
        "batch_sequence": batch["sequence"],
        "batch_status": batch["status"],
        "constellations": batch["constellations"],
        "candidate_star_count": len(batch_stars),
        "eligible_star_count": len(eligible),
        "excluded_star_count": len(excluded),
        "excluded": exclusion_rows,
    }

    commerce = {
        "schema": PROJECTION_SCHEMA,
        "projection_type": "commerce",
        "binding": binding,
        **policy.build_manifest(eligible),
    }
    commerce["projection_hash_sha256"] = canonical_payload_hash(commerce)

    nft_service = CatalogNftMetadataService(catalog, policy)
    nft_manifest = nft_service.manifest(eligible)
    nft = {
        "schema": PROJECTION_SCHEMA,
        "projection_type": "nft-metadata",
        "binding": binding,
        "commerce_projection_hash_sha256": commerce["projection_hash_sha256"],
        "nft_manifest": nft_manifest,
    }
    nft["projection_hash_sha256"] = canonical_payload_hash(nft)
    return commerce, nft


def write_batch_projections(
    commerce: dict[str, Any], nft: dict[str, Any], output_dir: str | Path, batch_id: str
) -> tuple[Path, Path]:
    output = Path(output_dir)
    output.mkdir(parents=True, exist_ok=True)
    commerce_path = output / f"commerce-projection-{batch_id}-v1.json"
    nft_path = output / f"nft-metadata-projection-{batch_id}-v1.json"
    commerce_path.write_text(json.dumps(commerce, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    nft_path.write_text(json.dumps(nft, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    return commerce_path, nft_path


def main() -> None:
    root = Path(__file__).parents[1]
    catalog_dir = root / "shared" / "catalog"
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--batch-id", default="expansion-1")
    parser.add_argument("--catalog", default=str(catalog_dir / "curated-all-sky-candidate-v1.json"))
    parser.add_argument("--base-policy", default=str(catalog_dir / "commerce-policy-v1.json"))
    parser.add_argument("--policy", default=str(catalog_dir / "commerce-policy-all-sky-v1.json"))
    parser.add_argument("--output-dir", default=str(catalog_dir))
    args = parser.parse_args()

    base_policy = json.loads(Path(args.base_policy).read_text(encoding="utf-8"))
    candidate = json.loads(Path(args.catalog).read_text(encoding="utf-8"))
    policy_payload = build_all_sky_policy(base_policy, candidate["catalog_version"])
    policy_path = Path(args.policy)
    policy_path.write_text(json.dumps(policy_payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    commerce, nft = build_batch_projections(args.catalog, policy_path, batch_id=args.batch_id)
    commerce_path, nft_path = write_batch_projections(commerce, nft, args.output_dir, args.batch_id)
    print(json.dumps({
        "batch_id": args.batch_id,
        "eligible_star_count": commerce["binding"]["eligible_star_count"],
        "excluded_star_count": commerce["binding"]["excluded_star_count"],
        "commerce_output": str(commerce_path),
        "nft_output": str(nft_path),
        "commerce_projection_hash_sha256": commerce["projection_hash_sha256"],
        "nft_projection_hash_sha256": nft["projection_hash_sha256"],
    }, indent=2))


if __name__ == "__main__":
    main()
