import {
  colorForStar,
  getStarDecDegrees,
  getStarRaDegrees,
  getStarRaHours,
  normalizeRaDelta,
  radiusForMag,
  raDecToAltAz,
} from '../utils/astronomy';

export const STAR_RENDER_BUDGET = Object.freeze({ low: 100, medium: 200, high: 300 });
export const VIEWPORT_PADDING = 140;

export function magnitudeLimitForZoom(zoom) {
  if (zoom < 0.8) return 6.2;
  if (zoom < 1.5) return 7.2;
  if (zoom < 3) return 8.4;
  return 9.5;
}

function projectDegrees(longitude, latitude, centerLongitude, centerLatitude, width, height, zoom) {
  const longitudeDiff = normalizeRaDelta(longitude - centerLongitude);
  const latitudeDiff = latitude - centerLatitude;
  const field = 90 / Math.max(0.1, zoom);
  const scale = width / field;
  const x = width / 2 + longitudeDiff * scale * Math.cos((centerLatitude * Math.PI) / 180);
  const y = height / 2 - latitudeDiff * scale;
  return { x, y };
}

function isImportantStar(star, selectedStar, owned) {
  if (owned) return true;
  if (!selectedStar) return false;
  return (
    String(selectedStar.id) === String(star.id)
    || String(selectedStar.canonicalId) === String(star.canonicalId)
    || (selectedStar.hip && star.hip && String(selectedStar.hip) === String(star.hip))
  );
}

function getSafeMagnitude(star) {
  const magnitude = Number(star?.mag);
  return Number.isFinite(magnitude) ? magnitude : Infinity;
}

export function buildStarRenderSet({
  stars,
  selectedStar,
  ownedIdSet,
  qualityLevel,
  zoom,
  nightVision,
  coordinateMode,
  observerLatitude,
  lstDegrees,
  virtualCenter,
  layout,
}) {
  const qualityMagnitudeOffset = qualityLevel === 'low' ? -0.5 : qualityLevel === 'medium' ? -0.2 : 0;
  const magnitudeLimit = magnitudeLimitForZoom(zoom) + qualityMagnitudeOffset;
  const poolLimit = STAR_RENDER_BUDGET[qualityLevel] || STAR_RENDER_BUDGET.medium;
  const importantStars = [];
  const regularStars = [];

  stars.forEach((star) => {
    const owned = (
      ownedIdSet.has(String(star.id))
      || ownedIdSet.has(String(star.hip))
      || ownedIdSet.has(String(star.canonicalId))
    );
    const important = isImportantStar(star, selectedStar, owned);
    if (!important && getSafeMagnitude(star) > magnitudeLimit) return;

    const ra = getStarRaHours(star);
    const dec = getStarDecDegrees(star);
    const prepared = {
      ...star,
      ra,
      dec,
      raDegrees: getStarRaDegrees(star),
      decDegrees: dec,
      radius: radiusForMag(star.mag, star.spect),
      color: nightVision ? '#FF514A' : colorForStar(star),
      owned,
    };

    if (coordinateMode === 'horizontal') {
      const horizontal = raDecToAltAz(ra, dec, observerLatitude, lstDegrees);
      prepared.horizontalAz = horizontal.az;
      prepared.horizontalAlt = horizontal.alt;
    }

    const projected = coordinateMode === 'horizontal'
      ? projectDegrees(
        prepared.horizontalAz,
        prepared.horizontalAlt,
        virtualCenter.ra,
        virtualCenter.dec,
        layout.width,
        layout.height,
        zoom,
      )
      : projectDegrees(
        prepared.raDegrees,
        dec,
        virtualCenter.ra,
        virtualCenter.dec,
        layout.width,
        layout.height,
        zoom,
      );

    const inVirtualViewport = projected.x >= -VIEWPORT_PADDING
      && projected.x <= layout.width + VIEWPORT_PADDING
      && projected.y >= -VIEWPORT_PADDING
      && projected.y <= layout.height + VIEWPORT_PADDING;
    if (!important && !inVirtualViewport) return;

    if (important) importantStars.push(prepared);
    else regularStars.push(prepared);
  });

  regularStars.sort((a, b) => getSafeMagnitude(a) - getSafeMagnitude(b));
  return [...importantStars, ...regularStars.slice(0, poolLimit)];
}
