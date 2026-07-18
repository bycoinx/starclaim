import hashlib
import json
from pathlib import Path

from backend.catalog_domain import CanonicalStar
from backend.catalog_rollout import CANDIDATE_VERSION, IAU_CONSTELLATIONS, TARGET_RANGE, constellation_registry


ROOT = Path(__file__).parents[2]
CATALOG_DIR = ROOT / "shared" / "catalog"


def _load(name: str):
    return json.loads((CATALOG_DIR / name).read_text(encoding="utf-8"))


def test_official_registry_has_88_unique_names_codes_and_genitives():
    registry = constellation_registry()
    rows = registry["constellations"]
    assert registry["constellation_count"] == 88 == len(IAU_CONSTELLATIONS)
    assert len({row["iau_code"] for row in rows}) == 88
    assert all(row["name"] and row["genitive"] for row in rows)
    assert registry["source"].startswith("https://www.iau.org/")


def test_committed_candidate_passes_rollout_quality_gates():
    candidate = _load("curated-all-sky-candidate-v1.json")
    assert candidate["catalog_version"] == CANDIDATE_VERSION
    assert candidate["status"] == "candidate-not-published"
    assert candidate["constellation_count"] == 88
    assert TARGET_RANGE[0] <= candidate["star_count"] <= TARGET_RANGE[1]
    assert all(gate["passed"] for gate in candidate["quality_gates"])
    digest_source = {key: value for key, value in candidate.items() if key != "manifest_sha256"}
    serialized = json.dumps(digest_source, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
    assert hashlib.sha256(serialized.encode("utf-8")).hexdigest() == candidate["manifest_sha256"]


def test_review_exceptions_are_visible_but_never_sellable():
    candidate = _load("curated-all-sky-candidate-v1.json")
    review_codes = {
        row["iau_code"] for row in candidate["constellations"]
        if row["status"] == "review-required"
    }
    assert review_codes == {"CVn", "Cae", "Cam", "Com", "LMi", "Lac", "Lyn", "Vul"}
    stars = [CanonicalStar.model_validate(payload) for payload in candidate["stars"]]
    reviewed_stars = [star for star in stars if star.constellation.iau_code in review_codes]
    assert reviewed_stars
    assert all(star.curation.visible and not star.curation.sellable for star in reviewed_stars)


def test_pilot_astronomy_and_identity_are_preserved_in_candidate():
    pilot = _load("curated-pilot-v1.json")
    candidate = _load("curated-all-sky-candidate-v1.json")
    by_id = {star["canonical_id"]: star for star in candidate["stars"]}
    for original in pilot["stars"]:
        expanded = by_id[original["canonical_id"]]
        for field in ("display_name", "constellation", "designations", "astrometry", "photometry", "stellar"):
            assert expanded[field] == original[field]


def test_batches_cover_each_constellation_once_and_keep_pilot_first():
    candidate = _load("curated-all-sky-candidate-v1.json")
    batches = candidate["batches"]
    codes = [code for batch in batches for code in batch["constellations"]]
    assert batches[0]["batch_id"] == "pilot"
    assert batches[0]["status"] == "approved"
    assert len(codes) == 88 == len(set(codes))
    assert set(codes) == {code for code, _, _ in IAU_CONSTELLATIONS}
    assert sum(batch["star_count"] for batch in batches) == candidate["star_count"]
