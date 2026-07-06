"""
P0.8 - 3D Coordinate System and Mathematics

Converts astronomical coordinates (J2000 ICRS) to 3D Cartesian space
for Voyage rendering.
"""

import math
from dataclasses import dataclass
from typing import Tuple

import numpy as np


@dataclass
class VoyageCoordinate:
    """3D Cartesian position in parsecs"""
    x: float  # Right (toward RA=0°)
    y: float  # Up (toward North Galactic Pole)
    z: float  # Forward (away from observer)
    
    def distance_from_origin(self) -> float:
        """Distance from Sol (origin) in parsecs"""
        return math.sqrt(self.x**2 + self.y**2 + self.z**2)
    
    def to_tuple(self) -> Tuple[float, float, float]:
        """Return as (x, y, z) tuple"""
        return (self.x, self.y, self.z)
    
    def to_array(self) -> np.ndarray:
        """Return as numpy array for GPU buffer"""
        return np.array([self.x, self.y, self.z], dtype=np.float32)


@dataclass
class AstronomicalCoordinate:
    """J2000 ICRS astronomical coordinates"""
    ra_degrees: float     # Right ascension (0-360)
    dec_degrees: float    # Declination (-90 to +90)
    distance_pc: float    # Distance in parsecs (> 0)
    
    def to_radians(self) -> Tuple[float, float]:
        """Convert RA/Dec to radians"""
        ra_rad = math.radians(self.ra_degrees)
        dec_rad = math.radians(self.dec_degrees)
        return ra_rad, dec_rad


class CoordinateTransform:
    """Convert between astronomical and Cartesian coordinates"""
    
    @staticmethod
    def astro_to_cartesian(coord: AstronomicalCoordinate) -> VoyageCoordinate:
        """
        Convert J2000 ICRS to 3D Cartesian coordinates.
        
        Standard astronomical convention:
        - X axis: toward RA=0°, Dec=0° (vernal equinox direction)
        - Y axis: toward North Galactic Pole (Dec=+90°)
        - Z axis: completes right-handed system (RA=90°, Dec=0°)
        
        Formulas:
            X = distance * cos(dec) * cos(ra)
            Y = distance * sin(dec)
            Z = distance * cos(dec) * sin(ra)
        
        Args:
            coord: Astronomical coordinate with RA, Dec, distance
            
        Returns:
            VoyageCoordinate in 3D Cartesian space
            
        Raises:
            ValueError: if distance <= 0 or coordinates invalid
        """
        if coord.distance_pc <= 0:
            raise ValueError(f"Distance must be > 0, got {coord.distance_pc}")
        if not (0 <= coord.ra_degrees < 360):
            raise ValueError(f"RA must be [0, 360), got {coord.ra_degrees}")
        if not (-90 <= coord.dec_degrees <= 90):
            raise ValueError(f"Dec must be [-90, 90], got {coord.dec_degrees}")
        
        ra_rad, dec_rad = coord.to_radians()
        
        # Calculate Cartesian coordinates
        cos_dec = math.cos(dec_rad)
        x = coord.distance_pc * cos_dec * math.cos(ra_rad)
        y = coord.distance_pc * math.sin(dec_rad)
        z = coord.distance_pc * cos_dec * math.sin(ra_rad)
        
        return VoyageCoordinate(x=x, y=y, z=z)
    
    @staticmethod
    def cartesian_to_astro(coord: VoyageCoordinate) -> AstronomicalCoordinate:
        """
        Convert 3D Cartesian back to J2000 ICRS coordinates.
        
        Inverse formulas:
            distance = sqrt(x² + y² + z²)
            dec = atan2(y, sqrt(x² + z²))
            ra = atan2(z, x)
        
        Args:
            coord: VoyageCoordinate in 3D space
            
        Returns:
            AstronomicalCoordinate with RA, Dec, distance
        """
        distance = coord.distance_from_origin()
        
        if distance < 1e-6:  # At origin or very close
            return AstronomicalCoordinate(
                ra_degrees=0,
                dec_degrees=0,
                distance_pc=0
            )
        
        # Calculate declination
        xy_distance = math.sqrt(coord.x**2 + coord.z**2)
        dec_rad = math.atan2(coord.y, xy_distance)
        dec_degrees = math.degrees(dec_rad)
        
        # Calculate RA
        ra_rad = math.atan2(coord.z, coord.x)
        ra_degrees = math.degrees(ra_rad)
        
        # Normalize RA to [0, 360)
        if ra_degrees < 0:
            ra_degrees += 360
        
        return AstronomicalCoordinate(
            ra_degrees=ra_degrees,
            dec_degrees=dec_degrees,
            distance_pc=distance
        )


class CameraTarget:
    """Represents camera targeting and movement state"""
    
    def __init__(self, position: VoyageCoordinate, look_at: VoyageCoordinate):
        """
        Initialize camera target.
        
        Args:
            position: Camera position in 3D space
            look_at: Point camera is looking at
        """
        self.position = position
        self.look_at = look_at
        self.distance_to_target = self._distance_to_target()
    
    def _distance_to_target(self) -> float:
        """Distance from camera to look-at point"""
        dx = self.look_at.x - self.position.x
        dy = self.look_at.y - self.position.y
        dz = self.look_at.z - self.position.z
        return math.sqrt(dx**2 + dy**2 + dz**2)
    
    def move_toward_target(self, fraction: float) -> "CameraTarget":
        """
        Move camera toward look-at point by fraction of distance.
        
        Args:
            fraction: 0-1, where 0.1 = move 10% closer
            
        Returns:
            New CameraTarget with updated position
        """
        if fraction < 0 or fraction > 1:
            raise ValueError("Fraction must be 0-1")
        
        # Interpolate position
        new_x = self.position.x + (self.look_at.x - self.position.x) * fraction
        new_y = self.position.y + (self.look_at.y - self.position.y) * fraction
        new_z = self.position.z + (self.look_at.z - self.position.z) * fraction
        
        new_position = VoyageCoordinate(x=new_x, y=new_y, z=new_z)
        return CameraTarget(new_position, self.look_at)


class LODCalculator:
    """Determines level-of-detail based on distance and view angle"""
    
    # LOD thresholds in parsecs
    LOD_DETAIL = 2.0      # < 2 pc: full star model
    LOD_NEAR = 10.0       # < 10 pc: billboard/cone
    LOD_MEDIUM = 100.0    # < 100 pc: glowing point
    LOD_FAR = 500.0       # < 500 pc: dim point
    
    @staticmethod
    def get_lod_level(star_pos: VoyageCoordinate, 
                     camera_pos: VoyageCoordinate) -> str:
        """
        Determine LOD level for star based on distance from camera.
        
        Args:
            star_pos: Star position
            camera_pos: Camera position
            
        Returns:
            LOD level: "detail", "near", "medium", "far", or "skip"
        """
        dx = star_pos.x - camera_pos.x
        dy = star_pos.y - camera_pos.y
        dz = star_pos.z - camera_pos.z
        distance = math.sqrt(dx**2 + dy**2 + dz**2)
        
        if distance < LODCalculator.LOD_DETAIL:
            return "detail"
        elif distance < LODCalculator.LOD_NEAR:
            return "near"
        elif distance < LODCalculator.LOD_MEDIUM:
            return "medium"
        elif distance < LODCalculator.LOD_FAR:
            return "far"
        else:
            return "skip"
    
    @staticmethod
    def get_star_size(magnitude: float, lod_level: str) -> float:
        """
        Calculate display size for star based on magnitude and LOD.
        
        Apparent magnitude formula (standard magnitude scale):
            m = -2.5 * log10(brightness)
        
        Inverse for relative sizes:
            size ∝ 10^(-magnitude / 2.5)
        
        Args:
            magnitude: Star's absolute magnitude
            lod_level: LOD level ("detail", "near", etc.)
            
        Returns:
            Display size in pixels (for rendering)
        """
        # Base size depends on LOD level
        lod_sizes = {
            "detail": 12,
            "near": 6,
            "medium": 3,
            "far": 1.5,
            "skip": 0,
        }
        
        base_size = lod_sizes.get(lod_level, 1)
        if base_size == 0:
            return 0
        
        # Scale by magnitude
        # Negative magnitude (bright) = larger
        # Positive magnitude (dim) = smaller
        size_factor = 10.0 ** (-magnitude / 2.5)
        size = base_size * size_factor
        
        # Clamp to reasonable range
        min_size = 0.5 if lod_level != "skip" else 0
        max_size = 16.0
        
        return max(min_size, min(max_size, size))


class SectorCulling:
    """Determines which 2D binary sectors are visible from 3D camera"""
    
    @staticmethod
    def get_visible_sectors(camera_pos: VoyageCoordinate,
                           view_distance: float) -> list:
        """
        Determine which 2D RA/Dec sectors are visible from camera.
        
        Converts camera 3D position to RA/Dec sphere and calculates
        which sectors could contain stars within view distance.
        
        Args:
            camera_pos: Camera position in 3D
            view_distance: Maximum distance to render (parsecs)
            
        Returns:
            List of sector IDs like ["r6-d7", "r7-d7", ...]
        """
        # Convert camera position to astronomical coordinates
        camera_astro = CoordinateTransform.cartesian_to_astro(camera_pos)
        
        # Sectors are 15° RA × 10° Dec
        sectors = []
        
        # Calculate which sectors overlap view distance sphere
        for ra_index in range(24):  # 24 sectors in RA (360/15)
            for dec_index in range(18):  # 18 sectors in Dec (180/10)
                sector_id = f"r{ra_index}-d{dec_index}"
                
                # Quick check: sector center within view
                sector_ra = ra_index * 15 + 7.5
                sector_dec = dec_index * 10 - 85  # Dec goes -90 to +90
                
                # Calculate angular distance
                sector_coord = AstronomicalCoordinate(
                    ra_degrees=sector_ra,
                    dec_degrees=sector_dec,
                    distance_pc=camera_astro.distance_pc or 100  # Use camera distance
                )
                sector_pos = CoordinateTransform.astro_to_cartesian(sector_coord)
                
                # Check if within view
                dx = sector_pos.x - camera_pos.x
                dy = sector_pos.y - camera_pos.y
                dz = sector_pos.z - camera_pos.z
                distance = math.sqrt(dx**2 + dy**2 + dz**2)
                
                if distance < view_distance * 1.5:  # 1.5x buffer
                    sectors.append(sector_id)
        
        return sectors
