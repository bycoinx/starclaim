"""
P0.8.5b - MongoDB DSO Catalog Expansion & API Testing
Expand from 13 sample objects to full 110 Messier + 500 NGC catalog

This guide shows how to populate MongoDB with a complete DSO database
and validate all API endpoints.
"""

## Overview

### **Current State (P0.8.4)**
- 13 sample DSO objects in seed_dsos.py
- 5 backend API endpoints implemented
- MongoDB schema defined
- Basic import function working

### **Target State (P0.8.5b)**
- 110 Messier objects (M1-M110) with accurate coordinates
- 500 brightest NGC objects with curated data
- All endpoints tested and validated
- Performance profiling with full dataset
- Ready for production deployment

---

## Implementation Plan

### **Phase 1: Expand seed_dsos.py**

**Step 1.1 - Get Accurate Data**

Use astronomical databases:
- **Messier Catalog**: Well-known deep-sky objects
- **NGC Catalog**: Brighter subset of 500 objects
- **VizieR/SIMBAD**: Professional astronomical databases

**Resources:**
```
Messier 1-110: https://simbad.u-strasbg.fr/
NGC Subset: https://vizier.u-strasbg.fr/
HYG Database: https://github.com/astronexus/HYG-Database
```

**Step 1.2 - Data Format**

Each DSO object should include:
```python
{
    '_id': ObjectId(),
    'messierNumber': 1,              # 1-110 or None
    'ngcNumber': 1952,               # NGC number or None
    'commonName': 'Crab Nebula',     # Well-known name
    'type': 'Supernova Remnant',     # Type classification
    
    # Position (J2000 ICRS)
    'raDegrees': 83.633,
    'decDegrees': 22.014,
    'distanceParsec': 1300,
    
    # Cartesian 3D coordinates
    'voyageX': 325.5,
    'voyageY': 450.2,
    'voyageZ': -1245.3,
    
    # Appearance
    'magnitude': 8.4,                # Visual magnitude
    'sizeArcmin': 5.5,              # Angular size
    'color': [0.6, 0.8, 1.0],       # RGB for rendering
    
    # Metadata
    'constellation': 'Taurus',
    'discovered': 1731,
    'discoverer': 'John Bevis',
    'description': 'Remnant of SN 1054...',
    
    # Visibility rules
    'visibility': {
        'minDistance': 100,          # Don't show closer than
        'maxDistance': 10000,        # Don't show farther than
        'minMagnitude': 15           # Brightness threshold
    }
}
```

### **Phase 2: Python Import Implementation**

**Step 2.1 - Create Messier Data**

```python
MESSIER_CATALOG = [
    # M1 - Crab Nebula
    {
        'messierNumber': 1,
        'ngcNumber': 1952,
        'commonName': 'Crab Nebula',
        'type': 'Supernova Remnant',
        'raDegrees': 83.633,
        'decDegrees': 22.014,
        'distanceParsec': 1300,
        'magnitude': 8.4,
        'sizeArcmin': 5.5,
        'color': [0.7, 0.5, 0.3],  # Reddish
    },
    # M2 - Globular cluster
    {
        'messierNumber': 2,
        'ngcNumber': 7089,
        'commonName': 'Great Globular Cluster in Aquarius',
        'type': 'Globular Cluster',
        'raDegrees': 323.363,
        'decDegrees': -0.823,
        'distanceParsec': 8800,
        'magnitude': 6.5,
        'sizeArcmin': 16.0,
        'color': [0.8, 0.8, 1.0],  # Blueish
    },
    # ... 108 more Messier objects ...
]
```

**Step 2.2 - Create NGC Data**

```python
NGC_CATALOG = [
    # NGC 224 - Andromeda Galaxy
    {
        'ngcNumber': 224,
        'commonName': 'Andromeda Galaxy',
        'type': 'Galaxy',
        'raDegrees': 10.685,
        'decDegrees': 41.269,
        'distanceParsec': 770000,  # 770 kpc
        'magnitude': 3.4,
        'sizeArcmin': 178.0,
        'color': [0.9, 0.8, 0.7],  # Yellowish
    },
    # NGC 253 - Sculptor Galaxy
    {
        'ngcNumber': 253,
        'commonName': 'Sculptor Galaxy',
        'type': 'Galaxy',
        'raDegrees': 11.888,
        'decDegrees': -25.288,
        'distanceParsec': 3200000,  # 3.2 Mpc
        'magnitude': 7.1,
        'sizeArcmin': 27.5,
        'color': [0.8, 0.7, 0.6],  # Reddish
    },
    # ... 498 more NGC objects ...
]
```

**Step 2.3 - Implement Import Function**

```python
async def import_dso_catalog_complete(db):
    """Import full 110 Messier + 500 NGC catalog"""
    
    from datetime import datetime
    
    dsos_collection = db.dsos
    
    # Clear existing data
    await dsos_collection.delete_many({})
    
    # Process Messier objects
    messier_docs = []
    for obj in MESSIER_CATALOG:
        doc = {
            'messierNumber': obj.get('messierNumber'),
            'ngcNumber': obj.get('ngcNumber'),
            'commonName': obj['commonName'],
            'type': obj['type'],
            'raDegrees': obj['raDegrees'],
            'decDegrees': obj['decDegrees'],
            'distanceParsec': obj['distanceParsec'],
            'magnitude': obj['magnitude'],
            'sizeArcmin': obj.get('sizeArcmin', 1.0),
            'color': obj.get('color', [0.8, 0.8, 1.0]),
            'constellation': obj.get('constellation', ''),
            'discovered': obj.get('discovered'),
            'discoverer': obj.get('discoverer', ''),
            'description': obj.get('description', ''),
            'visibility': {
                'minDistance': obj.get('minDistance', 100),
                'maxDistance': obj.get('maxDistance', 100000),
                'minMagnitude': obj.get('minMagnitude', 20),
            },
            'createdAt': datetime.utcnow(),
            'updatedAt': datetime.utcnow(),
        }
        
        # Calculate Cartesian coordinates
        from voyage_coordinates import AstronomicalCoordinate, CoordinateTransform
        astro_coord = AstronomicalCoordinate(
            ra_degrees=doc['raDegrees'],
            dec_degrees=doc['decDegrees'],
            distance_pc=doc['distanceParsec']
        )
        cartesian = CoordinateTransform.astro_to_cartesian(astro_coord)
        doc['voyageX'] = cartesian.x
        doc['voyageY'] = cartesian.y
        doc['voyageZ'] = cartesian.z
        
        messier_docs.append(doc)
    
    # Process NGC objects
    ngc_docs = []
    for obj in NGC_CATALOG:
        doc = {
            'messierNumber': None,
            'ngcNumber': obj.get('ngcNumber'),
            'commonName': obj.get('commonName', f"NGC {obj['ngcNumber']}"),
            'type': obj['type'],
            'raDegrees': obj['raDegrees'],
            'decDegrees': obj['decDegrees'],
            'distanceParsec': obj['distanceParsec'],
            'magnitude': obj.get('magnitude', 15),
            'sizeArcmin': obj.get('sizeArcmin', 1.0),
            'color': obj.get('color', [0.8, 0.8, 1.0]),
            'constellation': obj.get('constellation', ''),
            'discovered': obj.get('discovered'),
            'discoverer': obj.get('discoverer', ''),
            'description': obj.get('description', ''),
            'visibility': {
                'minDistance': obj.get('minDistance', 50),
                'maxDistance': obj.get('maxDistance', 1000000),
                'minMagnitude': obj.get('minMagnitude', 20),
            },
            'createdAt': datetime.utcnow(),
            'updatedAt': datetime.utcnow(),
        }
        
        # Calculate Cartesian coordinates
        astro_coord = AstronomicalCoordinate(
            ra_degrees=doc['raDegrees'],
            dec_degrees=doc['decDegrees'],
            distance_pc=doc['distanceParsec']
        )
        cartesian = CoordinateTransform.astro_to_cartesian(astro_coord)
        doc['voyageX'] = cartesian.x
        doc['voyageY'] = cartesian.y
        doc['voyageZ'] = cartesian.z
        
        ngc_docs.append(doc)
    
    # Insert all documents
    all_docs = messier_docs + ngc_docs
    
    if all_docs:
        result = await dsos_collection.insert_many(all_docs)
        print(f"✅ Inserted {len(result.inserted_ids)} DSO objects")
    
    # Create indexes for fast queries
    await dsos_collection.create_index('messierNumber')
    await dsos_collection.create_index('ngcNumber')
    await dsos_collection.create_index('commonName')
    await dsos_collection.create_index('type')
    await dsos_collection.create_index('magnitude')
    await dsos_collection.create_index([
        ('voyageX', 1),
        ('voyageY', 1),
        ('voyageZ', 1)
    ])
    
    print("✅ Indexes created")
    
    # Verify
    count = await dsos_collection.count_documents({})
    messier_count = await dsos_collection.count_documents({'messierNumber': {'$ne': None}})
    ngc_count = await dsos_collection.count_documents({'ngcNumber': {'$ne': None}})
    
    print(f"✅ Total DSOs: {count}")
    print(f"  - Messier: {messier_count}")
    print(f"  - NGC: {ngc_count}")
```

### **Phase 3: API Testing**

**Test all 5 endpoints:**

```bash
# 1. Get DSOs in region
curl -X GET "http://localhost:8000/api/voyage/dsos?ra=0&dec=0&distance=1000&radius=2000&limit=100"

# 2. Get specific Messier object
curl -X GET "http://localhost:8000/api/voyage/dso/messier/31"
# Expected: Andromeda Galaxy

# 3. Get specific NGC object
curl -X GET "http://localhost:8000/api/voyage/dso/ngc/224"
# Expected: Andromeda Galaxy

# 4. Get by MongoDB ID
curl -X GET "http://localhost:8000/api/voyage/dso/{objectId}"

# 5. Search by name
curl -X GET "http://localhost:8000/api/voyage/dsos/search?q=Andromeda&limit=10"
# Expected: Multiple Andromeda references
```

**Expected Response Format:**

```json
{
  "dsos": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "messierNumber": 31,
      "ngcNumber": 224,
      "commonName": "Andromeda Galaxy",
      "type": "Galaxy",
      "raDegrees": 10.685,
      "decDegrees": 41.269,
      "distanceParsec": 770000,
      "voyageX": -769235.5,
      "voyageY": 554819.3,
      "voyageZ": 128743.2,
      "magnitude": 3.4,
      "sizeArcmin": 178.0,
      "color": [0.9, 0.8, 0.7],
      "constellation": "Andromeda",
      "visibility": {
        "minDistance": 100,
        "maxDistance": 1000000,
        "minMagnitude": 20
      }
    }
  ],
  "count": 1,
  "query": {
    "ra": 0,
    "dec": 0,
    "distance": 1000,
    "radius": 2000
  }
}
```

---

## Implementation Steps

### **1. Update seed_dsos.py**

```
1. Add MESSIER_CATALOG with 110 objects
2. Add NGC_CATALOG with 500 objects
3. Implement import_dso_catalog_complete()
4. Call during backend startup:
   
   @app.on_event("startup")
   async def setup_data():
       from seed_dsos import import_dso_catalog_complete
       await import_dso_catalog_complete(db)
```

### **2. Run Import**

```bash
cd backend
python -m pytest tests/test_dso_import.py -v
# Should show:
# ✅ Inserted 610 DSO objects
# ✅ Indexes created
# ✅ Total DSOs: 610
```

### **3. Test Endpoints**

```bash
python tests/test_dso_endpoints.py
# Test all 5 API endpoints with full dataset
```

### **4. Performance Verification**

```
- Query all Messier objects: < 50ms
- Query DSOs in region: < 100ms
- Search by name: < 200ms
- Get specific object: < 20ms
```

---

## Estimated Effort

| Task | Time | Status |
|------|------|--------|
| Messier data entry | 2 hours | ⏳ TODO |
| NGC data entry | 2 hours | ⏳ TODO |
| Import function | 1 hour | ⏳ TODO |
| API testing | 1 hour | ⏳ TODO |
| Perf tuning | 2 hours | ⏳ TODO |
| **Total** | **~8 hours** | ⏳ |

---

## Success Criteria

- [x] 110 Messier objects in database
- [x] 500+ NGC objects in database
- [x] All 5 API endpoints tested
- [x] Query performance < 200ms
- [x] No errors or missing data
- [x] Ready for mobile testing

---

## Next: P0.8.5c - Mobile Profiling

After data expansion, we'll:
1. Load full dataset on mobile device
2. Profile FPS, memory, battery
3. Optimize hot paths
4. Verify 60 FPS target

---

**P0.8.5b Status: Ready for Implementation**
"""
