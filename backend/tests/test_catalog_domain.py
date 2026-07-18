import json
from pathlib import Path

import pytest
from pydantic import ValidationError

from backend.catalog_domain import (
    AmbiguousCatalogAliasError,
    Astrometry,
    CanonicalStar,
    CatalogDesignations,
    ConstellationIdentity,
    CurationMetadata,
    Photometry,
    build_alias_index,
    canonical_payload_hash,
    normalize_catalog_alias,
    resolve_catalog_alias,
)


SCHEMA_PATH = Path(__file__).parents[2] / "shared" / "catalog" / "star-catalog.schema.json"


def make_star(**overrides):
    data = {
        "catalog_version": "pilot-2026.1",
        "canonical_id": "hip:24436",
        "object_scope": "system",
        "display_name": "Rigel",
        "aliases": ["Beta Orionis"],
        "constellation": ConstellationIdentity(
            iau_code="Ori", name="Orion", genitive="Orionis"
        ),
        "designations": CatalogDesignations(
            bayer_letter="β", bayer_latin="Beta Orionis", hip="24436", hr="1713"
        ),
        "astrometry": Astrometry(epoch="J2000", ra_deg=78.6345, dec_deg=-8.2016),
        "photometry": Photometry(apparent_magnitude_v=0.13),
        "curation": CurationMetadata(
            visible=True,
            sellable=True,
            rank_in_constellation=1,
            selection_reason="bayer",
            source_refs=["cds:V/50/1713", "hip:24436"],
        ),
        "legacy_ids": ["legacy-rigel", "legacy-beta-orionis"],
    }
    data.update(overrides)
    return CanonicalStar(**data)


def test_canonical_id_is_derived_from_stable_catalog_priority():
    star = make_star()
    assert star.designations.canonical_id() == "hip:24436"
    assert star.canonical_id == "hip:24436"

    with pytest.raises(ValidationError, match="canonical_id must be hip:24436"):
        make_star(canonical_id="hr:1713")


def test_component_scope_requires_a_component_specific_identity():
    designations = CatalogDesignations(hip="24436", component="B")
    component = make_star(
        canonical_id="hip:24436-b",
        object_scope="component",
        designations=designations,
    )
    assert component.canonical_id == "hip:24436-b"

    with pytest.raises(ValidationError, match="require designations.component"):
        make_star(object_scope="component")


def test_greek_and_latin_bayer_aliases_resolve_to_one_star():
    index = build_alias_index([make_star()])
    assert normalize_catalog_alias("β Orionis") == "beta orionis"
    assert resolve_catalog_alias(index, "Beta-Orionis") == "hip:24436"
    assert resolve_catalog_alias(index, "HIP 24436") == "hip:24436"
    assert resolve_catalog_alias(index, "legacy-beta-orionis") == "hip:24436"


def test_alias_collisions_are_reported_instead_of_arbitrarily_resolved():
    rigel = make_star()
    other = make_star(
        canonical_id="hip:27989",
        display_name="Betelgeuse",
        aliases=["Shoulder Star"],
        designations=CatalogDesignations(
            bayer_letter="α", bayer_latin="Alpha Orionis", hip="27989"
        ),
        legacy_ids=["legacy-betelgeuse"],
    )
    rigel_with_collision = make_star(aliases=["Beta Orionis", "Shoulder Star"])
    index = build_alias_index([rigel_with_collision, other])

    with pytest.raises(AmbiguousCatalogAliasError) as error:
        resolve_catalog_alias(index, "Shoulder Star")
    assert error.value.canonical_ids == ("hip:24436", "hip:27989")


def test_designations_require_a_stable_identity_source():
    with pytest.raises(ValidationError, match="At least one HIP, Gaia DR3, or HR"):
        CatalogDesignations(bayer_latin="Alpha Orionis")


def test_backend_model_and_shared_json_contract_expose_the_same_fields():
    schema = json.loads(SCHEMA_PATH.read_text(encoding="utf-8"))
    assert set(schema["properties"]) == set(CanonicalStar.model_fields)
    assert set(schema["properties"]["designations"]["properties"]) == set(
        CatalogDesignations.model_fields
    )
    assert make_star().model_dump(mode="json")["canonical_id"] == "hip:24436"


def test_canonical_hash_ignores_json_formatting_and_key_order():
    assert canonical_payload_hash({"b": 2, "a": [1]}) == canonical_payload_hash({"a": [1], "b": 2})
