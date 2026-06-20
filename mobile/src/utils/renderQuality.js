const LEVELS = ['low', 'medium', 'high'];

function levelIndex(level) {
  return Math.max(0, LEVELS.indexOf(level));
}

export function getBaseRenderQuality({ pixelRatio, scenePixels, catalogStarCount }) {
  if (scenePixels >= 4_000_000 || catalogStarCount >= 30_000) return 'low';
  if (scenePixels >= 2_200_000 || catalogStarCount >= 15_000 || pixelRatio >= 3.5) return 'medium';
  return 'high';
}

export function getHeapPressure() {
  const memory = globalThis.performance?.memory;
  if (!memory?.jsHeapSizeLimit || !memory?.usedJSHeapSize) return null;
  return Math.max(0, Math.min(1, memory.usedJSHeapSize / memory.jsHeapSizeLimit));
}

export function updateAdaptiveQuality({
  current,
  maximum,
  fps,
  heapPressure = null,
  lowSamples = 0,
  highSamples = 0,
}) {
  const memoryCritical = heapPressure != null && heapPressure >= 0.82;
  const isSlow = fps > 0 && fps < 43;
  const isFast = fps >= 56 && (heapPressure == null || heapPressure < 0.68);
  const nextLowSamples = memoryCritical ? 3 : isSlow ? lowSamples + 1 : 0;
  const nextHighSamples = isFast ? highSamples + 1 : 0;
  let level = current;

  if (nextLowSamples >= 3 && levelIndex(current) > 0) {
    level = LEVELS[levelIndex(current) - 1];
  } else if (
    nextHighSamples >= 8
    && levelIndex(current) < levelIndex(maximum)
  ) {
    level = LEVELS[levelIndex(current) + 1];
  }

  return {
    level,
    lowSamples: level === current ? nextLowSamples : 0,
    highSamples: level === current ? nextHighSamples : 0,
  };
}

export function estimateLayerNodes({
  renderedStars,
  showGrid,
  showNebula,
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
  const starNodes = renderedStars.reduce((count, star) => (
    count + 1 + (star.owned ? 1 : 0) + (star.proper ? 1 : 0)
  ), 0);
  const layers = {
    background: 1 + (showNebula && quality !== 'low' ? 1 : 0),
    horizon: coordinateMode === 'horizontal' ? 11 : 0,
    grid: showGrid ? 672 : 0,
    stars: starNodes,
    constellations: showConstellations ? constellationLines : 0,
    constellationLabels: showConstellationLabels && quality !== 'low' ? constellationLabels : 0,
    boundaries: showConstellationBoundaries ? constellationBoundaries : 0,
    deepSpace: showDSOs ? dsoCount * 4 : 0,
    planets: showPlanets ? planetCount * 4 : 0,
    mythology: showMythology && quality === 'high' ? mythologyCount : 0,
  };
  return {
    layers,
    total: Object.values(layers).reduce((sum, count) => sum + count, 0),
  };
}
