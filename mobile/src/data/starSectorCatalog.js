import { clampDeclination, normalizeAngle } from '../utils/astronomy';

export const SECTOR_SCHEMA_VERSION = 1;
export const RA_SECTOR_SIZE_DEGREES = 15;
export const DEC_SECTOR_SIZE_DEGREES = 10;
export const DISTANCE_SHELLS_PARSEC = [10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000];

function getDistanceShellIndex(distanceParsec) {
  const distance = Number(distanceParsec);
  if (!Number.isFinite(distance) || distance <= 0) return 'u';
  const index = DISTANCE_SHELLS_PARSEC.findIndex((upperBound) => distance <= upperBound);
  return index === -1 ? DISTANCE_SHELLS_PARSEC.length : index;
}

export function getStarSectorId(star) {
  const raDegrees = normalizeAngle(
    Number.isFinite(star?.raDegrees) ? star.raDegrees : Number(star?.raHours || star?.ra || 0) * 15,
  );
  const decDegrees = clampDeclination(star?.decDegrees ?? star?.dec);
  const raIndex = Math.floor(raDegrees / RA_SECTOR_SIZE_DEGREES);
  const decIndex = Math.min(
    Math.floor((decDegrees + 90) / DEC_SECTOR_SIZE_DEGREES),
    Math.floor(180 / DEC_SECTOR_SIZE_DEGREES) - 1,
  );
  const shellIndex = getDistanceShellIndex(star?.distanceParsec ?? star?.dist);
  return `r${raIndex}-d${decIndex}-s${shellIndex}`;
}

export function createSectorAccumulator() {
  return new Map();
}

export function addStarToSectorAccumulator(sectors, star) {
  const sectorId = star.sectorId || getStarSectorId(star);
  const magnitude = Number(star.magnitude ?? star.mag);
  const distance = Number(star.distanceParsec ?? star.dist);
  const current = sectors.get(sectorId) || {
    id: sectorId,
    count: 0,
    minMagnitude: null,
    maxMagnitude: null,
    minDistanceParsec: null,
    maxDistanceParsec: null,
  };

  current.count += 1;
  if (Number.isFinite(magnitude)) {
    current.minMagnitude = current.minMagnitude == null
      ? magnitude
      : Math.min(current.minMagnitude, magnitude);
    current.maxMagnitude = current.maxMagnitude == null
      ? magnitude
      : Math.max(current.maxMagnitude, magnitude);
  }
  if (Number.isFinite(distance) && distance > 0) {
    current.minDistanceParsec = current.minDistanceParsec == null
      ? distance
      : Math.min(current.minDistanceParsec, distance);
    current.maxDistanceParsec = current.maxDistanceParsec == null
      ? distance
      : Math.max(current.maxDistanceParsec, distance);
  }

  sectors.set(sectorId, current);
  return sectorId;
}

export function finalizeSectorManifest(sectors) {
  return [...sectors.values()].sort((left, right) => left.id.localeCompare(right.id));
}

export function getSectorScheme() {
  return {
    schemaVersion: SECTOR_SCHEMA_VERSION,
    coordinateSystem: 'ICRS_RA_DEC_DISTANCE',
    raSectorSizeDegrees: RA_SECTOR_SIZE_DEGREES,
    decSectorSizeDegrees: DEC_SECTOR_SIZE_DEGREES,
    distanceShellsParsec: DISTANCE_SHELLS_PARSEC,
    unknownDistanceShell: 'u',
  };
}
