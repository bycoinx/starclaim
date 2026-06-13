/**
 * StarTarget represents a minimal set of fields needed to identify a star
 * across 2D map, 3D voyage, detail screens, and deep links.
 */
export const StarTargetShape = {
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
  /** Apparent magnitude */
  magnitude: 'number',
  /** Spectral type (O, B, A, F, G, K, M, etc.) */
  spectralType: 'string',
  /** Constellation name */
  constellation: 'string',
};

/**
 * Creates an empty StarTarget object.
 * @returns {Object} Empty star target
 */
export function createEmptyStarTarget() {
  return {
    id: undefined,
    hip: undefined,
    hd: undefined,
    properName: undefined,
    name: undefined,
    starClaimCode: undefined,
    raHours: undefined,
    raDegrees: undefined,
    decDegrees: undefined,
    distanceParsec: undefined,
    magnitude: undefined,
    spectralType: undefined,
    constellation: undefined,
  };
}

/**
 * Validates that an object contains at least one identifying field.
 * @param {Object} target
 * @returns {boolean}
 */
export function isValidStarTarget(target) {
  if (!target || typeof target !== 'object') return false;
  const { id, hip, hd, properName, name, starClaimCode } = target;
  return !!(
    id ||
    hip ||
    hd ||
    properName ||
    name ||
    starClaimCode
  );
}