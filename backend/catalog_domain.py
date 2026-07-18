"""Canonical astronomical identity models for the StarClaim catalog."""

from __future__ import annotations

import re
import unicodedata
import hashlib
import json
from datetime import datetime
from typing import Iterable, Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


SCHEMA_VERSION = 1
CANONICAL_ID_PATTERN = r"^(hip|gaia-dr3|hr):[A-Za-z0-9.-]+$"
IAU_CODE_PATTERN = r"^[A-Z][A-Za-z]{2}$"

GREEK_LETTERS = {
    "α": "alpha",
    "β": "beta",
    "γ": "gamma",
    "δ": "delta",
    "ε": "epsilon",
    "ζ": "zeta",
    "η": "eta",
    "θ": "theta",
    "ι": "iota",
    "κ": "kappa",
    "λ": "lambda",
    "μ": "mu",
    "ν": "nu",
    "ξ": "xi",
    "ο": "omicron",
    "π": "pi",
    "ρ": "rho",
    "σ": "sigma",
    "τ": "tau",
    "υ": "upsilon",
    "φ": "phi",
    "χ": "chi",
    "ψ": "psi",
    "ω": "omega",
}


def canonical_payload_hash(payload: object) -> str:
    """Hash JSON semantics, independent of indentation and line endings."""
    encoded = json.dumps(
        payload, sort_keys=True, separators=(",", ":"), ensure_ascii=False,
    ).encode("utf-8")
    return hashlib.sha256(encoded).hexdigest()


class CatalogDomainModel(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)


class ConstellationIdentity(CatalogDomainModel):
    iau_code: str = Field(pattern=IAU_CODE_PATTERN)
    name: str = Field(min_length=1)
    genitive: str = Field(min_length=1)


class CatalogDesignations(CatalogDomainModel):
    bayer_letter: str | None = None
    bayer_latin: str | None = None
    flamsteed: str | None = None
    hr: str | None = None
    hip: str | None = None
    hd: str | None = None
    gaia_dr3: str | None = None
    component: str | None = None

    @model_validator(mode="after")
    def require_stable_catalog_identifier(self):
        if not (self.hip or self.gaia_dr3 or self.hr):
            raise ValueError("At least one HIP, Gaia DR3, or HR identifier is required")
        return self

    def canonical_id(self) -> str:
        if self.hip:
            base = f"hip:{self.hip}"
        elif self.gaia_dr3:
            base = f"gaia-dr3:{self.gaia_dr3}"
        else:
            base = f"hr:{self.hr}"
        component = normalize_catalog_alias(self.component).replace(" ", "-") if self.component else ""
        return f"{base}-{component}" if component else base


class Astrometry(CatalogDomainModel):
    epoch: str = Field(min_length=1)
    ra_deg: float = Field(ge=0, lt=360)
    dec_deg: float = Field(ge=-90, le=90)
    parallax_mas: float | None = None
    distance_pc: float | None = Field(default=None, gt=0)
    distance_ly: float | None = Field(default=None, gt=0)


class Photometry(CatalogDomainModel):
    apparent_magnitude_v: float
    gaia_g_mag: float | None = None
    is_variable: bool = False
    magnitude_note: str | None = None


class StellarMetadata(CatalogDomainModel):
    spectral_type: str | None = None


class CurationMetadata(CatalogDomainModel):
    visible: bool
    sellable: bool
    rank_in_constellation: int = Field(ge=1)
    selection_reason: Literal["bayer", "brightness", "asterism", "cultural", "exception"]
    source_refs: list[str] = Field(min_length=1)
    reviewed_at: datetime | None = None

    @field_validator("source_refs")
    @classmethod
    def unique_sources(cls, values: list[str]) -> list[str]:
        return _unique_non_empty(values, "source_refs")


class CanonicalStar(CatalogDomainModel):
    schema_version: Literal[1] = SCHEMA_VERSION
    catalog_version: str = Field(min_length=1)
    canonical_id: str = Field(pattern=CANONICAL_ID_PATTERN)
    object_scope: Literal["system", "component"] = "system"
    display_name: str = Field(min_length=1)
    aliases: list[str] = Field(default_factory=list)
    constellation: ConstellationIdentity
    designations: CatalogDesignations
    astrometry: Astrometry
    photometry: Photometry
    stellar: StellarMetadata = Field(default_factory=StellarMetadata)
    asterisms: list[str] = Field(default_factory=list)
    curation: CurationMetadata
    legacy_ids: list[str] = Field(default_factory=list)

    @field_validator("aliases", "asterisms", "legacy_ids")
    @classmethod
    def unique_values(cls, values: list[str], info) -> list[str]:
        return _unique_non_empty(values, info.field_name)

    @model_validator(mode="after")
    def validate_identity_contract(self):
        expected_id = self.designations.canonical_id()
        if self.canonical_id != expected_id:
            raise ValueError(f"canonical_id must be {expected_id}")
        if self.object_scope == "component" and not self.designations.component:
            raise ValueError("Component records require designations.component")
        if self.object_scope == "system" and self.designations.component:
            raise ValueError("System records cannot set designations.component")
        return self


def _unique_non_empty(values: list[str], field_name: str) -> list[str]:
    cleaned = [value.strip() for value in values if value and value.strip()]
    if len(cleaned) != len(values):
        raise ValueError(f"{field_name} cannot contain empty values")
    normalized = [normalize_catalog_alias(value) for value in cleaned]
    if len(set(normalized)) != len(normalized):
        raise ValueError(f"{field_name} must be unique after normalization")
    return cleaned


def normalize_catalog_alias(value: str | None) -> str:
    text = unicodedata.normalize("NFKD", str(value or "")).casefold()
    for greek, latin in GREEK_LETTERS.items():
        text = text.replace(greek, f" {latin} ")
    text = "".join(char for char in text if not unicodedata.combining(char))
    return re.sub(r"[^a-z0-9]+", " ", text).strip()


class AmbiguousCatalogAliasError(ValueError):
    def __init__(self, alias: str, canonical_ids: tuple[str, ...]):
        super().__init__(f"Alias {alias!r} matches multiple stars: {', '.join(canonical_ids)}")
        self.alias = alias
        self.canonical_ids = canonical_ids


def catalog_aliases(star: CanonicalStar) -> set[str]:
    values = {
        star.canonical_id,
        star.display_name,
        *star.aliases,
        *star.legacy_ids,
    }
    designations = star.designations
    values.update(
        value
        for value in (designations.bayer_latin, designations.flamsteed)
        if value
    )
    if designations.hip:
        values.add(f"HIP {designations.hip}")
    if designations.hd:
        values.add(f"HD {designations.hd}")
    if designations.hr:
        values.add(f"HR {designations.hr}")
    if designations.gaia_dr3:
        values.add(f"Gaia DR3 {designations.gaia_dr3}")
    return {normalized for value in values if (normalized := normalize_catalog_alias(value))}


def build_alias_index(stars: Iterable[CanonicalStar]) -> dict[str, tuple[str, ...]]:
    index: dict[str, set[str]] = {}
    canonical_ids: set[str] = set()
    for star in stars:
        if star.canonical_id in canonical_ids:
            raise ValueError(f"Duplicate canonical_id: {star.canonical_id}")
        canonical_ids.add(star.canonical_id)
        for alias in catalog_aliases(star):
            index.setdefault(alias, set()).add(star.canonical_id)
    return {alias: tuple(sorted(ids)) for alias, ids in index.items()}


def resolve_catalog_alias(index: dict[str, tuple[str, ...]], alias: str) -> str | None:
    matches = index.get(normalize_catalog_alias(alias), ())
    if not matches:
        return None
    if len(matches) > 1:
        raise AmbiguousCatalogAliasError(alias, matches)
    return matches[0]
