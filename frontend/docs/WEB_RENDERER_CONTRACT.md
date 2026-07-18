# Web Renderer Contract

Web screens consume renderer purposes through `CelestialRenderer`; they do not
import Canvas 2D, React Three Fiber, or Three.js implementations directly.

## Registered purposes

| Purpose id | Kind | Implementation | Status |
| --- | --- | --- | --- |
| `celestial-background` | 2D | `StarCanvas` | Active |
| `celestial-galaxy` | 3D | `GalaxyScene/GalaxyScene` | Registered, not activated |
| `celestial-observatory` | 3D | `SkySphere` | Registered, not activated |

Each adapter declares capabilities and implements the same lifecycle surface:
`initialize`, `update`, `render`, `dispose`, and `getTelemetry`. The shared host
emits normalized lifecycle events without exposing renderer technology to its
consumer.

Renderer modules are loaded dynamically. Registering a 3D engine does not make
it render, and the Cosmos route will keep its maintenance surface until the
separate activation stage.

The next runtime stage will consume these lifecycle events to own renderer
status, error transitions, and telemetry aggregation.
