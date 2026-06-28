import { ensureStarData } from './starLoader';
import { loadGaiaViewport } from './remoteGaiaCatalog';

const DEFAULT_CORE_LIMIT = 10000;
const DEFAULT_GAIA_LIMIT = 12000;
const DEFAULT_WINDOW_LIMIT = 14000;

export function getCatalogFieldDegrees(zoom) {
  return 90 / Math.max(0.8, Number(zoom) || 1);
}

export function mergeCatalogStars(gaiaStars = [], coreStars = [], limit = DEFAULT_WINDOW_LIMIT) {
  const seenGaiaIds = new Set();
  const seenHipIds = new Set();
  const merged = [];

  gaiaStars.forEach((star) => {
    if (!star) return;
    if (star.canonicalId) seenGaiaIds.add(star.canonicalId);
    if (star.hip) seenHipIds.add(String(star.hip));
    merged.push(star);
  });

  coreStars.forEach((star) => {
    if (!star) return;
    if (star.canonicalId && seenGaiaIds.has(star.canonicalId)) return;
    if (star.hip && seenHipIds.has(String(star.hip))) return;
    merged.push(star);
  });

  return merged.slice(0, limit);
}

export async function loadSkyCatalogWindow({
  centerRaDegrees,
  centerDecDegrees,
  zoom,
  coreStars,
  maxStars = DEFAULT_WINDOW_LIMIT,
  gaiaMaxStars = DEFAULT_GAIA_LIMIT,
  coreLimit = DEFAULT_CORE_LIMIT,
  loadCore = ensureStarData,
  loadGaia = loadGaiaViewport,
}) {
  const fallbackCore = Array.isArray(coreStars) && coreStars.length
    ? coreStars
    : await loadCore();
  const coreFallback = fallbackCore.slice(0, Math.min(maxStars, coreLimit));
  const field = getCatalogFieldDegrees(zoom);

  try {
    const gaiaResult = await loadGaia({
      centerRaDegrees,
      centerDecDegrees,
      horizontalFovDegrees: field,
      verticalFovDegrees: field * 0.65,
      maxStars: gaiaMaxStars,
    });

    if (!gaiaResult?.stars?.length) {
      return {
        stars: coreFallback,
        source: 'hyg-core',
        sectorIds: [],
        catalogVersion: null,
        fallback: true,
      };
    }

    return {
      stars: mergeCatalogStars(gaiaResult.stars, fallbackCore, maxStars),
      source: 'gaia+hyg-core',
      sectorIds: gaiaResult.sectorIds || [],
      catalogVersion: gaiaResult.catalogVersion || null,
      fallback: false,
    };
  } catch (error) {
    return {
      stars: coreFallback,
      source: 'hyg-core',
      sectorIds: [],
      catalogVersion: null,
      fallback: true,
      error,
    };
  }
}
