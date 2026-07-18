import {
  CELESTIAL_EPOCH,
  CELESTIAL_FRAME,
  cameraDistanceToZoom,
  cartesianParsecToEquatorial,
  equatorialToCartesianParsec,
  getCanonicalStarCoordinates,
  raHoursToDegrees,
  starToWorldCartesian,
  zoomToCameraDistance,
} from "./celestialCoordinates";
import { StarAssetManager } from "../lib/StarAssetManager";
import { raDecToVector3, starToVector3, vector3ToRaDec } from "../lib/astro";

describe("web celestial coordinate contract", () => {
  test("normalizes string, hour and degree RA into ICRS/J2000", () => {
    const fromString = getCanonicalStarCoordinates({ ra: "06h 45m 09s", dec: "-16° 42' 58\"", dist: 2.637 });
    const fromHours = getCanonicalStarCoordinates({ raHours: 6.7525, decDegrees: -16.7161, distanceParsec: 2.637 });
    const fromDegrees = getCanonicalStarCoordinates({ raDegrees: 101.2875, decDegrees: -16.7161, distanceParsec: 2.637 });

    expect(fromString).toEqual(expect.objectContaining({ frame: CELESTIAL_FRAME, epoch: CELESTIAL_EPOCH }));
    expect(fromString.raDegrees).toBeCloseTo(fromHours.raDegrees, 2);
    expect(fromHours.raDegrees).toBeCloseTo(fromDegrees.raDegrees, 6);
    expect(raHoursToDegrees(fromDegrees.raHours)).toBeCloseTo(101.2875, 6);
  });

  test("matches the mobile Cartesian axis contract and round-trips", () => {
    const coordinates = { raDegrees: 90, decDegrees: 0, distanceParsec: 10 };
    const position = equatorialToCartesianParsec(coordinates);
    expect(position).toEqual({ x: 0, y: 0, z: -10 });
    expect(cartesianParsecToEquatorial(position)).toEqual(expect.objectContaining({
      raDegrees: 90,
      decDegrees: 0,
      distanceParsec: 10,
    }));
  });

  test("keeps Three.js adapters and camera zoom conversions reversible", () => {
    const vector = raDecToVector3("18h 36m 56s", "+38° 47' 01\"", 7.68);
    const returned = vector3ToRaDec(vector);
    expect(returned.raDegrees).toBeCloseTo(279.233, 2);
    expect(returned.decDegrees).toBeCloseTo(38.7836, 2);
    expect(cameraDistanceToZoom(zoomToCameraDistance(4.5))).toBeCloseTo(4.5, 6);
  });

  test("prefers explicit nested coordinate units in renderer adapters", () => {
    const vector = starToVector3({
      ra: 6,
      coordinates: { raDegrees: 6, decDegrees: 0, distanceParsec: 10 },
    });
    const returned = vector3ToRaDec(vector);
    expect(returned.raDegrees).toBeCloseTo(6, 6);
    expect(returned.distanceParsec).toBeCloseTo(10, 6);
  });

  test("preserves canonical coordinates through web asset normalization", () => {
    const asset = StarAssetManager.getStarAsset({
      id: "sirius",
      name: "Sirius",
      code: "SIRIUS-A",
      raDegrees: 101.2875,
      decDegrees: -16.7161,
      distanceParsec: 2.637,
    });
    expect(asset.coordinates).toEqual(expect.objectContaining({
      frame: "ICRS",
      epoch: "J2000.0",
      raDegrees: 101.2875,
      distanceParsec: 2.637,
    }));
    expect(starToWorldCartesian(asset.coordinates)).toEqual(expect.objectContaining({
      x: expect.any(Number), y: expect.any(Number), z: expect.any(Number),
    }));
  });
});
