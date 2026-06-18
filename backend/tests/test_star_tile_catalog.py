import gzip
import json

import pytest

from backend.star_tile_catalog import (
    build_star_tiles,
    get_sector_id,
    resolve_tile_path,
)


def sample_rows():
    return [
        {
            "id": "1", "hip": "1", "hd": "10", "proper": "Alpha",
            "ra": "0", "dec": "-90", "dist": "5", "mag": "1.2",
            "spect": "G2V", "con": "Oct",
        },
        {
            "id": "2", "hip": "2", "hd": "20", "proper": "Beta",
            "ra": "23.999", "dec": "90", "dist": "25", "mag": "-0.1",
            "spect": "B1V", "con": "UMi",
        },
        {
            "id": "3", "hip": "", "hd": "", "proper": "",
            "ra": "12", "dec": "0", "dist": "", "mag": "6.8",
            "spect": "M", "con": "Vir",
        },
        {"id": "bad", "ra": "not-a-number", "dec": "0", "mag": "2"},
    ]


def test_sector_boundaries_match_mobile_scheme():
    assert get_sector_id(0, -90, 5) == "r0-d0-s0"
    assert get_sector_id(23.999, 90, 25) == "r23-d17-s1"
    assert get_sector_id(12, 0, 12000) == "r12-d9-s10"
    assert get_sector_id(6, 45, 0) == "r6-d13-su"


def test_builds_versioned_gzip_tiles_and_manifest(tmp_path):
    manifest = build_star_tiles(sample_rows(), tmp_path, "test-v1")
    assert manifest["normalizedStarCount"] == 3
    assert manifest["invalidRowCount"] == 1
    assert sum(sector["count"] for sector in manifest["sectors"]) == 3

    sector = next(item for item in manifest["sectors"] if item["id"] == "r23-d17-s1")
    tile_path = resolve_tile_path(tmp_path, "test-v1", sector["id"])
    stars = json.loads(gzip.decompress(tile_path.read_bytes()))
    assert stars[0]["properName"] == "Beta"
    assert stars[0]["sectorId"] == sector["id"]
    assert sector["bytes"] == tile_path.stat().st_size
    assert len(sector["sha256"]) == 64


def test_rejects_unsafe_tile_paths(tmp_path):
    with pytest.raises(ValueError):
        resolve_tile_path(tmp_path, "test-v1", "../../manifest")
