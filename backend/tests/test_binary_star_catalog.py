import json
import struct

import pytest

from backend.binary_star_catalog import (
    HEADER,
    MAGIC,
    RECORD,
    build_binary_tiles,
    get_2d_sector_id,
    resolve_binary_tile_path,
)


def test_builds_fixed_binary_tiles_and_manifest(tmp_path):
    source = tmp_path / "catalog.json"
    source.write_text(
        json.dumps(
            {
                "catalogVersion": "fixture",
                "stars": [
                    {
                        "sourceId": "123456789012345678",
                        "gaiaSourceId": "123456789012345678",
                        "hip": 42,
                        "hd": 7,
                        "properName": "Test Star",
                        "raDegrees": 359.9,
                        "decDegrees": 89.9,
                        "parallaxMas": 10,
                        "magnitude": 1.2,
                        "colorIndex": 0.5,
                        "distanceParsec": 100,
                        "constellation": "UMi",
                        "spectralType": "G2V",
                    },
                    {
                        "sourceId": "2",
                        "gaiaSourceId": "2",
                        "hip": None,
                        "hd": None,
                        "properName": None,
                        "raDegrees": 0.1,
                        "decDegrees": -89.9,
                        "parallaxMas": None,
                        "magnitude": 5.0,
                        "colorIndex": None,
                        "distanceParsec": None,
                    },
                ],
            }
        ),
        encoding="utf-8",
    )
    manifest = build_binary_tiles(source, tmp_path / "out", "fixture-v1")

    assert manifest["starCount"] == 2
    assert manifest["tileCount"] == 2
    assert manifest["format"]["recordBytes"] == 40
    tile = resolve_binary_tile_path(tmp_path / "out", "fixture-v1", "r23-d17")
    data = tile.read_bytes()
    magic, version, record_bytes, count, _ = HEADER.unpack_from(data)
    assert (magic, version, record_bytes, count) == (MAGIC, 1, RECORD.size, 1)
    assert struct.unpack_from("<Q", data, HEADER.size)[0] == 123456789012345678
    assert len(manifest["sectors"][0]["sha256"]) == 64
    assert manifest["nameCount"] == 1


def test_2d_sector_boundaries_and_safe_resolution(tmp_path):
    assert get_2d_sector_id(0, -90) == "r0-d0"
    assert get_2d_sector_id(359.99, 90) == "r23-d17"
    with pytest.raises(ValueError):
        resolve_binary_tile_path(tmp_path, "v1", "../../secret")
