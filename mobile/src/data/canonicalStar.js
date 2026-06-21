import { normalizeAngle } from '../utils/astronomy';

export const STAR_SCHEMA_VERSION = 1;
export const STAR_COORDINATE_FRAME = 'ICRS';
export const STAR_EPOCH = 'J2000.0';
export const HYG_UNKNOWN_DISTANCE_PARSEC = 100000;

function finiteNumber(value) {
  if (value === null || value === undefined || value === '') return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function identifier(value) {
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

export function normalizeDistanceParsec(value, source = 'unknown') {
  const distance = finiteNumber(value);
  if (distance == null || distance <= 0) return null;
  if (source === 'hyg' && distance >= HYG_UNKNOWN_DISTANCE_PARSEC) return null;
  return distance;
}

export function createCanonicalStar(input, options = {}) {
  const source = identifier(options.source || input.source || 'unknown').toLowerCase();
  const sourceId = identifier(options.sourceId || input.sourceId || input.id);
  const raHoursInput = finiteNumber(input.raHours ?? input.ra);
  const raDegreesInput = finiteNumber(input.raDegrees);
  const raDegrees = raDegreesInput == null
    ? (raHoursInput == null ? null : normalizeAngle(raHoursInput * 15))
    : normalizeAngle(raDegreesInput);
  const raHours = raDegrees == null ? null : raDegrees / 15;
  const decDegrees = finiteNumber(input.decDegrees ?? input.dec);
  const magnitude = finiteNumber(input.magnitude ?? input.mag);

  if (
    !sourceId
    || raDegrees == null
    || decDegrees == null
    || decDegrees < -90
    || decDegrees > 90
    || magnitude == null
  ) return null;

  const parallaxMas = finiteNumber(input.parallaxMas ?? input.parallax);
  const explicitDistance = normalizeDistanceParsec(input.distanceParsec ?? input.dist, source);
  const distanceParsec = explicitDistance
    ?? (parallaxMas != null && parallaxMas > 0 ? 1000 / parallaxMas : null);
  const hip = identifier(input.hip);
  const hd = identifier(input.hd);
  const gaiaSourceId = identifier(input.gaiaSourceId);
  const properName = identifier(input.properName ?? input.proper);
  const spectralType = identifier(input.spectralType ?? input.spect);
  const constellation = identifier(input.constellation ?? input.con);
  const canonicalId = gaiaSourceId
    ? `gaia-dr3:${gaiaSourceId}`
    : hip
      ? `hip:${hip}`
      : `${source}:${sourceId}`;

  return {
    schemaVersion: STAR_SCHEMA_VERSION,
    canonicalId,
    source,
    sourceId,
    sourceCatalogVersion: identifier(options.sourceCatalogVersion || input.sourceCatalogVersion),
    gaiaSourceId,
    hip,
    hd,
    id: identifier(input.id || sourceId),
    proper: properName,
    properName,
    ra: raHours,
    raHours,
    raDegrees,
    dec: decDegrees,
    decDegrees,
    parallax: parallaxMas != null && parallaxMas > 0 ? parallaxMas : null,
    parallaxMas: parallaxMas != null && parallaxMas > 0 ? parallaxMas : null,
    dist: distanceParsec ?? 0,
    distanceParsec,
    distanceSource: explicitDistance != null ? source : parallaxMas > 0 ? 'parallax' : 'unknown',
    mag: magnitude,
    magnitude,
    colorIndex: finiteNumber(input.colorIndex ?? input.bpRp ?? input.bv),
    spect: spectralType,
    spectralType,
    con: constellation,
    constellation,
    epoch: identifier(input.epoch) || STAR_EPOCH,
    coordinateFrame: identifier(input.coordinateFrame) || STAR_COORDINATE_FRAME,
    starClaimCode: identifier(input.starClaimCode ?? input.code),
    type: 'star',
  };
}
