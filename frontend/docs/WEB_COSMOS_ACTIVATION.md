# Cosmos Engine Activation

The `/cosmos` route now mounts `celestial-galaxy` through `CelestialRenderer`.
The page does not import React Three Fiber or Three.js and receives runtime,
recovery, and performance state through the shared host callbacks.

The selected catalog star remains in the central Zustand store. On Cosmos
mount, its existing renderer position is preserved; catalog-only RA/Dec and
distance fields are converted through the shared coordinate contract. Camera
position, target, zoom, and observer RA/Dec continue to be published to the
same `view` slice.

If live 3D initialization fails, the standard low-quality 3D, safe 2D, and
maintenance chain remains active. The route and 3D implementation stay lazy
loaded by React Router and the renderer registry.
