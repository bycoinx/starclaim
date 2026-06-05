# PR: feature/galaxy-rewrite

Summary
-------
This PR introduces a ground-up rewrite of the 3D galaxy view used on the StarPicker/3D Map page.
It adds HYG star data loader, solar system data, a GalaxyScene with Milky Way background and LOD'd starfield,
drone-style cinematic CameraRig, mobile device orientation support, and a star detail popup overlay.

Files added
-----------
- `src/data/hygdata_v3_sample.js` — HYG v3 CSV loader (fallback included)
- `src/data/solarSystem.js` — solar system dataset and Kepler helper
- `src/components/GalaxyScene/GalaxyScene.jsx` — main scene (MilkyWayBackground, HYGStarField, SolarSystemScene)
- `src/components/GalaxyScene/CameraRig.jsx` — cinematic camera
- `src/components/GalaxyScene/StarPopup.jsx` — star detail overlay
- `src/hooks/useDeviceOrientation.js` — mobile orientation hook

Pages modified
--------------
- `src/pages/StarPicker.jsx` — 3D view now renders `GalaxyScene` in the "3D Map" tab; old `SkySphere` import preserved as reference.

Testing / How to run locally
---------------------------
1. Install deps (if needed):

```bash
cd frontend
npm install
```

2. Dev server:

```bash
npm start
```

3. Production build (CI-like check):

```bash
npm run build
```

4. Manual checks:
- Open `/stars` page and switch to the "3D Map" tab.
- Confirm galaxy loads (loading overlay -> scene). Stars near the Sun should be visible.
- Click a star to open the popup.
- On mobile, enable device orientation and verify camera reacts (use real device or Chrome device emulation with sensor support).

Notes & Next steps
------------------
- Current HYG loader uses a minimal in-file CSV parser to avoid adding `papaparse` during initial PR; we can switch
  to `papaparse` for robust parsing if preferred.
- LOD thresholds: near (<=200 pc), mid (<=500 pc); >500 pc are culled for performance. Adjust thresholds as needed.
- Completed: StarPopup claim button now calls the existing `onClaim` checkout flow from `StarPicker`.
- Optional: Move CSV parsing to a Web Worker for non-blocking load of full HYG (~9k stars).

Testing checklist (to include in PR):
- [ ] `npm run build` completes without errors
- [ ] `/stars` "3D Map" renders and does not show a black screen
- [ ] HYG fetch request observed in network tab when first loading
- [ ] Star popup displays correct RA/Dec/dist/mag values
- [ ] Mobile orientation toggles OrbitControls rotation and influences camera

If build or tests fail, revert the PR branch and open a follow-up with the failure logs.
