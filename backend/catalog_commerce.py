"""Deterministic rarity and primary-price policy for curated stars."""

from __future__ import annotations

import argparse
import json
from collections import Counter
from dataclasses import dataclass
from decimal import Decimal, ROUND_HALF_UP
from pathlib import Path
from typing import Any, Iterable

from backend.catalog_domain import CanonicalStar, canonical_payload_hash, normalize_catalog_alias


@dataclass(frozen=True)
class CommerceQuery:
    rarity_band: str | None = None
    min_price: Decimal | None = None
    max_price: Decimal | None = None


class CatalogCommercePolicy:
    def __init__(self, policy_path: str | Path):
        self.policy_path = Path(policy_path)
        self.payload = json.loads(self.policy_path.read_text(encoding="utf-8"))
        self.policy_hash = canonical_payload_hash(self.payload)
        self.policy_version = str(self.payload["policy_version"])
        self.catalog_version = str(self.payload["catalog_version"])
        self.currency = str(self.payload["currency"])
        self.score_policy = dict(self.payload["score_policy"])
        self.rarity_bands = list(self.payload["rarity_bands"])
        self.price_bands = dict(self.payload["price_bands"])
        self._validate()

    def _validate(self) -> None:
        minimums = [int(band["min_score"]) for band in self.rarity_bands]
        if minimums != sorted(minimums, reverse=True) or minimums[-1] != 0:
            raise ValueError("Rarity bands must descend to a zero-score fallback")
        names = {str(band["name"]) for band in self.rarity_bands}
        if names != set(self.price_bands):
            raise ValueError("Every rarity band must have exactly one price band")
        if self.currency != "USD":
            raise ValueError("Pilot commerce policy currently supports USD only")

    def metadata(self) -> dict[str, Any]:
        return {
            "policy_version": self.policy_version,
            "policy_hash_sha256": self.policy_hash,
            "catalog_version": self.catalog_version,
            "currency": self.currency,
            "rarity_bands": self.rarity_bands,
            "price_bands": self.price_bands,
            "immutable_purchase_snapshots": True,
        }

    def score(self, star: CanonicalStar) -> tuple[int, dict[str, int]]:
        if star.catalog_version != self.catalog_version:
            raise ValueError(
                f"Star catalog version {star.catalog_version!r} does not match policy {self.catalog_version!r}"
            )
        brightness = self._band_points(
            star.photometry.apparent_magnitude_v,
            self.score_policy["brightness_bands"],
            "max_magnitude",
        )
        rank = self._band_points(
            star.curation.rank_in_constellation,
            self.score_policy["rank_bands"],
            "max_rank",
        )
        proper_name = int(
            normalize_catalog_alias(star.display_name)
            != normalize_catalog_alias(star.designations.bayer_latin)
        ) * int(self.score_policy["proper_name_points"])
        alpha = int(
            normalize_catalog_alias(star.designations.bayer_letter).startswith("alpha")
        ) * int(self.score_policy["alpha_bayer_points"])
        asterism = int(bool(star.asterisms)) * int(self.score_policy["asterism_points"])
        zodiac = int(
            star.constellation.iau_code in set(self.score_policy["zodiac_iau_codes"])
        ) * int(self.score_policy["zodiac_constellation_points"])
        cultural = int(
            self.score_policy.get("cultural_prominence_overrides", {}).get(star.canonical_id, 0)
        )
        breakdown = {
            "brightness": brightness,
            "constellation_rank": rank,
            "asterism": asterism,
            "proper_name": proper_name,
            "alpha_bayer": alpha,
            "zodiac_constellation": zodiac,
            "reviewed_cultural_prominence": cultural,
        }
        return sum(breakdown.values()), breakdown

    @staticmethod
    def _band_points(value: float | int, bands: Iterable[dict[str, Any]], maximum_key: str) -> int:
        for band in bands:
            maximum = band.get(maximum_key)
            if maximum is None or value <= maximum:
                return int(band["points"])
        raise ValueError(f"Score bands have no fallback for {maximum_key}")

    def quote(self, star: CanonicalStar) -> dict[str, Any]:
        score, breakdown = self.score(star)
        rarity = next(band for band in self.rarity_bands if score >= int(band["min_score"]))
        price_policy = self.price_bands[rarity["name"]]
        delta = score - int(rarity["min_score"])
        amount = (
            Decimal(price_policy["base"])
            + Decimal(delta) * Decimal(price_policy["increment_per_score"])
        ).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        return {
            "canonical_id": star.canonical_id,
            "catalog_version": star.catalog_version,
            "policy_version": self.policy_version,
            "policy_hash_sha256": self.policy_hash,
            "rarity_score": score,
            "rarity_band": rarity["name"],
            "legacy_tier": rarity["legacy_tier"],
            "currency": self.currency,
            "primary_price": format(amount, ".2f"),
            "score_breakdown": breakdown,
            "frozen": False,
        }

    def resolve_price(self, star: CanonicalStar, purchase_snapshot: dict[str, Any] | None = None) -> dict[str, Any]:
        if purchase_snapshot is None:
            return self.quote(star)
        if purchase_snapshot.get("canonical_id") != star.canonical_id:
            raise ValueError("Purchase snapshot canonical_id does not match star")
        required = {"policy_version", "policy_hash_sha256", "currency", "primary_price"}
        missing = sorted(required - set(purchase_snapshot))
        if missing:
            raise ValueError(f"Purchase snapshot missing fields: {missing}")
        Decimal(str(purchase_snapshot["primary_price"]))
        return {**purchase_snapshot, "frozen": True}

    def query_quotes(self, stars: Iterable[CanonicalStar], query: CommerceQuery) -> list[dict[str, Any]]:
        quotes = [self.quote(star) for star in stars]
        if query.rarity_band:
            quotes = [quote for quote in quotes if quote["rarity_band"] == query.rarity_band]
        if query.min_price is not None:
            quotes = [quote for quote in quotes if Decimal(quote["primary_price"]) >= query.min_price]
        if query.max_price is not None:
            quotes = [quote for quote in quotes if Decimal(quote["primary_price"]) <= query.max_price]
        return sorted(quotes, key=lambda quote: (Decimal(quote["primary_price"]), quote["canonical_id"]))

    def build_manifest(self, stars: Iterable[CanonicalStar]) -> dict[str, Any]:
        quotes = self.query_quotes(stars, CommerceQuery())
        rarity_counts = Counter(quote["rarity_band"] for quote in quotes)
        return {
            **self.metadata(),
            "star_count": len(quotes),
            "rarity_counts": dict(sorted(rarity_counts.items())),
            "quotes": quotes,
        }


def main() -> None:
    root = Path(__file__).parents[1]
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--catalog", default=str(root / "shared" / "catalog" / "curated-pilot-v1.json"))
    parser.add_argument("--policy", default=str(root / "shared" / "catalog" / "commerce-policy-v1.json"))
    parser.add_argument("--output", default=str(root / "shared" / "catalog" / "curated-commerce-pilot-v1.json"))
    args = parser.parse_args()
    catalog = json.loads(Path(args.catalog).read_text(encoding="utf-8"))
    stars = [CanonicalStar.model_validate(payload) for payload in catalog["stars"]]
    manifest = CatalogCommercePolicy(args.policy).build_manifest(stars)
    output = Path(args.output)
    output.write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(json.dumps({"output": str(output), "star_count": manifest["star_count"],
                      "rarity_counts": manifest["rarity_counts"]}, indent=2))


if __name__ == "__main__":
    main()
