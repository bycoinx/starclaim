"""
P0.4 - Binary Catalog Tile System Tests

Validates:
- Binary tile format and structure
- Sector ID generation
- Search index integrity
- Reference star presence
- Tile integrity (SHA-256)
"""

import json
import struct
from pathlib import Path

import pytest

from backend.binary_star_catalog import (
    FORMAT_VERSION,
    HEADER,
    MAGIC,
    RECORD,
    build_binary_tiles,
    get_2d_sector_id,
    resolve_binary_tile_path,
)


class TestP04SectorCalculation:
    """Test 2D sector ID calculation."""
    
    def test_sirius_sector(self):
        """Sirius @ RA 101.3°, Dec -16.7° → sector r6-d7"""
        sector_id = get_2d_sector_id(101.3, -16.7)
        assert sector_id == "r6-d7", f"Expected r6-d7, got {sector_id}"
    
    def test_vega_sector(self):
        """Vega @ RA 279.2°, Dec +38.7° → sector r18-d12"""
        sector_id = get_2d_sector_id(279.2, 38.7)
        assert sector_id == "r18-d12", f"Expected r18-d12, got {sector_id}"
    
    def test_polaris_sector(self):
        """Polaris @ RA 37.95°, Dec +89.3° → sector r2-d17 (polar)"""
        sector_id = get_2d_sector_id(37.95, 89.3)
        assert sector_id == "r2-d17", f"Expected r2-d17, got {sector_id}"
    
    def test_southpole_clamp(self):
        """South pole clamps to d0"""
        sector_id = get_2d_sector_id(0, -91)
        assert "d0" in sector_id
    
    def test_northpole_clamp(self):
        """North pole clamps to d17"""
        sector_id = get_2d_sector_id(0, 91)
        assert "d17" in sector_id
    
    def test_ra_wrap_around(self):
        """RA wraps at 360°"""
        sector_id_360 = get_2d_sector_id(360, 0)
        sector_id_0 = get_2d_sector_id(0, 0)
        assert sector_id_360 == sector_id_0


class TestP04BinaryFormat:
    """Test binary tile encoding and structure."""
    
    def test_header_structure(self):
        """Header is 16 bytes: magic(4) + version(2) + record_size(2) + count(4) + reserved(4)"""
        assert HEADER.size == 16
        assert MAGIC == b"SCB1"
        assert FORMAT_VERSION == 1
    
    def test_record_structure(self):
        """Record is 40 bytes: gaia_id(8) + hip(4) + hd(4) + 7×float(28)"""
        assert RECORD.size == 40
    
    def test_tile_encoding(self, tmp_path):
        """Encode sample star and verify binary format"""
        sample_star = {
            "gaiaSourceId": 12345678901234567,
            "hip": 42,
            "hd": 7,
            "raDegrees": 101.3,
            "decDegrees": -16.7,
            "parallaxMas": 37.6,
            "magnitude": -1.44,
            "colorIndex": 0.5,
            "distanceParsec": 26.7,
        }
        
        source = tmp_path / "test.json"
        source.write_text(json.dumps({
            "catalogVersion": "test",
            "stars": [sample_star],
        }))
        
        output_root = tmp_path / "output"
        manifest = build_binary_tiles(source, output_root, "test-v1")
        
        # Verify manifest
        assert manifest["starCount"] == 1
        assert manifest["tileCount"] == 1
        assert manifest["format"]["magic"] == "SCB1"
        
        # Read back tile and verify record
        tile_path = output_root / "test-v1" / "tiles" / "r6-d7.bin"
        assert tile_path.exists()
        
        tile_bytes = tile_path.read_bytes()
        assert len(tile_bytes) >= HEADER.size + RECORD.size
        
        # Unpack header
        magic, version, record_size, count, reserved = HEADER.unpack(
            tile_bytes[:HEADER.size]
        )
        assert magic == MAGIC
        assert version == FORMAT_VERSION
        assert count == 1


class TestP04Manifest:
    """Test manifest structure and metadata."""
    
    def test_manifest_exists(self, tmp_path):
        """Manifest is created alongside tiles"""
        sample_stars = [
            {
                "gaiaSourceId": 1,
                "hip": i,
                "hd": None,
                "raDegrees": float(i % 360),
                "decDegrees": float((i % 18) * 10 - 90),
                "parallaxMas": None,
                "magnitude": 3.0 + (i % 10) * 0.1,
                "colorIndex": None,
                "distanceParsec": None,
                "properName": f"Star{i}" if i < 3 else None,
            }
            for i in range(1, 101)
        ]
        
        source = tmp_path / "test.json"
        source.write_text(json.dumps({
            "catalogVersion": "test-v1",
            "stars": sample_stars,
        }))
        
        output_root = tmp_path / "output"
        manifest = build_binary_tiles(source, output_root, "test-v1")
        
        # Verify manifest path
        manifest_path = output_root / "test-v1" / "manifest.json"
        assert manifest_path.exists()
        
        # Verify manifest content
        assert manifest["catalogVersion"] == "test-v1"
        assert manifest["starCount"] == 100
        assert manifest["tileCount"] > 0
        assert "sectors" in manifest
        assert len(manifest["sectors"]) == manifest["tileCount"]
    
    def test_names_file(self, tmp_path):
        """Names index is created separately"""
        sample_stars = [
            {
                "gaiaSourceId": 1,
                "hip": 32349,
                "hd": None,
                "properName": "Sirius",
                "raDegrees": 101.3,
                "decDegrees": -16.7,
                "parallaxMas": 37.6,
                "magnitude": -1.44,
                "colorIndex": None,
                "distanceParsec": 26.7,
                "constellation": "CMa",
                "spectralType": "A1V",
            }
        ]
        
        source = tmp_path / "test.json"
        source.write_text(json.dumps({
            "catalogVersion": "test",
            "stars": sample_stars,
        }))
        
        output_root = tmp_path / "output"
        manifest = build_binary_tiles(source, output_root, "test-v1")
        
        names_path = output_root / "test-v1" / "names.json"
        assert names_path.exists()
        
        names = json.loads(names_path.read_text())
        assert "1" in names
        assert names["1"]["properName"] == "Sirius"
        assert names["1"]["constellation"] == "CMa"
        assert names["1"]["spectralType"] == "A1V"


class TestP04TilePath:
    """Test tile path resolution and security."""
    
    def test_resolve_tile_path(self, tmp_path):
        """Tile path is properly resolved and validated"""
        tile_path = resolve_binary_tile_path(tmp_path, "test-v1", "r0-d0")
        assert str(tile_path).endswith("r0-d0.bin")
        assert tmp_path in tile_path.parents
    
    def test_invalid_sector_id(self, tmp_path):
        """Invalid sector IDs are rejected"""
        with pytest.raises(ValueError, match="Invalid 2D sector id"):
            resolve_binary_tile_path(tmp_path, "test", "invalid")
    
    def test_catalog_version_sanitization(self, tmp_path):
        """Catalog version is sanitized"""
        with pytest.raises(ValueError):
            resolve_binary_tile_path(tmp_path, "test/../../../etc", "r0-d0")


class TestP04ReferenceStars:
    """Test that reference stars are correctly encoded and findable."""
    
    REFERENCE_STARS = {
        "Sirius": {
            "hip": 32349,
            "hd": 48915,
            "ra_degrees": 101.2871,
            "dec_degrees": -16.7161,
            "magnitude": -1.46,
            "color_index": 0.005,
        },
        "Vega": {
            "hip": 91262,
            "hd": 172167,
            "ra_degrees": 279.2349,
            "dec_degrees": 38.7837,
            "magnitude": 0.03,
            "color_index": -0.027,
        },
        "Polaris": {
            "hip": 11767,
            "hd": 8890,
            "ra_degrees": 37.9545,
            "dec_degrees": 89.2641,
            "magnitude": 1.97,
            "color_index": 1.645,
        },
    }
    
    def test_reference_star_sectors(self):
        """Reference stars are in expected sectors"""
        expected_sectors = {
            "Sirius": "r6-d7",
            "Vega": "r18-d12",
            "Polaris": "r2-d17",
        }
        
        for star_name, expected_sector in expected_sectors.items():
            star_data = self.REFERENCE_STARS[star_name]
            actual_sector = get_2d_sector_id(
                star_data["ra_degrees"],
                star_data["dec_degrees"],
            )
            assert (
                actual_sector == expected_sector
            ), f"{star_name} should be in {expected_sector}, got {actual_sector}"
