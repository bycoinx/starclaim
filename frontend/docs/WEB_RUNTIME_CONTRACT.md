# Web Celestial Runtime Contract

Every mounted celestial renderer owns a `WebCelestialRuntime` instance. The
runtime is independent from Canvas 2D, React Three Fiber, and Three.js.

## Lifecycle

Renderer events drive the following states:

`idle -> initializing -> ready -> running -> disposed`

Additional operational states are `suspended`, `degraded`, and `error`.
Page visibility changes suspend and resume running runtimes without losing the
previous running or degraded state. Error and degraded states require an
explicit recovery transition.

Multiple copies of the same renderer receive unique runtime instance ids. The
global web runtime registry exposes snapshots of every mounted instance for
future diagnostics and performance policy consumers.

Visibility suspension uses independent `page-hidden` and `window-blur`
reasons. The runtime resumes only after every active reason has cleared, so a
focus event cannot restart a renderer while its tab is still hidden.

Three.js renderers listen for `webglcontextlost` and `webglcontextrestored`.
A lost context gets a two-second in-place restoration window. Successful
restoration recovers the same runtime; otherwise the normal low-quality,
safe-2D, and maintenance recovery policy continues.

## Telemetry

All renderers report the same base fields:

- `fps`
- `frameTimeMs`
- `renderedObjects`
- `memoryMB` when the browser exposes heap information
- `quality`
- `recordedAt`

Three-dimensional renderers additionally report WebGL render calls, geometry,
and texture counts. Renderer-specific fields are retained alongside the base
shape. Missing or non-finite numeric values are normalized to `null`.
