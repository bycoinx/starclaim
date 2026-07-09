"""
P0.8.4 - DSO (Deep Sky Object) 3D Rendering Layer
Specification & Architecture

Deep Sky Objects (Messier, NGC) rendering in 3D space with adaptive LOD,
selection, and full integration with star field.
"""

## Overview

**Phase Goal:**
Render Messier objects and NGC subset in 3D space with distance-based LOD,
star-like selection UI, and visual hierarchy that doesn't overwhelm star field.

**Scope:**
- 110 Messier objects (all)
- ~500 brightest NGC objects (subset)
- Distance estimates from parallax/spectroscopy
- Billboard rendering for deep objects
- Selection ray casting
- Info panel + warp targeting

---

## Architecture

### Data Flow
```
MongoDB (DSO Catalog)
    ↓
Backend API (/api/voyage/dsos)
    ↓
Mobile Frontend (DSO Manager)
    ↓
LOD System (distance-based)
    ↓
Renderer (Three.js/Babylon)
    ↓
User Selection (ray casting)
    ↓
Info Panel + Actions
```

### Component Stack
```
DSOCatalog (data model)
    ↓
DSOManager (load/cache)
    ↓
DSORender (LOD + rendering)
    ↓
DSOInteraction (selection)
    ↓
DSOInfoPanel (UI display)
```

---

## 1. DSO Data Model (MongoDB)

### Schema
```javascript
{
  _id: ObjectId,
  
  // Identification
  messierNumber: 1,          // M1 (Crab Nebula) or null
  ngcNumber: 1952,           // NGC 1952 (same object as M1)
  commonName: "Crab Nebula",
  
  // Position (J2000 ICRS)
  raDegrees: 83.633,
  decDegrees: 22.014,
  distanceParsec: 1300,      // distance estimate (Parallax/Spectroscopy)
  distanceUncertainty: 0.2,  // percentage
  
  // 3D Cartesian (derived from coordinates)
  voyageX: 325.5,
  voyageY: 450.2,
  voyageZ: -1245.3,
  
  // Visual Properties
  type: "Supernova Remnant",  // Nebula, Galaxy, Star Cluster, etc.
  magnitude: 8.4,
  sizeArcmin: 5.5,            // Angular size on sky
  luminosityL_sun: 50000,     // Solar luminosities
  
  // Rendering
  renderAs: "billboard",      // billboard, point, model
  color: [0.6, 0.8, 1.0],    // RGB
  visibility: {
    minDistance: 100,         // parsecs
    maxDistance: 10000,       // parsecs
    minMagnitude: 15,         // fainter than this = invisible
  },
  
  // Metadata
  discovered: 1758,
  discoverer: "John Bevis",
  constellation: "Taurus",
  
  timestamps: {
    created: ISODate,
    modified: ISODate,
  }
}
```

### Sample Data
```
M1 (Crab Nebula) - Supernova remnant, ~1300 pc
M31 (Andromeda) - Spiral galaxy, ~770 kpc
M51 (Whirlpool) - Spiral galaxy, ~8.4 Mpc
M13 (Great Globular) - Globular cluster, ~8.2 kpc
M57 (Ring Nebula) - Planetary nebula, ~0.65 kpc
```

---

## 2. Backend API Endpoints

### GET /api/voyage/dsos
**Query nearby DSOs**

Query parameters:
- `ra`: Right ascension (degrees)
- `dec`: Declination (degrees)
- `distance`: Camera distance (parsecs)
- `radius`: Search radius (parsecs) - default 2000
- `limit`: Max results - default 50

Response:
```json
{
  "dsos": [
    {
      "id": "...",
      "messierNumber": 1,
      "commonName": "Crab Nebula",
      "voyageX": 325.5,
      "voyageY": 450.2,
      "voyageZ": -1245.3,
      "magnitude": 8.4,
      "type": "Supernova Remnant",
      "distance": 1300,
      "renderAs": "billboard",
      "color": [0.6, 0.8, 1.0],
      "sizeArcmin": 5.5
    },
    ...
  ],
  "count": 12
}
```

### GET /api/voyage/dso/{dso_id}
**Get detailed DSO data**

Returns full record with distance, position, visibility rules.

### GET /api/voyage/dso/messier/{number}
**Get specific Messier object**

E.g., `/api/voyage/dso/messier/51` → M51 (Whirlpool)

### GET /api/voyage/dso/ngc/{number}
**Get specific NGC object**

E.g., `/api/voyage/dso/ngc/224` → NGC 224 (Andromeda)

---

## 3. DSO Manager (JavaScript)

### DSOCatalog Class
```javascript
class DSOCatalog {
  constructor(dsoData) {
    this.dsos = dsoData || [];
    this.messierIndex = {};    // M1 → DSO
    this.ngcIndex = {};        // NGC 224 → DSO
    this.buildIndexes();
  }
  
  // Lookup
  getByMessier(number)         // M1 → DSO
  getByNGC(number)             // NGC 224 → DSO
  getByName(name)              // "Crab" → DSO
  getNearby(x, y, z, radius)   // Sphere search
  getAllVisible(distance)      // Filter by visibility rules
}
```

### DSOManager Class
```javascript
class DSOManager {
  constructor(camera, renderer) {
    this.camera = camera;
    this.renderer = renderer;
    this.catalog = null;
    this.renderCache = new Map();  // DSO ID → render object
    this.visibleDSOs = [];         // Current frame visible list
    this.selectedDSO = null;
    this.lodManager = null;
  }
  
  // Load from backend
  async loadNearby(camera) {
    const response = await fetch('/api/voyage/dsos?...params...');
    this.catalog = new DSOCatalog(response.dsos);
  }
  
  // Rendering
  update(camera, frameTime) {
    // Update visible DSOs based on distance
    this.visibleDSOs = this.catalog.getAllVisible(camera.distance);
    
    // Render each visible DSO
    for (const dso of this.visibleDSOs) {
      this.renderDSO(dso);
    }
  }
  
  // Selection
  selectDSO(screenX, screenY) {
    const ray = this.camera.screenToRay(screenX, screenY);
    const nearest = this.findDSOsNearRay(ray);
    if (nearest) this.selectedDSO = nearest;
  }
}
```

### DSORender Class
```javascript
class DSORender {
  constructor(options) {
    this.lodManager = new DSOLODManager();
    this.renderables = new Map();  // DSO → Three.js object
  }
  
  // Determine LOD based on distance
  getLODLevel(dso, distancePc) {
    if (distancePc < dso.visibility.minDistance) return 'skip';
    if (dso.magnitude > dso.visibility.minMagnitude) return 'skip';
    if (distancePc < 1000) return 'billboard';
    if (distancePc < 5000) return 'point';
    return 'skip';
  }
  
  // Render DSO
  renderDSO(dso, lod) {
    switch (lod) {
      case 'billboard':
        return this.renderBillboard(dso);
      case 'point':
        return this.renderPoint(dso);
      case 'skip':
        return null;
    }
  }
  
  renderBillboard(dso) {
    // Flat quad facing camera with texture
    const size = this.calculateSize(dso);
    const material = new THREE.MeshBasicMaterial({
      color: dso.color,
      transparent: true,
    });
    return new THREE.Sprite(material);
  }
  
  renderPoint(dso) {
    // Single point for distant DSOs
    const material = new THREE.PointsMaterial({
      color: dso.color,
      size: 1,
    });
    return new THREE.Points(new THREE.BufferGeometry(), material);
  }
}
```

---

## 4. DSO LOD System

### LOD Levels
```
Distance    LOD         Rendering               Visible Count
< 100 pc    skip        (too close to render)   N/A
100-500     billboard   Textured quad           All in range
500-2000    billboard   Smaller quad            Top 50 by brightness
2000-5000   point       Single vertex           Top 20
> 5000      skip        Nothing                 N/A
```

### Visibility Rules
- **Distance**: Each DSO has min/max distance range
- **Magnitude**: Fainter objects invisible at great distance
- **Type**: Some types only render when zoomed in (galaxies, nebulae)

### Size Calculation
```javascript
function getDSOScreenSize(dso, distance, viewportHeight) {
  // Angular size to screen pixels
  // sizeArcmin * 60 = arcseconds
  // pixelSize = arcSeconds / (degreesPerPixel * 3600)
  
  const degreesPerPixel = fov / viewportHeight;
  const pixelSize = (dso.sizeArcmin / 60) / (degreesPerPixel * 3600);
  
  // Billboard: 1-64 pixels
  return clamp(pixelSize, 1, 64);
}
```

### Brightness Calculation
```javascript
function getDSOBrightness(dso, distance) {
  // Apparent magnitude decreases with distance
  // Luminosity = L / (4π * d²)
  
  const distanceLy = distance * 3.26156;  // parsecs to light-years
  const inverseSquare = 1 / (distanceLy ** 2);
  
  // Scale to 0-1 opacity
  return clamp(inverseSquare * dso.luminosityL_sun / 10000, 0, 1);
}
```

---

## 5. DSO Selection & Interaction

### Ray Casting
```javascript
class DSOInteraction {
  findDSOsNearRay(ray, maxCount = 5) {
    // For each DSO, calculate distance to ray
    // Sort by distance, return top N
    
    const results = [];
    for (const dso of this.visibleDSOs) {
      const distToRay = this.rayToDSODistance(ray, dso);
      if (distToRay < dso.sizeArcmin * 2) {  // within 2x angular size
        results.push({ dso, distToRay });
      }
    }
    
    results.sort((a, b) => a.distToRay - b.distToRay);
    return results.slice(0, maxCount);
  }
}
```

### Info Panel
```
┌─────────────────────────────┐
│ M51 - Whirlpool Galaxy      │
├─────────────────────────────┤
│ Type:       Spiral Galaxy   │
│ Magnitude:  8.4             │
│ Distance:   8.4 Mpc         │
│ Size:       11' × 7'        │
│ RA/Dec:     202.4°/47.2°    │
│ Const:      Canes Venatici  │
│ Discovered: 1773 (Messier)  │
│                             │
│ [Warp] [Info] [★ Favorite]  │
└─────────────────────────────┘
```

---

## 6. Integration with Stars

### Scene Hierarchy
```
VoyageScene
├── Stars (point cloud, LOD)
├── DSOs (billboards/points, LOD)
├── Background (skybox)
└── UI (reticle, info panel)
```

### Unified Selection
```javascript
// Both stars and DSOs use ray casting
const starsNearRay = starInteraction.findStarsNearRay(ray);
const dsosNearRay = dsoInteraction.findDSOsNearRay(ray);

// Sort all by distance, select closest
const combined = [...starsNearRay, ...dsosNearRay]
  .sort((a, b) => a.distance - b.distance);
const selected = combined[0];
```

### Unified Info Panel
```javascript
// Generic display handles both
if (selected.type === 'star') {
  panel.showStar(selected);
} else if (selected.type === 'dso') {
  panel.showDSO(selected);
}
```

---

## 7. File Structure

```
mobile/src/3d/
├── dso/
│   ├── DSOManager.js           (300 lines)
│   ├── DSOCatalog.js           (200 lines)
│   ├── DSORender.js            (250 lines)
│   ├── DSOInteraction.js       (200 lines)
│   └── DSOLODManager.js        (150 lines)
├── __tests__/
│   └── dso.test.js             (350 lines, 30+ tests)
└── scenes/
    └── VoyageScene.js          (500 lines - NEW, combines stars + DSOs)
```

---

## 8. Implementation Sequence

### Phase 1: Data Model
- [ ] Create DSOCatalog class
- [ ] Create DSOManager class
- [ ] Add backend API endpoints (/api/voyage/dsos)

### Phase 2: Rendering
- [ ] Create DSORender class (billboard + point rendering)
- [ ] Create DSOLODManager
- [ ] Integrate LOD system

### Phase 3: Interaction
- [ ] Create DSOInteraction class (ray casting)
- [ ] Extend StarInfoPanel for DSOs
- [ ] Add unified selection system

### Phase 4: Integration
- [ ] Create VoyageScene (combines stars + DSOs)
- [ ] Unified camera/gesture handling
- [ ] Performance optimization

### Phase 5: Testing
- [ ] Unit tests (30+ test cases)
- [ ] Integration tests with stars
- [ ] Performance profiling

---

## 9. Success Criteria

### Rendering
- [ ] All 110 Messier objects visible at appropriate distance
- [ ] NGC subset (top 500) renders without visual clutter
- [ ] Billboard rendering at < 1 ms per frame
- [ ] Point rendering at < 0.5 ms per frame
- [ ] LOD transitions smooth (no pop-in)

### Selection
- [ ] Ray casting finds DSOs within 2x angular size
- [ ] Info panel renders in < 10 ms
- [ ] Warp targeting works (camera approaches DSO)

### Integration
- [ ] Star + DSO rendering combined at 60 FPS
- [ ] No performance regression vs. star-only rendering
- [ ] Memory usage < 100 MB (all DSO data)

### Quality
- [ ] Messier object positions validated vs. star charts
- [ ] NGC subset brightness/magnitude accurate
- [ ] Color palette visually pleasing and distinct from stars

---

## 10. Data Sources

### Messier Catalog
- Published 1774-1781
- 110 deep sky objects (all to be included)
- Positions: RA/Dec (J2000)
- Distances from NED (NASA Extragalactic Database)

### NGC Catalog
- New General Catalog (1888)
- ~7,840 objects total
- Select top 500 by brightness
- Positions: RA/Dec (J2000)
- Distances from parallax/spectroscopy

### Distances
- Nearby objects (< 1 Mpc): Parallax (Gaia)
- Distant objects: Spectroscopic redshift + Hubble constant

---

## Next Deliverables

1. ✅ DSOCatalog.js + tests
2. ✅ DSOManager.js + tests
3. ✅ DSORender.js (billboard/point rendering)
4. ✅ DSOLODManager.js
5. ✅ DSOInteraction.js (ray casting + selection)
6. ✅ VoyageScene.js (integrated star + DSO rendering)
7. ✅ Backend API endpoints (/api/voyage/dsos)
8. ✅ MongoDB DSO catalog import
9. ✅ Comprehensive test suite (40+ tests)

---

**Status: P0.8.4 SPECIFICATION COMPLETE**
**Next: Implementation Phase 1 (Data Model)**
"""
