"""
P0.8 - 3D Coordinate System Tests

Validates astronomical to Cartesian coordinate conversion,
LOD calculations, and camera targeting.
"""

import pytest
import math
from backend.voyage_coordinates import (
    VoyageCoordinate,
    AstronomicalCoordinate,
    CoordinateTransform,
    CameraTarget,
    LODCalculator,
    SectorCulling,
)


class TestAstronomicalCoordinate:
    """Test astronomical coordinate parsing"""
    
    def test_valid_coordinates(self):
        """Create valid coordinates"""
        coord = AstronomicalCoordinate(
            ra_degrees=180,
            dec_degrees=0,
            distance_pc=10
        )
        assert coord.ra_degrees == 180
        assert coord.dec_degrees == 0
        assert coord.distance_pc == 10
    
    def test_to_radians(self):
        """Convert degrees to radians"""
        coord = AstronomicalCoordinate(
            ra_degrees=90,
            dec_degrees=0,
            distance_pc=1
        )
        ra_rad, dec_rad = coord.to_radians()
        assert abs(ra_rad - math.pi/2) < 1e-6
        assert abs(dec_rad - 0) < 1e-6


class TestCoordinateTransformAccuracy:
    """Test J2000 ICRS to Cartesian conversion"""
    
    def test_vernal_equinox_point(self):
        """RA=0, Dec=0 should map to positive X axis"""
        coord = AstronomicalCoordinate(
            ra_degrees=0,
            dec_degrees=0,
            distance_pc=100
        )
        
        cartesian = CoordinateTransform.astro_to_cartesian(coord)
        
        # Should be on positive X axis
        assert abs(cartesian.x - 100) < 1e-6
        assert abs(cartesian.y - 0) < 1e-6
        assert abs(cartesian.z - 0) < 1e-6
    
    def test_north_galactic_pole(self):
        """RA=any, Dec=+90 should map to positive Y axis"""
        coord = AstronomicalCoordinate(
            ra_degrees=45,  # RA doesn't matter at pole
            dec_degrees=90,
            distance_pc=50
        )
        
        cartesian = CoordinateTransform.astro_to_cartesian(coord)
        
        # Should be on positive Y axis
        assert abs(cartesian.x - 0) < 1e-6
        assert abs(cartesian.y - 50) < 1e-6
        assert abs(cartesian.z - 0) < 1e-6
    
    def test_south_galactic_pole(self):
        """RA=any, Dec=-90 should map to negative Y axis"""
        coord = AstronomicalCoordinate(
            ra_degrees=0,
            dec_degrees=-90,
            distance_pc=75
        )
        
        cartesian = CoordinateTransform.astro_to_cartesian(coord)
        
        # Should be on negative Y axis
        assert abs(cartesian.x - 0) < 1e-6
        assert abs(cartesian.y - (-75)) < 1e-6
        assert abs(cartesian.z - 0) < 1e-6
    
    def test_ra_90_dec_0(self):
        """RA=90, Dec=0 should map to positive Z axis"""
        coord = AstronomicalCoordinate(
            ra_degrees=90,
            dec_degrees=0,
            distance_pc=200
        )
        
        cartesian = CoordinateTransform.astro_to_cartesian(coord)
        
        # Should be on positive Z axis
        assert abs(cartesian.x - 0) < 1e-6
        assert abs(cartesian.y - 0) < 1e-6
        assert abs(cartesian.z - 200) < 1e-6
    
    def test_sirius_reference(self):
        """Sirius: RA=101.29°, Dec=-16.71°, distance=2.64 pc"""
        sirius = AstronomicalCoordinate(
            ra_degrees=101.29,
            dec_degrees=-16.71,
            distance_pc=2.64
        )
        
        cartesian = CoordinateTransform.astro_to_cartesian(sirius)
        
        # Verify distance is preserved
        distance = cartesian.distance_from_origin()
        assert abs(distance - 2.64) < 0.01  # Within 0.01 pc
        
        # Verify coordinates are in reasonable range
        assert abs(cartesian.x) < 3
        assert abs(cartesian.y) < 3
        assert abs(cartesian.z) < 3


class TestCoordinateTransformInverse:
    """Test round-trip coordinate conversion"""
    
    def test_round_trip_conversion(self):
        """astro -> cartesian -> astro should preserve values"""
        original = AstronomicalCoordinate(
            ra_degrees=135.5,
            dec_degrees=25.3,
            distance_pc=50.7
        )
        
        # Convert to cartesian and back
        cartesian = CoordinateTransform.astro_to_cartesian(original)
        recovered = CoordinateTransform.cartesian_to_astro(cartesian)
        
        # Check all values match
        assert abs(recovered.ra_degrees - original.ra_degrees) < 0.001
        assert abs(recovered.dec_degrees - original.dec_degrees) < 0.001
        assert abs(recovered.distance_pc - original.distance_pc) < 0.001
    
    def test_round_trip_at_origin(self):
        """Star very close to origin (Sol)"""
        original = AstronomicalCoordinate(
            ra_degrees=0,
            dec_degrees=0,
            distance_pc=0.001
        )
        
        cartesian = CoordinateTransform.astro_to_cartesian(original)
        recovered = CoordinateTransform.cartesian_to_astro(cartesian)
        
        assert abs(recovered.distance_pc - original.distance_pc) < 1e-6


class TestInvalidCoordinates:
    """Test error handling for invalid coordinates"""
    
    def test_negative_distance_rejected(self):
        """Distance must be positive"""
        coord = AstronomicalCoordinate(
            ra_degrees=0,
            dec_degrees=0,
            distance_pc=-10
        )
        
        with pytest.raises(ValueError):
            CoordinateTransform.astro_to_cartesian(coord)
    
    def test_zero_distance_rejected(self):
        """Distance must be > 0"""
        coord = AstronomicalCoordinate(
            ra_degrees=0,
            dec_degrees=0,
            distance_pc=0
        )
        
        with pytest.raises(ValueError):
            CoordinateTransform.astro_to_cartesian(coord)
    
    def test_ra_out_of_range_high(self):
        """RA must be [0, 360)"""
        coord = AstronomicalCoordinate(
            ra_degrees=360.5,
            dec_degrees=0,
            distance_pc=10
        )
        
        with pytest.raises(ValueError):
            CoordinateTransform.astro_to_cartesian(coord)
    
    def test_dec_out_of_range_high(self):
        """Dec must be [-90, +90]"""
        coord = AstronomicalCoordinate(
            ra_degrees=0,
            dec_degrees=91,
            distance_pc=10
        )
        
        with pytest.raises(ValueError):
            CoordinateTransform.astro_to_cartesian(coord)


class TestVoyageCoordinate:
    """Test 3D coordinate utility functions"""
    
    def test_distance_from_origin(self):
        """Calculate distance to Sol"""
        coord = VoyageCoordinate(x=3, y=4, z=0)
        
        # 3-4-5 right triangle
        distance = coord.distance_from_origin()
        assert abs(distance - 5) < 1e-6
    
    def test_to_tuple(self):
        """Convert to tuple"""
        coord = VoyageCoordinate(x=1, y=2, z=3)
        
        result = coord.to_tuple()
        assert result == (1, 2, 3)
    
    def test_to_array(self):
        """Convert to numpy array"""
        coord = VoyageCoordinate(x=1.5, y=2.5, z=3.5)
        
        arr = coord.to_array()
        assert arr.dtype.name == 'float32'
        assert len(arr) == 3
        assert abs(arr[0] - 1.5) < 1e-6


class TestCameraTarget:
    """Test camera movement and targeting"""
    
    def test_create_target(self):
        """Create camera target"""
        position = VoyageCoordinate(x=10, y=0, z=0)
        look_at = VoyageCoordinate(x=20, y=0, z=0)
        
        target = CameraTarget(position, look_at)
        
        assert target.position == position
        assert target.look_at == look_at
        assert abs(target.distance_to_target - 10) < 1e-6
    
    def test_move_toward_target(self):
        """Move camera toward target"""
        position = VoyageCoordinate(x=0, y=0, z=0)
        look_at = VoyageCoordinate(x=100, y=0, z=0)
        
        target = CameraTarget(position, look_at)
        
        # Move 50% closer
        new_target = target.move_toward_target(0.5)
        
        # Should be at x=50
        assert abs(new_target.position.x - 50) < 1e-6
        assert abs(new_target.position.y - 0) < 1e-6
        assert abs(new_target.position.z - 0) < 1e-6


class TestLODCalculator:
    """Test level-of-detail calculations"""
    
    def test_lod_detail_threshold(self):
        """Stars < 2 pc get detail LOD"""
        star_pos = VoyageCoordinate(x=1, y=0, z=0)
        camera_pos = VoyageCoordinate(x=0, y=0, z=0)
        
        lod = LODCalculator.get_lod_level(star_pos, camera_pos)
        assert lod == "detail"
    
    def test_lod_near_threshold(self):
        """Stars 2-10 pc get near LOD"""
        star_pos = VoyageCoordinate(x=5, y=0, z=0)
        camera_pos = VoyageCoordinate(x=0, y=0, z=0)
        
        lod = LODCalculator.get_lod_level(star_pos, camera_pos)
        assert lod == "near"
    
    def test_lod_medium_threshold(self):
        """Stars 10-100 pc get medium LOD"""
        star_pos = VoyageCoordinate(x=50, y=0, z=0)
        camera_pos = VoyageCoordinate(x=0, y=0, z=0)
        
        lod = LODCalculator.get_lod_level(star_pos, camera_pos)
        assert lod == "medium"
    
    def test_lod_far_threshold(self):
        """Stars 100-500 pc get far LOD"""
        star_pos = VoyageCoordinate(x=200, y=0, z=0)
        camera_pos = VoyageCoordinate(x=0, y=0, z=0)
        
        lod = LODCalculator.get_lod_level(star_pos, camera_pos)
        assert lod == "far"
    
    def test_lod_skip_threshold(self):
        """Stars > 500 pc are skipped"""
        star_pos = VoyageCoordinate(x=1000, y=0, z=0)
        camera_pos = VoyageCoordinate(x=0, y=0, z=0)
        
        lod = LODCalculator.get_lod_level(star_pos, camera_pos)
        assert lod == "skip"
    
    def test_star_size_bright_star(self):
        """Bright star (negative magnitude) larger"""
        size_bright = LODCalculator.get_star_size(-1.46, "medium")  # Sirius
        size_dim = LODCalculator.get_star_size(5, "medium")
        
        assert size_bright > size_dim
    
    def test_star_size_zero_lod_skip(self):
        """LOD skip returns size 0"""
        size = LODCalculator.get_star_size(0, "skip")
        assert size == 0
    
    def test_star_size_scales_with_magnitude(self):
        """Magnitude scale follows astronomical convention"""
        # Magnitude difference of 2.5 = 10x brightness = 3.16x size
        size_mag0 = LODCalculator.get_star_size(0, "far")
        size_mag2_5 = LODCalculator.get_star_size(2.5, "far")
        
        # 10^(-2.5 / 2.5) = 10^(-1) = 0.1
        # But clamped to min 0.5, so ratio won't follow pure formula
        # Just verify that brighter star (lower magnitude) is larger
        assert size_mag0 > size_mag2_5


class TestSectorCulling:
    """Test visibility culling for 2D sectors"""
    
    def test_sectors_at_origin(self):
        """Camera at Sol (origin) should see nearby sectors"""
        camera_pos = VoyageCoordinate(x=0, y=0, z=0)
        
        sectors = SectorCulling.get_visible_sectors(camera_pos, 200)
        
        # Should return list of sector IDs
        assert isinstance(sectors, list)
        assert len(sectors) > 0
        assert all("r" in s and "d" in s for s in sectors)
    
    def test_sector_format(self):
        """Sectors have correct format r{0-23}-d{0-17}"""
        camera_pos = VoyageCoordinate(x=0, y=0, z=0)
        
        sectors = SectorCulling.get_visible_sectors(camera_pos, 500)
        
        for sector in sectors:
            parts = sector.split("-")
            assert len(parts) == 2
            assert parts[0].startswith("r")
            assert parts[1].startswith("d")
            
            r_idx = int(parts[0][1:])
            d_idx = int(parts[1][1:])
            
            assert 0 <= r_idx < 24
            assert 0 <= d_idx < 18
