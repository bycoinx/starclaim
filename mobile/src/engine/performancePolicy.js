export const PERFORMANCE_LEVELS = Object.freeze(['low', 'medium', 'high']);

export const PERFORMANCE_PROFILES = Object.freeze({
  low: Object.freeze({
    skyStars: 100,
    voyageStars: 3500,
    galaxyPoints: 2400,
    maxRenderedObjects: 3500,
    targetFps: 45,
    recoveryFps: 54,
    heapPressureLimit: 0.78,
  }),
  medium: Object.freeze({
    skyStars: 260,
    voyageStars: 7000,
    galaxyPoints: 4800,
    maxRenderedObjects: 7000,
    targetFps: 50,
    recoveryFps: 56,
    heapPressureLimit: 0.82,
  }),
  high: Object.freeze({
    skyStars: 380,
    voyageStars: 10000,
    galaxyPoints: 8000,
    maxRenderedObjects: 10000,
    targetFps: 52,
    recoveryFps: 57,
    heapPressureLimit: 0.86,
  }),
});

function levelIndex(level) {
  return Math.max(0, PERFORMANCE_LEVELS.indexOf(level));
}

export function getPerformanceProfile(level = 'medium') {
  return PERFORMANCE_PROFILES[level] || PERFORMANCE_PROFILES.medium;
}

export function getDeviceMaximumProfile({
  pixelRatio = 1,
  scenePixels = 0,
  catalogObjectCount = 0,
  deviceMemoryGB = null,
} = {}) {
  if (
    scenePixels >= 4_000_000
    || catalogObjectCount >= 30_000
    || (deviceMemoryGB != null && deviceMemoryGB < 3)
  ) return 'low';
  if (
    scenePixels >= 2_200_000
    || catalogObjectCount >= 15_000
    || pixelRatio >= 3.5
    || (deviceMemoryGB != null && deviceMemoryGB < 6)
  ) return 'medium';
  return 'high';
}

export function getHeapPressure() {
  const memory = globalThis.performance?.memory;
  if (!memory?.jsHeapSizeLimit || !memory?.usedJSHeapSize) return null;
  return Math.max(0, Math.min(1, memory.usedJSHeapSize / memory.jsHeapSizeLimit));
}

export function evaluatePerformance({
  current,
  maximum,
  fps,
  heapPressure = null,
  renderedObjects = 0,
  lowSamples = 0,
  highSamples = 0,
}) {
  const profile = getPerformanceProfile(current);
  const memoryCritical = heapPressure != null && heapPressure >= profile.heapPressureLimit;
  const objectPressure = renderedObjects > profile.maxRenderedObjects;
  const isSlow = fps > 0 && fps < profile.targetFps;
  const isFast = fps >= profile.recoveryFps
    && !objectPressure
    && (heapPressure == null || heapPressure < 0.68);
  const nextLowSamples = memoryCritical || objectPressure ? 3 : isSlow ? lowSamples + 1 : 0;
  const nextHighSamples = isFast ? highSamples + 1 : 0;
  let level = current;

  if (nextLowSamples >= 3 && levelIndex(current) > 0) {
    level = PERFORMANCE_LEVELS[levelIndex(current) - 1];
  } else if (nextHighSamples >= 8 && levelIndex(current) < levelIndex(maximum)) {
    level = PERFORMANCE_LEVELS[levelIndex(current) + 1];
  }

  return {
    level,
    lowSamples: level === current ? nextLowSamples : 0,
    highSamples: level === current ? nextHighSamples : 0,
    pressure: memoryCritical ? 'memory' : objectPressure ? 'objects' : isSlow ? 'fps' : null,
  };
}
