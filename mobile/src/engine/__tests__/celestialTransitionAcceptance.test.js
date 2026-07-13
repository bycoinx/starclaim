import {
  selectSkyEngineSlice,
  selectVoyageEngineSlice,
  useCelestialEngineStore,
} from '../celestialEngineStore';
import { createSky2DRendererProps, createVoyage3DRendererProps } from '../celestialSurfaceProps';
import { cameraDistanceToZoom, zoomToCameraDistance } from '../celestialCoordinates';

describe('2D to 3D transition acceptance', () => {
  beforeEach(() => useCelestialEngineStore.getState().resetEngineState());

  test('preserves selected star and camera view across both renderers', () => {
    const sirius = { id: 'sirius', ra: 101.287, dec: -16.716, distancePc: 2.637 };
    const store = useCelestialEngineStore.getState();
    store.setSkyCatalog({ stars: [sirius] });
    store.setView({ ra: sirius.ra, dec: sirius.dec, zoom: 4.5 });
    store.selectTarget(sirius, { source: 'sky-2d' });
    store.setVoyageCatalog({ stars: [sirius] });

    const sky = selectSkyEngineSlice(useCelestialEngineStore.getState());
    const skyProps = createSky2DRendererProps({
      catalog: { stars: sky.stars },
      selection: { target: sky.selectedStar },
      view: { ra: sky.centerRa, dec: sky.centerDec, zoom: sky.zoom },
    });
    const voyage = selectVoyageEngineSlice(useCelestialEngineStore.getState());
    const voyageProps = createVoyage3DRendererProps({
      catalog: { stars: voyage.stars },
      selection: { target: voyage.targetStar },
      view: voyage.view,
    });

    expect(voyageProps.targetStar).toBe(skyProps.selectedStar);
    expect(voyageProps.view).toEqual(expect.objectContaining({
      ra: sirius.ra,
      dec: sirius.dec,
      zoom: 4.5,
    }));
    expect(cameraDistanceToZoom(zoomToCameraDistance(voyageProps.view.zoom)))
      .toBeCloseTo(skyProps.zoom, 6);

    useCelestialEngineStore.getState().setView({ zoom: 7.25 });
    const returnedSky = selectSkyEngineSlice(useCelestialEngineStore.getState());
    expect(returnedSky.selectedStar).toBe(sirius);
    expect(returnedSky.zoom).toBe(7.25);
  });
});
