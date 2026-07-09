/**
 * P0.2 - StarIdentity Platform Contract
 * =====================================
 * 
 * This is the canonical star identity model used across all StarClaim surfaces:
 * - Mobile Sky Live 2D Map
 * - Mobile 3D Voyage
 * - Mobile Star Catalog
 * - Web Stars / Marketplace / StarVault
 * - Backend API responses
 * 
 * All interfaces (2D, 3D, marketplace, ownership) consume this unified contract.
 * No component should assemble star data differently or maintain duplicate star metadata.
 */

/**
 * Canonical Star Identity - Single source of truth for star data
 * 
 * @typedef {Object} StarIdentity
 * @property {string} id - Unique stable identifier (e.g., "sirius-hip-32349")
 * @property {string} canonicalId - Versioned canonical reference (e.g., "hip:32349" or "gaia-dr3:5793498...")
 * @property {string} source - Origin catalog ("hyg", "gaia-dr3", "hipparcos", "hd")
 * @property {string} sourceId - Original catalog record ID
 * @property {string} sourceCatalogVersion - Version of source catalog (e.g., "4.1" for HYG)
 * 
 * Catalog Cross-References
 * @property {string|null} hip - Hipparcos catalog ID (HIP 32349)
 * @property {string|null} hd - Henry Draper catalog ID (HD 48915)
 * @property {string|null} gaiaSourceId - Gaia DR3 source_id (5793498453934637824)
 * 
 * Equatorial Coordinates (ICRS, J2000.0 epoch)
 * @property {number|null} raDegrees - Right Ascension in degrees [0, 360)
 * @property {number|null} raHours - Right Ascension in hours [0, 24)
 * @property {number|null} decDegrees - Declination in degrees [-90, 90]
 * 
 * Distance & Parallax
 * @property {number|null} distanceParsec - Distance in parsecs (parallax > 0 converted)
 * @property {number|null} parallaxMas - Parallax in milliarcseconds (>0 valid)
 * @property {string} distanceSource - Origin of distance ("hyg", "parallax", "unknown", "gaia")
 * 
 * Photometry
 * @property {number|null} magnitude - Visual magnitude (V-band)
 * @property {number|null} colorIndex - BP-RP or B-V color index
 * @property {number|null} temperature - Effective temperature in Kelvin
 * @property {number|null} luminosity - Luminosity relative to Sun
 * 
 * Classification
 * @property {string|null} spectralType - Spectral classification (A1V, G2V, M5)
 * @property {string|null} constellation - 3-letter IAU constellation code (CMa, UMa, Ori)
 * 
 * Naming & Display
 * @property {string} name - Best available name (proper > input > displayName)
 * @property {string} properName - Traditional proper name (Sirius, Vega, Polaris)
 * @property {string} displayName - Display-optimized name
 * @property {string} slug - URL-safe slug (sirius-hip-32349)
 * 
 * StarClaim Specific
 * @property {string|null} starClaimCode - Unique StarClaim code (SIRIUS-001, VEGA-042)
 * 
 * Schema Version & Status
 * @property {number} schemaVersion - Identity schema version (currently 1)
 * @property {string} status - Ownership status (available, owned, reserved, featured)
 * 
 * @example
 * const sirius = {
 *   id: "sirius-hip-32349",
 *   canonicalId: "hip:32349",
 *   source: "hyg",
 *   sourceId: "32349",
 *   sourceCatalogVersion: "4.1",
 *   hip: "32349",
 *   hd: "48915",
 *   gaiaSourceId: "5793498453934637824",
 *   raDegrees: 101.2871,
 *   raHours: 6.7525,
 *   decDegrees: -16.7161,
 *   distanceParsec: 2.64,
 *   parallaxMas: 379.21,
 *   distanceSource: "parallax",
 *   magnitude: -1.46,
 *   colorIndex: 0.00,
 *   temperature: 9940,
 *   luminosity: 26.0,
 *   spectralType: "A1V",
 *   constellation: "CMa",
 *   name: "Sirius",
 *   properName: "Sirius",
 *   displayName: "Sirius",
 *   slug: "sirius-hip-32349",
 *   starClaimCode: "SIRIUS-001",
 *   schemaVersion: 1,
 *   status: "available"
 * }
 */

// Type guard: ensure object is valid StarIdentity
export function isStarIdentity(obj) {
  if (!obj || typeof obj !== 'object') return false;
  return (
    typeof obj.id === 'string'
    && typeof obj.canonicalId === 'string'
    && typeof obj.source === 'string'
    && typeof obj.slug === 'string'
    && typeof obj.schemaVersion === 'number'
  );
}

/**
 * Validate star identity against schema
 * @param {*} obj
 * @returns {{valid: boolean, errors: string[]}}
 */
export function validateStarIdentity(obj) {
  const errors = [];

  if (!obj || typeof obj !== 'object') {
    return { valid: false, errors: ['Not an object'] };
  }

  // Required fields
  if (typeof obj.id !== 'string' || !obj.id.trim()) {
    errors.push('id must be non-empty string');
  }
  if (typeof obj.canonicalId !== 'string' || !obj.canonicalId.trim()) {
    errors.push('canonicalId must be non-empty string');
  }
  if (typeof obj.slug !== 'string' || !obj.slug.trim()) {
    errors.push('slug must be non-empty string');
  }
  if (obj.schemaVersion !== 1) {
    errors.push(`schemaVersion must be 1, got ${obj.schemaVersion}`);
  }

  // Coordinate validation
  if (obj.raDegrees != null) {
    if (typeof obj.raDegrees !== 'number' || obj.raDegrees < 0 || obj.raDegrees >= 360) {
      errors.push('raDegrees must be number in [0, 360)');
    }
  }
  if (obj.decDegrees != null) {
    if (typeof obj.decDegrees !== 'number' || obj.decDegrees < -90 || obj.decDegrees > 90) {
      errors.push('decDegrees must be number in [-90, 90]');
    }
  }
  if (obj.magnitude != null && typeof obj.magnitude !== 'number') {
    errors.push('magnitude must be null or number');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Extract core astronomy data from StarIdentity
 * Useful for 2D/3D renderers that only need position & appearance
 */
export function extractAstronomyData(star) {
  if (!isStarIdentity(star)) return null;
  return {
    id: star.id,
    hip: star.hip,
    hd: star.hd,
    raDegrees: star.raDegrees,
    decDegrees: star.decDegrees,
    magnitude: star.magnitude,
    spectralType: star.spectralType,
    distanceParsec: star.distanceParsec,
    constellation: star.constellation,
  };
}

/**
 * Extract display data from StarIdentity
 * Useful for UI cards that need name/appearance/ownership
 */
export function extractDisplayData(star) {
  if (!isStarIdentity(star)) return null;
  return {
    id: star.id,
    slug: star.slug,
    name: star.displayName || star.properName || star.name,
    properName: star.properName,
    constellation: star.constellation,
    magnitude: star.magnitude,
    spectralType: star.spectralType,
    status: star.status || 'available',
    starClaimCode: star.starClaimCode,
  };
}

/**
 * Resolve target star using multiple lookups
 * Input can be: starId, HIP number, HD number, Gaia source_id, or StarClaim code
 */
export function resolveStar(catalog, query) {
  if (!catalog || !query) return null;
  
  // Direct ID match
  let found = catalog.find((s) => s.id === query);
  if (found) return found;

  // HIP match
  found = catalog.find((s) => s.hip === String(query));
  if (found) return found;

  // HD match
  found = catalog.find((s) => s.hd === String(query));
  if (found) return found;

  // Gaia source_id match
  found = catalog.find((s) => s.gaiaSourceId === String(query));
  if (found) return found;

  // StarClaim code match
  found = catalog.find((s) => s.starClaimCode?.toUpperCase() === String(query).toUpperCase());
  if (found) return found;

  // Slug match
  found = catalog.find((s) => s.slug === String(query).toLowerCase());
  if (found) return found;

  // Name match (case-insensitive, partial)
  const queryLower = String(query).toLowerCase();
  found = catalog.find((s) =>
    s.properName?.toLowerCase().includes(queryLower)
    || s.displayName?.toLowerCase().includes(queryLower)
  );

  return found || null;
}
