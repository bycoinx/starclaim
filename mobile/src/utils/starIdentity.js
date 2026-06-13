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
    star?.id,
    star?.hip,
    star?.hip ? `HIP ${star.hip}` : null,
    star?.hd,
    star?.hd ? `HD ${star.hd}` : null,
    star?.proper,
    star?.properName,
    star?.name,
    star?.starClaimCode,
    star?.code,
  ]
    .filter((value) => value !== null && value !== undefined && value !== '')
    .map(normalizeText);
}

/**
 * Checks if a star matches a text query (used for search).
 * @param {Object} star - Star record
 * @param {string} query - User input
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
    id: star.id,
    hip: star.hip,
    hd: star.hd,
    properName: star.properName ?? star.proper,
    name: star.name,
    starClaimCode: star.starClaimCode ?? star.code,
    raHours: star.raHours,
    raDegrees: star.raDegrees,
    decDegrees: star.decDegrees,
    distanceParsec: star.distanceParsec,
    magnitude: star.magnitude,
    spectralType: star.spectralType,
    constellation: star.constellation,
  };
}