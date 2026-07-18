import { ENGINE_KIND } from './CelestialEngineRuntime';

export function createSky2DRendererProps({
  catalog = {},
  view = {},
  layers = {},
  selection = {},
  events = {},
  active = true,
} = {}) {
  return {
    stars: catalog.stars || [],
    dsoData: catalog.dsos || [],
    planetData: catalog.planets || [],
    ownedStarIds: catalog.ownedStarIds || [],
    selectedStar: selection.target || null,
    centerRa: view.ra ?? 0,
    centerDec: view.dec ?? 0,
    zoom: view.zoom ?? 1,
    coordinateMode: view.coordinateMode || 'equatorial',
    observerLatitude: view.observerLatitude ?? 0,
    lstDegrees: view.lstDegrees ?? 0,
    hideBelowHorizon: view.hideBelowHorizon ?? true,
    showConstellations: layers.constellations ?? false,
    showConstellationLabels: layers.constellationLabels ?? true,
    showConstellationBoundaries: layers.constellationBoundaries ?? false,
    showGrid: layers.grid ?? true,
    showLabels: layers.labels ?? false,
    showPlanets: layers.planets ?? true,
    showDSOs: layers.dsos ?? true,
    constellations: layers.constellationData,
    constellationStates: catalog.constellationStates,
    showMythology: layers.mythology ?? false,
    transparentBackground: layers.transparentBackground ?? false,
    nightVision: layers.nightVision ?? false,
    showNebula: layers.nebula ?? true,
    onInteractionStateChange: events.onInteractionStateChange,
    onCenterChange: events.onViewChange,
    onZoomChange: events.onZoomChange,
    onSelect: events.onSelect,
    onReady: events.onReady,
    onTelemetry: events.onTelemetry,
    active,
  };
}

export function createVoyage3DRendererProps({
  catalog = {},
  view = {},
  selection = {},
  events = {},
  qualityProfile,
  active = true,
} = {}) {
  return {
    stars: catalog.stars || [],
    ownedStars: catalog.ownedStars || [],
    loadedSectorCount: catalog.loadedSectorCount || 0,
    targetStar: selection.target || null,
    view,
    onArrival: events.onArrival,
    onTargetChange: events.onTargetChange,
    onOwnedStarPress: events.onOwnedStarPress,
    onReady: events.onReady,
    onRenderError: events.onError,
    onTelemetry: events.onTelemetry,
    onViewChange: events.onViewChange,
    onWarpStart: events.onWarpStart,
    qualityProfile,
    active,
  };
}

export function createRendererProps(kind, props) {
  if (kind === ENGINE_KIND.sky2d) return createSky2DRendererProps(props);
  if (kind === ENGINE_KIND.voyage3d) return createVoyage3DRendererProps(props);
  throw new Error(`Unsupported celestial engine kind: ${kind}`);
}
