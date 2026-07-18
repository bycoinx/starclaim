import {
  DEFAULT_CATALOG_FILTERS,
  DEFAULT_CELESTIAL_LAYERS,
  DEFAULT_CELESTIAL_INTERACTION,
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

  test("includes negative-magnitude bright stars in the default catalog", () => {
    expect(DEFAULT_CATALOG_FILTERS.magnitudeMin).toBeLessThanOrEqual(-1.46);
    expect(celestialStore.getState().catalog.filters.magnitudeMin).toBe(
      DEFAULT_CATALOG_FILTERS.magnitudeMin,
    );
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

  test("tracks transient pointer interaction independently from view state", () => {
    const actions = celestialStore.getState();
    actions.beginInteraction({ pointerType: "touch", recordedAt: 10 });
    actions.markInteractionMoved(20);
    actions.setHoveredObjectId("sirius");

    expect(celestialStore.getState().interaction).toEqual(expect.objectContaining({
      isPointerDown: true,
      isDragging: true,
      hoveredObjectId: "sirius",
      activePointerType: "touch",
      lastInputAt: 20,
    }));

    actions.endInteraction(30);
    expect(celestialStore.getState().interaction).toEqual(expect.objectContaining({
      isPointerDown: false,
      isDragging: false,
      hoveredObjectId: "sirius",
      lastInputAt: 30,
    }));
    actions.resetInteraction();
    expect(celestialStore.getState().interaction).toEqual(DEFAULT_CELESTIAL_INTERACTION);
  });
});
