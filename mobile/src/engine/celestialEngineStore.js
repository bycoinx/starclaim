import { create } from 'zustand';

export const DEFAULT_CELESTIAL_VIEW = Object.freeze({
  ra: 180,
  dec: 0,
  zoom: 1.2,
  coordinateMode: 'equatorial',
});

export const DEFAULT_CELESTIAL_LAYERS = Object.freeze({
  constellations: true,
  constellationLabels: true,
  constellationBoundaries: false,
  grid: false,
  labels: false,
  planets: true,
  dsos: true,
  nebula: true,
  mythology: false,
  nightVision: false,
});

const emptySectorWindow = () => ({ stars: [], sectorIds: [] });

function mergeIfChanged(current, patch) {
  if (!patch || typeof patch !== 'object') return current;
  const keys = Object.keys(patch);
  if (!keys.some((key) => !Object.is(current[key], patch[key]))) return current;
  return { ...current, ...patch };
}

export const selectSkyEngineSlice = (state) => ({
  stars: state.catalogs.sky.stars,
  constellations: state.catalogs.sky.constellations,
  dsos: state.catalogs.sky.dsos,
  planets: state.catalogs.sky.planets,
  selectedStar: state.selection.target,
  centerRa: state.view.ra,
  centerDec: state.view.dec,
  zoom: state.view.zoom,
  coordinateMode: state.view.coordinateMode,
  layers: state.layers,
  setSkyCatalog: state.setSkyCatalog,
  setView: state.setView,
  selectTarget: state.selectTarget,
  clearTarget: state.clearTarget,
  setLayers: state.setLayers,
});

export const selectVoyageEngineSlice = (state) => ({
  stars: state.catalogs.voyage.stars,
  sectorWindow: state.catalogs.voyage.sectorWindow,
  targetStar: state.selection.target,
  view: state.view,
  setVoyageCatalog: state.setVoyageCatalog,
  setView: state.setView,
  selectTarget: state.selectTarget,
  requestWarp: state.requestWarp,
  completeArrival: state.completeArrival,
});

export const useCelestialEngineStore = create((set) => ({
  catalogs: {
    sky: { stars: [], dsos: [], planets: [], constellations: null },
    voyage: { stars: [], sectorWindow: emptySectorWindow() },
  },
  view: { ...DEFAULT_CELESTIAL_VIEW },
  selection: { target: null },
  interaction: { sequence: 0, type: 'idle', source: null, target: null, metadata: null, occurredAt: null },
  layers: { ...DEFAULT_CELESTIAL_LAYERS },

  setSkyCatalog: (patch) => set((state) => {
    const sky = mergeIfChanged(state.catalogs.sky, patch);
    return sky === state.catalogs.sky ? state : {
      catalogs: { ...state.catalogs, sky },
    };
  }),
  setVoyageCatalog: (patch) => set((state) => {
    const voyage = mergeIfChanged(state.catalogs.voyage, patch);
    return voyage === state.catalogs.voyage ? state : {
      catalogs: { ...state.catalogs, voyage },
    };
  }),
  setView: (patch) => set((state) => {
    const view = mergeIfChanged(state.view, patch);
    return view === state.view ? state : { view };
  }),
  selectTarget: (target, options = {}) => set((state) => ({
    selection: { target: target || null },
    interaction: {
      sequence: state.interaction.sequence + 1,
      type: target ? 'target-selected' : 'selection-cleared',
      source: options.source || 'unknown',
      target: target || null,
      metadata: options.metadata || null,
      occurredAt: Date.now(),
    },
  })),
  clearTarget: (options = {}) => set((state) => ({
    selection: { target: null },
    interaction: {
      sequence: state.interaction.sequence + 1,
      type: 'selection-cleared',
      source: options.source || 'unknown',
      target: null,
      metadata: options.metadata || null,
      occurredAt: Date.now(),
    },
  })),
  requestWarp: (target, options = {}) => set((state) => ({
    selection: { target: target || state.selection.target },
    interaction: {
      sequence: state.interaction.sequence + 1,
      type: 'warp-requested',
      source: options.source || 'voyage-3d',
      target: target || state.selection.target,
      metadata: options.metadata || null,
      occurredAt: Date.now(),
    },
  })),
  completeArrival: (target, options = {}) => set((state) => ({
    selection: { target: target || state.selection.target },
    interaction: {
      sequence: state.interaction.sequence + 1,
      type: 'arrival-completed',
      source: options.source || 'voyage-3d',
      target: target || state.selection.target,
      metadata: options.metadata || null,
      occurredAt: Date.now(),
    },
  })),
  setLayers: (patch) => set((state) => {
    const layers = mergeIfChanged(state.layers, patch);
    return layers === state.layers ? state : { layers };
  }),
  resetEngineState: () => set({
    catalogs: {
      sky: { stars: [], dsos: [], planets: [], constellations: null },
      voyage: { stars: [], sectorWindow: emptySectorWindow() },
    },
    view: { ...DEFAULT_CELESTIAL_VIEW },
    selection: { target: null },
    interaction: { sequence: 0, type: 'idle', source: null, target: null, metadata: null, occurredAt: null },
    layers: { ...DEFAULT_CELESTIAL_LAYERS },
  }),
}));
