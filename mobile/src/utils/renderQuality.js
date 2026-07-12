import {
  evaluatePerformance,
  getDeviceMaximumProfile,
  getHeapPressure as getSharedHeapPressure,
} from '../engine/performancePolicy';

export function getBaseRenderQuality({ pixelRatio, scenePixels, catalogStarCount }) {
  return getDeviceMaximumProfile({ pixelRatio, scenePixels, catalogObjectCount: catalogStarCount });
}

export function getHeapPressure() {
  return getSharedHeapPressure();
}

export function updateAdaptiveQuality({
  current,
  maximum,
  fps,
  heapPressure = null,
  lowSamples = 0,
  highSamples = 0,
  renderedObjects = 0,
}) {
  return evaluatePerformance({
    current,
    maximum,
    fps,
    heapPressure,
    renderedObjects,
    lowSamples,
    highSamples,
  });
}

export function estimateLayerNodes({
  renderedStars,
  starBatchCount = null,
  starOverlayCount = 0,
  showGrid,
  showNebula,
  showMilkyWay = false,
  showDeepAtmosphere = true,
  showShootingStars = false,
  showConstellations,
  showConstellationLabels,
  showConstellationBoundaries,
  showDSOs,
  showPlanets,
  showMythology,
  coordinateMode,
  constellationLines,
  constellationLabels,
  constellationBoundaries,
  dsoCount,
  planetCount,
  mythologyCount,
  quality,
}) {
  const starNodes = Number.isFinite(starBatchCount)
    ? starBatchCount + starOverlayCount * 5
    : renderedStars.reduce((count, star) => (
      count + 1 + (star.owned ? 1 : 0) + (star.proper ? 1 : 0)
    ), 0);
  const layers = {
    background: 1,
    deepAtmosphere: showDeepAtmosphere ? 1 : 0,
    nebula: showNebula && quality !== 'low' ? 1 : 0,
    milkyWay: showMilkyWay ? 1 : 0,
    shootingStars: showShootingStars ? 1 : 0,
    horizon: coordinateMode === 'horizontal' ? 11 : 0,
    grid: showGrid ? 1 : 0,
    stars: starNodes,
    constellations: showConstellations && constellationLines > 0 ? 2 : 0,
    constellationLabels: showConstellationLabels && quality !== 'low' ? constellationLabels : 0,
    boundaries: showConstellationBoundaries && constellationBoundaries > 0 ? 1 : 0,
    deepSpace: showDSOs ? dsoCount * 4 : 0,
    planets: showPlanets ? planetCount * 4 : 0,
    mythology: showMythology && quality === 'high' ? mythologyCount : 0,
  };
  return {
    layers,
    total: Object.values(layers).reduce((sum, count) => sum + count, 0),
  };
}
