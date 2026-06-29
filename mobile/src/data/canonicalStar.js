import { normalizeAngle } from '../utils/astronomy';

export const STAR_SCHEMA_VERSION = 1;
export const STAR_COORDINATE_FRAME = 'ICRS';
export const STAR_EPOCH = 'J2000.0';
export const HYG_UNKNOWN_DISTANCE_PARSEC = 100000;
export const DEFAULT_STAR_ASSET_VERSION = 'v1';
export const DEFAULT_OWNERSHIP_STATUS = 'available';

function finiteNumber(value) {
  if (value === null || value === undefined || value === '') return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function identifier(value) {
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

function optionalIdentifier(value) {
  const normalized = identifier(value);
  return normalized || null;
}

function nonNegativeInteger(value, fallback = 0) {
  const number = finiteNumber(value);
  if (number == null || number < 0) return fallback;
  return Math.floor(number);
}

function slugPart(value) {
  return identifier(value)
    .toLocaleLowerCase('en-US')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function createStarSlug(input = {}) {
  const explicitSlug = slugPart(input.slug);
  if (explicitSlug) return explicitSlug;

  const nameSlug = slugPart(input.displayName ?? input.properName ?? input.proper ?? input.name);
  const catalogSlug = slugPart(input.catalogId ?? input.canonicalId ?? input.sourceId ?? input.id);
  if (nameSlug && catalogSlug && nameSlug !== catalogSlug) return `${nameSlug}-${catalogSlug}`;
  return nameSlug || catalogSlug || 'unknown-star';
}

function deriveRarity(magnitude) {
  if (magnitude == null) return 'standard';
  if (magnitude <= 0) return 'legendary';
  if (magnitude <= 2) return 'rare';
  return 'standard';
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
  const gaiaSourceId = identifier(input.gaiaSourceId ?? input.gaiaId);
  const properName = identifier(input.properName ?? input.proper);
  const inputName = identifier(input.name);
  const spectralType = identifier(input.spectralType ?? input.spect);
  const constellation = identifier(input.constellation ?? input.con);
  const canonicalId = gaiaSourceId
    ? `gaia-dr3:${gaiaSourceId}`
    : hip
      ? `hip:${hip}`
      : `${source}:${sourceId}`;
  const catalogId = identifier(input.catalogId) || canonicalId;
  const displayName = identifier(input.displayName) || properName || inputName || catalogId;
  const name = inputName || properName || displayName;
  const slug = createStarSlug({
    slug: input.slug,
    displayName,
    name,
    properName,
    catalogId,
    canonicalId,
    sourceId,
  });

  return {
    schemaVersion: STAR_SCHEMA_VERSION,
    canonicalId,
    id: identifier(input.id || sourceId),
    slug,
    catalogId,
    source,
    sourceId,
    sourceCatalogVersion: identifier(options.sourceCatalogVersion || input.sourceCatalogVersion),
    gaiaId: gaiaSourceId,
    gaiaSourceId,
    hip,
    hd,
    name,
    displayName,
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
    distance: distanceParsec,
    distanceSource: explicitDistance != null ? source : parallaxMas > 0 ? 'parallax' : 'unknown',
    mag: magnitude,
    magnitude,
    colorIndex: finiteNumber(input.colorIndex ?? input.bpRp ?? input.bv),
    spect: spectralType,
    spectralType,
    temperature: finiteNumber(input.temperature),
    luminosity: finiteNumber(input.luminosity),
    con: constellation,
    constellation,
    category: identifier(input.category) || 'star',
    rarity: identifier(input.rarity) || deriveRarity(magnitude),
    ownershipStatus: identifier(input.ownershipStatus) || DEFAULT_OWNERSHIP_STATUS,
    ownerCount: nonNegativeInteger(input.ownerCount),
    storyCount: nonNegativeInteger(input.storyCount),
    certificateCount: nonNegativeInteger(input.certificateCount),
    assetVersion: identifier(input.assetVersion) || DEFAULT_STAR_ASSET_VERSION,
    createdAt: optionalIdentifier(input.createdAt),
    updatedAt: optionalIdentifier(input.updatedAt),
    epoch: identifier(input.epoch) || STAR_EPOCH,
    coordinateFrame: identifier(input.coordinateFrame) || STAR_COORDINATE_FRAME,
    starClaimCode: identifier(input.starClaimCode ?? input.code),
    type: 'star',
  };
}
