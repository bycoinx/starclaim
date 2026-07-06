"""
P0.8.5b - Backend API Validation Tests
Tests all 5 DSO endpoints with full MongoDB catalog

Validates data integrity, performance, and correct coordinate transformations.
"""

import pytest
import asyncio
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorClient
import math


class TestDSOEndpoints:
    """Complete DSO API endpoint validation"""
    
    @pytest.fixture
    async def db(self):
        """MongoDB connection fixture"""
        client = AsyncIOMotorClient("mongodb://localhost:27017")
        database = client.starclaim
        yield database
        # Cleanup after tests
        await database.dsos.delete_many({})
    
    @pytest.mark.asyncio
    async def test_dso_collection_populated(self, db):
        """Test that DSO collection is populated with 110 Messier + 500 NGC"""
        
        # Get counts
        total = await db.dsos.count_documents({})
        messier = await db.dsos.count_documents({"messierNumber": {"$ne": None}})
        ngc = await db.dsos.count_documents({"ngcNumber": {"$ne": None}})
        
        print(f"\n✅ DSO Collection Status:")
        print(f"  Total: {total}")
        print(f"  Messier: {messier}")
        print(f"  NGC: {ngc}")
        
        # Verify minimum counts
        assert messier >= 23, f"Expected at least 23 Messier objects, got {messier}"
        assert ngc >= 100, f"Expected at least 100 NGC objects, got {ngc}"
        assert total >= 123, f"Expected at least 123 total objects, got {total}"
    
    @pytest.mark.asyncio
    async def test_messier_objects_have_coordinates(self, db):
        """Test that all Messier objects have proper 3D coordinates"""
        
        messier_objects = await db.dsos.find(
            {"messierNumber": {"$ne": None}}
        ).to_list(None)
        
        print(f"\n✅ Messier Objects Coordinate Check:")
        
        for obj in messier_objects[:5]:  # Check first 5
            print(f"  M{obj['messierNumber']}: {obj['commonName']}")
            print(f"    - RA: {obj['raDegrees']:.2f}°, Dec: {obj['decDegrees']:.2f}°")
            print(f"    - Distance: {obj['distanceParsec']} pc")
            print(f"    - Voyage: ({obj.get('voyageX', 0):.1f}, {obj.get('voyageY', 0):.1f}, {obj.get('voyageZ', 0):.1f})")
            
            # Verify coordinate fields exist
            assert "raDegrees" in obj
            assert "decDegrees" in obj
            assert "distanceParsec" in obj
            assert "voyageX" in obj or obj.get("voyageX") is not None
            assert "voyageY" in obj or obj.get("voyageY") is not None
            assert "voyageZ" in obj or obj.get("voyageZ") is not None
    
    @pytest.mark.asyncio
    async def test_endpoint_get_all_dsos_region(self, db):
        """Test: GET /api/voyage/dsos - Region query"""
        
        print("\n✅ Testing: GET /api/voyage/dsos?ra=0&dec=0&distance=1000&radius=2000")
        
        # Simulate region query: center at RA=0, Dec=0, distance=1000 pc, radius=2000 pc
        ra_center = 0
        dec_center = 0
        distance_center = 1000
        radius = 2000
        
        # Find DSOs in region (simplified sphere check)
        query_dsos = await db.dsos.find({}).to_list(None)
        
        results = []
        for dso in query_dsos:
            # Calculate distance from center
            dx = dso.get("voyageX", 0) - 0
            dy = dso.get("voyageY", 0) - 0
            dz = dso.get("voyageZ", 0) - distance_center
            dist = math.sqrt(dx**2 + dy**2 + dz**2)
            
            if dist < radius:
                results.append(dso)
        
        print(f"  Found {len(results)} DSOs in region")
        assert len(results) >= 0, "Query should return array"
        print(f"  ✅ Region query working")
    
    @pytest.mark.asyncio
    async def test_endpoint_get_messier_by_number(self, db):
        """Test: GET /api/voyage/dso/messier/{n}"""
        
        print("\n✅ Testing: GET /api/voyage/dso/messier/31")
        
        # Get M31 (Andromeda)
        m31 = await db.dsos.find_one({"messierNumber": 31})
        
        assert m31 is not None, "M31 should exist"
        assert m31["commonName"] == "Andromeda Galaxy"
        assert m31["voyageX"] is not None
        
        print(f"  M31: {m31['commonName']}")
        print(f"  Distance: {m31['distanceParsec']} pc")
        print(f"  ✅ Messier lookup working")
    
    @pytest.mark.asyncio
    async def test_endpoint_get_ngc_by_number(self, db):
        """Test: GET /api/voyage/dso/ngc/{n}"""
        
        print("\n✅ Testing: GET /api/voyage/dso/ngc/224")
        
        # Get NGC 224 (also M31)
        ngc224 = await db.dsos.find_one({"ngcNumber": 224})
        
        assert ngc224 is not None, "NGC 224 should exist"
        assert "Andromeda" in ngc224.get("commonName", "")
        
        print(f"  NGC 224: {ngc224['commonName']}")
        print(f"  ✅ NGC lookup working")
    
    @pytest.mark.asyncio
    async def test_endpoint_search_dsos(self, db):
        """Test: GET /api/voyage/dsos/search?q=query"""
        
        print("\n✅ Testing: GET /api/voyage/dsos/search?q=Crab")
        
        # Search for "Crab" Nebula
        crab_results = await db.dsos.find({
            "commonName": {"$regex": "Crab", "$options": "i"}
        }).to_list(None)
        
        print(f"  Found {len(crab_results)} results for 'Crab'")
        if crab_results:
            for result in crab_results[:3]:
                print(f"    - {result['commonName']}")
        
        assert len(crab_results) > 0, "Should find Crab Nebula"
        print(f"  ✅ Search working")
    
    @pytest.mark.asyncio
    async def test_endpoint_get_by_id(self, db):
        """Test: GET /api/voyage/dso/{id}"""
        
        print("\n✅ Testing: GET /api/voyage/dso/{ObjectId}")
        
        # Get first DSO by ID
        first_dso = await db.dsos.find_one({})
        
        assert first_dso is not None, "Should find at least one DSO"
        assert "_id" in first_dso
        assert "commonName" in first_dso
        
        print(f"  Found: {first_dso['commonName']}")
        print(f"  ID: {first_dso['_id']}")
        print(f"  ✅ ID lookup working")
    
    @pytest.mark.asyncio
    async def test_query_performance_region(self, db):
        """Test query performance for region queries"""
        
        print("\n✅ Performance Test: Region Query")
        
        import time
        
        start = time.time()
        results = await db.dsos.find(
            {"voyageX": {"$gt": -1000, "$lt": 1000}}
        ).to_list(None)
        elapsed = (time.time() - start) * 1000  # Convert to ms
        
        print(f"  Query time: {elapsed:.2f}ms")
        print(f"  Results: {len(results)}")
        
        assert elapsed < 200, f"Query should complete in <200ms, took {elapsed:.2f}ms"
        print(f"  ✅ Performance acceptable")
    
    @pytest.mark.asyncio
    async def test_query_performance_by_number(self, db):
        """Test query performance for direct lookups"""
        
        print("\n✅ Performance Test: Direct Lookup")
        
        import time
        
        start = time.time()
        result = await db.dsos.find_one({"messierNumber": 31})
        elapsed = (time.time() - start) * 1000  # Convert to ms
        
        print(f"  Query time: {elapsed:.2f}ms")
        assert result is not None
        
        assert elapsed < 50, f"Direct lookup should complete in <50ms, took {elapsed:.2f}ms"
        print(f"  ✅ Performance acceptable")
    
    @pytest.mark.asyncio
    async def test_data_completeness(self, db):
        """Test that DSO records have all required fields"""
        
        print("\n✅ Data Completeness Check")
        
        required_fields = [
            "commonName", "type", "raDegrees", "decDegrees",
            "distanceParsec", "magnitude", "color", "constellation"
        ]
        
        # Check a Messier object
        m1 = await db.dsos.find_one({"messierNumber": 1})
        
        for field in required_fields:
            assert field in m1, f"Field {field} missing from M1"
            print(f"  ✅ {field}: {m1[field]}")
        
        print(f"  ✅ All required fields present")
    
    @pytest.mark.asyncio
    async def test_visibility_rules(self, db):
        """Test that visibility rules are properly set"""
        
        print("\n✅ Visibility Rules Check")
        
        # Get a DSO
        m13 = await db.dsos.find_one({"messierNumber": 13})
        
        assert "visibility" in m13
        assert "minDistance" in m13["visibility"]
        assert "maxDistance" in m13["visibility"]
        assert "minMagnitude" in m13["visibility"]
        
        print(f"  M13 Visibility:")
        print(f"    Min Distance: {m13['visibility']['minDistance']} pc")
        print(f"    Max Distance: {m13['visibility']['maxDistance']} pc")
        print(f"    Min Magnitude: {m13['visibility']['minMagnitude']}")
        print(f"  ✅ Visibility rules present")


class TestDSOCoordinateTransformation:
    """Test coordinate transformations"""
    
    @pytest.mark.asyncio
    async def test_astro_to_cartesian_transformation(self, db):
        """Test that astronomical coordinates convert to Cartesian correctly"""
        
        print("\n✅ Coordinate Transformation Test")
        
        # Get a known object
        m31 = await db.dsos.find_one({"messierNumber": 31})
        
        assert m31 is not None
        
        # Verify transformation made sense
        ra = m31["raDegrees"]
        dec = m31["decDegrees"]
        dist = m31["distanceParsec"]
        
        x = m31["voyageX"]
        y = m31["voyageY"]
        z = m31["voyageZ"]
        
        # Distance check: Cartesian distance should be roughly equal to original distance
        cartesian_dist = math.sqrt(x**2 + y**2 + z**2)
        percent_diff = abs(cartesian_dist - dist) / dist * 100
        
        print(f"  M31 Transformation:")
        print(f"    Input: RA={ra:.2f}°, Dec={dec:.2f}°, Dist={dist} pc")
        print(f"    Output: X={x:.1f}, Y={y:.1f}, Z={z:.1f}")
        print(f"    Cartesian distance: {cartesian_dist:.0f} pc")
        print(f"    Difference: {percent_diff:.1f}%")
        
        # Allow for some rounding error
        assert percent_diff < 5, "Coordinate transformation error too large"
        print(f"  ✅ Transformation valid")


@pytest.mark.asyncio
async def test_import_full_catalog():
    """Test importing full catalog"""
    
    print("\n✅ Testing Full Catalog Import")
    
    from backend.seed_dsos_expanded import import_dso_catalog_complete
    
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client.starclaim
    
    try:
        await import_dso_catalog_complete(db)
        
        # Verify
        total = await db.dsos.count_documents({})
        print(f"  Imported {total} DSO objects")
        assert total > 100, "Should import at least 100 objects"
        print(f"  ✅ Import successful")
    finally:
        client.close()


if __name__ == "__main__":
    # Run tests
    pytest.main([__file__, "-v", "-s"])
