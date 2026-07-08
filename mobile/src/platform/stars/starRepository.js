import { ensureStarData } from '../../data/starLoader';
import { createCanonicalStar } from '../../data/canonicalStar';
import { createStarAsset } from '../../shared/starAsset';
import { CONFIG } from '../../../constants/Config';
import { isStarIdentity, resolveStar as resolveStarFromList } from './starIdentity.types';

const LISTING_PRICE_BASE = 250;
export const CATALOG_TARGET_SIZE = 10000;

function computeListingPrice(star, index) {
  const magnitude = Number(star.magnitude ?? star.mag ?? 5);
  const distance = Number(star.distanceParsec ?? star.distance ?? 1000);
  const tier = String(star.tier || star.rarity || 'standard').toLowerCase();
  const baseByTier = {
    legendary: 2800,
    zodiac: 1650,
    supernova: 1200,
    nova: 780,
    standard: 360,
  };
  const base = baseByTier[tier] || baseByTier.standard;
  const magnitudeAdjustment = magnitude < -0.5 ? 320 : magnitude < 1 ? 200 : magnitude < 3 ? 110 : magnitude < 5 ? 55 : 20;
  const distanceAdjustment = distance < 15 ? 220 : distance < 60 ? 130 : distance < 300 ? 70 : distance < 1000 ? 25 : 0;
  const brightnessBand = magnitude < -0.5 ? 140 : magnitude < 1 ? 90 : magnitude < 3 ? 45 : 0;
  const indexAdjustment = index % 17 === 0 ? 140 : index % 7 === 0 ? 60 : 0;
  return Math.round(base + magnitudeAdjustment + distanceAdjustment + brightnessBand + indexAdjustment + LISTING_PRICE_BASE);
}

let localCache = [];
let localInitialized = false;

export async function loadLocalStars(forceReload = false) {
  if (localInitialized && !forceReload) {
    return localCache;
  }

  try {
    const rawCatalog = await ensureStarData();
    // Local catalog stars returned by ensureStarData are already canonical objects.
    // We just ensure they have their asset mapping.
    localCache = (rawCatalog || []).map((star) => {
      const asset = createStarAsset({
        starId: star.id,
        slug: star.slug,
        version: star.assetVersion
      }, star);

      return {
        ...star,
        asset,
        localCatalog: true,
      };
    });

    localInitialized = true;
    return localCache;
  } catch (error) {
    console.warn('starRepository: Failed to load local stars catalog:', error);
    return [];
  }
}

function normalizeRemoteInput(item = {}) {
  const sourceId = item.sourceId || item.source_id || item.star_id || item.starId || item.id || item.code;
  return {
    ...item,
    id: item.id || item.star_id || item.starId || item.code,
    sourceId,
    raHours: item.raHours ?? item.ra_hours ?? item.ra,
    raDegrees: item.raDegrees ?? item.ra_degrees ?? item.ra_deg,
    decDegrees: item.decDegrees ?? item.dec_degrees ?? item.dec_deg ?? item.dec,
    distanceParsec: item.distanceParsec ?? item.distance_parsec ?? item.distance ?? item.dist,
    magnitude: item.magnitude ?? item.mag,
    spectralType: item.spectralType ?? item.spectral_type ?? item.spect,
    properName: item.properName ?? item.proper_name ?? item.proper,
    displayName: item.displayName ?? item.display_name ?? item.name,
    gaiaSourceId: item.gaiaSourceId ?? item.gaia_source_id ?? item.gaiaId,
    colorIndex: item.colorIndex ?? item.color_index,
    starClaimCode: item.starClaimCode ?? item.code,
    ownerCount: item.ownerCount ?? (item.owner_id || item.owner_name ? 1 : 0),
    ownershipStatus: item.ownershipStatus ?? item.status ?? (item.owner_id || item.owner_name ? 'claimed' : 'available'),
    storyCount: item.storyCount ?? item.stories_count ?? 0,
    certificateCount: item.certificateCount ?? item.certificate_count ?? 0,
  };
}

export async function fetchRemoteStars(params = {}) {
  const query = typeof params === 'number'
    ? { limit: params, sort: 'price_asc' }
    : { limit: CATALOG_TARGET_SIZE, sort: 'price_asc', ...params };
  const baseUrl = await CONFIG.getAPIUrl();
  try {
    const searchParams = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.set(key, String(value));
      }
    });
    const response = await fetch(`${baseUrl}/api/stars?${searchParams.toString()}`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const data = await response.json();
    return (data || []).map((item, index) => {
      const normalizedInput = normalizeRemoteInput(item);
      const canonical = createCanonicalStar(normalizedInput, {
        source: item.source || 'remote',
        sourceId: normalizedInput.sourceId,
      }) || {
        ...item,
        id: item.star_id || item.starId || item.id || item.code,
        slug: item.slug || item.code || item.star_id,
        name: item.name || item.displayName || item.properName || item.proper || `Star ${item.code || item.star_id}`,
        canonicalId: item.canonicalId || item.canonical_id || normalizedInput.sourceId,
      };

      const asset = createStarAsset({
        starId: canonical.id || canonical.starId || canonical.star_id || canonical.code,
        slug: canonical.slug || canonical.code || canonical.star_id || 'unknown',
        version: canonical.assetVersion || canonical.version || 'v1'
      }, canonical);

      const price = item.price ?? computeListingPrice(canonical, index);
      return {
        ...canonical,
        asset,
        localCatalog: false,
        tier: item.tier || canonical.tier || canonical.rarity || 'standard',
        code: item.code || canonical.starClaimCode,
        isClaimed: Boolean(item.owner_id || item.owner_name || item.claimed || item.status === 'claimed'),
        ownerName: item.owner_name || item.ownerName || null,
        price,
      };
    });
  } catch (error) {
    console.warn(`starRepository: Failed to fetch remote stars from ${baseUrl}:`, error);
    return [];
  }
}

export async function countRemoteStars(params = {}) {
  const baseUrl = await CONFIG.getAPIUrl();
  try {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.set(key, String(value));
      }
    });
    const suffix = searchParams.toString();
    const response = await fetch(`${baseUrl}/api/stars/count${suffix ? `?${suffix}` : ''}`);
    if (!response.ok) {
      if (response.status === 404 || response.status === 405) {
        return null;
      }
      throw new Error(`HTTP ${response.status}`);
    }
    const data = await response.json();
    return Number(data?.count || 0);
  } catch (error) {
    console.warn(`starRepository: Failed to count remote stars from ${baseUrl}:`, error);
    return null;
  }
}

export async function loadAllStars(limit = CATALOG_TARGET_SIZE) {
  // Remote registry is the shared source of truth. Local HYG remains an offline fallback.
  const remote = await fetchRemoteStars({ limit, sort: 'price_asc' });
  if (remote.length > 0) {
    return remote.slice(0, limit);
  }

  const local = await loadLocalStars();
  const seenIds = new Set();
  const combined = [];

  for (const star of local) {
    if (star && star.canonicalId && !seenIds.has(star.canonicalId)) {
      combined.push(star);
      seenIds.add(star.canonicalId);
    }
  }

  return combined.slice(0, limit);
}

export function searchStars(query, starsList = []) {
  if (!query || typeof query !== 'string') return starsList;
  const normalizedQuery = query.toLowerCase().trim();
  return starsList.filter((star) => {
    return (
      (star.name && star.name.toLowerCase().includes(normalizedQuery)) ||
      (star.starClaimCode && star.starClaimCode.toLowerCase().includes(normalizedQuery)) ||
      (star.constellation && star.constellation.toLowerCase().includes(normalizedQuery)) ||
      (star.displayName && star.displayName.toLowerCase().includes(normalizedQuery)) ||
      (star.slug && star.slug.toLowerCase().includes(normalizedQuery))
    );
  });
}

export function queryStars(params = {}, starsList = []) {
  return starsList.filter((star) => {
    if (params.isClaimed !== undefined && (star.ownershipStatus === 'claimed') !== params.isClaimed) {
      return false;
    }
    if (params.constellation && star.constellation !== params.constellation) {
      return false;
    }
    if (params.spectralType) {
      const typeChar = star.spectralType ? star.spectralType.charAt(0).toUpperCase() : '';
      if (typeChar !== params.spectralType.toUpperCase()) {
        return false;
      }
    }
    if (params.tier && star.rarity !== params.tier && star.tier !== params.tier) {
      return false;
    }
    return true;
  });
}

export function getConstellations(starsList = []) {
  const list = starsList
    .map((s) => s.constellation)
    .filter((c) => c && c !== 'Bilinmiyor');
  return Array.from(new Set(list)).sort();
}

export function getSpectralTypes(starsList = []) {
  const list = starsList
    .map((s) => (s.spectralType ? s.spectralType.charAt(0).toUpperCase() : null))
    .filter((letter) => ['O', 'B', 'A', 'F', 'G', 'K', 'M'].includes(letter));
  return Array.from(new Set(list)).sort();
}

// P0.2 Contract Functions ================================================

/**
 * Resolve star by multiple identifiers (P0.2 contract)
 * Works with: id, hip, hd, gaiaSourceId, starClaimCode, slug, name
 */
export function resolveStar(catalog, query) {
  return resolveStarFromList(catalog, query);
}

/**
 * Get canonical stars that match criteria (P0.2 contract)
 */
export function queryCatalog(catalog, criteria = {}) {
  if (!catalog || !Array.isArray(catalog)) return [];

  let results = catalog.filter(isStarIdentity);

  // Filter by constellation
  if (criteria.constellation) {
    results = results.filter((s) => s.constellation === criteria.constellation.toUpperCase());
  }

  // Filter by magnitude range
  if (criteria.magMin != null) {
    results = results.filter((s) => s.magnitude != null && s.magnitude >= criteria.magMin);
  }
  if (criteria.magMax != null) {
    results = results.filter((s) => s.magnitude != null && s.magnitude <= criteria.magMax);
  }

  // Filter by distance range
  if (criteria.distMin != null) {
    results = results.filter((s) => s.distanceParsec != null && s.distanceParsec >= criteria.distMin);
  }
  if (criteria.distMax != null) {
    results = results.filter((s) => s.distanceParsec != null && s.distanceParsec <= criteria.distMax);
  }

  // Fuzzy search on multiple fields
  if (criteria.search) {
    const query = criteria.search.toLowerCase();
    results = results.filter(
      (s) => s.id.toLowerCase().includes(query)
        || s.name.toLowerCase().includes(query)
        || (s.hip && s.hip.includes(query))
        || (s.hd && s.hd.includes(query))
        || (s.starClaimCode && s.starClaimCode.toLowerCase().includes(query))
    );
  }

  return results;
}

/**
 * Sort stars by P0.2 contract (field; prefix "-" for descending)
 */
export function sortCatalog(stars, sortBy = 'name') {
  if (!stars || stars.length === 0) return stars;

  const descending = sortBy.startsWith('-');
  const field = descending ? sortBy.slice(1) : sortBy;
  const copy = [...stars];

  copy.sort((a, b) => {
    let aVal = a[field];
    let bVal = b[field];

    if (aVal == null && bVal == null) return 0;
    if (aVal == null) return descending ? -1 : 1;
    if (bVal == null) return descending ? 1 : -1;

    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return descending ? bVal - aVal : aVal - bVal;
    }

    const aStr = String(aVal).toLowerCase();
    const bStr = String(bVal).toLowerCase();
    const cmp = aStr.localeCompare(bStr);
    return descending ? -cmp : cmp;
  });

  return copy;
}

/**
 * Get catalog statistics (P0.2 audit)
 */
export function getCatalogStatistics(catalog) {
  if (!catalog || !Array.isArray(catalog)) return { size: 0 };

  const valid = catalog.filter(isStarIdentity);
  const withHip = valid.filter((s) => s.hip).length;
  const withProper = valid.filter((s) => s.properName).length;
  const withDistance = valid.filter((s) => s.distanceParsec != null).length;

  const magnitudes = valid.map((s) => s.magnitude).filter((m) => m != null);
  const distances = valid.map((s) => s.distanceParsec).filter((d) => d != null);

  return {
    size: valid.length,
    valid: valid.length,
    invalid: catalog.length - valid.length,
    withHip,
    withProper,
    withDistance,
    magnitudeStats: magnitudes.length > 0 ? {
      min: Math.min(...magnitudes),
      max: Math.max(...magnitudes),
      mean: magnitudes.reduce((a, b) => a + b, 0) / magnitudes.length,
    } : null,
    distanceStats: distances.length > 0 ? {
      min: Math.min(...distances),
      max: Math.max(...distances),
      mean: distances.reduce((a, b) => a + b, 0) / distances.length,
    } : null,
  };
}
