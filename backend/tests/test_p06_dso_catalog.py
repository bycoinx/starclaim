"""
P0.6 - Deep Sky Object (DSO) Catalog Tests

Validates:
- Messier catalog completeness
- NGC selection quality
- Zoom-based visibility rules
- Search functionality
- DSO identity contract
"""

import pytest
from backend.dso_catalog import (
    DSOIdentity,
    MESSIER_CATALOG,
    NGC_SELECTION,
    get_all_dsos,
    get_dsos_for_zoom,
    search_dsos,
    to_dict,
)


class TestP06DSOIdentity:
    """Test DSO identity contract (P0.2 extension)"""
    
    def test_dso_identity_creation(self):
        """Create DSO identity with minimal fields"""
        dso = DSOIdentity(
            catalogId="messier-1",
            messierNumber=1,
            commonName="Crab Nebula",
            raDegrees=83.633,
            decDegrees=22.015,
            objectType="supernova_remnant",
        )
        
        assert dso.catalogId == "messier-1"
        assert dso.messierNumber == 1
        assert dso.raDegrees == 83.633
    
    def test_dso_defaults(self):
        """DSO should have sensible defaults"""
        dso = DSOIdentity(catalogId="test")
        
        assert dso.raDegrees == 0.0
        assert dso.decDegrees == 0.0
        assert dso.objectType == "unknown"
        assert dso.minZoomForDisplay == 0.5
        assert dso.minQualityProfile == "low"
    
    def test_dso_hashable(self):
        """DSO should be hashable for set/dict operations"""
        dso1 = DSOIdentity(catalogId="m31")
        dso2 = DSOIdentity(catalogId="m31")
        dso_set = {dso1, dso2}
        
        # Both should hash to same value
        assert len(dso_set) == 1


class TestP06MessierCatalog:
    """Test Messier catalog completeness"""
    
    def test_messier_count(self):
        """Should have major Messier objects"""
        assert len(MESSIER_CATALOG) >= 7  # At least reference stars
    
    def test_andromeda_in_catalog(self):
        """M31 (Andromeda) must be present"""
        m31 = next((m for m in MESSIER_CATALOG if m.messierNumber == 31), None)
        assert m31 is not None
        assert m31.commonName == "Andromeda Galaxy"
        assert m31.objectType == "galaxy"
    
    def test_orion_nebula_in_catalog(self):
        """M42 (Orion Nebula) must be present"""
        m42 = next((m for m in MESSIER_CATALOG if m.messierNumber == 42), None)
        assert m42 is not None
        assert m42.objectType == "emission_nebula"
        assert m42.constellation == "Orion"
    
    def test_messier_coordinates_valid(self):
        """All Messier objects should have valid coordinates"""
        for m in MESSIER_CATALOG:
            assert 0 <= m.raDegrees < 360
            assert -90 <= m.decDegrees <= 90


class TestP06NGCSelection:
    """Test NGC selection quality"""
    
    def test_ngc_count(self):
        """Should have curated NGC objects"""
        assert len(NGC_SELECTION) > 0
    
    def test_ngc_coordinates_valid(self):
        """All NGC objects should have valid coordinates"""
        for ngc in NGC_SELECTION:
            assert 0 <= ngc.raDegrees < 360
            assert -90 <= ngc.decDegrees <= 90
    
    def test_no_duplicate_messier_in_ngc(self):
        """NGC shouldn't heavily duplicate Messier"""
        messier_ids = {m.catalogId for m in MESSIER_CATALOG}
        ngc_messier_overlap = sum(
            1 for ngc in NGC_SELECTION 
            if ngc.catalogId in messier_ids
        )
        # Allow some overlap (same object referenced both ways)
        assert ngc_messier_overlap <= len(NGC_SELECTION) * 0.2


class TestP06CatalogMerge:
    """Test merged catalog functionality"""
    
    def test_get_all_dsos_deduplicates(self):
        """get_all_dsos should deduplicate by catalogId"""
        all_dsos = get_all_dsos()
        catalog_ids = [d.catalogId for d in all_dsos]
        
        # Should be no duplicates
        assert len(catalog_ids) == len(set(catalog_ids))
    
    def test_all_dsos_have_required_fields(self):
        """Each DSO should have essential fields"""
        for dso in get_all_dsos():
            assert dso.catalogId
            assert 0 <= dso.raDegrees < 360
            assert -90 <= dso.decDegrees <= 90
            assert dso.objectType


class TestP06ZoomFiltering:
    """Test zoom-level visibility rules"""
    
    def test_zoom_filtering_high(self):
        """At high zoom, should see many DSOs"""
        high_zoom_dsos = get_dsos_for_zoom(zoom=5.0, quality="high")
        low_zoom_dsos = get_dsos_for_zoom(zoom=0.5, quality="high")
        
        # High zoom should reveal small, faint objects
        assert len(high_zoom_dsos) >= len(low_zoom_dsos)
    
    def test_zoom_filtering_quality(self):
        """High quality profile should show more DSOs"""
        high_quality = get_dsos_for_zoom(zoom=1.0, quality="high")
        low_quality = get_dsos_for_zoom(zoom=1.0, quality="low")
        
        # High quality can display more objects
        assert len(high_quality) >= len(low_quality)
    
    def test_andromeda_visible_all_zoom(self):
        """M31 (Andromeda) should always be visible"""
        for zoom in [0.5, 1.0, 2.0, 5.0]:
            dsos = get_dsos_for_zoom(zoom=zoom, quality="high")
            m31_ids = [d.catalogId for d in dsos if d.messierNumber == 31]
            assert len(m31_ids) > 0, f"M31 not found at zoom {zoom}"


class TestP06Search:
    """Test DSO search functionality"""
    
    def test_search_by_messier_number(self):
        """Search 'm31' should find Andromeda"""
        results = search_dsos("m31")
        assert len(results) > 0
        assert any(d.messierNumber == 31 for d in results)
    
    def test_search_by_messier_number_text(self):
        """Search 'messier-51' should find Whirlpool"""
        results = search_dsos("messier-51")
        assert len(results) > 0
        assert any(d.messierNumber == 51 for d in results)
    
    def test_search_by_name(self):
        """Search by common name"""
        results = search_dsos("andromeda")
        assert len(results) > 0
        assert any(d.commonName and "andromeda" in d.commonName.lower() for d in results)
    
    def test_search_by_constellation(self):
        """Search by constellation"""
        results = search_dsos("orion")
        assert len(results) > 0
    
    def test_search_by_type(self):
        """Search by object type"""
        results = search_dsos("galaxy")
        assert len(results) > 0
        assert any(d.objectType == "galaxy" for d in results)
    
    def test_search_limit(self):
        """Search respects result limit"""
        results = search_dsos("cluster", limit=5)
        assert len(results) <= 5


class TestP06ReferenceObjects:
    """Test specific reference DSOs"""
    
    def test_crab_nebula_properties(self):
        """M1 (Crab Nebula) has correct properties"""
        m1 = next((d for d in get_all_dsos() if d.messierNumber == 1), None)
        assert m1 is not None
        assert m1.objectType == "supernova_remnant"
        assert m1.constellation == "Taurus"
        assert m1.magnitude == 8.4
    
    def test_ring_nebula_properties(self):
        """M57 (Ring Nebula) has correct properties"""
        m57 = next((d for d in get_all_dsos() if d.messierNumber == 57), None)
        assert m57 is not None
        assert m57.objectType == "planetary_nebula"
        assert m57.constellation == "Lyra"
    
    def test_sombrero_galaxy_properties(self):
        """M104 (Sombrero) has correct properties"""
        m104 = next((d for d in get_all_dsos() if d.messierNumber == 104), None)
        assert m104 is not None
        assert m104.objectType == "galaxy"
        assert m104.constellation == "Virgo"
        assert m104.magnitude == 8.0


class TestP06Serialization:
    """Test to_dict conversion for JSON"""
    
    def test_to_dict_complete(self):
        """to_dict should include all fields"""
        dso = MESSIER_CATALOG[0]
        dso_dict = to_dict(dso)
        
        assert dso_dict["catalogId"] == dso.catalogId
        assert dso_dict["raDegrees"] == dso.raDegrees
        assert dso_dict["decDegrees"] == dso.decDegrees
        assert dso_dict["objectType"] == dso.objectType
    
    def test_to_dict_serializable(self):
        """to_dict output should be JSON serializable"""
        import json
        
        dso = MESSIER_CATALOG[0]
        dso_dict = to_dict(dso)
        
        # Should not raise
        json_str = json.dumps(dso_dict)
        assert len(json_str) > 0
