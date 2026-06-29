/**
 * StarTarget represents a minimal set of fields needed to identify a star
 * across 2D map, 3D voyage, detail screens, and deep links.
 */
export const StarTargetShape = {
  /** Canonical schema version */
  schemaVersion: 'number',
  /** Stable cross-catalog identity */
  canonicalId: 'string',
  /** URL-safe identity used by web/mobile routes and future assets */
  slug: 'string',
  /** Human-readable catalog identity such as hip:32349 or gaia-dr3:... */
  catalogId: 'string',
  /** Source catalog name and source-local identifier */
  source: 'string',
  sourceId: 'string',
  /** Gaia DR3 source identifier */
  gaiaId: 'string',
  gaiaSourceId: 'string',
  /** Unique identifier (Mongo _id or UUID) */
  id: 'string',
  /** HIP catalogue number */
  hip: 'number|string',
  /** HD catalogue number */
  hd: 'number|string',
  /** Proper name (e.g., Sirius) */
  properName: 'string',
  /** Alternative name */
  name: 'string',
  /** Preferred UI label */
  displayName: 'string',
  /** StarClaim code (custom identifier) */
  starClaimCode: 'string',
  /** Right Ascension in hours */
  raHours: 'number',
  /** Right Ascension in degrees */
  raDegrees: 'number',
  /** Declination in degrees */
  decDegrees: 'number',
  /** Distance from Earth in parsecs */
  distanceParsec: 'number',
  /** Renderer-independent distance alias */
  distance: 'number',
  /** Apparent magnitude */
  magnitude: 'number',
  /** Spectral type (O, B, A, F, G, K, M, etc.) */
  spectralType: 'string',
  temperature: 'number',
  luminosity: 'number',
  /** Constellation name */
  constellation: 'string',
  category: 'string',
  rarity: 'string',
  ownershipStatus: 'string',
  ownerCount: 'number',
  storyCount: 'number',
  certificateCount: 'number',
  assetVersion: 'string',
  createdAt: 'string',
  updatedAt: 'string',
  /** Reference epoch and coordinate frame */
  epoch: 'string',
  coordinateFrame: 'string',
  /** B-V or source-compatible color index */
  colorIndex: 'number',
};

/**
 * Creates an empty StarTarget object.
 * @returns {Object} Empty star target
 */
export function createEmptyStarTarget() {
  return {
    schemaVersion: undefined,
    canonicalId: undefined,
    slug: undefined,
    catalogId: undefined,
    source: undefined,
    sourceId: undefined,
    gaiaId: undefined,
    gaiaSourceId: undefined,
    id: undefined,
    hip: undefined,
    hd: undefined,
    properName: undefined,
    name: undefined,
    displayName: undefined,
    starClaimCode: undefined,
    raHours: undefined,
    raDegrees: undefined,
    decDegrees: undefined,
    distanceParsec: undefined,
    distance: undefined,
    magnitude: undefined,
    spectralType: undefined,
    temperature: undefined,
    luminosity: undefined,
    constellation: undefined,
    category: undefined,
    rarity: undefined,
    ownershipStatus: undefined,
    ownerCount: undefined,
    storyCount: undefined,
    certificateCount: undefined,
    assetVersion: undefined,
    createdAt: undefined,
    updatedAt: undefined,
    epoch: undefined,
    coordinateFrame: undefined,
    colorIndex: undefined,
  };
}

/**
 * Validates that an object contains at least one identifying field.
 * @param {Object} target
 * @returns {boolean}
 */
export function isValidStarTarget(target) {
  if (!target || typeof target !== 'object') return false;
  const {
    canonicalId,
    slug,
    catalogId,
    sourceId,
    gaiaId,
    gaiaSourceId,
    id,
    hip,
    hd,
    properName,
    name,
    starClaimCode,
  } = target;
  return !!(
    canonicalId ||
    slug ||
    catalogId ||
    sourceId ||
    gaiaId ||
    gaiaSourceId ||
    id ||
    hip ||
    hd ||
    properName ||
    name ||
    starClaimCode
  );
}
