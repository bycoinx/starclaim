Re-enable Cosmos 3D Map (GalaxyScene)

Purpose
- Steps to re-enable the 3D GalaxyScene on the `/cosmos` route when ready.

Prerequisites
- Frontend dev environment working (`node >=18`, dependencies installed via `npm ci`).
- Enough system RAM for `npm run build` (build can be memory intensive).

Quick plan
1. Undo the placeholder changes in `frontend/src/pages/Cosmos.jsx` by restoring the original `GalaxyScene` render and observer wiring.
2. Verify `GalaxyScene`'s `CameraObserver` is throttled/debounced to avoid excessive state updates.
3. Confirm `CatalogProvider` and `CatalogStore` observer wiring is explicit (only pass `viewer_ra/viewer_dec` when needed).
4. Run dev server and test the route interactively at `/cosmos`.
5. Run production build and smoke-test the built assets.

Detailed steps

1) Restore GalaxyScene rendering
- In `frontend/src/pages/Cosmos.jsx` replace the placeholder background div with:

  <GalaxyScene onObserverCoordsChange={setObserverCoords} />

- Ensure `Cosmos` uses `useState` for `observerCoords` and provides `setObserverCoords` to `GalaxyScene`.

2) Check `GalaxyScene` observer emits
- Open `frontend/src/components/GalaxyScene/GalaxyScene.jsx` and locate how camera RA/DEC are computed (e.g., `vector3ToRaDec`).
- Ensure the callback to `onObserverCoordsChange` is throttled. Example pattern:

  const send = useRef(throttle((c) => onObserverCoordsChange(c), 800));
  useFrame(() => {
    const coords = computeRaDecFromCamera();
    send.current(coords);
  });

- Prefer using `useRef` + `throttle` from `lodash` or a small custom throttle.

3) Verify Catalog wiring
- `CatalogStore.buildServerQuery()` should only add `viewer_ra`/`viewer_dec` when `sort=nearest` and valid `observerCoords` exist.
- Ensure `CatalogProvider` consumers do not trigger full reloads on high-frequency observer updates. Observer updates should only update local `observerCoords` unless a catalog `nearest` query is explicitly requested.

4) Dev test
- Start dev server: `cd frontend && npm start` and open `http://localhost:3000/cosmos` or the port CRACO picks.
- Interact with camera and monitor network calls: nearest queries should include `viewer_ra`/`viewer_dec` only when `sort=nearest`.

5) Production build
- Run: `cd frontend && npm run build`.
- If build fails due to memory, consider increasing `NODE_OPTIONS` memory or building on a machine with more RAM. The `package.json` already sets `NODE_OPTIONS` for build.
- Serve `build` locally to smoke-test: `npx serve frontend/build` or use the project's static server.

Rollback notes
- If visuals are too heavy, keep `GalaxyScene` off by default and gate enablement behind a feature flag or lazy-loading route.

Checklist before merge
- No ESLint `no-unused-vars` in modified files.
- No high-frequency state updates tied to `useFrame` without throttling.
- Catalog queries only include viewer coords when requested.

Contact
- If you want, I can perform the re-enable steps and run the dev build here when you're ready (may be slow on low-RAM machine).