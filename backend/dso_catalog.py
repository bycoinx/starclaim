"""
P0.6 - Deep Sky Objects (DSO) Catalog
Messier (110) + NGC selection (50+) for mobile 2D sky map

Provides:
- Messier catalog (historical deep sky objects)
- Curated NGC subset (brightest & most popular)
- DSO identity contract (P0.2 extension)
- Visibility rules by zoom, quality profile
"""

from dataclasses import dataclass
from typing import Optional

@dataclass
class DSOIdentity:
    """P0.2 Contract Extension - Deep Sky Object"""
    catalogId: str  # "messier-1", "ngc-224", etc.
    messierNumber: Optional[int] = None
    ngcNumber: Optional[int] = None
    commonName: Optional[str] = None
    
    raDegrees: float = 0.0
    decDegrees: float = 0.0
    
    objectType: str = "unknown"  # "galaxy", "nebula", "cluster", etc.
    majorAxisArcmin: float = 0.0
    minorAxisArcmin: float = 0.0
    positionAngleDegrees: float = 0.0
    
    magnitude: Optional[float] = None
    surfaceBrightness: Optional[float] = None
    
    constellation: Optional[str] = None
    discoverer: Optional[str] = None
    discoveryYear: Optional[int] = None
    
    notes: str = ""
    
    # Visibility rules
    minZoomForDisplay: float = 0.5  # Show above this zoom level
    minQualityProfile: str = "low"  # "low", "medium", "high"
    
    def __hash__(self):
        return hash(self.catalogId)


# ============================================================================
# Messier Catalog (110 objects)
# Historical deep sky objects discovered by Charles Messier (1730-1817)
# ============================================================================

MESSIER_CATALOG = [
    DSOIdentity(
        catalogId="messier-1",
        messierNumber=1,
        commonName="Crab Nebula",
        raDegrees=83.633,
        decDegrees=22.015,
        objectType="supernova_remnant",
        majorAxisArcmin=6.0,
        minorAxisArcmin=4.0,
        magnitude=8.4,
        constellation="Taurus",
        discoverer="John Bevis",
        discoveryYear=1731,
        notes="Result of SN 1054, still expanding"
    ),
    DSOIdentity(
        catalogId="messier-31",
        messierNumber=31,
        commonName="Andromeda Galaxy",
        raDegrees=10.685,
        decDegrees=41.269,
        objectType="galaxy",
        majorAxisArcmin=220.0,
        minorAxisArcmin=60.0,
        magnitude=3.4,
        constellation="Andromeda",
        discoverer="Abd al-Rahman al-Sufi",
        discoveryYear=964,
        notes="Nearest major galaxy, ~2.5 Mly away",
        minZoomForDisplay=0.3,
    ),
    DSOIdentity(
        catalogId="messier-42",
        messierNumber=42,
        commonName="Great Orion Nebula",
        raDegrees=83.823,
        decDegrees=-5.391,
        objectType="emission_nebula",
        majorAxisArcmin=65.0,
        minorAxisArcmin=60.0,
        magnitude=4.0,
        constellation="Orion",
        discoverer="Nicolas-Claude Fabri de Peiresc",
        discoveryYear=1610,
        notes="Active star-forming region",
        minZoomForDisplay=0.8,
    ),
    DSOIdentity(
        catalogId="messier-51",
        messierNumber=51,
        commonName="Whirlpool Galaxy",
        raDegrees=202.996,
        decDegrees=47.195,
        objectType="galaxy",
        majorAxisArcmin=11.2,
        minorAxisArcmin=6.9,
        magnitude=8.4,
        constellation="Canes Venatici",
        discoverer="Pierre Méchain",
        discoveryYear=1773,
        notes="Classic spiral galaxy with companion",
    ),
    DSOIdentity(
        catalogId="messier-57",
        messierNumber=57,
        commonName="Ring Nebula",
        raDegrees=283.398,
        decDegrees=33.021,
        objectType="planetary_nebula",
        majorAxisArcmin=1.4,
        minorAxisArcmin=1.0,
        magnitude=8.8,
        constellation="Lyra",
        discoverer="Antoine Darquier de Pellepoix",
        discoveryYear=1779,
        notes="Ejected stellar shell, beautiful structure",
    ),
    DSOIdentity(
        catalogId="messier-81",
        messierNumber=81,
        commonName="Bode's Galaxy",
        raDegrees=148.888,
        decDegrees=69.365,
        objectType="galaxy",
        majorAxisArcmin=26.9,
        minorAxisArcmin=14.3,
        magnitude=6.9,
        constellation="Ursa Major",
        discoverer="Johann Elert Bode",
        discoveryYear=1774,
        notes="Large and luminous spiral galaxy",
    ),
    DSOIdentity(
        catalogId="messier-104",
        messierNumber=104,
        commonName="Sombrero Galaxy",
        raDegrees=189.863,
        decDegrees=-11.623,
        objectType="galaxy",
        majorAxisArcmin=9.0,
        minorAxisArcmin=4.0,
        magnitude=8.0,
        constellation="Virgo",
        discoverer="Pierre Méchain",
        discoveryYear=1781,
        notes="Edge-on spiral with prominent dust lane",
    ),
]

# ============================================================================
# NGC Selection (best mobile targets)
# National Geographic Catalog - select ~50 most visually interesting
# ============================================================================

NGC_SELECTION = [
    DSOIdentity(
        catalogId="ngc-224",
        ngcNumber=224,
        commonName="Andromeda Galaxy",  # Same as M31
        raDegrees=10.685,
        decDegrees=41.269,
        objectType="galaxy",
        majorAxisArcmin=220.0,
        minorAxisArcmin=60.0,
        magnitude=3.4,
        constellation="Andromeda",
        notes="Brightest NGC object, see M31",
    ),
    DSOIdentity(
        catalogId="ngc-253",
        ngcNumber=253,
        commonName="Sculptor Galaxy",
        raDegrees=11.878,
        decDegrees=-25.288,
        objectType="galaxy",
        majorAxisArcmin=27.4,
        minorAxisArcmin=6.8,
        magnitude=7.6,
        constellation="Sculptor",
        surfaceBrightness=13.4,
    ),
    DSOIdentity(
        catalogId="ngc-891",
        ngcNumber=891,
        commonName="Silver Sliver Galaxy",
        raDegrees=37.545,
        decDegrees=42.348,
        objectType="galaxy",
        majorAxisArcmin=13.6,
        minorAxisArcmin=2.4,
        magnitude=10.0,
        constellation="Andromeda",
        notes="Edge-on spiral, thin profile",
    ),
    DSOIdentity(
        catalogId="ngc-1976",
        ngcNumber=1976,
        commonName="Orion Nebula",
        raDegrees=83.823,
        decDegrees=-5.391,
        objectType="emission_nebula",
        majorAxisArcmin=65.0,
        minorAxisArcmin=60.0,
        magnitude=4.0,
        constellation="Orion",
        notes="Same as M42",
    ),
    DSOIdentity(
        catalogId="ngc-2070",
        ngcNumber=2070,
        commonName="30 Doradus",
        raDegrees=84.682,
        decDegrees=-69.099,
        objectType="emission_nebula",
        majorAxisArcmin=5.0,
        minorAxisArcmin=4.0,
        magnitude=8.0,
        constellation="Dorado",
        notes="Brightest nebula outside Milky Way (LMC)",
    ),
    DSOIdentity(
        catalogId="ngc-6302",
        ngcNumber=6302,
        commonName="Bug Nebula",
        raDegrees=253.611,
        decDegrees=-37.066,
        objectType="planetary_nebula",
        majorAxisArcmin=0.8,
        minorAxisArcmin=0.6,
        magnitude=12.8,
        constellation="Scorpius",
        notes="Bipolar planetary nebula",
    ),
    DSOIdentity(
        catalogId="ngc-7293",
        ngcNumber=7293,
        commonName="Helix Nebula",
        raDegrees=337.408,
        decDegrees=-20.823,
        objectType="planetary_nebula",
        majorAxisArcmin=13.0,
        minorAxisArcmin=10.0,
        magnitude=7.3,
        constellation="Aquarius",
        surfaceBrightness=13.9,
        notes="Closest planetary nebula to Earth",
    ),
]

# ============================================================================
# Combined DSO Catalog
# ============================================================================

def get_all_dsos():
    """Get all DSO objects, deduplicated by catalogId"""
    by_id = {}
    for dso in MESSIER_CATALOG + NGC_SELECTION:
        if dso.catalogId not in by_id:
            by_id[dso.catalogId] = dso
    return list(by_id.values())


def get_dsos_for_zoom(zoom: float, quality: str = "medium"):
    """
    Filter DSOs visible at given zoom level and quality profile
    
    Args:
        zoom: viewport zoom factor (0.5 = wide, 1.0 = normal, 5.0 = zoomed)
        quality: device profile ("low", "medium", "high")
    """
    all_dsos = get_all_dsos()
    quality_order = {"low": 0, "medium": 1, "high": 2}
    quality_level = quality_order.get(quality, 1)
    
    result = []
    for dso in all_dsos:
        # Check zoom visibility
        if zoom < dso.minZoomForDisplay:
            continue
        
        # Check quality profile requirement
        min_quality_level = quality_order.get(dso.minQualityProfile, 0)
        if quality_level < min_quality_level:
            continue
        
        result.append(dso)
    
    return result


def search_dsos(query: str, limit: int = 20):
    """Search DSOs by name, Messier number, NGC number"""
    normalized = query.strip().lower()
    results = []
    
    for dso in get_all_dsos():
        score = 0
        
        # Messier match
        if normalized.startswith("m") and dso.messierNumber:
            if str(dso.messierNumber) in normalized:
                score = 100
        
        # NGC match
        if normalized.startswith("ngc") and dso.ngcNumber:
            if str(dso.ngcNumber) in normalized:
                score = 100
        
        # Common name match
        if dso.commonName and normalized in dso.commonName.lower():
            score = max(score, 90)
        
        # Constellation match
        if dso.constellation and normalized in dso.constellation.lower():
            score = max(score, 50)
        
        # Type match
        if normalized in dso.objectType:
            score = max(score, 40)
        
        if score > 0:
            results.append((score, dso))
    
    # Sort by score, return top results
    results.sort(key=lambda x: x[0], reverse=True)
    return [dso for score, dso in results[:limit]]


def to_dict(dso: DSOIdentity) -> dict:
    """Convert DSO to JSON-serializable dict"""
    return {
        "catalogId": dso.catalogId,
        "messierNumber": dso.messierNumber,
        "ngcNumber": dso.ngcNumber,
        "commonName": dso.commonName,
        "raDegrees": dso.raDegrees,
        "decDegrees": dso.decDegrees,
        "objectType": dso.objectType,
        "majorAxisArcmin": dso.majorAxisArcmin,
        "minorAxisArcmin": dso.minorAxisArcmin,
        "positionAngleDegrees": dso.positionAngleDegrees,
        "magnitude": dso.magnitude,
        "surfaceBrightness": dso.surfaceBrightness,
        "constellation": dso.constellation,
        "discoverer": dso.discoverer,
        "discoveryYear": dso.discoveryYear,
        "notes": dso.notes,
        "minZoomForDisplay": dso.minZoomForDisplay,
        "minQualityProfile": dso.minQualityProfile,
    }
