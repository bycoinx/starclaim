"""Build and serve versioned HYG sector tiles for the mobile 3D map."""

from __future__ import annotations

import csv
import gzip
import hashlib
import json
import math
import re
from collections import defaultdict
from pathlib import Path
from typing import Iterable

RA_SECTOR_SIZE_DEGREES = 15
DEC_SECTOR_SIZE_DEGREES = 10
DISTANCE_SHELLS_PARSEC = [10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000]
SECTOR_ID_PATTERN = re.compile(r"^r\d+-d\d+-s(?:\d+|u)$")


def _finite_float(value: object) -> float | None:
    try:
        parsed = float(value)
    except (TypeError, ValueError):
        return None
    return parsed if math.isfinite(parsed) else None


def get_sector_id(ra_hours: float, dec_degrees: float, distance_parsec: float) -> str:
    ra_degrees = (ra_hours * 15.0) % 360.0
    dec_degrees = max(-90.0, min(90.0, dec_degrees))
    ra_index = int(ra_degrees // RA_SECTOR_SIZE_DEGREES)
    dec_count = 180 // DEC_SECTOR_SIZE_DEGREES
    dec_index = min(int((dec_degrees + 90.0) // DEC_SECTOR_SIZE_DEGREES), dec_count - 1)
    if distance_parsec <= 0:
        shell: str | int = "u"
    else:
        shell = next(
            (index for index, upper_bound in enumerate(DISTANCE_SHELLS_PARSEC) if distance_parsec <= upper_bound),
            len(DISTANCE_SHELLS_PARSEC),
        )
    return f"r{ra_index}-d{dec_index}-s{shell}"


def normalize_hyg_row(row: dict[str, str], fallback_id: int) -> dict[str, object] | None:
    ra_hours = _finite_float(row.get("ra"))
    dec_degrees = _finite_float(row.get("dec"))
    magnitude = _finite_float(row.get("mag"))
    if ra_hours is None or dec_degrees is None or magnitude is None:
        return None
    distance_parsec = _finite_float(row.get("dist")) or 0.0
    proper_name = row.get("proper") or ""
    spectral_type = row.get("spect") or ""
    constellation = row.get("con") or ""
    sector_id = get_sector_id(ra_hours, dec_degrees, distance_parsec)
    return {
        "id": row.get("id") or str(fallback_id),
        "hip": row.get("hip") or "",
        "hd": row.get("hd") or "",
        "proper": proper_name,
        "properName": proper_name,
        "ra": ra_hours,
        "raHours": ra_hours,
        "raDegrees": ra_hours * 15.0,
        "dec": dec_degrees,
        "decDegrees": dec_degrees,
        "dist": distance_parsec,
        "distanceParsec": distance_parsec,
        "mag": magnitude,
        "magnitude": magnitude,
        "spect": spectral_type,
        "spectralType": spectral_type,
        "con": constellation,
        "constellation": constellation,
        "starClaimCode": "",
        "sectorId": sector_id,
        "type": "star",
    }


def build_star_tiles(
    rows: Iterable[dict[str, str]],
    output_root: Path,
    catalog_version: str = "hyg-v4.1-sector-v1",
) -> dict[str, object]:
    version_root = output_root / catalog_version
    tile_root = version_root / "tiles"
    if version_root.exists():
        raise FileExistsError(f"Catalog version already exists: {version_root}")
    tile_root.mkdir(parents=True, exist_ok=False)

    sectors: dict[str, list[dict[str, object]]] = defaultdict(list)
    invalid_rows = 0
    normalized_count = 0
    for row_index, row in enumerate(rows, start=1):
        star = normalize_hyg_row(row, row_index)
        if star is None:
            invalid_rows += 1
            continue
        normalized_count += 1
        sectors[str(star["sectorId"])].append(star)

    manifest_sectors = []
    for sector_id in sorted(sectors):
        stars = sorted(sectors[sector_id], key=lambda star: float(star["magnitude"]))
        payload = json.dumps(stars, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
        compressed = gzip.compress(payload, compresslevel=9, mtime=0)
        tile_path = tile_root / f"{sector_id}.json.gz"
        tile_path.write_bytes(compressed)
        distances = [float(star["distanceParsec"]) for star in stars if float(star["distanceParsec"]) > 0]
        manifest_sectors.append({
            "id": sector_id,
            "count": len(stars),
            "bytes": len(compressed),
            "sha256": hashlib.sha256(compressed).hexdigest(),
            "minMagnitude": float(stars[0]["magnitude"]),
            "maxMagnitude": float(stars[-1]["magnitude"]),
            "minDistanceParsec": min(distances) if distances else None,
            "maxDistanceParsec": max(distances) if distances else None,
        })

    manifest = {
        "schemaVersion": 1,
        "catalogVersion": catalog_version,
        "normalizedStarCount": normalized_count,
        "invalidRowCount": invalid_rows,
        "sectorScheme": {
            "coordinateSystem": "ICRS_RA_DEC_DISTANCE",
            "raSectorSizeDegrees": RA_SECTOR_SIZE_DEGREES,
            "decSectorSizeDegrees": DEC_SECTOR_SIZE_DEGREES,
            "distanceShellsParsec": DISTANCE_SHELLS_PARSEC,
            "unknownDistanceShell": "u",
        },
        "sectors": manifest_sectors,
    }
    (version_root / "manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, separators=(",", ":")),
        encoding="utf-8",
    )
    return manifest


def read_hyg_csv(path: Path) -> csv.DictReader:
    handle = path.open("r", encoding="utf-8-sig", newline="")
    return csv.DictReader(handle)


def resolve_catalog_root(base_root: Path, catalog_version: str) -> Path:
    safe_version = re.sub(r"[^a-zA-Z0-9._-]", "", catalog_version)
    if safe_version != catalog_version:
        raise ValueError("Invalid catalog version")
    return (base_root / safe_version).resolve()


def resolve_tile_path(base_root: Path, catalog_version: str, sector_id: str) -> Path:
    if not SECTOR_ID_PATTERN.fullmatch(sector_id):
        raise ValueError("Invalid sector id")
    catalog_root = resolve_catalog_root(base_root, catalog_version)
    tile_path = (catalog_root / "tiles" / f"{sector_id}.json.gz").resolve()
    if catalog_root not in tile_path.parents:
        raise ValueError("Invalid tile path")
    return tile_path
