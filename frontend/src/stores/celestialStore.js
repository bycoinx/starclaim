import { create } from "zustand";

export const DEFAULT_CATALOG_FILTERS = Object.freeze({
  constellation: "all",
  magnitudeMin: 0,
  magnitudeMax: 10,
  distanceMin: 0,
  distanceMax: 10000,
  spectralType: "all",
  starType: "all",
  ownership: "all",
  hasStories: false,
});

export const DEFAULT_CELESTIAL_LAYERS = Object.freeze({
  stars: true,
  constellations: true,
  landmarks: true,
  planets: true,
  nebula: true,
});

function createInitialState() {
  return {
    catalog: {
      loading: true,
      error: "",
      stars: [],
      searchQuery: "",
      filters: { ...DEFAULT_CATALOG_FILTERS },
      sortBy: "recommended",
      currentPage: 1,
      pageSize: 24,
      serverTotalCount: null,
      serverConstellations: [],
    },
    view: {
      catalogMode: "grid",
      rendererMode: "observatory",
      observerCoords: { ra: 279.2347, dec: 38.7837 },
      cameraTarget: null,
      zoom: 1.2,
      cameraDistance: 68,
    },
    selection: {
      starId: null,
      star: null,
    },
    layers: { ...DEFAULT_CELESTIAL_LAYERS },
    favorites: readStoredFavorites(),
  };
}

function readStoredFavorites() {
  try {
    if (typeof localStorage === "undefined") return [];
    const saved = localStorage.getItem("starclaim_favorites");
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

function resolveValue(value, previous) {
  return typeof value === "function" ? value(previous) : value;
}

export const useCelestialStore = create((set) => ({
  ...createInitialState(),

  setCatalogField: (field, value) => set((state) => ({
    catalog: {
      ...state.catalog,
      [field]: resolveValue(value, state.catalog[field]),
    },
  })),
  setSearchQuery: (searchQuery) => set((state) => ({
    catalog: { ...state.catalog, searchQuery, currentPage: 1 },
  })),
  updateFilters: (updater) => set((state) => ({
    catalog: {
      ...state.catalog,
      filters: typeof updater === "function"
        ? updater(state.catalog.filters)
        : { ...state.catalog.filters, ...updater },
      currentPage: 1,
    },
  })),
  resetFilters: () => set((state) => ({
    catalog: {
      ...state.catalog,
      filters: { ...DEFAULT_CATALOG_FILTERS },
      searchQuery: "",
      sortBy: "recommended",
      currentPage: 1,
    },
  })),
  setSortBy: (sortBy) => set((state) => ({
    catalog: { ...state.catalog, sortBy, currentPage: 1 },
  })),
  setCurrentPage: (currentPage) => set((state) => ({
    catalog: { ...state.catalog, currentPage: resolveValue(currentPage, state.catalog.currentPage) },
  })),
  setPageSize: (pageSize) => set((state) => ({
    catalog: { ...state.catalog, pageSize, currentPage: 1 },
  })),

  selectStar: (star) => set({
    selection: { starId: star?.starId || star?.id || star?.code || null, star: star || null },
  }),
  setSelectedStarId: (starId) => set((state) => ({
    selection: {
      starId,
      star: state.selection.starId === starId ? state.selection.star : null,
    },
  })),
  clearSelection: () => set({ selection: { starId: null, star: null } }),

  setCatalogViewMode: (catalogMode) => set((state) => ({
    view: { ...state.view, catalogMode },
  })),
  setRendererMode: (rendererMode) => set((state) => ({
    view: { ...state.view, rendererMode },
  })),
  updateObserverCoords: (coords) => set((state) => ({
    view: {
      ...state.view,
      observerCoords: { ...state.view.observerCoords, ...coords },
    },
    catalog: { ...state.catalog, currentPage: 1 },
  })),
  setCameraTarget: (cameraTarget) => set((state) => ({
    view: { ...state.view, cameraTarget },
  })),
  setCameraView: (view) => set((state) => ({
    view: { ...state.view, ...view },
  })),

  setLayerVisibility: (layer, visible) => set((state) => ({
    layers: { ...state.layers, [layer]: Boolean(visible) },
  })),
  toggleLayer: (layer) => set((state) => ({
    layers: { ...state.layers, [layer]: !state.layers[layer] },
  })),
  setFavorites: (favorites) => set((state) => ({
    favorites: resolveValue(favorites, state.favorites),
  })),

  resetCelestialState: () => set(createInitialState()),
}));

export const celestialStore = useCelestialStore;
