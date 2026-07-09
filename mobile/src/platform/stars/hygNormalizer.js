/**
 * P0.2 - HYG → StarIdentity Normalizer
 * 
 * Converts HYG (Yale Bright Star Catalog) CSV records into canonical StarIdentity objects
 * Handles missing/invalid data with consistent fallback policies
 */

import { createCanonicalStar } from '../../data/canonicalStar';

/**
 * Normalize HYG CSV record to StarIdentity
 * 
 * @param {Object} hygRecord - Raw HYG record from CSV or fixture
 * @param {number} hygRecord.id - HYG internal ID
 * @param {number|null} hygRecord.hip - Hipparcos catalog ID
 * @param {number|null} hygRecord.hd - Henry Draper catalog ID
 * @param {string} hygRecord.proper - Proper name
 * @param {number} hygRecord.ra - RA in hours [0, 24)
 * @param {number} hygRecord.dec - Dec in degrees [-90, 90]
 * @param {number|null} hygRecord.dist - Distance in parsecs
 * @param {number} hygRecord.mag - Visual magnitude
 * @param {string} hygRecord.spect - Spectral type
 * @param {string} hygRecord.con - 3-letter constellation code
 * 
 * @returns {StarIdentity|null} Canonical star identity or null if validation fails
 */
export function normalizeHygRecord(hygRecord) {
  if (!hygRecord) return null;

  // Validate essential fields
  const ra = Number(hygRecord.ra);
  const dec = Number(hygRecord.dec);
  const mag = Number(hygRecord.mag);

  if (!Number.isFinite(ra) || !Number.isFinite(dec) || !Number.isFinite(mag)) {
    console.warn('HYG normalization: invalid RA/Dec/Mag', hygRecord.id);
    return null;
  }

  if (dec < -90 || dec > 90) {
    console.warn('HYG normalization: Dec out of range', hygRecord.id, dec);
    return null;
  }

  // Distance handling with fallback policy
  let distanceParsec = null;
  if (hygRecord.dist && Number.isFinite(Number(hygRecord.dist))) {
    const dist = Number(hygRecord.dist);
    // Filter unrealistic distances (HYG uses 100000+ for unknown)
    if (dist > 0 && dist < 100000) {
      distanceParsec = dist;
    }
  }

  // Create canonical star using existing factory
  const star = createCanonicalStar(
    {
      id: String(hygRecord.id),
      hip: hygRecord.hip ? String(hygRecord.hip) : null,
      hd: hygRecord.hd ? String(hygRecord.hd) : null,
      properName: hygRecord.proper || '',
      raHours: ra,
      decDegrees: dec,
      distanceParsec,
      magnitude: mag,
      spectralType: hygRecord.spect || '',
      constellation: hygRecord.con || '',
    },
    {
      source: 'hyg',
      sourceId: String(hygRecord.id),
      sourceCatalogVersion: '4.1',
    }
  );

  if (!star) {
    console.warn('HYG normalization: createCanonicalStar failed', hygRecord.id);
    return null;
  }

  return star;
}

/**
 * Batch normalize HYG records with progress callback
 * Yields control every N records to prevent blocking
 * 
 * @param {Array<Object>} hygRecords - Array of HYG records
 * @param {Object} options
 * @param {number} options.yieldInterval - Yield control every N records (default 2500)
 * @param {Function} options.onProgress - Progress callback(processed, total)
 * 
 * @returns {Promise<StarIdentity[]>} Array of normalized stars
 */
export async function normalizeHygCatalog(hygRecords, options = {}) {
  const { yieldInterval = 2500, onProgress = null } = options;
  const normalized = [];
  let skipped = 0;

  for (let i = 0; i < hygRecords.length; i += 1) {
    const star = normalizeHygRecord(hygRecords[i]);
    if (star) {
      normalized.push(star);
    } else {
      skipped += 1;
    }

    // Yield control every N records
    if (i % yieldInterval === 0) {
      // eslint-disable-next-line no-await-in-loop
      await new Promise((resolve) => {
        setTimeout(resolve, 0);
      });
      if (onProgress) {
        onProgress(i + 1, hygRecords.length, skipped);
      }
    }
  }

  console.log(`HYG Normalization: ${normalized.length} valid, ${skipped} skipped of ${hygRecords.length}`);
  return normalized;
}

/**
 * Validate normalized catalog
 * Checks for duplicate IDs, coordinate extremes, etc.
 */
export function validateNormalizedCatalog(stars) {
  const issues = {
    duplicateIds: [],
    duplicateHips: [],
    extremeMagnitude: [],
    extremeDistance: [],
  };

  const idSet = new Set();
  const hipSet = new Set();

  for (const star of stars) {
    // Duplicate ID check
    if (idSet.has(star.id)) {
      issues.duplicateIds.push(star.id);
    }
    idSet.add(star.id);

    // Duplicate HIP check
    if (star.hip) {
      if (hipSet.has(star.hip)) {
        issues.duplicateHips.push(star.hip);
      }
      hipSet.add(star.hip);
    }

    // Magnitude extremes
    if (star.magnitude != null && (star.magnitude < -5 || star.magnitude > 20)) {
      issues.extremeMagnitude.push(`${star.name}: ${star.magnitude}`);
    }

    // Distance extremes
    if (star.distanceParsec != null && (star.distanceParsec < 0 || star.distanceParsec > 10000)) {
      issues.extremeDistance.push(`${star.name}: ${star.distanceParsec}pc`);
    }
  }

  return {
    valid: Object.values(issues).every((arr) => arr.length === 0),
    issues,
    catalogSize: stars.length,
  };
}

/**
 * Export catalog statistics for audit
 */
export function catalogStatistics(stars) {
  if (!stars || stars.length === 0) {
    return { size: 0 };
  }

  const withHip = stars.filter((s) => s.hip).length;
  const withHd = stars.filter((s) => s.hd).length;
  const withDistance = stars.filter((s) => s.distanceParsec != null).length;
  const withProper = stars.filter((s) => s.properName).length;

  const magnitudes = stars.map((s) => s.magnitude).filter((m) => m != null);
  const distances = stars.map((s) => s.distanceParsec).filter((d) => d != null);

  return {
    size: stars.length,
    withHip,
    withHd,
    withDistance,
    withProper,
    magnitudeRange: magnitudes.length > 0 ? {
      min: Math.min(...magnitudes),
      max: Math.max(...magnitudes),
      mean: magnitudes.reduce((a, b) => a + b, 0) / magnitudes.length,
    } : null,
    distanceRange: distances.length > 0 ? {
      min: Math.min(...distances),
      max: Math.max(...distances),
      mean: distances.reduce((a, b) => a + b, 0) / distances.length,
    } : null,
  };
}
