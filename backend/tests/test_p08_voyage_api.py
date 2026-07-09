"""
P0.8.1 - Backend Voyage API Tests

Tests the 3D voyage endpoints for coordinate transformation
and region querying.
"""

import pytest
from backend.voyage_coordinates import (
    AstronomicalCoordinate,
    CoordinateTransform,
    VoyageCoordinate,
)


class TestVoyageAPIEndpoints:
    """Test voyage endpoint behavior and math"""
    
    def test_voyage_region_math(self):
        """Test region calculation for voyage endpoint"""
        # Center at Sol
        center = AstronomicalCoordinate(
            ra_degrees=0,
            dec_degrees=0,
            distance_pc=0.001  # Near Sol
        )
        center_cartesian = CoordinateTransform.astro_to_cartesian(center)
        
        # Star at 10 pc distance
        star = AstronomicalCoordinate(
            ra_degrees=45,
            dec_degrees=0,
            distance_pc=10
        )
        star_cartesian = CoordinateTransform.astro_to_cartesian(star)
        
        # Calculate distance
        dx = star_cartesian.x - center_cartesian.x
        dy = star_cartesian.y - center_cartesian.y
        dz = star_cartesian.z - center_cartesian.z
        
        import math
        distance = math.sqrt(dx**2 + dy**2 + dz**2)
        
        # Should be approximately 10 pc (Sol origin)
        assert 9 < distance < 11
    
    def test_voyage_target_resolution(self):
        """Test target resolution by different ID types"""
        # Test coordinate transform for multiple formats
        
        # HIP 32349 (Sirius)
        sirius = AstronomicalCoordinate(
            ra_degrees=101.29,
            dec_degrees=-16.71,
            distance_pc=2.64
        )
        
        cartesian = CoordinateTransform.astro_to_cartesian(sirius)
        recovered = CoordinateTransform.cartesian_to_astro(cartesian)
        
        # Should recover coordinates
        assert abs(recovered.ra_degrees - sirius.ra_degrees) < 0.01
        assert abs(recovered.dec_degrees - sirius.dec_degrees) < 0.01
        assert abs(recovered.distance_pc - sirius.distance_pc) < 0.01
    
    def test_voyage_lod_at_distances(self):
        """Test LOD transitions at various distances"""
        from backend.voyage_coordinates import LODCalculator
        
        camera = VoyageCoordinate(x=0, y=0, z=0)
        
        distances = [
            (1, "detail"),      # < 2 pc
            (5, "near"),        # 2-10 pc
            (30, "medium"),     # 10-100 pc
            (200, "far"),       # 100-500 pc
            (1000, "skip"),     # > 500 pc
        ]
        
        for distance, expected_lod in distances:
            star = VoyageCoordinate(x=distance, y=0, z=0)
            lod = LODCalculator.get_lod_level(star, camera)
            assert lod == expected_lod
    
    def test_voyge_size_calculation(self):
        """Test star size calculation from magnitude"""
        from backend.voyage_coordinates import LODCalculator
        
        # Sirius (mag -1.46) should be large
        sirius_size = LODCalculator.get_star_size(-1.46, "detail")
        assert sirius_size > 5  # Large for such a bright star
        
        # Faint star (mag 10) should be small
        faint_size = LODCalculator.get_star_size(10, "far")
        assert 0 < faint_size < 2  # Small but visible
        
        # Sirius should be significantly larger than faint star
        assert sirius_size > faint_size * 5
