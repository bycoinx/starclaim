"""Build a read-only reconciliation plan for the legacy commercial catalog.

The module has no database dependency and performs no writes. It converts
legacy API records plus a local HYG reference file into a reviewable plan.
"""

from __future__ import annotations

import argparse
import csv
import json
import math
import re
from collections import Counter, defaultdict
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any, Iterable, Literal

from backend.catalog_audit import fetch_catalog
from backend.catalog_domain import normalize_catalog_alias


ReconciliationStatus = Literal["matched", "merge", "quarantine", "unresolved"]
HYG_SOURCE = "HYG Database v4.1 (local reference cross-match)"

GREEK_ABBREVIATIONS = {
    "alpha": "alp", "beta": "bet", "gamma": "gam", "delta": "del",
    "epsilon": "eps", "zeta": "zet", "eta": "eta", "theta": "the",
    "iota": "iot", "kappa": "kap", "lambda": "lam", "mu": "mu",
    "nu": "nu", "xi": "xi", "omicron": "omi", "pi": "pi",
    "rho": "rho", "sigma": "sig", "tau": "tau", "upsilon": "ups",
    "phi": "phi", "chi": "chi", "psi": "psi", "omega": "ome",
}

CONSTELLATION_CODES = {
    "andromeda": "And", "aquarius": "Aqr", "aquila": "Aql", "aries": "Ari",
    "bootes": "Boo", "canis major": "CMa", "capricornus": "Cap",
    "carina": "Car", "cassiopeia": "Cas", "centaurus": "Cen", "cetus": "Cet",
    "cygnus": "Cyg", "draco": "Dra", "eridanus": "Eri", "gemini": "Gem",
    "hercules": "Her", "leo": "Leo", "libra": "Lib", "lupus": "Lup",
    "lyra": "Lyr", "orion": "Ori", "pegasus": "Peg", "perseus": "Per",
    "pisces": "Psc", "sagittarius": "Sgr", "scorpius": "Sco", "taurus": "Tau",
    "ursa major": "UMa", "ursa minor": "UMi", "vela": "Vel", "virgo": "Vir",
}

# Reviewed legacy exceptions, not fuzzy astronomical guesses.
QUARANTINE_OVERRIDES = {
    "sc 001": "Coordinates and integrated magnitude describe M31 (Andromeda Galaxy), not a star.",
    "sc 005": "Coordinates and integrated magnitude describe M42 (Orion Nebula), not a star.",
}


@dataclass(frozen=True)
class ReferenceStar:
    canonical_id: str
    hip: str | None
    hr: str | None
    hd: str | None
    proper_name: str | None
    bayer: str | None
    flamsteed: str | None
    constellation_code: str
    ra_deg: float
    dec_deg: float
    magnitude: float
    distance_pc: float | None
    spectral_type: str | None


@dataclass(frozen=True)
class Candidate:
    reference: ReferenceStar
    confidence: float
    angular_separation_deg: float
    magnitude_delta: float
    reasons: tuple[str, ...]


def parse_ra_deg(value: Any) -> float | None:
    if isinstance(value, (int, float)):
        number = float(value)
        return number if 0 <= number < 360 else None
    match = re.search(r"(\d+(?:\.\d+)?)\s*h(?:\s*(\d+(?:\.\d+)?)\s*m?)?", str(value or ""), re.I)
    if not match:
        return None
    return (float(match.group(1)) + float(match.group(2) or 0) / 60) * 15


def parse_dec_deg(value: Any) -> float | None:
    if isinstance(value, (int, float)):
        number = float(value)
        return number if -90 <= number <= 90 else None
    match = re.search(
        r"([+-])?\s*(\d+(?:\.\d+)?)\s*[°d](?:\s*(\d+(?:\.\d+)?)\s*['m]?)?",
        str(value or "").strip(), re.I,
    )
    if not match:
        return None
    sign = -1 if match.group(1) == "-" else 1
    return sign * (float(match.group(2)) + float(match.group(3) or 0) / 60)


def angular_separation_deg(ra1: float, dec1: float, ra2: float, dec2: float) -> float:
    ra1r, dec1r, ra2r, dec2r = map(math.radians, (ra1, dec1, ra2, dec2))
    cosine = math.sin(dec1r) * math.sin(dec2r) + math.cos(dec1r) * math.cos(dec2r) * math.cos(ra1r - ra2r)
    return math.degrees(math.acos(max(-1.0, min(1.0, cosine))))


def _optional(value: Any) -> str | None:
    text = str(value or "").strip()
    return text or None


def load_hyg_reference(path: str | Path) -> list[ReferenceStar]:
    stars: list[ReferenceStar] = []
    with Path(path).open("r", encoding="utf-8-sig", newline="") as handle:
        for row in csv.DictReader(handle):
            hip, hr = _optional(row.get("hip")), _optional(row.get("hr"))
            if not (hip or hr) or not row.get("ra") or not row.get("dec") or not row.get("mag"):
                continue
            distance = float(row["dist"]) if row.get("dist") else None
            if distance is not None and distance >= 100000:
                distance = None
            stars.append(ReferenceStar(
                canonical_id=f"hip:{hip}" if hip else f"hr:{hr}", hip=hip, hr=hr,
                hd=_optional(row.get("hd")), proper_name=_optional(row.get("proper")),
                bayer=_optional(row.get("bayer")), flamsteed=_optional(row.get("flam")),
                constellation_code=str(row.get("con") or ""), ra_deg=float(row["ra"]) * 15,
                dec_deg=float(row["dec"]), magnitude=float(row["mag"]), distance_pc=distance,
                spectral_type=_optional(row.get("spect")),
            ))
    return stars


def _legacy_bayer(record: dict[str, Any]) -> tuple[str, str] | None:
    parts = normalize_catalog_alias(record.get("name") or record.get("code")).split()
    constellation = CONSTELLATION_CODES.get(normalize_catalog_alias(record.get("constellation")))
    if len(parts) < 2 or parts[0] not in GREEK_ABBREVIATIONS or not constellation:
        return None
    return GREEK_ABBREVIATIONS[parts[0]], constellation.casefold()


def _candidate(record: dict[str, Any], reference: ReferenceStar) -> Candidate | None:
    ra = parse_ra_deg(record.get("ra_deg", record.get("ra")))
    dec = parse_dec_deg(record.get("dec_deg", record.get("dec")))
    magnitude = record.get("magnitude")
    if ra is None or dec is None or not isinstance(magnitude, (int, float)):
        return None
    separation = angular_separation_deg(ra, dec, reference.ra_deg, reference.dec_deg)
    mag_delta = abs(float(magnitude) - reference.magnitude)
    legacy_name = normalize_catalog_alias(record.get("name"))
    proper_match = bool(reference.proper_name and legacy_name == normalize_catalog_alias(reference.proper_name))
    bayer_identity = _legacy_bayer(record)
    reference_bayer = re.sub(r"[^a-z]", "", (reference.bayer or "").casefold())[:3]
    bayer_match = bool(bayer_identity and bayer_identity[0] == reference_bayer
                       and bayer_identity[1] == reference.constellation_code.casefold())

    reasons: list[str] = []
    if proper_match and separation <= 0.75 and mag_delta <= 0.75:
        confidence = 0.99
        reasons.append("exact proper-name identity")
    elif bayer_match and separation <= 0.75 and mag_delta <= 0.35:
        confidence = 0.97
        reasons.append("exact Bayer identity")
    elif separation <= 0.30 and mag_delta <= 0.12:
        confidence = 0.90
        reasons.append("coordinate and magnitude agreement")
    else:
        return None
    reasons.extend((f"angular separation {separation:.4f} deg", f"magnitude delta {mag_delta:.2f}"))
    return Candidate(reference, confidence, separation, mag_delta, tuple(reasons))


def find_match(record: dict[str, Any], references: Iterable[ReferenceStar]) -> tuple[Candidate | None, str | None]:
    candidates = sorted(
        (candidate for ref in references if (candidate := _candidate(record, ref))),
        key=lambda item: (-item.confidence, item.angular_separation_deg, item.magnitude_delta, item.reference.canonical_id),
    )
    if not candidates:
        return None, "No reference met the strong identity gates"
    best = candidates[0]
    if (len(candidates) > 1 and candidates[1].confidence == best.confidence
            and abs(candidates[1].angular_separation_deg - best.angular_separation_deg) < 0.01):
        return None, "Multiple references met the same confidence gate"
    return best, None


def _index_references(references: Iterable[ReferenceStar]) -> tuple[dict[str, list[ReferenceStar]], dict[tuple[str, str], list[ReferenceStar]], dict[tuple[int, int], list[ReferenceStar]]]:
    proper: dict[str, list[ReferenceStar]] = defaultdict(list)
    bayer: dict[tuple[str, str], list[ReferenceStar]] = defaultdict(list)
    sky: dict[tuple[int, int], list[ReferenceStar]] = defaultdict(list)
    for reference in references:
        if reference.proper_name:
            proper[normalize_catalog_alias(reference.proper_name)].append(reference)
        abbreviation = re.sub(r"[^a-z]", "", (reference.bayer or "").casefold())[:3]
        if abbreviation:
            bayer[(abbreviation, reference.constellation_code.casefold())].append(reference)
        sky[(math.floor(reference.ra_deg), math.floor(reference.dec_deg))].append(reference)
    return proper, bayer, sky


def _likely_references(record: dict[str, Any], indexes: tuple[dict, dict, dict]) -> list[ReferenceStar]:
    proper, bayer, sky = indexes
    selected: dict[int, ReferenceStar] = {}
    for reference in proper.get(normalize_catalog_alias(record.get("name")), []):
        selected[id(reference)] = reference
    identity = _legacy_bayer(record)
    if identity:
        for reference in bayer.get(identity, []):
            selected[id(reference)] = reference
    ra = parse_ra_deg(record.get("ra_deg", record.get("ra")))
    dec = parse_dec_deg(record.get("dec_deg", record.get("dec")))
    if ra is not None and dec is not None:
        for ra_offset in (-1, 0, 1):
            for dec_offset in (-1, 0, 1):
                cell = ((math.floor(ra) + ra_offset) % 360, math.floor(dec) + dec_offset)
                for reference in sky.get(cell, []):
                    selected[id(reference)] = reference
    return list(selected.values())


def _legacy_id(record: dict[str, Any]) -> str:
    return str(record.get("star_id") or record.get("code") or "")


def _survivor_key(result: dict[str, Any], source: dict[str, Any]) -> tuple[int, int, str]:
    code = normalize_catalog_alias(source.get("code"))
    return int(bool(re.fullmatch(r"sc \d+", code))), int(bool(_legacy_bayer(source))), str(result["legacy_id"])


def reconcile_catalog(records: Iterable[dict[str, Any]], references: Iterable[ReferenceStar]) -> dict[str, Any]:
    rows, refs = list(records), list(references)
    indexes = _index_references(refs)
    results: list[dict[str, Any]] = []
    result_sources: dict[str, dict[str, Any]] = {}
    for row in rows:
        legacy_id = _legacy_id(row)
        code = normalize_catalog_alias(row.get("code"))
        result_sources[legacy_id] = row
        if code in QUARANTINE_OVERRIDES:
            results.append({"legacy_id": legacy_id, "code": row.get("code"), "name": row.get("name"),
                            "status": "quarantine", "canonical_id": None, "confidence": 1.0,
                            "reasons": [QUARANTINE_OVERRIDES[code]], "source_refs": ["reviewed legacy exception"]})
            continue
        match, reason = find_match(row, _likely_references(row, indexes))
        if match:
            results.append({"legacy_id": legacy_id, "code": row.get("code"), "name": row.get("name"),
                            "status": "matched", "canonical_id": match.reference.canonical_id,
                            "confidence": match.confidence, "reasons": list(match.reasons),
                            "source_refs": [HYG_SOURCE], "reference": asdict(match.reference)})
        else:
            results.append({"legacy_id": legacy_id, "code": row.get("code"), "name": row.get("name"),
                            "status": "unresolved", "canonical_id": None, "confidence": 0.0,
                            "reasons": [reason], "source_refs": []})

    # Exact duplicate legacy coordinates may expose a bad magnitude/name. They
    # inherit only a secure sibling identity and remain explicit merge reviews.
    position_groups: dict[tuple[str, str], list[dict[str, Any]]] = defaultdict(list)
    by_id = {result["legacy_id"]: result for result in results}
    for row in rows:
        position_groups[(str(row.get("ra") or row.get("ra_deg")), str(row.get("dec") or row.get("dec_deg")))].append(row)
    for group in position_groups.values():
        canonical_ids = {
            by_id[_legacy_id(row)]["canonical_id"] for row in group
            if by_id[_legacy_id(row)]["canonical_id"]
        }
        if len(canonical_ids) == 1:
            canonical_id = next(iter(canonical_ids))
            for row in group:
                result = by_id[_legacy_id(row)]
                if result["status"] == "unresolved":
                    result.update(status="merge", canonical_id=canonical_id, confidence=0.80,
                                  reasons=["exact legacy position duplicates a securely matched record; metadata conflict requires review"],
                                  source_refs=[HYG_SOURCE])

    groups: list[dict[str, Any]] = []
    canonical_groups: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for result in results:
        if result.get("canonical_id"):
            canonical_groups[result["canonical_id"]].append(result)
    for canonical_id, group in sorted(canonical_groups.items()):
        if len(group) < 2:
            continue
        survivor = min(group, key=lambda item: _survivor_key(item, result_sources[item["legacy_id"]]))
        redirects = []
        for item in group:
            if item is not survivor:
                item["status"] = "merge"
                item["merge_into_legacy_id"] = survivor["legacy_id"]
                redirects.append(item["legacy_id"])
        groups.append({"canonical_id": canonical_id, "survivor_legacy_id": survivor["legacy_id"],
                       "redirect_legacy_ids": sorted(redirects),
                       "requires_metadata_review": any("conflict" in " ".join(item["reasons"]) for item in group)})

    counts = Counter(item["status"] for item in results)
    return {
        "mode": "dry-run", "writes_performed": False, "record_count": len(rows),
        "status_counts": {status: counts.get(status, 0) for status in ("matched", "merge", "quarantine", "unresolved")},
        "records": results, "merge_groups": groups,
        "reference_preservation": {
            "strategy": "Keep the survivor legacy star_id and store redirects for every merged legacy id.",
            "dependent_fields_to_repoint_before_removal": [
                "orders.star_id", "listings.star_id", "payment_transactions.star_id",
                "transactions.star_id", "ownership snapshots star_id/starId",
            ],
            "automatic_mutation": False,
        },
    }


def build_redirect_manifest(
    report: dict[str, Any],
    catalog_version: str,
    canonical_ids: Iterable[str] | None = None,
) -> dict[str, Any]:
    """Project a reviewed dry-run into a small, immutable redirect artifact."""
    allowed = set(canonical_ids) if canonical_ids is not None else None
    merge_survivors = {
        group["canonical_id"]: group["survivor_legacy_id"]
        for group in report.get("merge_groups", [])
    }
    redirects: dict[str, dict[str, Any]] = {}
    quarantined: dict[str, dict[str, Any]] = {}
    unresolved: list[str] = []
    for record in report.get("records", []):
        legacy_id = record["legacy_id"]
        canonical_id = record.get("canonical_id")
        if record["status"] == "quarantine":
            quarantined[legacy_id] = {"reason": record["reasons"][0]}
        elif not canonical_id:
            unresolved.append(legacy_id)
        elif allowed is None or canonical_id in allowed:
            survivor = merge_survivors.get(canonical_id, legacy_id)
            redirects[legacy_id] = {
                "canonical_id": canonical_id,
                "survivor_legacy_id": survivor,
                "redirect_required": legacy_id != survivor,
            }
    return {
        "catalog_version": catalog_version,
        "source": "legacy reconciliation dry-run",
        "writes_performed": False,
        "redirects": dict(sorted(redirects.items())),
        "quarantined": dict(sorted(quarantined.items())),
        "unresolved_legacy_ids": sorted(unresolved),
    }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--api-base", default="https://starclaim.onrender.com/api")
    parser.add_argument("--hyg-csv", default=str(Path(__file__).parent / "data" / "hyg_v41.csv"))
    parser.add_argument("--limit", type=int, default=1000)
    parser.add_argument("--output", help="Optional report path; omitted prints JSON only")
    parser.add_argument("--redirect-output", help="Optional compact legacy redirect manifest path")
    parser.add_argument("--catalog-manifest", help="Curated manifest used to limit redirect canonical IDs")
    args = parser.parse_args()
    report = reconcile_catalog(fetch_catalog(args.api_base, args.limit), load_hyg_reference(args.hyg_csv))
    rendered = json.dumps(report, indent=2, ensure_ascii=False)
    if args.output:
        Path(args.output).write_text(rendered + "\n", encoding="utf-8")
    if args.redirect_output:
        if not args.catalog_manifest:
            parser.error("--redirect-output requires --catalog-manifest")
        catalog = json.loads(Path(args.catalog_manifest).read_text(encoding="utf-8"))
        redirect_manifest = build_redirect_manifest(
            report,
            str(catalog["catalog_version"]),
            {star["canonical_id"] for star in catalog.get("stars", [])},
        )
        Path(args.redirect_output).write_text(
            json.dumps(redirect_manifest, indent=2, ensure_ascii=False) + "\n",
            encoding="utf-8",
        )
    print(rendered)


if __name__ == "__main__":
    main()
