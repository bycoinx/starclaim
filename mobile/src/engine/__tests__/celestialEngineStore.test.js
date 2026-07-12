import {
  DEFAULT_CELESTIAL_LAYERS,
  DEFAULT_CELESTIAL_VIEW,
  useCelestialEngineStore,
} from '../celestialEngineStore';

describe('celestial engine store', () => {
  beforeEach(() => useCelestialEngineStore.getState().resetEngineState());

  test('preserves selection and view while renderer catalogs change', () => {
    const target = { id: 'sirius', ra: 101.2, dec: -16.7 };
    const store = useCelestialEngineStore.getState();
    store.setSkyCatalog({
      stars: [target],
      dsos: [{ id: 'm42' }],
      planets: [{ id: 'mars' }],
    });
    store.setView({ ra: 101.2, dec: -16.7, zoom: 4 });
    store.selectTarget(target);
    store.setVoyageCatalog({ stars: [target], sectorWindow: { stars: [target], sectorIds: ['10:2'] } });

    const state = useCelestialEngineStore.getState();
    expect(state.selection.target).toBe(target);
    expect(state.view).toEqual(expect.objectContaining({ ra: 101.2, dec: -16.7, zoom: 4 }));
    expect(state.catalogs.sky.stars).toEqual([target]);
    expect(state.catalogs.sky.dsos).toEqual([{ id: 'm42' }]);
    expect(state.catalogs.sky.planets).toEqual([{ id: 'mars' }]);
    expect(state.catalogs.voyage.sectorWindow.sectorIds).toEqual(['10:2']);
  });

  test('updates layer policy without replacing unrelated flags', () => {
    useCelestialEngineStore.getState().setLayers({ nightVision: true, grid: true });
    expect(useCelestialEngineStore.getState().layers).toEqual({
      ...DEFAULT_CELESTIAL_LAYERS,
      nightVision: true,
      grid: true,
    });
  });

  test('resets shared state to stable defaults', () => {
    const store = useCelestialEngineStore.getState();
    store.setView({ zoom: 8 });
    store.selectTarget({ id: 1 });
    store.resetEngineState();
    expect(useCelestialEngineStore.getState().view).toEqual(DEFAULT_CELESTIAL_VIEW);
    expect(useCelestialEngineStore.getState().selection.target).toBeNull();
  });

  test('publishes renderer-neutral selection, warp and arrival events', () => {
    const target = { id: 'vega' };
    const store = useCelestialEngineStore.getState();
    store.selectTarget(target, { source: 'sky-2d' });
    expect(useCelestialEngineStore.getState().interaction).toEqual(expect.objectContaining({
      sequence: 1,
      type: 'target-selected',
      source: 'sky-2d',
      target,
    }));
    store.requestWarp(target, { metadata: { certified: true } });
    expect(useCelestialEngineStore.getState().interaction.type).toBe('warp-requested');
    store.completeArrival(target);
    expect(useCelestialEngineStore.getState().interaction).toEqual(expect.objectContaining({
      sequence: 3,
      type: 'arrival-completed',
      target,
    }));
  });
});
