import * as THREE from "three";
import {
  cartesianParsecToEquatorial,
  equatorialToCartesianParsec,
  getCanonicalStarCoordinates,
  parseDeclinationDegrees,
  parseRightAscensionHours,
} from "../engine/celestialCoordinates";

export function parseRightAscension(value) {
  return parseRightAscensionHours(value);
}

export function parseDeclination(value) {
  return parseDeclinationDegrees(value);
}

export function raDecToVector3(ra, dec, radius = 500) {
  const coordinates = getCanonicalStarCoordinates({ ra, dec, distanceParsec: radius });
  const position = equatorialToCartesianParsec(coordinates);
  return new THREE.Vector3(position.x, position.y, position.z);
}

export function starToVector3(star, radius) {
  const source = { ...star, ...star?.coordinates };
  const coordinates = getCanonicalStarCoordinates(
    Number.isFinite(radius) ? { ...source, distanceParsec: radius } : source
  );
  const position = equatorialToCartesianParsec(coordinates);
  return new THREE.Vector3(position.x, position.y, position.z);
}

export function vector3ToRaDec(vec) {
  const coordinates = cartesianParsecToEquatorial(vec);
  return {
    ra: coordinates.raDegrees,
    dec: coordinates.decDegrees,
    ...coordinates,
  };
}
