import {
  DEFAULT_CELESTIAL_LAYERS,
  celestialStore,
} from "./celestialStore";

describe("central celestial store", () => {
  beforeEach(() => celestialStore.getState().resetCelestialState());

  test("keeps catalog, view, selection and layers in independent slices", () => {
    const actions = celestialStore.getState();
    actions.setCatalogField("stars", [{ starId: "sirius" }]);
    actions.selectStar({ starId: "sirius", name: "Sirius" });
    actions.setRendererMode("system");
    actions.setCameraTarget({ x: 1, y: 2, z: 3 });
    actions.toggleLayer("planets");

    const state = celestialStore.getState();
    expect(state.catalog.stars).toHaveLength(1);
    expect(state.selection).toEqual(expect.objectContaining({ starId: "sirius" }));
    expect(state.view).toEqual(expect.objectContaining({
      rendererMode: "system",
      cameraTarget: { x: 1, y: 2, z: 3 },
    }));
    expect(state.layers.planets).toBe(false);
    expect(DEFAULT_CELESTIAL_LAYERS.planets).toBe(true);
  });

  test("resets pagination when catalog query inputs change", () => {
    const actions = celestialStore.getState();
    actions.setCurrentPage(5);
    actions.setSearchQuery("Sirius");
    expect(celestialStore.getState().catalog.currentPage).toBe(1);
    actions.setCurrentPage(4);
    actions.updateFilters({ constellation: "Canis Major" });
    expect(celestialStore.getState().catalog.currentPage).toBe(1);
    actions.setCurrentPage(3);
    actions.updateObserverCoords({ ra: 101.28, dec: -16.71 });
    expect(celestialStore.getState().catalog.currentPage).toBe(1);
  });

  test("preserves selection and camera state across subscribers", () => {
    celestialStore.getState().selectStar({ starId: "vega", name: "Vega" });
    celestialStore.getState().setCameraView({ zoom: 4, cameraDistance: 20 });

    expect(celestialStore.getState()).toEqual(expect.objectContaining({
      selection: expect.objectContaining({ starId: "vega" }),
      view: expect.objectContaining({ zoom: 4, cameraDistance: 20 }),
    }));
  });
});
