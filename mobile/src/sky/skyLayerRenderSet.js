import { normalizeRaDelta, raDecToAltAz } from '../utils/astronomy';

export const SKY_LAYER_BUDGET = Object.freeze({
  low: Object.freeze({
    dsos: 6,
    planets: 4,
    constellationLabels: 0,
    constellationLines: 10,
    constellationBoundaries: 0,
    mythology: 0,
    constellationSegments: 80,
    boundarySegments: 0,
  }),
  medium: Object.freeze({
    dsos: 14,
    planets: 6,
    constellationLabels: 12,
    constellationLines: 26,
    constellationBoundaries: 8,
    mythology: 0,
    constellationSegments: 220,
    boundarySegments: 110,
  }),
  high: Object.freeze({
    dsos: 28,
    planets: 8,
    constellationLabels: 22,
    constellationLines: 44,
    constellationBoundaries: 14,
    mythology: 8,
    constellationSegments: 380,
    boundarySegments: 190,
  }),
});

export const SKY_VISUAL_LAYER_BUDGET = Object.freeze({
  low: Object.freeze({
    deepAtmosphere: true,
    nebula: false,
    milkyWay: true,
    milkyWaySampleStep: 3,
    shootingStars: false,
  }),
  medium: Object.freeze({
    deepAtmosphere: true,
    nebula: true,
    milkyWay: true,
    milkyWaySampleStep: 3,
    shootingStars: false,
  }),
  high: Object.freeze({
    deepAtmosphere: true,
    nebula: true,
    milkyWay: true,
    milkyWaySampleStep: 2,
    shootingStars: true,
  }),
});

const VIEWPORT_PADDING_DEGREES = 15;

function getBudget(qualityLevel) {
  return SKY_LAYER_BUDGET[qualityLevel] || SKY_LAYER_BUDGET.medium;
}

export function getSkyVisualLayerBudget(qualityLevel) {
  return SKY_VISUAL_LAYER_BUDGET[qualityLevel] || SKY_VISUAL_LAYER_BUDGET.medium;
}

export function getCoarseViewport({ virtualCenter, zoom }) {
  const fovDegrees = 90 / Math.max(0.1, zoom);
  return {
    centerRaDegrees: virtualCenter.ra,
    centerDecDegrees: virtualCenter.dec,
    halfFovX: (fovDegrees / 2) + VIEWPORT_PADDING_DEGREES,
    halfFovY: (fovDegrees / 2) + VIEWPORT_PADDING_DEGREES,
  };
}

export function isLayerPointVisible(raHours, decDegrees, viewport) {
  const decDiff = Math.abs(decDegrees - viewport.centerDecDegrees);
  if (decDiff > viewport.halfFovY) return false;

  const raDiff = Math.abs(normalizeRaDelta((raHours * 15) - viewport.centerRaDegrees));
  const cosDec = Math.max(0.08, Math.abs(Math.cos((viewport.centerDecDegrees * Math.PI) / 180)));
  return raDiff <= viewport.halfFovX / cosDec;
}

function pointScore(raHours, decDegrees, viewport) {
  const raDiff = Math.abs(normalizeRaDelta((raHours * 15) - viewport.centerRaDegrees));
  const decDiff = Math.abs(decDegrees - viewport.centerDecDegrees);
  return raDiff + decDiff;
}

function getViewPoint(raHours, decDegrees, {
  coordinateMode = 'equatorial',
  observerLatitude = 0,
  lstDegrees = 0,
} = {}) {
  if (coordinateMode === 'horizontal') {
    const horizontal = raDecToAltAz(raHours, decDegrees, observerLatitude, lstDegrees);
    return { longitude: horizontal.az, latitude: horizontal.alt };
  }
  return { longitude: raHours * 15, latitude: decDegrees };
}

function isViewPointVisible(raHours, decDegrees, viewport, options) {
  const point = getViewPoint(raHours, decDegrees, options);
  const decDiff = Math.abs(point.latitude - viewport.centerDecDegrees);
  if (decDiff > viewport.halfFovY) return false;

  const longitudeDiff = Math.abs(normalizeRaDelta(point.longitude - viewport.centerRaDegrees));
  const cosDec = Math.max(0.08, Math.abs(Math.cos((viewport.centerDecDegrees * Math.PI) / 180)));
  return longitudeDiff <= viewport.halfFovX / cosDec;
}

function viewPointScore(raHours, decDegrees, viewport, options) {
  const point = getViewPoint(raHours, decDegrees, options);
  const longitudeDiff = Math.abs(normalizeRaDelta(point.longitude - viewport.centerRaDegrees));
  const latitudeDiff = Math.abs(point.latitude - viewport.centerDecDegrees);
  return longitudeDiff + latitudeDiff;
}

function getFeaturePoints(feature) {
  if (!feature?.geometry) return [];
  const { type, coordinates } = feature.geometry;
  if (!Array.isArray(coordinates)) return [];

  if (type === 'Point') return [coordinates];
  if (type === 'LineString') return coordinates;
  if (type === 'MultiLineString') return coordinates.flat();
  if (type === 'Polygon') return coordinates.flat();
  if (type === 'MultiPolygon') return coordinates.flat(2);
  return [];
}

function toAbbrevFromName(name) {
  if (!name) return null;
  const words = String(name)
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!words.length) return null;
  if (words.length === 1) return words[0].slice(0, 3).toUpperCase();
  return words.slice(0, 3).map((word) => word[0]).join('').toUpperCase();
}

function getConstellationAbbrev(feature) {
  const props = feature?.properties || {};
  const candidates = [
    props.iau,
    props.abbrev,
    props.abbr,
    props.short,
    props.code,
    feature?.id,
  ];
  for (const candidate of candidates) {
    if (!candidate) continue;
    const value = String(candidate).trim();
    if (!value) continue;
    return value.toUpperCase();
  }
  return toAbbrevFromName(props.name);
}

function normalizeLongitudeDegrees(value) {
  let longitude = Number(value) || 0;
  while (longitude < 0) longitude += 360;
  while (longitude >= 360) longitude -= 360;
  return longitude;
}

function centroidFromPoints(points = []) {
  if (!points.length) return null;
  let sinSum = 0;
  let cosSum = 0;
  let decSum = 0;
  let count = 0;

  points.forEach((point) => {
    if (!Array.isArray(point) || point.length < 2) return;
    const longitude = normalizeLongitudeDegrees(point[0]);
    const latitude = Number(point[1]);
    if (!Number.isFinite(latitude)) return;
    const angle = (longitude * Math.PI) / 180;
    sinSum += Math.sin(angle);
    cosSum += Math.cos(angle);
    decSum += latitude;
    count += 1;
  });

  if (!count) return null;
  let centroidLongitude = Math.atan2(sinSum, cosSum) * (180 / Math.PI);
  if (centroidLongitude < 0) centroidLongitude += 360;
  return [centroidLongitude, decSum / count];
}

function buildCentroidConstellationLabels(constellations = {}) {
  const features = constellations.lines?.features || [];
  return features
    .map((feature) => {
      const coords = centroidFromPoints(getFeaturePoints(feature));
      if (!coords) return null;
      const abbrev = getConstellationAbbrev(feature);
      if (!abbrev) return null;
      return {
        id: abbrev,
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: coords,
        },
        properties: {
          ...(feature.properties || {}),
          iau: abbrev,
          rank: Number(feature.properties?.rank || 2),
        },
      };
    })
    .filter(Boolean);
}

function getFeatureScore(feature, viewport, options) {
  const points = getFeaturePoints(feature);
  if (!points.length) return Infinity;
  return points.reduce((best, point) => {
    if (!Array.isArray(point) || point.length < 2) return best;
    return Math.min(best, viewPointScore(point[0] / 15, point[1], viewport, options));
  }, Infinity);
}

function isSelectedConstellationFeature(feature, selectedStar) {
  if (!selectedStar) return false;
  const targetValues = [selectedStar.con, selectedStar.constellation]
    .filter(Boolean)
    .map((value) => String(value).toLowerCase());
  if (!targetValues.length) return false;
  const featureValues = [
    feature.id,
    feature.properties?.id,
    feature.properties?.name,
    feature.properties?.iau,
  ].filter(Boolean).map((value) => String(value).toLowerCase());
  return targetValues.some((target) => featureValues.includes(target));
}

function featureTouchesViewport(feature, viewport, options) {
  const points = getFeaturePoints(feature);
  if (!points.length) return false;
  return points.some((point) => (
    Array.isArray(point)
    && point.length >= 2
    && isViewPointVisible(point[0] / 15, point[1], viewport, options)
  ));
}

function limitByScore(items, limit, getScore) {
  if (!limit || limit <= 0) return [];
  return items
    .map((item) => ({ item, score: getScore(item) }))
    .filter((entry) => Number.isFinite(entry.score))
    .sort((a, b) => a.score - b.score)
    .slice(0, limit)
    .map((entry) => entry.item);
}

export function getBoundaryPaths(feature) {
  if (feature?.geometry?.type === 'Polygon') return feature.geometry.coordinates || [];
  if (feature?.geometry?.type === 'MultiPolygon') return (feature.geometry.coordinates || []).flat();
  return [];
}

function pushPathSegments(target, pathPoints, limit, emphasized = false) {
  if (!Array.isArray(pathPoints) || pathPoints.length < 2 || target.length >= limit) return;
  for (let index = 0; index < pathPoints.length - 1 && target.length < limit; index += 1) {
    const first = pathPoints[index];
    const second = pathPoints[index + 1];
    if (
      Array.isArray(first)
      && Array.isArray(second)
      && first.length >= 2
      && second.length >= 2
    ) {
      target.push({
        firstRa: first[0] / 15,
        firstDec: first[1],
        secondRa: second[0] / 15,
        secondDec: second[1],
        emphasized,
      });
    }
  }
}

export function buildConstellationSegments(features = [], selectedStar = null, limit = Infinity) {
  const segments = [];
  for (let featureIndex = 0; featureIndex < features.length && segments.length < limit; featureIndex += 1) {
    const feature = features[featureIndex];
    if (feature?.geometry?.type !== 'MultiLineString') continue;
    const emphasized = isSelectedConstellationFeature(feature, selectedStar);
    (feature.geometry.coordinates || []).forEach((linePoints) => {
      pushPathSegments(segments, linePoints, limit, emphasized);
    });
  }
  return segments;
}

export function buildBoundarySegments(features = [], limit = Infinity) {
  const segments = [];
  for (let featureIndex = 0; featureIndex < features.length && segments.length < limit; featureIndex += 1) {
    getBoundaryPaths(features[featureIndex]).forEach((pathPoints) => {
      pushPathSegments(segments, pathPoints, limit, false);
    });
  }
  return segments;
}

export function countSegments(segments = []) {
  return segments.length;
}

export function countFeatureSegments(features = []) {
  return features.reduce((total, feature) => {
    const paths = feature?.geometry?.type === 'MultiPolygon'
      ? (feature.geometry.coordinates || []).flat()
      : feature?.geometry?.coordinates || [];
    if (!Array.isArray(paths)) return total;
    return total + paths.reduce((pathTotal, path) => (
      pathTotal + (Array.isArray(path) ? Math.max(0, path.length - 1) : 0)
    ), 0);
  }, 0);
}

export function buildSkyLayerRenderSet({
  dsoData,
  planetData,
  constellations,
  mythologyAssets,
  showDSOs,
  showPlanets,
  showConstellations,
  showConstellationLabels,
  showConstellationBoundaries,
  showMythology,
  selectedStar,
  qualityLevel,
  zoom,
  virtualCenter,
  coordinateMode = 'equatorial',
  observerLatitude = 0,
  lstDegrees = 0,
}) {
  const budget = getBudget(qualityLevel);
  const viewport = getCoarseViewport({ virtualCenter, zoom });
  const visibilityOptions = { coordinateMode, observerLatitude, lstDegrees };
  const centroidLabels = buildCentroidConstellationLabels(constellations);
  const explicitLabels = constellations.labels?.features || [];
  const labelMap = new Map();
  explicitLabels.forEach((feature) => {
    const key = getConstellationAbbrev(feature) || String(feature.id || Math.random());
    labelMap.set(key, feature);
  });
  centroidLabels.forEach((feature) => {
    const key = getConstellationAbbrev(feature) || String(feature.id);
    if (!labelMap.has(key)) labelMap.set(key, feature);
  });
  const labelFeatures = [...labelMap.values()];

  const visibleDSOs = showDSOs
    ? limitByScore(
      dsoData.filter((dso) => isViewPointVisible(dso.ra, dso.dec, viewport, visibilityOptions)),
      budget.dsos,
      (dso) => viewPointScore(dso.ra, dso.dec, viewport, visibilityOptions),
    )
    : [];

  const visiblePlanets = showPlanets
    ? limitByScore(
      planetData.filter((planet) => isViewPointVisible(planet.ra, planet.dec, viewport, visibilityOptions)),
      budget.planets,
      (planet) => viewPointScore(planet.ra, planet.dec, viewport, visibilityOptions),
    )
    : [];

  const visibleConstellationLabels = showConstellationLabels
    ? limitByScore(
      labelFeatures.filter((feature) => {
        const coords = feature.geometry?.coordinates;
        return Array.isArray(coords) && isViewPointVisible(coords[0] / 15, coords[1], viewport, visibilityOptions);
      }),
      budget.constellationLabels,
      (feature) => {
        const coords = feature.geometry?.coordinates || [0, 0];
        const rank = Number(feature.properties?.rank || 3);
        return (rank * 8) + viewPointScore(coords[0] / 15, coords[1], viewport, visibilityOptions);
      },
    )
    : [];

  const visibleConstellationLines = showConstellations
    ? limitByScore(
      (constellations.lines?.features || []).filter((feature) => featureTouchesViewport(feature, viewport, visibilityOptions)),
      budget.constellationLines,
      (feature) => getFeatureScore(feature, viewport, visibilityOptions),
    )
    : [];

  const visibleConstellationLineSegments = buildConstellationSegments(
    visibleConstellationLines,
    selectedStar,
    budget.constellationSegments,
  );

  const visibleBoundaries = showConstellationBoundaries
    ? limitByScore(
      (constellations.boundaries?.features || []).filter((feature) => featureTouchesViewport(feature, viewport, visibilityOptions)),
      budget.constellationBoundaries,
      (feature) => getFeatureScore(feature, viewport, visibilityOptions),
    )
    : [];

  const visibleBoundarySegments = buildBoundarySegments(
    visibleBoundaries,
    budget.boundarySegments,
  );

  const visibleMythologyKeys = showMythology && qualityLevel === 'high'
    ? limitByScore(
      Object.keys(mythologyAssets).filter((key) => {
        const item = mythologyAssets[key];
        return isViewPointVisible(item.ra, item.dec, viewport, visibilityOptions);
      }),
      budget.mythology,
      (key) => viewPointScore(mythologyAssets[key].ra, mythologyAssets[key].dec, viewport, visibilityOptions),
    )
    : [];

  return {
    visibleDSOs,
    visiblePlanets,
    visibleConstellationLabels,
    visibleConstellationLines,
    visibleConstellationLineSegments,
    visibleBoundaries,
    visibleBoundarySegments,
    visibleMythologyKeys,
  };
}
