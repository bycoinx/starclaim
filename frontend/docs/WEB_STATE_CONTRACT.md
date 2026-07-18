# Web Celestial State Contract

`src/stores/celestialStore.js` is the shared state boundary between catalog,
2D, and 3D renderer surfaces. Renderer technology must not create competing
copies of these values.

## Slices

- `catalog`: loaded stars, loading/error state, query filters, sorting, and pagination
- `view`: catalog and renderer modes, observer coordinates, camera target, zoom, and distance
- `selection`: selected star id and normalized star object
- `layers`: stars, constellations, landmarks, planets, and nebula visibility
- `interaction`: pointer-down, dragging, hovered object, active pointer type, and last-input timestamp
- `favorites`: user favorite star ids

`CatalogProvider` remains as a compatibility and derived-data layer for current
catalog components. Its source state is Zustand, so unmounting StarPicker or
Marketplace no longer discards selection and view state.

Camera targets are stored as plain `{ x, y, z }` objects rather than Three.js
instances. Observatory reconstructs a renderer vector locally; Galaxy consumes
the same target through its renderer adapter. Both engines publish their latest
camera distance and zoom back to the view slice.

Catalog selection actions retain the normalized star object as well as its id.
This allows a later 3D mount to reconstruct the camera target without fetching
or guessing the selected star again.

Transient interaction state resets independently and does not replace
selection or camera state during renderer transitions.
