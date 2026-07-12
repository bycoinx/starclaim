import { ENGINE_KIND } from '../CelestialEngineRuntime';
import {
  createRendererProps,
  createSky2DRendererProps,
  createVoyage3DRendererProps,
} from '../celestialSurfaceProps';

describe('celestial surface renderer adapters', () => {
  test('maps the shared surface model to the Skia renderer', () => {
    const onSelect = jest.fn();
    const props = createSky2DRendererProps({
      catalog: {
        stars: [{ id: 1 }],
        dsos: [{ id: 'm31' }],
        planets: [{ id: 'mars' }],
        ownedStarIds: ['1'],
      },
      view: { ra: 15, dec: -20, zoom: 3, coordinateMode: 'horizontal' },
      layers: { grid: false, dsos: false, nightVision: true },
      selection: { target: { id: 1 } },
      events: { onSelect },
      active: false,
    });

    expect(props).toEqual(expect.objectContaining({
      stars: [{ id: 1 }],
      dsoData: [{ id: 'm31' }],
      planetData: [{ id: 'mars' }],
      ownedStarIds: ['1'],
      centerRa: 15,
      centerDec: -20,
      zoom: 3,
      coordinateMode: 'horizontal',
      showGrid: false,
      showDSOs: false,
      nightVision: true,
      active: false,
      onSelect,
    }));
  });

  test('maps the shared surface model to the Three.js renderer', () => {
    const onError = jest.fn();
    const props = createVoyage3DRendererProps({
      catalog: { stars: [{ id: 2 }], ownedStars: [{ id: 2 }], loadedSectorCount: 4 },
      selection: { target: { id: 2 } },
      events: { onError },
    });

    expect(props).toEqual(expect.objectContaining({
      targetStar: { id: 2 },
      loadedSectorCount: 4,
      onRenderError: onError,
    }));
  });

  test('rejects renderer kinds outside the shared contract', () => {
    expect(() => createRendererProps('unity', {})).toThrow('Unsupported celestial engine kind');
    expect(createRendererProps(ENGINE_KIND.sky2d, {}).stars).toEqual([]);
  });
});
