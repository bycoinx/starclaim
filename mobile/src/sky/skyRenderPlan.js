import { estimateLayerNodes } from '../utils/renderQuality';
import {
  SKY_LAYER_BUDGET,
  buildSkyLayerRenderSet,
  countSegments,
  getSkyVisualLayerBudget,
} from './skyLayerRenderSet';
import { STAR_RENDER_BUDGET, buildStarRenderSet } from './starRenderSet';

const OVERLAY_STAR_LIMIT = 24;

export function getSkyRenderLayerBudgets(qualityLevel, coordinateMode = 'equatorial') {
  const objectBudget = SKY_LAYER_BUDGET[qualityLevel] || SKY_LAYER_BUDGET.medium;
  const visualBudget = getSkyVisualLayerBudget(qualityLevel);
  const starLimit = STAR_RENDER_BUDGET[qualityLevel] || STAR_RENDER_BUDGET.medium;
  const horizontalMode = coordinateMode === 'horizontal';

  return {
    stars: {
      maxVisible: starLimit,
      dynamic: true,
      priority: 1,
    },
    milkyWay: {
      enabled: visualBudget.milkyWay,
      sampleStep: visualBudget.milkyWaySampleStep,
      dynamic: false,
      priority: horizontalMode ? 5 : 4,
    },
    nebula: {
      enabled: visualBudget.nebula,
      dynamic: false,
      priority: 6,
    },
    deepAtmosphere: {
      enabled: visualBudget.deepAtmosphere,
      dynamic: false,
      priority: 7,
    },
    shootingStars: {
      enabled: visualBudget.shootingStars,
      dynamic: true,
      priority: 8,
    },
    dsos: {
      maxVisible: objectBudget.dsos,
      dynamic: false,
      priority: 4,
    },
    planets: {
      maxVisible: objectBudget.planets,
      dynamic: true,
      priority: 3,
    },
    constellations: {
      maxFeatures: objectBudget.constellationLines,
      maxSegments: objectBudget.constellationSegments,
      dynamic: false,
      priority: 2,
    },
    constellationLabels: {
      maxVisible: objectBudget.constellationLabels,
      dynamic: false,
      priority: 5,
    },
    constellationBoundaries: {
      maxFeatures: objectBudget.constellationBoundaries,
      maxSegments: objectBudget.boundarySegments,
      dynamic: false,
      priority: 6,
    },
    mythology: {
      maxVisible: objectBudget.mythology,
      dynamic: false,
      priority: 9,
    },
  };
}

export function buildEnabledSkyLayers({
  qualityLevel,
  coordinateMode,
  showGrid,
  showNebula,
  showDSOs,
  showPlanets,
  showConstellations,
  showConstellationLabels,
  showConstellationBoundaries,
  showMythology,
}) {
  const layerRenderBudgets = getSkyRenderLayerBudgets(qualityLevel, coordinateMode);
  return {
    grid: Boolean(showGrid),
    deepAtmosphere: Boolean(layerRenderBudgets.deepAtmosphere.enabled),
    nebula: Boolean(showNebula && layerRenderBudgets.nebula.enabled),
    milkyWay: Boolean(showNebula && layerRenderBudgets.milkyWay.enabled),
    shootingStars: Boolean(layerRenderBudgets.shootingStars.enabled),
    dsos: Boolean(showDSOs && layerRenderBudgets.dsos.maxVisible > 0),
    planets: Boolean(showPlanets && layerRenderBudgets.planets.maxVisible > 0),
    constellations: Boolean(showConstellations && layerRenderBudgets.constellations.maxSegments > 0),
    constellationLabels: Boolean(
      showConstellationLabels
      && qualityLevel !== 'low'
      && layerRenderBudgets.constellationLabels.maxVisible > 0
    ),
    constellationBoundaries: Boolean(
      showConstellationBoundaries
      && layerRenderBudgets.constellationBoundaries.maxSegments > 0
    ),
    mythology: Boolean(
      showMythology
      && qualityLevel === 'high'
      && layerRenderBudgets.mythology.maxVisible > 0
    ),
  };
}

export function buildStarBatches(renderedStars = []) {
  const batches = new Map();
  renderedStars.forEach((star) => {
    const radius = Math.max(0.75, Math.min(3, Math.round(star.radius * 2) / 2));
    const key = `${star.color}:${radius}`;
    const batch = batches.get(key) || { key, color: star.color, radius, stars: [] };
    batch.stars.push(star);
    batches.set(key, batch);
  });
  return [...batches.values()];
}

export function buildOverlayStars(renderedStars = [], {
  showLabels = false,
  zoom = 1,
  limit = OVERLAY_STAR_LIMIT,
} = {}) {
  return renderedStars
    .filter((star) => star.owned || star.availabilityState || (star.proper && (showLabels || zoom > 2.8)))
    .slice(0, limit);
}

export function buildSkyRenderPlan({
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
  dsoData,
  planetData,
  constellations,
  constellationStates,
  mythologyAssets,
  showLabels,
  showGrid,
  showNebula,
  showDSOs,
  showPlanets,
  showConstellations,
  showConstellationLabels,
  showConstellationBoundaries,
  showMythology,
}) {
  const layerRenderBudgets = getSkyRenderLayerBudgets(qualityLevel, coordinateMode);
  const enabledLayers = buildEnabledSkyLayers({
    qualityLevel,
    coordinateMode,
    showGrid,
    showNebula,
    showDSOs,
    showPlanets,
    showConstellations,
    showConstellationLabels,
    showConstellationBoundaries,
    showMythology,
  });
  const renderedStars = buildStarRenderSet({
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
  });

  const starBatches = buildStarBatches(renderedStars);
  const overlayStars = buildOverlayStars(renderedStars, { showLabels, zoom });
  const skyLayers = buildSkyLayerRenderSet({
    dsoData,
    planetData,
    constellations,
    constellationStates,
    mythologyAssets,
    showDSOs: enabledLayers.dsos,
    showPlanets: enabledLayers.planets,
    showConstellations: enabledLayers.constellations,
    showConstellationLabels: enabledLayers.constellationLabels,
    showConstellationBoundaries: enabledLayers.constellationBoundaries,
    showMythology: enabledLayers.mythology,
    selectedStar,
    qualityLevel,
    zoom,
    virtualCenter,
    coordinateMode,
    observerLatitude,
    lstDegrees,
  });
  const visualLayerBudget = getSkyVisualLayerBudget(qualityLevel);
  const layerNodeEstimate = estimateLayerNodes({
    renderedStars,
    starBatchCount: starBatches.length,
    starOverlayCount: overlayStars.length,
    showGrid: enabledLayers.grid,
    showNebula: enabledLayers.nebula,
    showMilkyWay: enabledLayers.milkyWay,
    showDeepAtmosphere: enabledLayers.deepAtmosphere,
    showShootingStars: enabledLayers.shootingStars,
    showConstellations: enabledLayers.constellations,
    showConstellationLabels: enabledLayers.constellationLabels,
    showConstellationBoundaries: enabledLayers.constellationBoundaries,
    showDSOs: enabledLayers.dsos,
    showPlanets: enabledLayers.planets,
    showMythology: enabledLayers.mythology,
    coordinateMode,
    constellationLines: countSegments(skyLayers.visibleConstellationLineSegments),
    constellationLabels: skyLayers.visibleConstellationLabels.length,
    constellationBoundaries: countSegments(skyLayers.visibleBoundarySegments),
    dsoCount: skyLayers.visibleDSOs.length,
    planetCount: skyLayers.visiblePlanets.length,
    mythologyCount: skyLayers.visibleMythologyKeys.length,
    quality: qualityLevel,
  });

  return {
    renderedStars,
    starBatches,
    overlayStars,
    enabledLayers,
    layerRenderBudgets,
    visualLayerBudget,
    layerNodeEstimate,
    ...skyLayers,
  };
}
