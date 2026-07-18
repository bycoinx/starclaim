"""Build the review-gated 88-constellation StarClaim catalog candidate."""

from __future__ import annotations

import argparse
import hashlib
import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Iterable

from backend.catalog_curate import (
    HYG_SOURCE,
    HIPPARCOS_SOURCE,
    IAU_SOURCE,
    HipparcosRecord,
    PilotPolicy,
    _system_key,
    _to_canonical_star,
    fetch_hipparcos_bright,
    load_hyg_rows,
)
from backend.catalog_domain import CanonicalStar, build_alias_index


CANDIDATE_VERSION = "all-sky-candidate-v1"
PILOT_VERSION = "pilot-v1"
MAX_STARS_PER_CONSTELLATION = 10
MAGNITUDE_CEILING = 5.5
MIN_REVIEWED_STARS = 5
TARGET_RANGE = (600, 800)

# IAU nominative names, three-letter abbreviations, and genitives. The source
# URL is emitted with the registry artifact so updates remain auditable.
IAU_CONSTELLATIONS = (
    ("And", "Andromeda", "Andromedae"), ("Ant", "Antlia", "Antliae"),
    ("Aps", "Apus", "Apodis"), ("Aql", "Aquila", "Aquilae"),
    ("Aqr", "Aquarius", "Aquarii"), ("Ara", "Ara", "Arae"),
    ("Ari", "Aries", "Arietis"), ("Aur", "Auriga", "Aurigae"),
    ("Boo", "Boötes", "Boötis"), ("CMa", "Canis Major", "Canis Majoris"),
    ("CMi", "Canis Minor", "Canis Minoris"),
    ("CVn", "Canes Venatici", "Canum Venaticorum"),
    ("Cae", "Caelum", "Caeli"), ("Cam", "Camelopardalis", "Camelopardalis"),
    ("Cap", "Capricornus", "Capricorni"), ("Car", "Carina", "Carinae"),
    ("Cas", "Cassiopeia", "Cassiopeiae"), ("Cen", "Centaurus", "Centauri"),
    ("Cep", "Cepheus", "Cephei"), ("Cet", "Cetus", "Ceti"),
    ("Cha", "Chamaeleon", "Chamaeleontis"), ("Cir", "Circinus", "Circini"),
    ("Cnc", "Cancer", "Cancri"), ("Col", "Columba", "Columbae"),
    ("Com", "Coma Berenices", "Comae Berenices"),
    ("CrA", "Corona Australis", "Coronae Australis"),
    ("CrB", "Corona Borealis", "Coronae Borealis"),
    ("Crt", "Crater", "Crateris"), ("Cru", "Crux", "Crucis"),
    ("Crv", "Corvus", "Corvi"), ("Cyg", "Cygnus", "Cygni"),
    ("Del", "Delphinus", "Delphini"), ("Dor", "Dorado", "Doradus"),
    ("Dra", "Draco", "Draconis"), ("Equ", "Equuleus", "Equulei"),
    ("Eri", "Eridanus", "Eridani"), ("For", "Fornax", "Fornacis"),
    ("Gem", "Gemini", "Geminorum"), ("Gru", "Grus", "Gruis"),
    ("Her", "Hercules", "Herculis"), ("Hor", "Horologium", "Horologii"),
    ("Hya", "Hydra", "Hydrae"), ("Hyi", "Hydrus", "Hydri"),
    ("Ind", "Indus", "Indi"), ("LMi", "Leo Minor", "Leonis Minoris"),
    ("Lac", "Lacerta", "Lacertae"), ("Leo", "Leo", "Leonis"),
    ("Lep", "Lepus", "Leporis"), ("Lib", "Libra", "Librae"),
    ("Lup", "Lupus", "Lupi"), ("Lyn", "Lynx", "Lyncis"),
    ("Lyr", "Lyra", "Lyrae"), ("Men", "Mensa", "Mensae"),
    ("Mic", "Microscopium", "Microscopii"),
    ("Mon", "Monoceros", "Monocerotis"), ("Mus", "Musca", "Muscae"),
    ("Nor", "Norma", "Normae"), ("Oct", "Octans", "Octantis"),
    ("Oph", "Ophiuchus", "Ophiuchi"), ("Ori", "Orion", "Orionis"),
    ("Pav", "Pavo", "Pavonis"), ("Peg", "Pegasus", "Pegasi"),
    ("Per", "Perseus", "Persei"), ("Phe", "Phoenix", "Phoenicis"),
    ("Pic", "Pictor", "Pictoris"),
    ("PsA", "Piscis Austrinus", "Piscis Austrini"),
    ("Psc", "Pisces", "Piscium"), ("Pup", "Puppis", "Puppis"),
    ("Pyx", "Pyxis", "Pyxidis"), ("Ret", "Reticulum", "Reticuli"),
    ("Scl", "Sculptor", "Sculptoris"), ("Sco", "Scorpius", "Scorpii"),
    ("Sct", "Scutum", "Scuti"), ("Ser", "Serpens", "Serpentis"),
    ("Sex", "Sextans", "Sextantis"), ("Sge", "Sagitta", "Sagittae"),
    ("Sgr", "Sagittarius", "Sagittarii"), ("Tau", "Taurus", "Tauri"),
    ("Tel", "Telescopium", "Telescopii"),
    ("TrA", "Triangulum Australe", "Trianguli Australis"),
    ("Tri", "Triangulum", "Trianguli"), ("Tuc", "Tucana", "Tucanae"),
    ("UMa", "Ursa Major", "Ursae Majoris"),
    ("UMi", "Ursa Minor", "Ursae Minoris"),
    ("Vel", "Vela", "Velorum"), ("Vir", "Virgo", "Virginis"),
    ("Vol", "Volans", "Volantis"), ("Vul", "Vulpecula", "Vulpeculae"),
)


@dataclass(frozen=True)
class RolloutSelection:
    iau_code: str
    name: str
    genitive: str
    selected_count: int
    status: str
    reason: str | None


def constellation_registry() -> dict[str, Any]:
    return {
        "registry_version": "iau-constellations-v1",
        "source": IAU_SOURCE,
        "constellation_count": len(IAU_CONSTELLATIONS),
        "constellations": [
            {"iau_code": code, "name": name, "genitive": genitive}
            for code, name, genitive in IAU_CONSTELLATIONS
        ],
    }


def _candidate_rows(
    rows: Iterable[dict[str, str]],
    hipparcos: dict[str, HipparcosRecord],
    code: str,
) -> list[dict[str, str]]:
    systems: dict[str, dict[str, str]] = {}
    for row in rows:
        hip = row.get("hip", "")
        if row.get("con") != code or not row.get("bayer") or hip not in hipparcos:
            continue
        if hipparcos[hip].magnitude_v > MAGNITUDE_CEILING:
            continue
        key = _system_key(row)
        current = systems.get(key)
        if current is None or (hipparcos[hip].magnitude_v, int(hip)) < (
            hipparcos[current["hip"]].magnitude_v, int(current["hip"])
        ):
            systems[key] = row
    return sorted(
        systems.values(),
        key=lambda row: (hipparcos[row["hip"]].magnitude_v, row["bayer"], int(row["hip"])),
    )[:MAX_STARS_PER_CONSTELLATION]


def _candidate_star(
    row: dict[str, str], hip: HipparcosRecord, policy: PilotPolicy, rank: int, sellable: bool
) -> CanonicalStar:
    payload = _to_canonical_star(row, hip, policy, rank).model_dump(mode="json")
    payload["catalog_version"] = CANDIDATE_VERSION
    payload["curation"]["sellable"] = sellable
    payload["curation"]["selection_reason"] = "bayer" if sellable else "exception"
    return CanonicalStar.model_validate(payload)


def _pilot_star(payload: dict[str, Any]) -> CanonicalStar:
    copied = json.loads(json.dumps(payload))
    copied["catalog_version"] = CANDIDATE_VERSION
    return CanonicalStar.model_validate(copied)


def _gate(name: str, passed: bool, detail: str) -> dict[str, Any]:
    return {"name": name, "passed": passed, "detail": detail}


def build_all_sky_candidate(
    hyg_rows: Iterable[dict[str, str]],
    hipparcos: dict[str, HipparcosRecord],
    pilot_manifest: dict[str, Any],
) -> dict[str, Any]:
    rows = list(hyg_rows)
    pilot_by_code: dict[str, list[dict[str, Any]]] = {}
    for star in pilot_manifest["stars"]:
        pilot_by_code.setdefault(star["constellation"]["iau_code"], []).append(star)

    stars: list[CanonicalStar] = []
    selections: list[RolloutSelection] = []
    for code, name, genitive in IAU_CONSTELLATIONS:
        if code in pilot_by_code:
            group = [_pilot_star(star) for star in pilot_by_code[code]]
            status, reason = "pilot-approved", None
        else:
            selected = _candidate_rows(rows, hipparcos, code)
            status = "ready" if len(selected) >= MIN_REVIEWED_STARS else "review-required"
            reason = None if status == "ready" else (
                f"Only {len(selected)} Bayer-designated Hipparcos systems satisfy the "
                f"V≤{MAGNITUDE_CEILING} quality policy; no filler stars were added."
            )
            policy = PilotPolicy(code, name, genitive, MAGNITUDE_CEILING, MAX_STARS_PER_CONSTELLATION)
            group = [
                _candidate_star(row, hipparcos[row["hip"]], policy, rank, status == "ready")
                for rank, row in enumerate(selected, start=1)
            ]
        stars.extend(group)
        selections.append(RolloutSelection(code, name, genitive, len(group), status, reason))

    build_alias_index(stars)
    ids = [star.canonical_id for star in stars]
    coordinates = [(round(star.astrometry.ra_deg, 8), round(star.astrometry.dec_deg, 8)) for star in stars]
    pilot_ids = {star["canonical_id"] for star in pilot_manifest["stars"]}
    candidate_by_id = {star.canonical_id: star.model_dump(mode="json") for star in stars}
    continuity_fields = ("display_name", "constellation", "designations", "astrometry", "photometry", "stellar")
    pilot_continuity = all(
        original["canonical_id"] in candidate_by_id and all(
            candidate_by_id[original["canonical_id"]][field] == original[field]
            for field in continuity_fields
        )
        for original in pilot_manifest["stars"]
    )
    registry_codes = {code for code, _, _ in IAU_CONSTELLATIONS}
    hyg_codes = {row.get("con") for row in rows if row.get("con")}
    review_codes = [item.iau_code for item in selections if item.status == "review-required"]
    gates = [
        _gate("iau-registry-coverage", len(registry_codes) == 88 and registry_codes <= hyg_codes,
              f"{len(registry_codes)} IAU constellations; {len(registry_codes & hyg_codes)} represented in HYG."),
        _gate("target-star-count", TARGET_RANGE[0] <= len(stars) <= TARGET_RANGE[1],
              f"{len(stars)} candidate systems; target is {TARGET_RANGE[0]}–{TARGET_RANGE[1]}."),
        _gate("unique-canonical-ids", len(ids) == len(set(ids)), f"{len(ids)} IDs checked."),
        _gate("unique-coordinates", len(coordinates) == len(set(coordinates)),
              f"{len(coordinates)} rounded ICRS coordinate pairs checked."),
        _gate("pilot-continuity", pilot_continuity,
              f"{len(pilot_ids)} pilot identities and astronomy projections preserved."),
        _gate("source-provenance", all(star.curation.source_refs for star in stars),
              "Every candidate has source references."),
        _gate("bayer-designations", all(star.designations.bayer_latin for star in stars),
              "Every candidate has a Bayer designation."),
        _gate("review-isolation", all(
            not star.curation.sellable for star in stars
            if star.constellation.iau_code in review_codes
        ), f"{len(review_codes)} exception constellations are non-sellable pending review."),
    ]

    pilot_codes = set(pilot_by_code)
    remaining_codes = [code for code, _, _ in IAU_CONSTELLATIONS if code not in pilot_codes]
    batch_codes = [sorted(pilot_codes)] + [remaining_codes[index:index + 13] for index in range(0, len(remaining_codes), 13)]
    selection_map = {item.iau_code: item for item in selections}
    batches = []
    for index, codes in enumerate(batch_codes):
        exceptions = [code for code in codes if selection_map[code].status == "review-required"]
        batches.append({
            "batch_id": "pilot" if index == 0 else f"expansion-{index}",
            "sequence": index,
            "status": "approved" if index == 0 else ("review-required" if exceptions else "ready"),
            "constellations": codes,
            "star_count": sum(selection_map[code].selected_count for code in codes),
            "review_required": exceptions,
        })

    payload: dict[str, Any] = {
        "catalog_version": CANDIDATE_VERSION,
        "status": "candidate-not-published",
        "base_catalog_version": PILOT_VERSION,
        "selection_policy": {
            "bayer_required": True,
            "magnitude_ceiling_v": MAGNITUDE_CEILING,
            "preferred_minimum_per_constellation": MIN_REVIEWED_STARS,
            "maximum_per_constellation": MAX_STARS_PER_CONSTELLATION,
            "exception_policy": "Do not add filler stars; mark under-minimum constellations non-sellable for review.",
            "sources": [IAU_SOURCE, HIPPARCOS_SOURCE, HYG_SOURCE],
        },
        "constellation_count": len(selections),
        "star_count": len(stars),
        "constellations": [item.__dict__ for item in selections],
        "quality_gates": gates,
        "batches": batches,
        "stars": [star.model_dump(mode="json") for star in stars],
    }
    digest_payload = json.dumps(payload, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
    payload["manifest_sha256"] = hashlib.sha256(digest_payload.encode("utf-8")).hexdigest()
    return payload


def write_rollout_artifacts(candidate: dict[str, Any], output_dir: str | Path) -> list[Path]:
    output = Path(output_dir)
    output.mkdir(parents=True, exist_ok=True)
    artifacts = {
        "iau-constellations-v1.json": constellation_registry(),
        "all-sky-rollout-policy-v1.json": candidate["selection_policy"],
        "all-sky-batches-v1.json": {
            "catalog_version": candidate["catalog_version"], "batches": candidate["batches"]
        },
        "all-sky-rollout-report-v1.json": {
            "catalog_version": candidate["catalog_version"],
            "status": candidate["status"],
            "constellation_count": candidate["constellation_count"],
            "star_count": candidate["star_count"],
            "manifest_sha256": candidate["manifest_sha256"],
            "quality_gates": candidate["quality_gates"],
            "constellations": candidate["constellations"],
        },
        "curated-all-sky-candidate-v1.json": candidate,
    }
    paths = []
    for name, payload in artifacts.items():
        path = output / name
        path.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
        paths.append(path)
    return paths


def main() -> None:
    root = Path(__file__).parents[1]
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--hyg-csv", default=str(Path(__file__).parent / "data" / "hyg_v41.csv"))
    parser.add_argument("--pilot", default=str(root / "shared" / "catalog" / "curated-pilot-v1.json"))
    parser.add_argument("--output-dir", default=str(root / "shared" / "catalog"))
    args = parser.parse_args()
    pilot = json.loads(Path(args.pilot).read_text(encoding="utf-8"))
    candidate = build_all_sky_candidate(
        load_hyg_rows(args.hyg_csv), fetch_hipparcos_bright(MAGNITUDE_CEILING), pilot
    )
    paths = write_rollout_artifacts(candidate, args.output_dir)
    print(json.dumps({
        "catalog_version": candidate["catalog_version"],
        "star_count": candidate["star_count"],
        "constellation_count": candidate["constellation_count"],
        "review_required": [
            item["iau_code"] for item in candidate["constellations"]
            if item["status"] == "review-required"
        ],
        "artifacts": [str(path) for path in paths],
    }, indent=2))


if __name__ == "__main__":
    main()
