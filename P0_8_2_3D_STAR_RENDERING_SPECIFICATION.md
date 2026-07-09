"""
P0.8.2 - 3D Star Rendering and LOD System

Renders stars in 3D space using Three.js/Babylon or custom WebGL.
Integrates LOD system for performance optimization.
"""

# Star Rendering Pipeline
## Input: Binary tiles from P0.4, Voyage coordinates from P0.8.1
## Output: Interactive 3D star field with zoom/pan/selection

# Architecture:
# 1. VoyageScene - Main Three.js scene container
# 2. StarFieldGeometry - Point cloud or instanced mesh for stars
# 3. StarLODManager - Switches between LOD levels
# 4. TileLoader - Streams binary tiles into GPU buffers
# 5. StarInteraction - Raycasting for selection/information

## Key Components:

### VoyageScene
```
Purpose: Initialize and manage Three.js scene
- Camera setup: perspective with FOV for celestial view
- Lighting: disabled (stars are self-luminous)
- Background: Black space with starfield shader
- Render loop: requestAnimationFrame with delta-time tracking

Responsibilities:
- Scene creation
- Camera positioning
- Viewport management
- Render loop initialization
```

### Star Rendering Strategies (by LOD)

#### Detail LOD (< 2 pc)
- Full 3D sphere mesh with corona effect
- Realistic star diameter calculation from magnitude
- Atmospheric scattering shader for nearby stars
- 40-80 triangles per star (expensive, few stars visible)

#### Near LOD (2-10 pc)
- Billboard quad with alpha-blended star texture
- Glow/bloom effect via post-processing
- 2 triangles per star (efficient for 100-500 visible)

#### Medium LOD (10-100 pc)
- Single textured point sprite
- Size from magnitude
- Color from BP-RP
- 1 triangle per star (efficient for 1000-5000 visible)

#### Far LOD (100-500 pc)
- Tiny colored points
- Size fixed (1-2 px)
- Batch rendering via instancing
- 1 triangle per star (handles 10k+ visible)

#### Skip LOD (> 500 pc)
- Not rendered (save GPU bandwidth)

### Color Pipeline
```
Input: Gaia BP-RP color index or spectral type
Process:
  1. BP-RP → effective temperature (K)
  2. Temperature → RGB via Planck radiation
  3. Apply atmosphere/brightness correction
Output: RGB color for star shader
```

### Size Pipeline
```
Input: Absolute magnitude
Process:
  1. mag → relative brightness (10^(-mag/2.5))
  2. Distance-based scaling (FOV projection)
  3. LOD-specific base size adjustment
Output: Pixel size or world-space radius
```

### Tile Streaming Strategy
```
1. Camera moves → calculate visible sectors
2. Fetch new tiles from /api/catalog/2d/tiles/{sector_id}
3. Decode binary data on worker thread
4. Upload star data to GPU as buffer geometry
5. Update visible star count in HUD
6. Unload tiles outside view frustum (LRU)
```

### Interaction & Selection
```
Ray Casting:
1. Mouse click/touch → screen coordinates
2. Cast ray from camera into scene
3. Detect intersection with star points
4. Return star data (name, distance, type, etc.)

Selection States:
- None: point sprite only
- Hovering: size +20%, brightness +50%
- Selected: add reticle + info panel, keep locked until deselected
```

### Performance Targets

Memory:
- GPU buffer: 1 million points @ 16 bytes/point = 16 MB
- Textures: star sprite (2K), backgrounds (4K) = 40 MB
- Shaders: ~10 KB compiled
- Total target: < 200 MB

Rendering:
- 60 FPS on mid-tier Android (Snapdragon 888+)
- Frame time: < 16.67 ms
- Batch draw calls: < 5 per frame
- Visible stars: 50k max (with LOD culling)

CPU:
- Tile decode: < 50 ms per sector (async)
- LOD updates: < 5 ms per frame
- Ray casting: < 2 ms per interaction

## File Structure

```
mobile/src/3d/
├── scenes/
│   ├── VoyageScene.js         # Main scene setup
│   ├── VoyageRenderer.js      # Render loop + frame management
│   └── VoyageCamera.js        # Camera controller
├── stars/
│   ├── StarFieldGeometry.js   # Point cloud / mesh data
│   ├── StarLODManager.js      # LOD switching logic
│   └── StarInteraction.js     # Ray casting + selection
├── rendering/
│   ├── StarShaders.js         # Vertex/fragment shaders
│   ├── ColorCalculator.js     # BP-RP to RGB conversion
│   └── SizeCalculator.js      # Magnitude to size conversion
├── tiles/
│   ├── TileLoader.js          # Binary tile streaming
│   └── TileCache.js           # LRU cache for tiles
└── ui/
    ├── VoyageHUD.js           # On-screen information
    └── VoyageOverlay.js       # 2D UI on top of 3D

mobile/src/3d/VoyageContainer.js
  → Main component bridging React/Three.js/Expo GL
  → Manages state and updates
```

## Integration Points

### Backend
- Query `/api/voyage/region` for initial star data
- Fetch `/api/catalog/2d/tiles/{sector_id}` for streaming
- Query `/api/voyage/target/{id}` for target information

### P0.2 Schema
- Use `canonicalId` for unique identification
- Use `magnitude`, `raDegrees`, `decDegrees`, `distanceParsec`
- Use `colorIndex` (BP-RP) for coloring

### P0.4 Binary Tiles
- Decode binary format in JavaScript
- Extract stars to Point geometry
- Stream tiles as camera moves

### P0.8.1 Voyage Coordinates
- Backend computes Cartesian coordinates
- Mobile uses XYZ directly for positioning
- LOD calculator informs mesh selection

## Testing Strategy

### Unit Tests
- Color mapping: BP-RP → RGB accuracy
- Size scaling: magnitude → pixel/world size
- Coordinate transform: RA/Dec → XYZ validation
- Tile decoding: binary format correctness

### Integration Tests
- Scene initialization: render loop starts
- Star rendering: visible count matches query result
- LOD transitions: smooth as camera moves
- Tile loading: new sectors appear seamlessly
- Interaction: selection by ray casting

### Device Tests
- 10 min continuous navigation (free orbit)
- FPS stable at 60 fps
- Memory growth < 50 MB over 10 min
- CPU usage < 50% average
- Temperature rise < 5°C after 10 min

## Success Criteria (P0.8.2)

- [ ] VoyageScene initializes and renders blank 3D space
- [ ] Stars appear as colored points in correct positions
- [ ] LOD system smoothly transitions as camera moves
- [ ] Tile loading/unloading seamless (no pop-in/flicker)
- [ ] Selection by tap works (reticle + info appears)
- [ ] Unit tests: 15+ passing (color, size, interaction)
- [ ] Integration test: 10 min navigation stable
- [ ] FPS metric: 60±5 FPS, frame time < 18 ms
- [ ] Memory metric: < 200 MB peak, < 50 MB growth in 10 min
"""
