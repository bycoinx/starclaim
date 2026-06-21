"""Build and resolve compact Gaia binary tiles for the 2D sky renderer."""

from __future__ import annotations

import hashlib
import json
import math
import re
import struct
from collections import defaultdict
from pathlib import Path

MAGIC = b"SCB1"
FORMAT_VERSION = 1
HEADER = struct.Struct("<4sHHII")
RECORD = struct.Struct("<QIIffffff")
RA_SECTOR_SIZE_DEGREES = 15
DEC_SECTOR_SIZE_DEGREES = 10
SECTOR_ID_PATTERN = re.compile(r"^r\d+-d\d+$")


def get_2d_sector_id(ra_degrees: float, dec_degrees: float) -> str:
    ra_index = int((ra_degrees % 360.0) // RA_SECTOR_SIZE_DEGREES)
    dec_index = min(17, max(0, int((dec_degrees + 90.0) // DEC_SECTOR_SIZE_DEGREES)))
    return f"r{ra_index}-d{dec_index}"


def _number(value, default=math.nan):
    try:
        parsed = float(value)
        return parsed if math.isfinite(parsed) else default
    except (TypeError, ValueError):
        return default


def _integer(value, default=0):
    try:
        return int(value)
    except (TypeError, ValueError):
        return default


def _encode_tile(stars):
    payload = bytearray(HEADER.pack(MAGIC, FORMAT_VERSION, RECORD.size, len(stars), 0))
    for star in stars:
        payload.extend(
            RECORD.pack(
                _integer(star.get("gaiaSourceId") or star.get("sourceId")),
                _integer(star.get("hip")),
                _integer(star.get("hd")),
                _number(star.get("raDegrees")),
                _number(star.get("decDegrees")),
                _number(star.get("parallaxMas")),
                _number(star.get("magnitude")),
                _number(star.get("colorIndex")),
                _number(star.get("distanceParsec")),
            )
        )
    return bytes(payload)


def build_binary_tiles(
    catalog_path: Path, output_root: Path, catalog_version="gaia-dr3-hip-2d-v1"
):
    payload = json.loads(Path(catalog_path).read_text(encoding="utf-8"))
    stars = payload.get("stars", payload)
    version_root = Path(output_root) / catalog_version
    if version_root.exists():
        raise FileExistsError(f"Catalog version already exists: {version_root}")
    tile_root = version_root / "tiles"
    tile_root.mkdir(parents=True)

    sectors = defaultdict(list)
    names = {}
    for star in stars:
        sector_id = get_2d_sector_id(
            float(star["raDegrees"]), float(star["decDegrees"])
        )
        sectors[sector_id].append(star)
        if star.get("properName") or star.get("constellation"):
            names[str(star.get("gaiaSourceId") or star.get("sourceId"))] = {
                "properName": star.get("properName"),
                "constellation": star.get("constellation"),
                "spectralType": star.get("spectralType"),
            }

    manifest_sectors = []
    total_bytes = 0
    for sector_id in sorted(sectors):
        sector_stars = sorted(
            sectors[sector_id], key=lambda star: float(star["magnitude"])
        )
        tile_bytes = _encode_tile(sector_stars)
        tile_path = tile_root / f"{sector_id}.bin"
        tile_path.write_bytes(tile_bytes)
        total_bytes += len(tile_bytes)
        manifest_sectors.append(
            {
                "id": sector_id,
                "count": len(sector_stars),
                "bytes": len(tile_bytes),
                "sha256": hashlib.sha256(tile_bytes).hexdigest(),
                "minMagnitude": float(sector_stars[0]["magnitude"]),
                "maxMagnitude": float(sector_stars[-1]["magnitude"]),
            }
        )

    names_path = version_root / "names.json"
    names_path.write_text(
        json.dumps(names, ensure_ascii=True, separators=(",", ":")), encoding="utf-8"
    )
    manifest = {
        "schemaVersion": 1,
        "catalogVersion": catalog_version,
        "sourceCatalogVersion": payload.get("catalogVersion", "gaia-dr3-hip-v1"),
        "format": {
            "magic": MAGIC.decode("ascii"),
            "version": FORMAT_VERSION,
            "endianness": "little",
            "headerBytes": HEADER.size,
            "recordBytes": RECORD.size,
            "fields": [
                "gaiaSourceId:uint64",
                "hip:uint32",
                "hd:uint32",
                "raDegrees:float32",
                "decDegrees:float32",
                "parallaxMas:float32",
                "magnitude:float32",
                "colorIndex:float32",
                "distanceParsec:float32",
            ],
        },
        "sectorScheme": {
            "coordinateSystem": "ICRS_RA_DEC",
            "raSectorSizeDegrees": RA_SECTOR_SIZE_DEGREES,
            "decSectorSizeDegrees": DEC_SECTOR_SIZE_DEGREES,
        },
        "starCount": len(stars),
        "tileCount": len(manifest_sectors),
        "tileBytes": total_bytes,
        "nameCount": len(names),
        "names": {
            "path": "names.json",
            "bytes": names_path.stat().st_size,
            "sha256": hashlib.sha256(names_path.read_bytes()).hexdigest(),
        },
        "sectors": manifest_sectors,
    }
    (version_root / "manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=True, indent=2), encoding="utf-8"
    )
    return manifest


def resolve_binary_catalog_root(base_root: Path, catalog_version: str) -> Path:
    safe_version = re.sub(r"[^a-zA-Z0-9._-]", "", catalog_version)
    if safe_version != catalog_version:
        raise ValueError("Invalid catalog version")
    return (Path(base_root) / safe_version).resolve()


def resolve_binary_tile_path(
    base_root: Path, catalog_version: str, sector_id: str
) -> Path:
    if not SECTOR_ID_PATTERN.fullmatch(sector_id):
        raise ValueError("Invalid 2D sector id")
    catalog_root = resolve_binary_catalog_root(base_root, catalog_version)
    tile_path = (catalog_root / "tiles" / f"{sector_id}.bin").resolve()
    if catalog_root not in tile_path.parents:
        raise ValueError("Invalid tile path")
    return tile_path
