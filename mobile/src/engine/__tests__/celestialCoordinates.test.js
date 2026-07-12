import {
  cameraDistanceToZoom,
  cartesianParsecToEquatorial,
  equatorialToCartesianParsec,
  getCanonicalStarCoordinates,
  projectEquatorialToScreen,
  starToWorldCartesian,
  zoomToCameraDistance,
} from '../celestialCoordinates';

describe('celestial coordinate contract', () => {
  test('normalizes aliases to ICRS/J2000 RA hours, Dec degrees and parsecs', () => {
    expect(getCanonicalStarCoordinates({ raDegrees: 101.25, dec: -16.7, dist: 2.64 })).toEqual({
      frame: 'ICRS',
      epoch: 'J2000.0',
      raHours: 6.75,
      raDegrees: 101.25,
      decDegrees: -16.7,
      distanceParsec: 2.64,
    });
  });

  test('round-trips equatorial and Y-up Cartesian parsec coordinates', () => {
    const source = { raHours: 6.7525, decDegrees: -16.7161, distanceParsec: 2.637 };
    const restored = cartesianParsecToEquatorial(equatorialToCartesianParsec(source));
    expect(restored.raHours).toBeCloseTo(source.raHours, 6);
    expect(restored.decDegrees).toBeCloseTo(source.decDegrees, 6);
    expect(restored.distanceParsec).toBeCloseTo(source.distanceParsec, 6);
  });

  test('uses the same axes for 2D center and 3D world placement', () => {
    const star = { raHours: 0, decDegrees: 0, distanceParsec: 10 };
    expect(starToWorldCartesian(star)).toEqual({ x: 1.5, y: 0, z: 0 });
    expect(projectEquatorialToScreen({
      raHours: 0,
      decDegrees: 0,
      centerRaDegrees: 0,
      centerDecDegrees: 0,
      width: 1000,
      height: 500,
      zoom: 1,
    })).toEqual(expect.objectContaining({ x: 500, y: 250 }));
  });

  test('converts 2D zoom and 3D camera distance reversibly', () => {
    for (const zoom of [0.5, 1.2, 3, 6]) {
      expect(cameraDistanceToZoom(zoomToCameraDistance(zoom))).toBeCloseTo(zoom, 6);
    }
  });
});
