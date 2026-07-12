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

export const useCelestialEngineStore = create((set) => ({
  catalogs: {
    sky: { stars: [], dsos: [], planets: [], constellations: null },
    voyage: { stars: [], sectorWindow: emptySectorWindow() },
  },
  view: { ...DEFAULT_CELESTIAL_VIEW },
  selection: { target: null },
  interaction: { sequence: 0, type: 'idle', source: null, target: null, metadata: null, occurredAt: null },
  layers: { ...DEFAULT_CELESTIAL_LAYERS },

  setSkyCatalog: (patch) => set((state) => ({
    catalogs: {
      ...state.catalogs,
      sky: { ...state.catalogs.sky, ...patch },
    },
  })),
  setVoyageCatalog: (patch) => set((state) => ({
    catalogs: {
      ...state.catalogs,
      voyage: { ...state.catalogs.voyage, ...patch },
    },
  })),
  setView: (patch) => set((state) => ({ view: { ...state.view, ...patch } })),
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
  setLayers: (patch) => set((state) => ({ layers: { ...state.layers, ...patch } })),
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
