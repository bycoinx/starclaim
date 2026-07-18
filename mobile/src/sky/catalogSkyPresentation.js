import { normalizeRaDelta, raDecToAltAz } from '../utils/astronomy';

export const CATALOG_SKY_COLORS = Object.freeze({
  owned: '#E6BC4A',
  claimed: '#FF5C67',
  available: '#42D6A4',
  unlisted: '#8290A8',
  selected: '#7EBEFF',
  default: '#7893B5',
});

function identityKeys(star = {}) {
  return [
    star.canonicalId,
    star.canonical_id,
    star.hip && `hip:${star.hip}`,
    star.id && `id:${star.id}`,
    star.starId && `id:${star.starId}`,
    star.star_id && `id:${star.star_id}`,
    star.code && `code:${star.code}`,
  ].filter(Boolean).map(String);
}

export function normalizeAvailabilityState(star = {}) {
  if (star.availabilityState) return star.availabilityState;
  if (star.isOwnedByViewer) return 'owned';
  if (star.isClaimed || star.ownershipStatus === 'claimed') return 'claimed';
  if (star.claimable === false) return 'unlisted';
  return 'available';
}

export function buildCatalogPresentationIndex(catalogStars = []) {
  const index = new Map();
  catalogStars.forEach((star) => {
    const presentation = {
      canonicalId: star.canonicalId || star.canonical_id,
      iauCode: star.iauCode || star.constellationCode,
      constellation: star.constellation,
      bayerDesignation: star.bayerDesignation,
      asterisms: star.asterisms || [],
      availabilityState: normalizeAvailabilityState(star),
      claimable: Boolean(star.claimable),
      isOwnedByViewer: Boolean(star.isOwnedByViewer),
      isClaimed: Boolean(star.isClaimed),
      catalogVersion: star.catalogVersion,
      price: star.price,
      tier: star.tier,
    };
    identityKeys(star).forEach((key) => index.set(key, presentation));
  });
  return index;
}

export function enrichStarWithCatalogPresentation(star, index) {
  const presentation = identityKeys(star).map((key) => index.get(key)).find(Boolean);
  return presentation ? { ...star, ...presentation } : star;
}

function summarizeConstellationState(collection = {}) {
  if (collection.isComplete || collection.owned > 0) return 'owned';
  if (collection.available > 0) return 'available';
  if (collection.claimed > 0) return 'claimed';
  return 'unlisted';
}

export function buildConstellationStateIndex(collections = []) {
  const index = new Map();
  collections.forEach((collection) => {
    const summary = {
      state: summarizeConstellationState(collection),
      total: collection.total || 0,
      owned: collection.owned || 0,
      claimed: collection.claimed || 0,
      available: collection.available || 0,
      completionPercent: collection.completionPercent || 0,
    };
    [collection.key, collection.iauCode, collection.name]
      .filter(Boolean)
      .forEach((key) => index.set(String(key).toLowerCase(), summary));
  });
  return index;
}

export function resolveConstellationState(index, ...keys) {
  for (const key of keys) {
    if (!key) continue;
    const value = index?.get?.(String(key).toLowerCase());
    if (value) return value;
  }
  return null;
}

export function getCatalogSkyColor(state, nightVision = false) {
  if (nightVision) return state === 'unlisted' ? '#8F4548' : '#FF6961';
  return CATALOG_SKY_COLORS[state] || CATALOG_SKY_COLORS.default;
}

function featureIdentity(feature = {}) {
  return [
    feature.id,
    feature.properties?.iau,
    feature.properties?.id,
    feature.properties?.name,
  ].filter(Boolean);
}

function projectHorizontalPoint(point, options) {
  if (!Array.isArray(point) || point.length < 2) return null;
  const horizontal = raDecToAltAz(point[0] / 15, point[1], options.latitude, options.lstDegrees);
  const azimuthDelta = normalizeRaDelta(horizontal.az - options.deviceAz);
  return {
    x: options.width / 2 + (azimuthDelta * options.width / options.fovX),
    y: options.height / 2 - ((horizontal.alt - options.deviceAlt) * options.height / options.fovY),
    azimuthDelta,
    altitude: horizontal.alt,
  };
}

export function buildARConstellationSegments({
  features = [],
  constellationStates,
  lstDegrees,
  latitude = 0,
  deviceAz,
  deviceAlt,
  width,
  height,
  fovX = 90,
  fovY = 60,
  maxSegments = 120,
}) {
  const options = { lstDegrees, latitude, deviceAz, deviceAlt, width, height, fovX, fovY };
  const segments = [];
  for (const feature of features) {
    if (feature?.geometry?.type !== 'MultiLineString') continue;
    const summary = resolveConstellationState(constellationStates, ...featureIdentity(feature));
    if (!summary) continue;
    for (const path of feature.geometry.coordinates || []) {
      for (let index = 0; index < path.length - 1; index += 1) {
        const first = projectHorizontalPoint(path[index], options);
        const second = projectHorizontalPoint(path[index + 1], options);
        if (!first || !second || Math.abs(first.azimuthDelta - second.azimuthDelta) > fovX * 0.8) continue;
        const margin = 80;
        const visible = [first, second].some((point) => (
          point.x >= -margin && point.x <= width + margin
          && point.y >= -margin && point.y <= height + margin
        ));
        if (!visible) continue;
        segments.push({
          key: `${feature.id || feature.properties?.name}-${index}-${segments.length}`,
          x1: first.x,
          y1: first.y,
          x2: second.x,
          y2: second.y,
          state: summary.state,
          constellation: feature.id || feature.properties?.iau || feature.properties?.name,
        });
        if (segments.length >= maxSegments) return segments;
      }
    }
  }
  return segments;
}
