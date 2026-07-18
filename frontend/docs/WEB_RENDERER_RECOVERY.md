# Web Renderer Recovery Policy

`CelestialRenderer` owns recovery so screens do not implement renderer-specific
error branches. Lazy module failures, React render failures, Canvas 2D context
failures, and WebGL context loss enter the same policy.

## Recovery order

For a 3D renderer:

1. Retry the primary renderer with the low quality profile.
2. Replace it with the registered safe 2D background renderer.
3. Show the maintenance surface with a manual retry action.

For a 2D renderer, the policy retries with reduced density and then shows the
maintenance surface. It never selects the failed renderer as its own fallback.

Low quality is an operational profile, not only a label. It reduces Canvas 2D
particles and dust; 3D renderers reduce device pixel ratio and disable
antialiasing, shadows, bloom, and other post-processing.

Every failure records renderer id, stage, error name/message, and timestamp.
`onRecoveryChange` exposes this state for diagnostics. Manual retry clears the
failure chain and returns to the primary renderer.
