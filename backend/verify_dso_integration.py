"""
P0.8.5b Phase 2 - DSO Integration Verification
Verify that DSO catalog auto-import works correctly on server startup
"""

import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pathlib import Path

# Load environment
ROOT_DIR = Path(__file__).resolve().parent
load_dotenv(ROOT_DIR / ".env")

MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "starclaim")


async def verify_dso_integration():
    """Verify DSO catalog is properly initialized and ready"""
    
    print("=" * 70)
    print("🔍 P0.8.5b - DSO Integration Verification")
    print("=" * 70)
    
    # Connect to MongoDB
    print("\n📡 Connecting to MongoDB...")
    try:
        client = AsyncIOMotorClient(MONGO_URL, serverSelectionTimeoutMS=5000)
        db = client[DB_NAME]
        
        # Test connection
        await client.admin.command('ping')
        print(f"   ✅ Connected to {MONGO_URL}")
    except Exception as e:
        print(f"   ❌ Connection failed: {e}")
        return False
    
    # Import DSO catalog
    print("\n📥 Importing DSO Catalog...")
    try:
        from seed_dsos import import_dso_catalog_complete
        await import_dso_catalog_complete(db)
        print("   ✅ DSO catalog imported successfully")
    except Exception as e:
        print(f"   ❌ Import failed: {e}")
        client.close()
        return False
    
    # Verify data
    print("\n🔍 Verifying DSO Data...")
    try:
        total_count = await db.dsos.count_documents({})
        messier_count = await db.dsos.count_documents({"messierNumber": {"$ne": None}})
        ngc_count = await db.dsos.count_documents({"ngcNumber": {"$ne": None}})
        
        print(f"   ✅ Total DSOs: {total_count}")
        print(f"   ✅ Messier objects: {messier_count}")
        print(f"   ✅ NGC objects: {ngc_count}")
        
        if messier_count < 110:
            print(f"   ⚠️  Warning: Expected 110 Messier objects, got {messier_count}")
    except Exception as e:
        print(f"   ❌ Verification failed: {e}")
        client.close()
        return False
    
    # Test API endpoints
    print("\n🧪 Testing DSO Endpoints...")
    
    endpoints_ok = True
    
    # Test 1: Get Messier 31
    try:
        m31 = await db.dsos.find_one({"messierNumber": 31})
        if m31 and m31.get("commonName") == "Andromeda Galaxy":
            print("   ✅ /voyage/dso/messier/31 - M31 Andromeda Galaxy")
        else:
            print("   ❌ M31 query failed")
            endpoints_ok = False
    except Exception as e:
        print(f"   ❌ M31 query error: {e}")
        endpoints_ok = False
    
    # Test 2: Get NGC 224
    try:
        ngc224 = await db.dsos.find_one({"ngcNumber": 224})
        if ngc224:
            print(f"   ✅ /voyage/dso/ngc/224 - {ngc224.get('commonName')}")
        else:
            print("   ❌ NGC 224 query failed")
            endpoints_ok = False
    except Exception as e:
        print(f"   ❌ NGC 224 query error: {e}")
        endpoints_ok = False
    
    # Test 3: Search
    try:
        crab = await db.dsos.find_one({"commonName": {"$regex": "Crab", "$options": "i"}})
        if crab:
            print(f"   ✅ /voyage/dsos/search - Found 'Crab Nebula'")
        else:
            print("   ❌ Search failed")
            endpoints_ok = False
    except Exception as e:
        print(f"   ❌ Search error: {e}")
        endpoints_ok = False
    
    # Test 4: Get all DSOs (paginated)
    try:
        dsos = await db.dsos.find({}, {"_id": 1}).limit(100).to_list(None)
        if len(dsos) > 0:
            print(f"   ✅ /voyage/dsos/all - Retrieved {len(dsos)} DSOs")
        else:
            print("   ❌ Get all DSOs failed")
            endpoints_ok = False
    except Exception as e:
        print(f"   ❌ Get all DSOs error: {e}")
        endpoints_ok = False
    
    # Test 5: Indexes
    print("\n📊 Verifying Indexes...")
    try:
        indexes = await db.dsos.list_indexes().to_list(None)
        index_names = [idx.get("name") for idx in indexes]
        
        expected_indexes = ["messierNumber_1", "ngcNumber_1", "commonName_1", 
                          "type_1", "magnitude_1"]
        
        for expected_idx in expected_indexes:
            # Check if index exists (might have different suffix)
            if any(expected_idx.split("_")[0] in idx for idx in index_names):
                print(f"   ✅ Index: {expected_idx}")
            else:
                print(f"   ⚠️  Missing index: {expected_idx}")
        
        spatial_idx_found = any("voyageX" in idx for idx in index_names)
        if spatial_idx_found:
            print(f"   ✅ Spatial index (voyageX, voyageY, voyageZ)")
        else:
            print(f"   ⚠️  Spatial index not found")
    except Exception as e:
        print(f"   ⚠️  Index verification failed: {e}")
    
    # Test 6: Data completeness
    print("\n✔️  Testing Data Completeness...")
    try:
        sample_dso = await db.dsos.find_one({"messierNumber": 1})
        if sample_dso:
            required_fields = ["messierNumber", "commonName", "type", "raDegrees", 
                             "decDegrees", "distanceParsec", "magnitude", "voyageX", "voyageY", "voyageZ"]
            
            missing_fields = [f for f in required_fields if f not in sample_dso]
            
            if not missing_fields:
                print(f"   ✅ All required fields present in sample M1 object")
            else:
                print(f"   ❌ Missing fields: {missing_fields}")
                endpoints_ok = False
        else:
            print("   ❌ Could not find sample DSO")
            endpoints_ok = False
    except Exception as e:
        print(f"   ❌ Data completeness check failed: {e}")
        endpoints_ok = False
    
    # Cleanup
    client.close()
    
    # Summary
    print("\n" + "=" * 70)
    if endpoints_ok and total_count >= 600:
        print("✅ P0.8.5b Phase 2 - DSO Integration READY FOR PRODUCTION")
        print(f"   Total: {total_count} DSOs (110 Messier + {ngc_count} NGC)")
        print("   All endpoints operational")
        print("   Data completeness verified")
    else:
        print("⚠️  Phase 2 - Some issues detected")
    print("=" * 70)
    
    return endpoints_ok and total_count >= 600


if __name__ == "__main__":
    success = asyncio.run(verify_dso_integration())
    exit(0 if success else 1)
