export const PERFORMANCE_LEVELS = Object.freeze(["low", "medium", "high"]);

export const WEB_PERFORMANCE_PROFILES = Object.freeze({
  low: Object.freeze({
    canvasStars: 120,
    canvasDust: 16,
    shootingIntervalMs: 6000,
    galaxyStars: 6000,
    galaxyAsteroids: 250,
    observatoryStars: 2500,
    maxRenderedObjects: 7000,
    maxMemoryMB: 384,
    targetFps: 40,
    recoveryFps: 52,
    maxFrameTimeMs: 25,
    heapPressureLimit: 0.78,
    dpr: [0.75, 1],
    antialias: false,
    shadows: false,
    postProcessing: false,
  }),
  medium: Object.freeze({
    canvasStars: 280,
    canvasDust: 32,
    shootingIntervalMs: 4500,
    galaxyStars: 12000,
    galaxyAsteroids: 600,
    observatoryStars: 7000,
    maxRenderedObjects: 14000,
    maxMemoryMB: 640,
    targetFps: 48,
    recoveryFps: 55,
    maxFrameTimeMs: 21,
    heapPressureLimit: 0.82,
    dpr: [1, 1.25],
    antialias: true,
    shadows: false,
    postProcessing: true,
  }),
  high: Object.freeze({
    canvasStars: 500,
    canvasDust: 50,
    shootingIntervalMs: 3500,
    galaxyStars: 18000,
    galaxyAsteroids: 900,
    observatoryStars: 12000,
    maxRenderedObjects: 22000,
    maxMemoryMB: 1024,
    targetFps: 52,
    recoveryFps: 58,
    maxFrameTimeMs: 19.5,
    heapPressureLimit: 0.86,
    dpr: [1, 1.5],
    antialias: true,
    shadows: true,
    postProcessing: true,
  }),
});

function levelIndex(level) {
  const index = PERFORMANCE_LEVELS.indexOf(level);
  return index < 0 ? 1 : index;
}

export function getWebPerformanceProfile(level = "medium") {
  return WEB_PERFORMANCE_PROFILES[level] || WEB_PERFORMANCE_PROFILES.medium;
}

export function getWebDeviceCapabilities() {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return { pixelRatio: 1, scenePixels: 0, deviceMemoryGB: null, hardwareConcurrency: null, reducedMotion: false };
  }
  const pixelRatio = window.devicePixelRatio || 1;
  return {
    pixelRatio,
    scenePixels: window.innerWidth * window.innerHeight * pixelRatio * pixelRatio,
    deviceMemoryGB: Number.isFinite(navigator.deviceMemory) ? navigator.deviceMemory : null,
    hardwareConcurrency: Number.isFinite(navigator.hardwareConcurrency) ? navigator.hardwareConcurrency : null,
    reducedMotion: Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches),
  };
}

export function getDeviceMaximumProfile({
  pixelRatio = 1,
  scenePixels = 0,
  catalogObjectCount = 0,
  deviceMemoryGB = null,
  hardwareConcurrency = null,
  reducedMotion = false,
} = {}) {
  if (
    reducedMotion
    || scenePixels >= 4_000_000
    || catalogObjectCount >= 30_000
    || (deviceMemoryGB != null && deviceMemoryGB < 3)
    || (hardwareConcurrency != null && hardwareConcurrency <= 2)
  ) return "low";
  if (
    scenePixels >= 2_200_000
    || catalogObjectCount >= 15_000
    || pixelRatio >= 3
    || (deviceMemoryGB != null && deviceMemoryGB < 6)
    || (hardwareConcurrency != null && hardwareConcurrency <= 4)
  ) return "medium";
  return "high";
}

export function getBrowserHeapPressure() {
  const memory = typeof performance !== "undefined" ? performance.memory : null;
  if (!memory?.jsHeapSizeLimit || !memory?.usedJSHeapSize) return null;
  return Math.max(0, Math.min(1, memory.usedJSHeapSize / memory.jsHeapSizeLimit));
}

export function createPerformanceState(maximum = "medium", initial = maximum) {
  const maximumIndex = levelIndex(maximum);
  const initialIndex = Math.min(levelIndex(initial), maximumIndex);
  return {
    level: PERFORMANCE_LEVELS[initialIndex],
    maximum: PERFORMANCE_LEVELS[maximumIndex],
    lowSamples: 0,
    highSamples: 0,
    pressure: null,
    revision: 0,
  };
}

export function evaluateWebPerformance({
  current,
  maximum,
  fps,
  frameTimeMs = null,
  heapPressure = null,
  memoryMB = null,
  renderedObjects = 0,
  lowSamples = 0,
  highSamples = 0,
}) {
  const profile = getWebPerformanceProfile(current);
  const memoryCritical = (heapPressure != null && heapPressure >= profile.heapPressureLimit)
    || (memoryMB != null && memoryMB >= profile.maxMemoryMB);
  const objectPressure = renderedObjects > profile.maxRenderedObjects;
  const framePressure = frameTimeMs != null && frameTimeMs > profile.maxFrameTimeMs;
  const isSlow = fps > 0 && (fps < profile.targetFps || framePressure);
  const isFast = fps >= profile.recoveryFps
    && (frameTimeMs == null || frameTimeMs <= 1000 / profile.recoveryFps)
    && !objectPressure
    && (heapPressure == null || heapPressure < 0.68)
    && (memoryMB == null || memoryMB < profile.maxMemoryMB * 0.7);
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
    pressure: memoryCritical ? "memory" : objectPressure ? "objects" : isSlow ? "frame" : null,
  };
}

export function applyPerformanceTelemetry(state, telemetry = {}) {
  const decision = evaluateWebPerformance({
    current: state.level,
    maximum: state.maximum,
    ...telemetry,
    lowSamples: state.lowSamples,
    highSamples: state.highSamples,
  });
  return {
    ...state,
    ...decision,
    revision: decision.level === state.level ? state.revision : state.revision + 1,
  };
}
