"""
P0.8 - 3D Voyage Infrastructure

Sequential implementation of Celestia-like 3D star journey experience.

Phase Breakdown:
- P0.8.1: Scene setup, coordinate system, camera controller
- P0.8.2: Star rendering in 3D space with P0.2 integration
- P0.8.3: Navigation, warp mechanics, target selection
- P0.8.4: DSO rendering in 3D
- P0.8.5: Performance optimization and mobile integration

Blocking Rule: Cannot start 3D until P0.1-P0.7 all [x] complete
Gate Status: P0.7 ✅ 26/26 tests → P0.8 UNLOCKED
"""

# P0.8.1 Phase Specification

## 3D Coordinate System

### J2000 ICRS Conversion
- Input: RA (degrees), Dec (degrees), Distance (parsecs)
- Output: Cartesian (X, Y, Z) in parsecs
- Formulas:
  - X = distance * cos(dec) * cos(ra)
  - Y = distance * sin(dec)
  - Z = distance * cos(dec) * sin(ra)

### Camera Reference Frame
- Origin: Observer at Sol (0, 0, 0)
- Forward: +Z (toward RA=0, Dec=0)
- Up: +Y (toward North Galactic Pole)
- Right: +X

### Units
- Distances: parsecs (1 pc = 3.086e13 km)
- Angular: degrees (converted to radians in math)
- Time: Unix seconds (for smooth interpolation)

## Scene Hierarchy

```
VoyageScene
├── BackgroundLayer
│   ├── StarfieldShader (distant stars as cubemap)
│   └── MilkyWayShader (galactic dust layer)
├── DataLayer
│   ├── StarField (points from binary tiles)
│   ├── DSOs (Messier/NGC models)
│   └── NavigationMarkers
├── UILayer
│   ├── TargetReticle
│   ├── DistanceLabel
│   └── WarpProgressBar
└── EffectsLayer
    ├── BloomPass
    ├── WarpParticles
    └── NebulaTransition

```

## Camera Control

### Movement Modes
1. **Free Orbit**: Pan + zoom around current position
   - Gesture: 2-finger drag, 2-finger pinch
   - Speed: 1-100 pc/second (adaptive to zoom)

2. **Target Lock**: Camera follows toward selected star
   - Gesture: Single tap on star
   - Speed: smooth easing to 50% distance
   - Stopping: stop when distance < 2 pc or user cancels

3. **Warp Jump**: Instant teleport + animation to target
   - Gesture: Double-tap on star (or long-press → "Warp" button)
   - Animation: Camera pulls back, screen flashes, warp particles, forward zoom
   - Duration: 1.2-1.5s

## Star Rendering

### LOD System
- **Far (> 100 pc)**: Points (size 1-2 px)
- **Medium (10-100 pc)**: Points with glow (size 2-4 px)
- **Near (< 10 pc)**: Billboard model or cone (size 4-16 px)
- **Detail (< 2 pc)**: Full star model with corona

### Magnitude Mapping
- Apparent magnitude -> display size
- Formula: `size = baseSize * 10^(-mag / 2.5)`
- Clamp: min 0.5 px, max 16 px at detail distance
- Brightness: combined with distance-based fade

### Color Mapping
- BP-RP (Gaia color index) -> RGB color
- Formula: Map color index to temperature (K) -> XYZ->RGB
- Fallback: Spectral type -> approximate color (e.g., F7V -> yellow)

## Tile Loading Strategy

### Distance-Based LOD
- Camera position -> frustum culling
- Sectors within 200 pc -> HIGH priority queue
- Sectors 200-500 pc -> MEDIUM priority
- Sectors > 500 pc -> LOW or skip

### LRU Cache Behavior
- Max tiles in memory: 32 (configurable)
- Load from binary tiles API (existing P0.4 endpoint)
- Decode stars on worker thread
- Upload to GPU buffer on main thread

### Fallback Behavior
- If tile loading fails: skip sector (don't crash)
- If cache corrupted: clear and retry once
- If network timeout: show offline message, use last good snapshot

## Gestures & Input

### Touch Controls (Mobile)
- **1-Finger Pan**: Orbit around fixed point
  - Inertia decay: 0.98x per frame
  - Max speed: 100 pc/sec
- **2-Finger Rotate**: Roll camera (optional, reserve for later)
- **Pinch**: Zoom in/out
  - Speed: 0.5-3.0x per pinch
  - Clamp: min 5 pc, max 10,000 pc from nearest star
- **Tap**: Select star (show reticle + info)
- **Long-Tap**: Open star detail sheet
- **Double-Tap**: Warp to star

### Keyboard Controls (Test/Desktop)
- WASD: Pan
- Q/E: Zoom in/out
- Arrow keys: Rotate camera
- Space: Toggle free camera
- Click: Select

## Performance Targets

### Target Metrics
- **FPS**: 60 FPS on mid-tier Android (Snapdragon 888+)
- **Frame Time**: < 16.67 ms (60 FPS @ 60Hz)
- **Memory**: < 200 MB GPU (stars + tiles + textures)
- **Load Time**: < 2s from app start to first rendered scene

### Budget Constraints
- Max visible stars per frame: 10,000
- Max DSOs per frame: 50
- Shader passes: 2 (forward + bloom)
- Particles: < 5,000 active during warp

## Testing & Validation

### Unit Tests
- Coordinate transform accuracy (J2000 -> Cartesian)
- LOD distance calculations
- Color mapping edge cases

### Integration Tests
- Tile loading order under movement
- Gesture response time
- Warp animation completeness

### Physical Device Tests
- 10 min continuous navigation (pan + zoom + warp)
- FPS/frame time/memory/heat telemetry
- Gesture responsiveness on various screen sizes

## Success Criteria (P0.8.1)

- [ ] Scene renders with stars in 3D space
- [ ] Camera movement smooth and responsive
- [ ] Tiles load based on view frustum
- [ ] Navigation mode switching works
- [ ] Warp animation completes
- [ ] Unit tests: 10+ coordinate system tests passing
- [ ] Physical device: 10 min test no crash/freeze
- [ ] FPS stable at 60 FPS for 30 sec navigation
