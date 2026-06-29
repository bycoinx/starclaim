import { createEmptyStarTarget, isValidStarTarget } from '../types/starTarget';

/**
 * Normalizes a string for case-insensitive, alphanumeric comparison.
 * @param {string} value
 * @returns {string}
 */
function normalizeText(value) {
  return String(value ?? '')
    .trim()
    .toLocaleLowerCase('en-US')
    .replace(/[^a-z0-9]+/g, '');
}

/**
 * Generates searchable tokens from a star record.
 * @param {Object} star - Star object containing id, hip, hd, proper, properName, name, starClaimCode, code
 * @returns {string[]}
 */
export function getStarSearchTokens(star) {
  return [
    star?.canonicalId,
    star?.slug,
    star?.catalogId,
    star?.sourceId,
    star?.gaiaId,
    star?.gaiaSourceId,
    star?.gaiaSourceId ? `Gaia DR3 ${star.gaiaSourceId}` : null,
    star?.id,
    star?.hip,
    star?.hip ? `HIP ${star.hip}` : null,
    star?.hd,
    star?.hd ? `HD ${star.hd}` : null,
    star?.star_id,
    star?.proper,
    star?.properName,
    star?.name,
    star?.displayName,
    star?.starClaimCode,
    star?.code,
  ]
    .filter((value) => value !== null && value !== undefined && value !== '')
    .map(normalizeText);
}

/**
 * Checks if a purchase record corresponds to the selected star.
 * @param {Object} purchase - Purchase record from storage
 * @param {Object} star - Star record from catalog
 * @returns {boolean}
 */
export function purchaseMatchesStar(purchase, star) {
  if (!purchase || !star) return false;

  const purchaseTokens = [
    purchase.starId,
    purchase.hip,
    purchase.hd,
    purchase.starClaimCode,
    purchase.code,
    purchase.name,
  ]
    .filter((value) => value !== null && value !== undefined && value !== '')
    .map(normalizeText);

  if (purchaseTokens.length === 0) return false;

  const starTokens = new Set(getStarSearchTokens(star));
  return purchaseTokens.some((token) => starTokens.has(token));
}

/**
 * Checks if a star matches a target identifier (used for linking/navigation).
 * @param {Object} star - Star record from catalog
 * @param {Object} target - StarTarget or partial identifier (may include starId, id, hip, hd, starClaimCode, code, name)
 * @returns {boolean}
 */
export function starMatchesQuery(star, query) {
  const normalizedQuery = normalizeText(query);
  if (!normalizedQuery) return false;
  return getStarSearchTokens(star).some((token) => token.includes(normalizedQuery));
}

/**
 * Checks if a star matches a target identifier (used for linking/navigation).
 * @param {Object} star - Star record from catalog
 * @param {Object} target - StarTarget or partial identifier (may include starId, id, hip, hd, starClaimCode, code, name)
 * @returns {boolean}
 */
export function starMatchesTarget(star, target) {
  const candidates = [
    target?.canonicalId,
    target?.slug,
    target?.catalogId,
    target?.sourceId,
    target?.gaiaId,
    target?.gaiaSourceId,
    target?.starId, // from deep link or external reference
    target?.id,
    target?.hip,
    target?.hd,
    target?.starClaimCode,
    target?.code,
    target?.name,
  ]
    .filter((value) => value !== null && value !== undefined && value !== '')
    .map(normalizeText);
  if (candidates.length === 0) return false;

  const starTokens = new Set(getStarSearchTokens(star));
  return candidates.some((candidate) => starTokens.has(candidate));
}

/**
 * Resolves a star object from the catalog that matches the given target.
 * @param {Object[]} stars - Array of star records
 * @param {Object} target - StarTarget or partial identifier
 * @returns {Object|null} Matching star or null
 */
export function resolveStarTarget(stars, target) {
  if (!isValidStarTarget(target)) return null;
  return stars.find((star) => starMatchesTarget(star, target)) || null;
}

/**
 * Creates a StarTarget object from a star record (for passing between screens).
 * @param {Object} star - Full star record from catalog or API
 * @returns {Object} StarTarget-compatible object
 */
export function createStarTargetFromStar(star) {
  if (!star) return createEmptyStarTarget();
  return {
    schemaVersion: star.schemaVersion,
    canonicalId: star.canonicalId,
    slug: star.slug,
    catalogId: star.catalogId,
    source: star.source,
    sourceId: star.sourceId,
    gaiaId: star.gaiaId,
    gaiaSourceId: star.gaiaSourceId,
    id: star.id,
    hip: star.hip,
    hd: star.hd,
    properName: star.properName ?? star.proper,
    name: star.name,
    displayName: star.displayName,
    starClaimCode: star.starClaimCode ?? star.code,
    raHours: star.raHours,
    raDegrees: star.raDegrees,
    decDegrees: star.decDegrees,
    distanceParsec: star.distanceParsec,
    distance: star.distance,
    magnitude: star.magnitude,
    spectralType: star.spectralType,
    temperature: star.temperature,
    luminosity: star.luminosity,
    constellation: star.constellation,
    category: star.category,
    rarity: star.rarity,
    ownershipStatus: star.ownershipStatus,
    ownerCount: star.ownerCount,
    storyCount: star.storyCount,
    certificateCount: star.certificateCount,
    assetVersion: star.assetVersion,
    createdAt: star.createdAt,
    updatedAt: star.updatedAt,
    epoch: star.epoch,
    coordinateFrame: star.coordinateFrame,
    colorIndex: star.colorIndex,
  };
}
