# Web Performance Policy

All celestial renderers consume profiles from
`src/engine/performance/webPerformancePolicy.js`. Screens and renderer
implementations must not define independent quality thresholds.

## Shared budgets

| Budget | Low | Medium | High |
| --- | ---: | ---: | ---: |
| Canvas stars | 120 | 280 | 500 |
| Canvas dust | 16 | 32 | 50 |
| Galaxy stars | 6,000 | 12,000 | 18,000 |
| Galaxy asteroids | 250 | 600 | 900 |
| Observatory stars | 2,500 | 7,000 | 12,000 |
| Maximum rendered objects | 7,000 | 14,000 | 22,000 |
| Target FPS | 40 | 48 | 52 |

Profiles also own DPR ranges, antialiasing, shadows, post-processing, memory
limits, frame-time limits, and heap-pressure thresholds.

## Device ceiling

The initial maximum profile is selected from physical scene pixels, pixel
ratio, catalog size, reported device memory, CPU concurrency, and reduced
motion preference. A caller may request a lower ceiling but cannot exceed the
detected device ceiling.

## Runtime adaptation

- Three consecutive slow frame samples reduce quality by one level.
- Critical heap, absolute memory, or rendered-object pressure reduces quality immediately.
- Eight consecutive healthy samples increase quality by one level.
- Recovery never exceeds the device ceiling.
- Renderer recovery mode always overrides the performance controller with the low profile.

Telemetry includes the active and maximum quality levels so diagnostics can
explain every budget decision.
