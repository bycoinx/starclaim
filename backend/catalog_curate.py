"""Build the deterministic ten-constellation StarClaim pilot catalog."""

from __future__ import annotations

import argparse
import csv
import io
import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Iterable
from urllib.parse import urlencode
from urllib.request import urlopen

from backend.catalog_domain import (
    Astrometry, CanonicalStar, CatalogDesignations, ConstellationIdentity,
    CurationMetadata, Photometry, StellarMetadata, build_alias_index,
)


CATALOG_VERSION = "pilot-v1"
IAU_SOURCE = "https://www.iau.org/Iau/Science/What-we-do/The-Constellations.aspx"
HIPPARCOS_SOURCE = "https://cdsarc.cds.unistra.fr/viz-bin/cat/I/239"
HYG_SOURCE = "https://github.com/astronexus/HYG-Database (v4.1 cross-match)"
PARSEC_TO_LIGHT_YEAR = 3.26156

GREEK_NAMES = {
    "Alp": "alpha", "Bet": "beta", "Gam": "gamma", "Del": "delta",
    "Eps": "epsilon", "Zet": "zeta", "Eta": "eta", "The": "theta",
    "Iot": "iota", "Kap": "kappa", "Lam": "lambda", "Mu": "mu",
    "Nu": "nu", "Xi": "xi", "Omi": "omicron", "Pi": "pi",
    "Rho": "rho", "Sig": "sigma", "Tau": "tau", "Ups": "upsilon",
    "Phi": "phi", "Chi": "chi", "Psi": "psi", "Ome": "omega",
}


@dataclass(frozen=True)
class PilotPolicy:
    iau_code: str
    name: str
    genitive: str
    magnitude_ceiling: float
    max_stars: int
    required_bayer: tuple[str, ...] = ()
    asterisms: tuple[tuple[str, tuple[str, ...]], ...] = ()


PILOT_POLICIES = (
    PilotPolicy("Ori", "Orion", "Orionis", 4.0, 10,
                asterisms=(("Orion Belt", ("Del", "Eps", "Zet")),)),
    PilotPolicy("UMa", "Ursa Major", "Ursae Majoris", 4.0, 7,
                required_bayer=("Alp", "Bet", "Gam", "Del", "Eps", "Zet", "Eta"),
                asterisms=(("Big Dipper", ("Alp", "Bet", "Gam", "Del", "Eps", "Zet", "Eta")),)),
    PilotPolicy("Cas", "Cassiopeia", "Cassiopeiae", 4.0, 5,
                required_bayer=("Alp", "Bet", "Gam", "Del", "Eps"),
                asterisms=(("Cassiopeia W", ("Alp", "Bet", "Gam", "Del", "Eps")),)),
    PilotPolicy("Sco", "Scorpius", "Scorpii", 4.0, 12),
    PilotPolicy("Tau", "Taurus", "Tauri", 4.0, 10),
    PilotPolicy("Leo", "Leo", "Leonis", 4.0, 10),
    PilotPolicy("Sgr", "Sagittarius", "Sagittarii", 4.0, 10,
                asterisms=(("Teapot", ("Gam-2", "Del", "Eps", "Lam", "Phi", "Sig", "Tau", "Zet")),)),
    PilotPolicy("Cru", "Crux", "Crucis", 4.0, 5,
                required_bayer=("Alp-1", "Bet", "Gam", "Del", "Eps"),
                asterisms=(("Southern Cross", ("Alp-1", "Bet", "Gam", "Del")),)),
    PilotPolicy("Cen", "Centaurus", "Centauri", 4.0, 10),
    PilotPolicy("Lyr", "Lyra", "Lyrae", 4.5, 5,
                asterisms=(("Summer Triangle", ("Alp",)),)),
)


@dataclass(frozen=True)
class HipparcosRecord:
    hip: str
    ra_deg: float
    dec_deg: float
    parallax_mas: float | None
    magnitude_v: float


def fetch_hipparcos_bright(magnitude_ceiling: float = 5.0) -> dict[str, HipparcosRecord]:
    query = urlencode({
        "-source": "I/239/hip_main", "Vmag": f"-2.0..{magnitude_ceiling}",
        "-out": "HIP,RAICRS,DEICRS,Plx,Vmag", "-out.max": 5000,
    })
    url = f"https://vizier.cds.unistra.fr/viz-bin/asu-tsv?{query}"
    with urlopen(url, timeout=60) as response:  # nosec B310 - fixed CDS HTTPS endpoint
        text = response.read().decode("utf-8")
    data_lines = [line for line in text.splitlines() if line and not line.startswith("#")]
    reader = csv.DictReader(io.StringIO("\n".join(data_lines)), delimiter="\t")
    records: dict[str, HipparcosRecord] = {}
    for row in reader:
        hip = (row.get("HIP") or "").strip()
        ra_deg = _float_or_none(row.get("RAICRS"))
        dec_deg = _float_or_none(row.get("DEICRS"))
        magnitude_v = _float_or_none(row.get("Vmag"))
        if not hip.isdigit() or ra_deg is None or dec_deg is None or magnitude_v is None:
            continue
        records[hip] = HipparcosRecord(
            hip=hip, ra_deg=ra_deg, dec_deg=dec_deg,
            parallax_mas=_float_or_none(row.get("Plx")), magnitude_v=magnitude_v,
        )
    if not records:
        raise ValueError("CDS Hipparcos query returned no usable records")
    return records


def load_hyg_rows(path: str | Path) -> list[dict[str, str]]:
    with Path(path).open("r", encoding="utf-8-sig", newline="") as handle:
        return list(csv.DictReader(handle))


def _float_or_none(value: Any) -> float | None:
    text = str(value or "").strip()
    try:
        return float(text) if text else None
    except ValueError:
        return None


def _bayer_parts(value: str) -> tuple[str, str]:
    base, separator, suffix = value.strip().partition("-")
    greek = GREEK_NAMES.get(base)
    if not greek:
        raise ValueError(f"Unsupported Bayer abbreviation: {value}")
    return greek, suffix if separator else ""


def _bayer_latin(value: str, genitive: str) -> tuple[str, str]:
    greek, suffix = _bayer_parts(value)
    letter = f"{greek}{suffix}"
    return letter, f"{letter.capitalize()} {genitive}"


def _system_key(row: dict[str, str]) -> str:
    return row.get("comp_primary") or row.get("base") or row.get("hip") or row.get("id") or ""


def _select_rows(rows: Iterable[dict[str, str]], hipparcos: dict[str, HipparcosRecord], policy: PilotPolicy) -> list[dict[str, str]]:
    candidates = [
        row for row in rows
        if row.get("con") == policy.iau_code and row.get("bayer")
        and row.get("hip") in hipparcos
        and hipparcos[row["hip"]].magnitude_v <= policy.magnitude_ceiling
    ]
    systems: dict[str, dict[str, str]] = {}
    for row in candidates:
        key = _system_key(row)
        current = systems.get(key)
        if current is None or (hipparcos[row["hip"]].magnitude_v, int(row["hip"])) < (
            hipparcos[current["hip"]].magnitude_v, int(current["hip"])
        ):
            systems[key] = row
    candidates = list(systems.values())
    if policy.required_bayer:
        by_bayer = {row["bayer"].strip(): row for row in candidates}
        missing = [designation for designation in policy.required_bayer if designation not in by_bayer]
        if missing:
            raise ValueError(f"{policy.iau_code} missing required Bayer stars: {missing}")
        selected = [by_bayer[designation] for designation in policy.required_bayer]
    else:
        selected = sorted(candidates, key=lambda row: (
            hipparcos[row["hip"]].magnitude_v, row["bayer"], int(row["hip"])
        ))[:policy.max_stars]
    selected.sort(key=lambda row: (hipparcos[row["hip"]].magnitude_v, int(row["hip"])))
    if not 5 <= len(selected) <= 12:
        raise ValueError(f"{policy.iau_code} selected {len(selected)} stars; expected 5-12")
    return selected


def _unique_aliases(values: Iterable[str | None]) -> list[str]:
    result, normalized = [], set()
    for value in values:
        cleaned = str(value or "").strip()
        key = " ".join(cleaned.casefold().split())
        if cleaned and key not in normalized:
            normalized.add(key)
            result.append(cleaned)
    return result


def _asterisms(policy: PilotPolicy, bayer: str) -> list[str]:
    return [name for name, members in policy.asterisms if bayer in members]


def _to_canonical_star(row: dict[str, str], hip: HipparcosRecord, policy: PilotPolicy, rank: int) -> CanonicalStar:
    bayer = row["bayer"].strip()
    bayer_letter, bayer_latin = _bayer_latin(bayer, policy.genitive)
    proper_name = (row.get("proper") or "").strip() or None
    display_name = proper_name or bayer_latin
    flamsteed = f"{row['flam'].strip()} {policy.genitive}" if row.get("flam", "").strip() else None
    distance_pc = 1000 / hip.parallax_mas if hip.parallax_mas and hip.parallax_mas > 0 else None
    variable = bool((row.get("var") or "").strip())
    variable_note = None
    if variable:
        bounds = [str(value) for value in (row.get("var_min"), row.get("var_max")) if str(value or "").strip()]
        variable_note = f"HYG variable-star fields: {', '.join(bounds)}" if bounds else "Variable star"
    asterisms = _asterisms(policy, bayer)
    return CanonicalStar(
        catalog_version=CATALOG_VERSION, canonical_id=f"hip:{hip.hip}", object_scope="system",
        display_name=display_name, aliases=_unique_aliases((bayer_latin, row.get("bf"), flamsteed)),
        constellation=ConstellationIdentity(iau_code=policy.iau_code, name=policy.name, genitive=policy.genitive),
        designations=CatalogDesignations(
            bayer_letter=bayer_letter, bayer_latin=bayer_latin, flamsteed=flamsteed,
            hr=(row.get("hr") or "").strip() or None, hip=hip.hip,
            hd=(row.get("hd") or "").strip() or None, gaia_dr3=None, component=None,
        ),
        astrometry=Astrometry(
            epoch="J1991.25 (ICRS)", ra_deg=hip.ra_deg, dec_deg=hip.dec_deg,
            parallax_mas=hip.parallax_mas, distance_pc=distance_pc,
            distance_ly=distance_pc * PARSEC_TO_LIGHT_YEAR if distance_pc else None,
        ),
        photometry=Photometry(apparent_magnitude_v=hip.magnitude_v, is_variable=variable, magnitude_note=variable_note),
        stellar=StellarMetadata(spectral_type=(row.get("spect") or "").strip() or None),
        asterisms=asterisms,
        curation=CurationMetadata(
            visible=True, sellable=True, rank_in_constellation=rank,
            selection_reason="asterism" if asterisms else "bayer",
            source_refs=[IAU_SOURCE, f"{HIPPARCOS_SOURCE} (HIP {hip.hip})", HYG_SOURCE],
        ),
        legacy_ids=[],
    )


def curate_pilot(hyg_rows: Iterable[dict[str, str]], hipparcos: dict[str, HipparcosRecord], policies: Iterable[PilotPolicy] = PILOT_POLICIES) -> dict[str, Any]:
    rows, selected_stars, policy_rows = list(hyg_rows), [], []
    for policy in policies:
        selected = _select_rows(rows, hipparcos, policy)
        stars = [_to_canonical_star(row, hipparcos[row["hip"]], policy, rank)
                 for rank, row in enumerate(selected, start=1)]
        selected_stars.extend(stars)
        policy_rows.append({"iau_code": policy.iau_code, "name": policy.name,
                            "magnitude_ceiling": policy.magnitude_ceiling, "selected_count": len(stars)})
    build_alias_index(selected_stars)
    coordinates = [(round(star.astrometry.ra_deg, 8), round(star.astrometry.dec_deg, 8)) for star in selected_stars]
    if len(set(coordinates)) != len(coordinates):
        raise ValueError("Pilot contains duplicate coordinates")
    return {
        "catalog_version": CATALOG_VERSION, "status": "curated-pilot",
        "source_policy": "IAU constellation metadata + CDS Hipparcos astrometry/photometry + HYG name cross-match",
        "constellation_count": len(policy_rows), "star_count": len(selected_stars),
        "constellations": policy_rows,
        "stars": [star.model_dump(mode="json") for star in selected_stars],
    }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--hyg-csv", default=str(Path(__file__).parent / "data" / "hyg_v41.csv"))
    parser.add_argument("--output", default=str(Path(__file__).parents[1] / "shared" / "catalog" / "curated-pilot-v1.json"))
    args = parser.parse_args()
    manifest = curate_pilot(load_hyg_rows(args.hyg_csv), fetch_hipparcos_bright())
    output = Path(args.output)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(json.dumps({"output": str(output), "star_count": manifest["star_count"],
                      "constellation_count": manifest["constellation_count"]}, indent=2))


if __name__ == "__main__":
    main()
