"""Read-only service for versioned curated astronomy manifests."""

from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Iterable, Literal

from backend.catalog_domain import CanonicalStar, canonical_payload_hash, normalize_catalog_alias


CatalogSort = Literal["rank", "brightest", "name", "nearest"]


class CatalogVersionNotFoundError(LookupError):
    pass


class CatalogStarNotFoundError(LookupError):
    pass


class LegacyRedirectNotFoundError(LookupError):
    pass


@dataclass(frozen=True)
class CatalogQuery:
    catalog_version: str | None = None
    iau_code: str | None = None
    bayer: str | None = None
    asterism: str | None = None
    magnitude_min: float | None = None
    magnitude_max: float | None = None
    sellable: bool | None = None
    visible: bool | None = True
    search: str | None = None
    sort: CatalogSort = "rank"


class CuratedCatalogService:
    def __init__(self, manifest_path: str | Path, redirects_path: str | Path | None = None):
        self.manifest_path = Path(manifest_path)
        payload = json.loads(self.manifest_path.read_text(encoding="utf-8"))
        self.catalog_hash = canonical_payload_hash(payload)
        self.catalog_version = str(payload["catalog_version"])
        self.status = str(payload.get("status") or "unknown")
        self.source_policy = str(payload.get("source_policy") or "")
        self._constellations = list(payload.get("constellations") or [])
        self._stars = tuple(CanonicalStar.model_validate(star) for star in payload.get("stars") or [])
        if len({star.canonical_id for star in self._stars}) != len(self._stars):
            raise ValueError("Catalog manifest contains duplicate canonical IDs")
        self._by_id = {star.canonical_id: star for star in self._stars}

        self.redirects_path = Path(redirects_path) if redirects_path else None
        redirects_payload: dict[str, Any] = {}
        if self.redirects_path and self.redirects_path.exists():
            redirects_payload = json.loads(self.redirects_path.read_text(encoding="utf-8"))
            redirect_version = redirects_payload.get("catalog_version")
            if redirect_version != self.catalog_version:
                raise ValueError(
                    f"Redirect version {redirect_version!r} does not match catalog {self.catalog_version!r}"
                )
        self._redirects = dict(redirects_payload.get("redirects") or {})
        self._quarantined = dict(redirects_payload.get("quarantined") or {})
        unknown_targets = {
            redirect.get("canonical_id") for redirect in self._redirects.values()
            if redirect.get("canonical_id") not in self._by_id
        }
        if unknown_targets:
            raise ValueError(f"Redirects target unknown canonical IDs: {sorted(unknown_targets)}")

    def metadata(self) -> dict[str, Any]:
        return {
            "catalog_version": self.catalog_version,
            "catalog_hash_sha256": self.catalog_hash,
            "status": self.status,
            "source_policy": self.source_policy,
            "star_count": len(self._stars),
            "constellation_count": len(self._constellations),
            "redirect_count": len(self._redirects),
            "immutable_astronomy": True,
            "commerce_embedded": False,
        }

    def constellations(self) -> list[dict[str, Any]]:
        return [dict(row) for row in self._constellations]

    def query(self, query: CatalogQuery) -> list[CanonicalStar]:
        self._require_version(query.catalog_version)
        stars: Iterable[CanonicalStar] = self._stars
        if query.iau_code:
            code = query.iau_code.casefold()
            stars = (star for star in stars if star.constellation.iau_code.casefold() == code)
        if query.bayer:
            bayer = normalize_catalog_alias(query.bayer)
            stars = (
                star for star in stars
                if bayer in {
                    normalize_catalog_alias(star.designations.bayer_letter),
                    normalize_catalog_alias(star.designations.bayer_latin),
                }
            )
        if query.asterism:
            asterism = normalize_catalog_alias(query.asterism)
            stars = (star for star in stars if any(normalize_catalog_alias(value) == asterism for value in star.asterisms))
        if query.magnitude_min is not None:
            stars = (star for star in stars if star.photometry.apparent_magnitude_v >= query.magnitude_min)
        if query.magnitude_max is not None:
            stars = (star for star in stars if star.photometry.apparent_magnitude_v <= query.magnitude_max)
        if query.sellable is not None:
            stars = (star for star in stars if star.curation.sellable is query.sellable)
        if query.visible is not None:
            stars = (star for star in stars if star.curation.visible is query.visible)
        if query.search:
            term = normalize_catalog_alias(query.search)
            stars = (star for star in stars if self._matches_search(star, term))
        result = list(stars)
        sort_keys = {
            "rank": lambda star: (star.constellation.iau_code, star.curation.rank_in_constellation, star.canonical_id),
            "brightest": lambda star: (star.photometry.apparent_magnitude_v, star.canonical_id),
            "name": lambda star: (normalize_catalog_alias(star.display_name), star.canonical_id),
            "nearest": lambda star: (star.astrometry.distance_pc is None, star.astrometry.distance_pc or float("inf"), star.canonical_id),
        }
        result.sort(key=sort_keys.get(query.sort, sort_keys["rank"]))
        return result

    def count(self, query: CatalogQuery) -> int:
        return len(self.query(query))

    def get_star(self, canonical_id: str, catalog_version: str | None = None) -> CanonicalStar:
        self._require_version(catalog_version)
        star = self._by_id.get(canonical_id.casefold())
        if not star:
            raise CatalogStarNotFoundError(canonical_id)
        return star

    def resolve_legacy(self, legacy_id: str, catalog_version: str | None = None) -> dict[str, Any]:
        self._require_version(catalog_version)
        if legacy_id in self._quarantined:
            return {"legacy_id": legacy_id, "status": "quarantined", **self._quarantined[legacy_id]}
        redirect = self._redirects.get(legacy_id)
        if not redirect:
            raise LegacyRedirectNotFoundError(legacy_id)
        return {"legacy_id": legacy_id, "status": "resolved", **redirect}

    def legacy_ids_for(self, canonical_id: str) -> list[str]:
        return sorted(
            legacy_id for legacy_id, redirect in self._redirects.items()
            if redirect.get("canonical_id") == canonical_id
        )

    def filter_by_availability(
        self,
        stars: Iterable[CanonicalStar],
        commercial_rows: Iterable[dict[str, Any]],
        available: bool,
    ) -> list[CanonicalStar]:
        stars = list(stars)
        legacy_to_canonical = {
            legacy_id: star.canonical_id
            for star in stars
            for legacy_id in self.legacy_ids_for(star.canonical_id)
        }
        available_ids = {
            legacy_to_canonical[row["star_id"]]
            for row in commercial_rows
            if row.get("star_id") in legacy_to_canonical and not row.get("owner_id")
        }
        return [star for star in stars if (star.canonical_id in available_ids) is available]

    def _require_version(self, version: str | None) -> None:
        if version and version != self.catalog_version:
            raise CatalogVersionNotFoundError(version)

    @staticmethod
    def _matches_search(star: CanonicalStar, term: str) -> bool:
        values = [
            star.canonical_id, star.display_name, star.constellation.name,
            star.constellation.iau_code, star.designations.bayer_latin,
            star.designations.flamsteed, *star.aliases, *star.asterisms,
        ]
        return any(term in normalize_catalog_alias(value) for value in values if value)
