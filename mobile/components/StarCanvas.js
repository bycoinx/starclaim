import React, { forwardRef, useImperativeHandle, useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { StyleSheet, View, Text, Dimensions, TouchableOpacity, PixelRatio } from 'react-native';
import {
  Canvas,
  Circle,
  Line,
  Group,
  Text as SkiaText,
  useFont,
  vec,
  LinearGradient,
  RadialGradient,
  Rect,
  Image as SkiaImage,
  useImage,
  Path,
  Points,
  Skia,
} from '@shopify/react-native-skia';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView
} from 'react-native-gesture-handler';
import {
  useSharedValue,
  useDerivedValue,
  useAnimatedReaction,
  useFrameCallback,
  runOnJS,
  withSpring,
  withTiming
} from 'react-native-reanimated';
import {
  buildTapStarIndex,
  findNearestIndexedStar,
} from '../src/sky/skyInteractionIndex';
import { buildSkyRenderPlan } from '../src/sky/skyRenderPlan';
import { MYTHOLOGY_ASSETS } from '../src/data/mythologyData';
import {
  isSkySegmentVisible,
  projectSkySegment,
} from '../src/utils/skyProjection';
import {
  getBaseRenderQuality,
  getHeapPressure,
  updateAdaptiveQuality,
} from '../src/utils/renderQuality';
import { CelestialEngineRuntime, ENGINE_KIND } from '../src/engine/CelestialEngineRuntime';
import { projectEquatorialToScreen } from '../src/engine/celestialCoordinates';
import {
  DEEP_SPACE_ATMOSPHERE_SPEC,
  MILKY_WAY_DENSITY_SPEC,
  NEBULA_BACKGROUND_SPEC,
  getMilkyWayWidthScale,
} from '../src/sky/skyVisualQuality';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const deg2rad = (deg) => {
  'worklet';
  return deg * Math.PI / 180;
};
const SPRING_CONFIG = { damping: 20, stiffness: 90 };
const SENSOR_VIEW_TIMING = { duration: 150 };
const GESTURE_UPDATE_DIVISOR = 2;
const MIN_PROJECTION_COSINE = 0.08;
const OWNED_RING_RENDER_LIMIT = 72;
const GALACTIC_PLANE = Array.from({ length: 73 }, (_, index) => {
  const longitude = index * 5 * Math.PI / 180;
  const galacticX = Math.cos(longitude);
  const galacticY = Math.sin(longitude);
  const equatorialX = -0.0548755604 * galacticX + 0.4941094279 * galacticY;
  const equatorialY = -0.8734370902 * galacticX - 0.4448296300 * galacticY;
  const equatorialZ = -0.4838350155 * galacticX + 0.7469822445 * galacticY;
  let raDegrees = Math.atan2(equatorialY, equatorialX) * 180 / Math.PI;
  if (raDegrees < 0) raDegrees += 360;
  return {
    ra: raDegrees / 15,
    dec: Math.asin(equatorialZ) * 180 / Math.PI,
  };
});

function normalizeRaDelta(delta) {
  'worklet';
  let value = delta;
  while (value > 180) value -= 360;
  while (value < -180) value += 360;
  return value;
}

function normalizeLongitude(value) {
  'worklet';
  let normalized = Number(value) || 0;
  while (normalized < 0) normalized += 360;
  while (normalized >= 360) normalized -= 360;
  return normalized;
}

function normalizeRaHours(value) {
  'worklet';
  let normalized = Number(value) || 0;
  while (normalized < 0) normalized += 24;
  while (normalized >= 24) normalized -= 24;
  return normalized;
}

function safeCosDeclination(decDegrees) {
  'worklet';
  const value = Math.cos(deg2rad(decDegrees));
  if (Math.abs(value) >= MIN_PROJECTION_COSINE) return value;
  return value < 0 ? -MIN_PROJECTION_COSINE : MIN_PROJECTION_COSINE;
}

function getWorkletStarDistanceParsec(star) {
  'worklet';
  if (star && Number.isFinite(star.distanceParsec)) return star.distanceParsec;
  if (star && Number.isFinite(star.dist)) return star.dist;
  if (star && Number.isFinite(star.distance)) return star.distance;
  return 100;
}

// Calculate parallax offset for a star based on its distance and view movement
// Returns { raOffset, decOffset } in degrees to add to star's position
function calculateParallaxOffset(star, prevRa, prevDec, currRa, currDec, layoutWidth, layoutHeight, zoomValue) {
  'worklet';
  // Get star distance in parsecs
  const distanceParsec = getWorkletStarDistanceParsec(star);

  // Calculate how much the view center has moved (in degrees)
  const raMove = normalizeRaDelta(currRa - prevRa);
  const decMove = currDec - prevDec;

  // Convert view movement from degrees to pixels at current zoom
  // Scale: pixels per degree = layoutWidth * zoomValue / 90 (approx, for small angles near equator)
  const pixelsPerDegree = layoutWidth * zoomValue / 90;
  const raMovePixels = raMove * pixelsPerDegree;
  const decMovePixels = decMove * pixelsPerDegree;

  // Parallax effect: closer stars appear to move more relative to distant ones
  // We want the offset to be in the OPPOSITE direction of view movement
  // Calculate normalized distance factor (closer = larger effect)
  // Use a logarithmic curve to avoid extreme values for very close/distant stars
  const normalizedDistance = Math.log(Math.max(distanceParsec, 1)) / Math.log(10000); // log(1)=0, log(10000)=~9.2
  const distanceFactor = 1.0 - Math.min(normalizedDistance, 1.0); // 1 for close stars, 0 for distant

  // Base parallax strength in pixels - aiming for 0.5-4px range as per document
  const baseParallaxPixels = 2.0; // Medium strength

  // Calculate parallax offset in pixels
  const raOffsetPixels = -raMovePixels * distanceFactor * baseParallaxPixels;
  const decOffsetPixels = -decMovePixels * distanceFactor * baseParallaxPixels;

  // Convert back to degrees for application in project function
  const raOffset = raOffsetPixels / pixelsPerDegree;
  const decOffset = decOffsetPixels / pixelsPerDegree;

  return { raOffset, decOffset };
}

function equatorialToHorizontal(raHours, decDegrees, latitudeDegrees, lstDegrees) {
  'worklet';
  const hourAngle = normalizeRaDelta(lstDegrees - raHours * 15) * Math.PI / 180;
  const declination = decDegrees * Math.PI / 180;
  const latitude = latitudeDegrees * Math.PI / 180;
  const sinAltitude = (
    Math.sin(declination) * Math.sin(latitude)
    + Math.cos(declination) * Math.cos(latitude) * Math.cos(hourAngle)
  );
  const altitude = Math.asin(Math.max(-1, Math.min(1, sinAltitude)));
  let azimuth = Math.atan2(
    -Math.sin(hourAngle) * Math.cos(declination),
    Math.sin(declination) * Math.cos(latitude)
      - Math.cos(declination) * Math.sin(latitude) * Math.cos(hourAngle),
  ) * 180 / Math.PI;
  while (azimuth < 0) azimuth += 360;
  while (azimuth >= 360) azimuth -= 360;
  return { az: azimuth, alt: altitude * 180 / Math.PI };
}

function projectDegrees(longitude, latitude, centerLongitude, centerLatitude, width, height, zoom) {
  'worklet';
  return projectEquatorialToScreen({
    raDegrees: longitude,
    decDegrees: latitude,
    centerRaDegrees: centerLongitude,
    centerDecDegrees: centerLatitude,
    width,
    height,
    zoom,
  });
}

function project(
  starRa,
  starDec,
  centerRa,
  centerDec,
  width,
  height,
  zoom,
  coordinateMode,
  observerLatitude,
  lstDegrees,
) {
  'worklet';
  if (coordinateMode === 'horizontal') {
    const horizontal = equatorialToHorizontal(
      starRa,
      starDec,
      observerLatitude,
      lstDegrees,
    );
    const projected = projectDegrees(
      horizontal.az,
      horizontal.alt,
      centerRa,
      centerDec,
      width,
      height,
      zoom,
    );
    return { x: projected.x, y: projected.y, skyAltitude: horizontal.alt };
  }
  const projected = projectDegrees(
    starRa * 15,
    starDec,
    centerRa,
    centerDec,
    width,
    height,
    zoom,
  );
  return { x: projected.x, y: projected.y, skyAltitude: null };
}

// Enhanced projection function with parallax effect for stars
function projectWithParallax(
  star,
  starRa,
  starDec,
  centerRa,
  centerDec,
  width,
  height,
  zoom,
  coordinateMode,
  observerLatitude,
  lstDegrees,
  prevRa,
  prevDec,
) {
  'worklet';
  // Calculate parallax offset based on view movement
  const parallaxOffset = calculateParallaxOffset(
    star,
    prevRa,
    prevDec,
    centerRa,
    centerDec,
    width,
    height,
    zoom
  );

  // Apply parallax offset to star's position
  const adjustedRa = normalizeRaHours(starRa + parallaxOffset.raOffset / 15);
  const adjustedDec = starDec + parallaxOffset.decOffset;

  // Project using adjusted position
  if (coordinateMode === 'horizontal') {
    const horizontal = equatorialToHorizontal(
      adjustedRa,
      adjustedDec,
      observerLatitude,
      lstDegrees,
    );
    const projected = projectDegrees(
      horizontal.az,
      horizontal.alt,
      centerRa,
      centerDec,
      width,
      height,
      zoom,
    );
    return { x: projected.x, y: projected.y, skyAltitude: horizontal.alt };
  }
  const projected = projectDegrees(
    adjustedRa * 15,
    adjustedDec,
    centerRa,
    centerDec,
    width,
    height,
    zoom,
  );
  return { x: projected.x, y: projected.y, skyAltitude: null };
}

function NebulaBackground({ ra, dec, layout, qualityLevel }) {
  const blueCenter = useDerivedValue(() => vec(
    layout.width * (0.28 + Math.sin(deg2rad(ra.value)) * 0.18),
    layout.height * (0.38 + Math.max(-1, Math.min(1, dec.value / 90)) * 0.16),
  ));
  const purpleCenter = useDerivedValue(() => vec(
    layout.width * (0.72 + Math.cos(deg2rad(ra.value * 0.62)) * 0.16),
    layout.height * (0.62 - Math.max(-1, Math.min(1, dec.value / 90)) * 0.12),
  ));
  const navyCenter = useDerivedValue(() => vec(
    layout.width * (0.5 + Math.sin(deg2rad(ra.value * 0.4)) * 0.1),
    layout.height * (0.5 + Math.cos(deg2rad(dec.value * 0.3)) * 0.1),
  ));

  return (
    <Group opacity={NEBULA_BACKGROUND_SPEC.opacity}>
      {/* Very light blue nebula */}
      <Rect x={0} y={0} width={layout.width} height={layout.height}>
        <RadialGradient
          c={blueCenter}
          r={layout.width * NEBULA_BACKGROUND_SPEC.gradients[0].radiusScale}
          colors={NEBULA_BACKGROUND_SPEC.gradients[0].colors}
        />
      </Rect>

      {/* Very light purple nebula */}
      <Rect x={0} y={0} width={layout.width} height={layout.height}>
        <RadialGradient
          c={purpleCenter}
          r={layout.width * NEBULA_BACKGROUND_SPEC.gradients[1].radiusScale}
          colors={NEBULA_BACKGROUND_SPEC.gradients[1].colors}
        />
      </Rect>

      {/* Very light navy nebula */}
      <Rect x={0} y={0} width={layout.width} height={layout.height}>
        <RadialGradient
          c={navyCenter}
          r={layout.width * NEBULA_BACKGROUND_SPEC.gradients[2].radiusScale}
          colors={NEBULA_BACKGROUND_SPEC.gradients[2].colors}
        />
      </Rect>
    </Group>
  );
}

function MilkyWayDensity({
  ra,
  dec,
  zoom,
  layout,
  coordinateMode,
  observerLatitude,
  lstDegrees,
  qualityLevel,
  nightVision,
  sampleStep = 1,
}) {
  const sampledGalacticPlane = useMemo(() => {
    const step = Math.max(1, Math.floor(sampleStep));
    if (step === 1) return GALACTIC_PLANE;
    const sampled = GALACTIC_PLANE.filter((_, index) => index % step === 0);
    const lastPoint = GALACTIC_PLANE[GALACTIC_PLANE.length - 1];
    if (sampled[sampled.length - 1] !== lastPoint) sampled.push(lastPoint);
    return sampled;
  }, [sampleStep]);

  const path = useDerivedValue(() => {
    const result = Skia.Path.Make();
    let previous = null;
    sampledGalacticPlane.forEach((point) => {
      const projected = project(
        point.ra,
        point.dec,
        ra.value,
        dec.value,
        layout.width,
        layout.height,
        zoom.value,
        coordinateMode,
        observerLatitude,
        lstDegrees,
      );
      const shouldContinue = previous
        && Math.abs(projected.x - previous.x) < layout.width * 0.5
        && Math.abs(projected.y - previous.y) < layout.height * 0.75;
      if (shouldContinue) result.lineTo(projected.x, projected.y);
      else result.moveTo(projected.x, projected.y);
      previous = projected;
    });
    return result;
  });

  const widthScale = getMilkyWayWidthScale(qualityLevel);

  return (
    <Group opacity={MILKY_WAY_DENSITY_SPEC.opacity}>
      {/* Main Milky Way band - very subtle */}
      <Path path={path} color={MILKY_WAY_DENSITY_SPEC.bands[0].color} style="stroke" strokeWidth={MILKY_WAY_DENSITY_SPEC.bands[0].width * widthScale} strokeCap="round" opacity={MILKY_WAY_DENSITY_SPEC.bands[0].opacity} />
      <Path path={path} color={MILKY_WAY_DENSITY_SPEC.bands[1].color} style="stroke" strokeWidth={MILKY_WAY_DENSITY_SPEC.bands[1].width * widthScale} strokeCap="round" opacity={MILKY_WAY_DENSITY_SPEC.bands[1].opacity} />
      <Path path={path} color={MILKY_WAY_DENSITY_SPEC.bands[2].color} style="stroke" strokeWidth={MILKY_WAY_DENSITY_SPEC.bands[2].width * widthScale} strokeCap="round" opacity={MILKY_WAY_DENSITY_SPEC.bands[2].opacity} />

      {/* Very subtle glow */}
      <Path path={path} color={MILKY_WAY_DENSITY_SPEC.bands[3].color} style="stroke" strokeWidth={MILKY_WAY_DENSITY_SPEC.bands[3].width * widthScale} strokeCap="round" opacity={MILKY_WAY_DENSITY_SPEC.bands[3].opacity} />
      <Path path={path} color={MILKY_WAY_DENSITY_SPEC.bands[4].color} style="stroke" strokeWidth={MILKY_WAY_DENSITY_SPEC.bands[4].width * widthScale} strokeCap="round" opacity={MILKY_WAY_DENSITY_SPEC.bands[4].opacity} />
    </Group>
  );
}

function DeepSpaceAtmosphere({ layout, nightVision }) {
  if (nightVision) return null;
  return (
    <Group>
      <Rect x={0} y={0} width={layout.width} height={layout.height} opacity={DEEP_SPACE_ATMOSPHERE_SPEC.gradients[0].opacity}>
        <RadialGradient
          c={vec(layout.width * DEEP_SPACE_ATMOSPHERE_SPEC.gradients[0].center.x, layout.height * DEEP_SPACE_ATMOSPHERE_SPEC.gradients[0].center.y)}
          r={layout.width * DEEP_SPACE_ATMOSPHERE_SPEC.gradients[0].radiusScale}
          colors={DEEP_SPACE_ATMOSPHERE_SPEC.gradients[0].colors}
        />
      </Rect>
      <Rect x={0} y={0} width={layout.width} height={layout.height} opacity={DEEP_SPACE_ATMOSPHERE_SPEC.gradients[1].opacity}>
        <RadialGradient
          c={vec(layout.width * DEEP_SPACE_ATMOSPHERE_SPEC.gradients[1].center.x, layout.height * DEEP_SPACE_ATMOSPHERE_SPEC.gradients[1].center.y)}
          r={layout.width * DEEP_SPACE_ATMOSPHERE_SPEC.gradients[1].radiusScale}
          colors={DEEP_SPACE_ATMOSPHERE_SPEC.gradients[1].colors}
        />
      </Rect>
    </Group>
  );
}

const StarCanvasBase = forwardRef(function StarCanvas({
  stars,
  dsoData = [],
  planetData = [],
  selectedStar,
  centerRa: initialRa,
  centerDec: initialDec,
  zoom: initialZoom,
  onCenterChange,
  onZoomChange,
  onSelect,
  ownedStarIds = [],
  showConstellations = false,
  showConstellationLabels = true,
  showConstellationBoundaries = false,
  showGrid = true,
  constellations = {
    lines: { features: [] },
    labels: { features: [] },
    boundaries: { features: [] },
  },
  showMythology = false,
  showLabels = false,
  showPlanets = true,
  showDSOs = true,
  coordinateMode = 'equatorial',
  observerLatitude = 0,
  lstDegrees = 0,
  hideBelowHorizon = true,
  transparentBackground = false,
  nightVision = false,
  showNebula = true,
  onReady = null,
  onTelemetry = null,
  onInteractionStateChange = null,
  active = true,
}, ref) {
  const [layout, setLayout] = useState({ width: SCREEN_WIDTH, height: SCREEN_HEIGHT });
  const [qualityLevel, setQualityLevel] = useState('high');
  const [virtualCenter, setVirtualCenter] = useState({ ra: initialRa, dec: initialDec });
  const virtualCenterRef = useRef({ ra: initialRa, dec: initialDec });

  const ra = useSharedValue(initialRa);
  const dec = useSharedValue(initialDec);
  const zoom = useSharedValue(initialZoom);
  const layerRa = useSharedValue(initialRa);
  const layerDec = useSharedValue(initialDec);
  const layerZoom = useSharedValue(initialZoom);
  const time = useSharedValue(0);
  const fpsShared = useSharedValue(0);
  const readyShared = useSharedValue(false);
  const frameCountShared = useSharedValue(0);
  const lastTimeShared = useSharedValue(0);
  const lastVisualTickShared = useSharedValue(0);
  const lastRenderSetLogAtRef = useRef(0);
  const readyDetailsRef = useRef(null);
  const onReadyRef = useRef(onReady);
  const onTelemetryRef = useRef(onTelemetry);
  const engineRef = useRef(null);
  if (!engineRef.current) {
    engineRef.current = new CelestialEngineRuntime({
      id: 'star-canvas',
      kind: ENGINE_KIND.sky2d,
      capabilities: ['catalog', 'view', 'selection', 'telemetry'],
    });
  }
  // For parallax effect: track previous center to calculate movement delta
  const prevRa = useSharedValue(initialRa);
  const prevDec = useSharedValue(initialDec);
  const panFrame = useSharedValue(0);
  const pinchFrame = useSharedValue(0);
  const qualityRef = useRef({ level: 'high', maximum: 'high', lowSamples: 0, highSamples: 0 });

  useImperativeHandle(ref, () => ({
    setView(nextRa, nextDec) {
      if (!Number.isFinite(nextRa) || !Number.isFinite(nextDec)) return;
      const nextRaNormalized = normalizeLongitude(nextRa);
      const nextDecClamped = Math.max(-90, Math.min(90, nextDec));
      engineRef.current.setView({ ra: nextRaNormalized, dec: nextDecClamped, zoom: zoom.value });
      const shortestRaTarget = ra.value + normalizeRaDelta(nextRaNormalized - normalizeLongitude(ra.value));
      ra.value = withTiming(shortestRaTarget, SENSOR_VIEW_TIMING);
      dec.value = withTiming(nextDecClamped, SENSOR_VIEW_TIMING);
      const current = virtualCenterRef.current;
      if (Math.abs(normalizeRaDelta(nextRaNormalized - current.ra)) >= 8 || Math.abs(nextDecClamped - current.dec) >= 6) {
        const next = { ra: nextRaNormalized, dec: nextDecClamped };
        virtualCenterRef.current = next;
        setVirtualCenter(next);
      }
    },
  }), [dec, ra]);

  useEffect(() => {
    onReadyRef.current = onReady;
    onTelemetryRef.current = onTelemetry;
    engineRef.current.setCallbacks({
      onReady: (_, details) => onReadyRef.current?.(details),
      onTelemetry: (details) => onTelemetryRef.current?.(details),
    });
  }, [onInteractionStateChange, onReady, onTelemetry]);

  useEffect(() => {
    engineRef.current.setCatalog('stars', stars);
  }, [stars]);

  useEffect(() => () => engineRef.current.destroy(), []);

  const reportTelemetry = (fps) => {
    const heapPressure = getHeapPressure();
    const next = updateAdaptiveQuality({
      current: qualityRef.current.level,
      maximum: qualityRef.current.maximum,
      fps,
      heapPressure,
      lowSamples: qualityRef.current.lowSamples,
      highSamples: qualityRef.current.highSamples,
      renderedObjects: readyDetailsRef.current?.totalDrawNodes || 0,
    });
    qualityRef.current = { ...qualityRef.current, ...next };
    setQualityLevel((current) => current === next.level ? current : next.level);
    engineRef.current.reportTelemetry({
      fps,
      heapPressure,
      quality: next.level,
      layerNodes: readyDetailsRef.current?.layerNodes,
      totalDrawNodes: readyDetailsRef.current?.totalDrawNodes,
      maximumQuality: qualityRef.current.maximum,
    });
  };

  const reportReady = () => {
    engineRef.current.initialize(readyDetailsRef.current);
    if (active) engineRef.current.start();
  };

  const baseQuality = useMemo(() => getBaseRenderQuality({
    pixelRatio: PixelRatio.get(),
    scenePixels: layout.width * layout.height * Math.pow(PixelRatio.get(), 2),
    catalogStarCount: stars.length,
  }), [layout.height, layout.width, stars.length]);

  useEffect(() => {
    qualityRef.current.maximum = baseQuality;
    const levels = ['low', 'medium', 'high'];
    if (levels.indexOf(qualityRef.current.level) > levels.indexOf(baseQuality)) {
      qualityRef.current.level = baseQuality;
      qualityRef.current.lowSamples = 0;
      qualityRef.current.highSamples = 0;
      setQualityLevel(baseQuality);
    }
  }, [baseQuality]);

  const visualTickMs = qualityLevel === 'high' ? 33 : qualityLevel === 'medium' ? 50 : 100;
  const sensorLayerMultiplier = coordinateMode === 'horizontal' ? 2.4 : 1;
  const layerRaThreshold = (qualityLevel === 'high' ? 1.2 : qualityLevel === 'medium' ? 2.2 : 3.5) * sensorLayerMultiplier;
  const layerDecThreshold = (qualityLevel === 'high' ? 0.9 : qualityLevel === 'medium' ? 1.6 : 2.5) * sensorLayerMultiplier;
  const layerZoomThreshold = qualityLevel === 'high' ? 0.16 : qualityLevel === 'medium' ? 0.25 : 0.4;

  useAnimatedReaction(
    () => ({
      ra: ra.value,
      dec: dec.value,
      zoom: zoom.value,
    }),
    (next) => {
      const raChanged = Math.abs(normalizeRaDelta(next.ra - layerRa.value)) >= layerRaThreshold;
      const decChanged = Math.abs(next.dec - layerDec.value) >= layerDecThreshold;
      const zoomChanged = Math.abs(next.zoom - layerZoom.value) >= layerZoomThreshold;
      if (raChanged || decChanged || zoomChanged) {
        layerRa.value = next.ra;
        layerDec.value = next.dec;
        layerZoom.value = next.zoom;
      }
    },
    [layerDecThreshold, layerRaThreshold, layerZoomThreshold],
  );

  useFrameCallback((info) => {
    const now = info.timestamp;
    if (!readyShared.value) {
      readyShared.value = true;
      runOnJS(reportReady)();
    }
    frameCountShared.value += 1;
    if (now - lastTimeShared.value >= 1000) {
      const measuredFps = Math.round((frameCountShared.value * 1000) / (now - lastTimeShared.value));
      fpsShared.value = measuredFps;
      frameCountShared.value = 0;
      lastTimeShared.value = now;
      runOnJS(reportTelemetry)(measuredFps);
    }
    if (now - lastVisualTickShared.value >= visualTickMs) {
      lastVisualTickShared.value = now;
      time.value = now / 1000;
    }
    // Update previous center values for parallax calculation
    prevRa.value = ra.value;
    prevDec.value = dec.value;
  }, active);

  useEffect(() => {
    if (active && readyShared.value) engineRef.current.start();
    if (!active) engineRef.current.stop();
  }, [active, readyShared]);

  useEffect(() => {
    ra.value = withSpring(initialRa, SPRING_CONFIG);
    dec.value = withSpring(initialDec, SPRING_CONFIG);
    zoom.value = withSpring(initialZoom, SPRING_CONFIG);
    layerRa.value = initialRa;
    layerDec.value = initialDec;
    layerZoom.value = initialZoom;
    const next = { ra: initialRa, dec: initialDec };
    virtualCenterRef.current = next;
    setVirtualCenter(next);
  }, [initialRa, initialDec, initialZoom]);

  const panGesture = Gesture.Pan()
    .onBegin(() => {
      if (onInteractionStateChange) runOnJS(onInteractionStateChange)(true);
    })
    .onUpdate((e) => {
      panFrame.value = (panFrame.value + 1) % GESTURE_UPDATE_DIVISOR;
      if (panFrame.value !== 0) return;
      const field = 90 / zoom.value;
      const scale = layout.width / field;
      const raMove = (e.changeX / scale) / safeCosDeclination(dec.value);
      const decMove = (e.changeY / scale);
      ra.value = normalizeLongitude(ra.value - raMove);
      dec.value += decMove;
      if (dec.value > 90) dec.value = 90;
      if (dec.value < -90) dec.value = -90;
    })
    .onEnd(() => {
      if (onCenterChange) runOnJS(onCenterChange)({ ra: ra.value, dec: dec.value });
    })
    .onFinalize(() => {
      if (onInteractionStateChange) runOnJS(onInteractionStateChange)(false);
    });

  const pinchGesture = Gesture.Pinch()
    .onBegin(() => {
      if (onInteractionStateChange) runOnJS(onInteractionStateChange)(true);
    })
    .onUpdate((e) => {
      pinchFrame.value = (pinchFrame.value + 1) % GESTURE_UPDATE_DIVISOR;
      if (pinchFrame.value !== 0) return;
      const newZoom = zoom.value * e.scaleChange;
      zoom.value = Math.max(0.2, Math.min(15, newZoom));
    })
    .onEnd(() => {
      if (onZoomChange) runOnJS(onZoomChange)(zoom.value);
    })
    .onFinalize(() => {
      if (onInteractionStateChange) runOnJS(onInteractionStateChange)(false);
    });

  const ownedIdSet = useMemo(
    () => new Set(ownedStarIds.map((id) => String(id))),
    [ownedStarIds],
  );

  const {
    renderedStars,
    starBatches,
    overlayStars,
    visibleDSOs,
    visiblePlanets,
    visibleConstellationLabels,
    visibleConstellationLineSegments,
    visibleBoundarySegments,
    visibleMythologyKeys,
    enabledLayers,
    visualLayerBudget,
    layerNodeEstimate,
  } = useMemo(() => buildSkyRenderPlan({
    stars,
    selectedStar,
    ownedIdSet,
    qualityLevel,
    zoom: initialZoom,
    nightVision,
    coordinateMode,
    observerLatitude,
    lstDegrees,
    virtualCenter,
    layout,
    dsoData,
    planetData,
    constellations,
    mythologyAssets: MYTHOLOGY_ASSETS,
    showLabels,
    showGrid,
    showNebula,
    showDSOs,
    showPlanets,
    showConstellations,
    showConstellationLabels,
    showConstellationBoundaries,
    showMythology,
  }), [
    constellations.boundaries?.features,
    constellations.labels?.features,
    constellations.lines?.features,
    coordinateMode,
    dsoData,
    initialZoom,
    layout.height,
    layout.width,
    lstDegrees,
    nightVision,
    observerLatitude,
    ownedIdSet,
    planetData,
    qualityLevel,
    selectedStar?.canonicalId,
    showConstellationBoundaries,
    showConstellationLabels,
    showConstellations,
    showDSOs,
    showGrid,
    showLabels,
    showMythology,
    showNebula,
    showPlanets,
    selectedStar?.con,
    selectedStar?.constellation,
    selectedStar?.hip,
    selectedStar?.id,
    stars,
    virtualCenter.dec,
    virtualCenter.ra,
  ]);

  const ownedRingStars = useMemo(() => {
    const selectedCanonical = selectedStar?.canonicalId != null ? String(selectedStar.canonicalId) : null;
    const selectedId = selectedStar?.id != null ? String(selectedStar.id) : null;
    const selectedHip = selectedStar?.hip != null ? String(selectedStar.hip) : null;

    return renderedStars
      .filter((star) => {
        if (!star?.owned) return false;
        const canonicalId = star?.canonicalId != null ? String(star.canonicalId) : null;
        const starId = star?.id != null ? String(star.id) : null;
        const hip = star?.hip != null ? String(star.hip) : null;
        if (selectedCanonical && canonicalId && selectedCanonical === canonicalId) return false;
        if (selectedId && starId && selectedId === starId) return false;
        if (selectedHip && hip && selectedHip === hip) return false;
        return true;
      })
      .sort((a, b) => Number(a?.mag ?? 99) - Number(b?.mag ?? 99))
      .slice(0, OWNED_RING_RENDER_LIMIT);
  }, [renderedStars, selectedStar?.canonicalId, selectedStar?.hip, selectedStar?.id]);

  readyDetailsRef.current = {
    catalogStarCount: stars.length,
    renderedStarCount: renderedStars.length,
    quality: qualityLevel,
    layerNodes: layerNodeEstimate.layers,
    totalDrawNodes: layerNodeEstimate.total,
    width: layout.width,
    height: layout.height,
  };

  useEffect(() => {
    if (__DEV__) {
      const now = Date.now();
      if (now - lastRenderSetLogAtRef.current < 5000) return;
      lastRenderSetLogAtRef.current = now;
      console.debug(`[StarCanvas] render set: ${renderedStars.length}/${stars.length}`);
    }
  }, [renderedStars.length, stars.length]);

  const tapStarIndex = useMemo(() => {
    return buildTapStarIndex({
      stars: renderedStars,
      width: layout.width,
      height: layout.height,
      hideBelowHorizon,
      projectStar: (star) => project(
        star.ra,
        star.dec,
        virtualCenter.ra,
        virtualCenter.dec,
        layout.width,
        layout.height,
        initialZoom,
        coordinateMode,
        observerLatitude,
        lstDegrees,
      ),
    });
  }, [
    coordinateMode,
    hideBelowHorizon,
    initialZoom,
    layout.height,
    layout.width,
    lstDegrees,
    observerLatitude,
    renderedStars,
    virtualCenter.dec,
    virtualCenter.ra,
  ]);

  const selectNearestStar = useCallback((x, y) => {
    if (!onSelect) return;
    const closestStar = findNearestIndexedStar(tapStarIndex, x, y);
    if (closestStar) onSelect(closestStar);
  }, [onSelect, tapStarIndex]);

  const tapGesture = Gesture.Tap()
    .runOnJS(true)
    .onEnd((e) => selectNearestStar(e.x, e.y));

  const combinedGesture = Gesture.Simultaneous(panGesture, pinchGesture, tapGesture);

  const font = useFont(null, 10);
  const boldFont = useFont(null, 11);

  const selectedStarPos = useDerivedValue(() => {
    if (!selectedStar) return null;
    return project(
      selectedStar.ra,
      selectedStar.dec,
      ra.value,
      dec.value,
      layout.width,
      layout.height,
      zoom.value,
      coordinateMode,
      observerLatitude,
      lstDegrees,
    );
  });

  const isSelectedVisible = useDerivedValue(() => {
    if (!selectedStarPos.value) return false;
    return selectedStarPos.value.x > 0 && selectedStarPos.value.x < layout.width &&
           selectedStarPos.value.y > 0 && selectedStarPos.value.y < layout.height &&
           (!hideBelowHorizon || selectedStarPos.value.skyAltitude == null || selectedStarPos.value.skyAltitude >= 0);
  });
  const selectedX = useDerivedValue(() => selectedStarPos.value?.x ?? -100);
  const selectedY = useDerivedValue(() => selectedStarPos.value?.y ?? -100);
  const selectedHaloCenter = useDerivedValue(() => vec(selectedX.value, selectedY.value));
  const selectedOpacity = useDerivedValue(() => isSelectedVisible.value ? 1 : 0);
  const selectedRingRadius = useDerivedValue(() => 20 + Math.sin(time.value * 3) * 2);

  return (
    <GestureHandlerRootView style={[styles.container, transparentBackground && styles.transparentContainer]}>
      <GestureDetector gesture={combinedGesture}>
        <View style={[styles.container, transparentBackground && styles.transparentContainer]} onLayout={(e) => setLayout(e.nativeEvent.layout)}>
          <Canvas style={styles.canvas}>
            {!transparentBackground && (
              <Rect x={0} y={0} width={layout.width} height={layout.height}>
                <RadialGradient
                  c={vec(layout.width / 2, layout.height / 2)}
                  r={layout.width * 1.25}
                  colors={['#02050A', '#000000', '#000000']}
                />
              </Rect>
            )}

            {!transparentBackground && enabledLayers.deepAtmosphere && (
              <DeepSpaceAtmosphere layout={layout} nightVision={nightVision} />
            )}

            {enabledLayers.nebula && !transparentBackground && !nightVision && (
              <NebulaBackground
                ra={layerRa}
                dec={layerDec}
                layout={layout}
                qualityLevel={qualityLevel}
              />
            )}

            {enabledLayers.milkyWay && !transparentBackground && (
              <MilkyWayDensity
                ra={layerRa}
                dec={layerDec}
                zoom={layerZoom}
                layout={layout}
                coordinateMode={coordinateMode}
                observerLatitude={observerLatitude}
                lstDegrees={lstDegrees}
                qualityLevel={qualityLevel}
                nightVision={nightVision}
                sampleStep={visualLayerBudget.milkyWaySampleStep}
              />
            )}

            {coordinateMode === 'horizontal' && (
              <HorizonOverlay
                ra={ra}
                dec={dec}
                zoom={zoom}
                layout={layout}
                font={boldFont}
                nightVision={nightVision}
              />
            )}

            {enabledLayers.grid && (
              <CelestialGrid
                ra={layerRa}
                dec={layerDec}
                zoom={layerZoom}
                layout={layout}
                font={font}
                qualityLevel={qualityLevel}
                coordinateMode={coordinateMode}
                observerLatitude={observerLatitude}
                lstDegrees={lstDegrees}
                nightVision={nightVision}
              />
            )}

            {enabledLayers.mythology && visibleMythologyKeys.map((key) => {
              const data = MYTHOLOGY_ASSETS[key];
              return (
                <MythologyFigure key={key} data={data} ra={ra} dec={dec} zoom={zoom} layout={layout} coordinateMode={coordinateMode} observerLatitude={observerLatitude} lstDegrees={lstDegrees} />
              );
            })}

            {enabledLayers.dsos && visibleDSOs.map((dso) => (
              <DSOMarker key={dso.id} dso={dso} ra={ra} dec={dec} zoom={zoom} layout={layout} font={font} coordinateMode={coordinateMode} observerLatitude={observerLatitude} lstDegrees={lstDegrees} nightVision={nightVision} time={time} />
            ))}

            {enabledLayers.constellationBoundaries && (
              <ConstellationBoundariesPath
                segments={visibleBoundarySegments}
                ra={layerRa}
                dec={layerDec}
                zoom={layerZoom}
                layout={layout}
                coordinateMode={coordinateMode}
                observerLatitude={observerLatitude}
                lstDegrees={lstDegrees}
                nightVision={nightVision}
              />
            )}

            {enabledLayers.constellations && (
              <ConstellationsPath
                segments={visibleConstellationLineSegments}
                ra={layerRa}
                dec={layerDec}
                zoom={layerZoom}
                layout={layout}
                coordinateMode={coordinateMode}
                observerLatitude={observerLatitude}
                lstDegrees={lstDegrees}
                nightVision={nightVision}
              />
            )}

            {starBatches.map((batch) => (
              <StarPointBatch key={batch.key} batch={batch} ra={ra} dec={dec} zoom={zoom} layout={layout} time={time} coordinateMode={coordinateMode} observerLatitude={observerLatitude} lstDegrees={lstDegrees} hideBelowHorizon={hideBelowHorizon} qualityLevel={qualityLevel} prevRa={prevRa} prevDec={prevDec} />
            ))}

            {ownedRingStars.map((star) => (
              <OwnedStarRing
                key={`owned-ring-${star.canonicalId || star.id}`}
                star={star}
                ra={ra}
                dec={dec}
                zoom={zoom}
                layout={layout}
                coordinateMode={coordinateMode}
                observerLatitude={observerLatitude}
                lstDegrees={lstDegrees}
                hideBelowHorizon={hideBelowHorizon}
                nightVision={nightVision}
              />
            ))}

            {overlayStars.map((star) => (
              <StarCircle key={`overlay-${star.canonicalId || star.id}`} star={star} ra={ra} dec={dec} zoom={zoom} layout={layout} time={time} font={font} showLabels={showLabels} suppressLabel={selectedStar?.canonicalId === star.canonicalId || selectedStar?.id === star.id} coordinateMode={coordinateMode} observerLatitude={observerLatitude} lstDegrees={lstDegrees} hideBelowHorizon={hideBelowHorizon} nightVision={nightVision} qualityLevel={qualityLevel} prevRa={prevRa} prevDec={prevDec} />
            ))}

            {enabledLayers.constellationLabels && visibleConstellationLabels.map((feature, index) => (
              <ConstellationLabel
                key={`${feature.id || 'label'}-${index}`}
                feature={feature}
                ra={ra}
                dec={dec}
                zoom={zoom}
                layout={layout}
                font={boldFont}
                coordinateMode={coordinateMode}
                observerLatitude={observerLatitude}
                lstDegrees={lstDegrees}
                nightVision={nightVision}
              />
            ))}

            {enabledLayers.planets && visiblePlanets.map((planet) => (
              <PlanetMarker key={planet.id} planet={planet} ra={ra} dec={dec} zoom={zoom} layout={layout} font={boldFont} coordinateMode={coordinateMode} observerLatitude={observerLatitude} lstDegrees={lstDegrees} nightVision={nightVision} time={time} />
            ))}

            {enabledLayers.shootingStars && <ShootingStar time={time} layout={layout} />}

            {selectedStar && (
              <Group opacity={selectedOpacity}>
                <Circle cx={selectedX} cy={selectedY} r={28} opacity={0.42}>
                  <RadialGradient c={selectedHaloCenter} r={28} colors={nightVision ? ['rgba(255,105,97,0.5)', 'rgba(255,74,66,0)'] : ['rgba(178,222,255,0.55)', 'rgba(119,191,255,0)']} />
                </Circle>
                <Circle cx={selectedX} cy={selectedY} r={selectedRingRadius} color={nightVision ? '#FF6961' : '#9DD2FF'} style="stroke" strokeWidth={1} opacity={0.48} />
                <Circle cx={selectedX} cy={selectedY} r={8} color={nightVision ? 'rgba(255,105,97,0.35)' : 'rgba(157,210,255,0.34)'} />
                <Circle cx={selectedX} cy={selectedY} r={3.2} color={nightVision ? '#FFD0CC' : '#FFFFFF'} />
              </Group>
            )}
          </Canvas>

          <View style={styles.controls} pointerEvents="box-none">
            <TouchableOpacity style={styles.zoomButton} onPress={() => { zoom.value = Math.min(15, zoom.value + 1); onZoomChange?.(zoom.value); }}>
              <Text style={styles.zoomText}>+</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.zoomButton} onPress={() => { zoom.value = Math.max(0.2, zoom.value - 1); onZoomChange?.(zoom.value); }}>
              <Text style={styles.zoomText}>-</Text>
            </TouchableOpacity>
          </View>
        </View>
      </GestureDetector>
    </GestureHandlerRootView>
  );
});

const StarCanvas = React.memo(StarCanvasBase);
StarCanvas.displayName = 'StarCanvas';

export default StarCanvas;

const CelestialGrid = React.memo(function CelestialGrid({ ra, dec, zoom, layout, font, qualityLevel, coordinateMode, observerLatitude, lstDegrees, nightVision }) {
  const raSteps = qualityLevel === 'low'
    ? [0, 6, 12, 18]
    : qualityLevel === 'medium'
      ? [0, 4, 8, 12, 16, 20]
      : [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22];
  const decSteps = qualityLevel === 'low'
    ? [-60, -30, 0, 30, 60]
    : qualityLevel === 'medium'
      ? [-75, -45, -15, 15, 45, 75]
      : [-75, -60, -45, -30, -15, 0, 15, 30, 45, 60, 75];

  const gridLines = useMemo(() => {
    const lines = [];
    raSteps.forEach((raStep) => {
      const linePoints = [];
      const decStepSize = qualityLevel === 'high' ? 5 : 10;
      for (let d = -85; d <= 85; d += decStepSize) {
        linePoints.push({ ra: raStep, dec: d });
      }
      lines.push(linePoints);
    });
    decSteps.forEach((decStep) => {
      const linePoints = [];
      const raStepSize = qualityLevel === 'high' ? 1 : 2;
      for (let r = 0; r <= 24; r += raStepSize) {
        linePoints.push({ ra: r, dec: decStep });
      }
      lines.push(linePoints);
    });
    return lines;
  }, [qualityLevel]);

  const path = useDerivedValue(() => {
    const p = Skia.Path.Make();
    const w = layout.width;
    const h = layout.height;
    const z = zoom.value;
    const rVal = ra.value;
    const dVal = dec.value;

    gridLines.forEach((linePoints) => {
      let isDrawing = false;
      for (let i = 0; i < linePoints.length - 1; i++) {
        const segment = projectSkySegment(
          linePoints[i],
          linePoints[i + 1],
          rVal,
          dVal,
          w,
          h,
          z,
          coordinateMode,
          observerLatitude,
          lstDegrees,
        );

        if (isSkySegmentVisible(segment, w, h, 100, coordinateMode, -2, true)) {
          if (!isDrawing) {
            p.moveTo(segment.p1.x, segment.p1.y);
            isDrawing = true;
          }
          p.lineTo(segment.p2.x, segment.p2.y);
        } else {
          isDrawing = false;
        }
      }
    });

    return p;
  });

  return (
    <Path
      path={path}
      color={nightVision ? 'rgba(255,74,66,0.07)' : 'rgba(80,145,190,0.035)'}
      strokeWidth={0.5}
      style="stroke"
    />
  );
});

const HorizonOverlay = React.memo(function HorizonOverlay({ ra, dec, zoom, layout, font, nightVision }) {
  const horizonY = useDerivedValue(() => (
    projectDegrees(ra.value, 0, ra.value, dec.value, layout.width, layout.height, zoom.value).y
  ));
  const directions = [
    { az: 0, label: 'K' },
    { az: 90, label: 'D' },
    { az: 180, label: 'G' },
    { az: 270, label: 'B' },
  ];

  return (
    <Group>
      {/* Ground Shading with Gradient */}
      <Rect
        x={0}
        y={horizonY}
        width={layout.width}
        height={useDerivedValue(() => Math.max(0, layout.height - horizonY.value))}
      >
        <LinearGradient
          start={useDerivedValue(() => vec(0, horizonY.value))}
          end={useDerivedValue(() => vec(0, layout.height))}
          colors={nightVision ? ['rgba(25,0,0,0.95)', '#000000'] : ['rgba(10,15,30,0.92)', '#000000']}
        />
      </Rect>

      {/* Atmospheric Glow */}
      <Rect
        x={0}
        y={useDerivedValue(() => horizonY.value - 80)}
        width={layout.width}
        height={80}
      >
        <LinearGradient
          start={useDerivedValue(() => vec(0, horizonY.value - 80))}
          end={useDerivedValue(() => vec(0, horizonY.value))}
          colors={nightVision ? ['rgba(0,0,0,0)', 'rgba(255,45,35,0.12)'] : ['rgba(0,0,0,0)', 'rgba(0,242,254,0.1)']}
        />
      </Rect>

      {/* Horizon Line */}
      <Line
        p1={useDerivedValue(() => vec(0, horizonY.value))}
        p2={useDerivedValue(() => vec(layout.width, horizonY.value))}
        color={nightVision ? 'rgba(255,74,66,0.4)' : 'rgba(0,242,254,0.3)'}
        strokeWidth={1}
      />
      {directions.map((direction) => (
        <HorizonDirection
          key={direction.label}
          direction={direction}
          ra={ra}
          dec={dec}
          zoom={zoom}
          layout={layout}
          font={font}
          nightVision={nightVision}
        />
      ))}
    </Group>
  );
});

const HorizonDirection = React.memo(function HorizonDirection({ direction, ra, dec, zoom, layout, font, nightVision }) {
  const pos = useDerivedValue(() => (
    projectDegrees(
      direction.az,
      0,
      ra.value,
      dec.value,
      layout.width,
      layout.height,
      zoom.value,
    )
  ));
  const isVisible = useDerivedValue(() => (
    pos.value.x > 8
    && pos.value.x < layout.width - 18
    && pos.value.y > 20
    && pos.value.y < layout.height - 8
  ));

  const cx = useDerivedValue(() => pos.value.x);
  const cy = useDerivedValue(() => pos.value.y);
  const textX = useDerivedValue(() => pos.value.x - 4);
  const textY = useDerivedValue(() => pos.value.y + 4);
  const opacity = useDerivedValue(() => isVisible.value ? 1 : 0);

  if (!font) return null;
  return (
    <Group opacity={opacity}>
      <Circle cx={cx} cy={cy} r={11} color="rgba(0,0,0,0.72)" />
      <SkiaText
        x={textX}
        y={textY}
        text={direction.label}
        font={font}
        color={nightVision ? '#FF4A42' : '#C9A84C'}
      />
    </Group>
  );
});

function ConstellationBoundariesPath({ segments = [], ra, dec, zoom, layout, coordinateMode, observerLatitude, lstDegrees, nightVision }) {

  const path = useDerivedValue(() => {
    const p = Skia.Path.Make();
    const w = layout.width;
    const h = layout.height;
    const z = zoom.value;
    const rVal = ra.value;
    const dVal = dec.value;

    if (z < 0.75) return p;

    segments.forEach((item) => {
      const segment = projectSkySegment(
        { ra: item.firstRa, dec: item.firstDec },
        { ra: item.secondRa, dec: item.secondDec },
        rVal,
        dVal,
        w,
        h,
        z,
        coordinateMode,
        observerLatitude,
        lstDegrees,
      );

      if (isSkySegmentVisible(segment, w, h, 60, coordinateMode, 0)) {
        p.moveTo(segment.p1.x, segment.p1.y);
        p.lineTo(segment.p2.x, segment.p2.y);
      }
    });

    return p;
  });

  return (
    <Path
      path={path}
      color={nightVision ? 'rgba(255,74,66,0.13)' : 'rgba(130,160,190,0.11)'}
      strokeWidth={0.65}
      style="stroke"
    />
  );
}

function ConstellationLabel({ feature, ra, dec, zoom, layout, font, coordinateMode, observerLatitude, lstDegrees, nightVision }) {
  const coordinates = feature.geometry?.coordinates;
  const label = feature.properties?.iau || feature.properties?.abbrev || feature.properties?.abbr || feature.id || feature.properties?.tr || feature.properties?.name;
  const rank = Number(feature.properties?.rank || 3);
  const pos = useDerivedValue(() => project(coordinates[0] / 15, coordinates[1], ra.value, dec.value, layout.width, layout.height, zoom.value, coordinateMode, observerLatitude, lstDegrees));

  const isVisible = useDerivedValue(() => {
    const rankVisible = rank <= 1 || zoom.value >= 1.5;
    return (
      rankVisible
      && zoom.value >= 0.6
      && pos.value.x > -50
      && pos.value.x < layout.width + 50
      && pos.value.y > -20
      && pos.value.y < layout.height + 20
      && (coordinateMode !== 'horizontal' || pos.value.skyAltitude >= 0)
    );
  });

  const opacity = useDerivedValue(() => {
    if (!isVisible.value) return 0;
    return zoom.value < 1.0 ? 0.4 : 0.8;
  });

  const labelOffsetX = Math.max(10, String(label || '').length * 3.5);
  const labelX = useDerivedValue(() => pos.value.x - labelOffsetX);
  const labelY = useDerivedValue(() => pos.value.y);

  if (!font || !coordinates) return null;
  return (
    <Group opacity={opacity}>
      <SkiaText
        x={labelX}
        y={labelY}
        text={String(label).toUpperCase()}
        font={font}
        color={nightVision ? '#FF4A42' : '#E6C98C'}
      />
    </Group>
  );
}

function ConstellationsPath({ segments = [], ra, dec, zoom, layout, coordinateMode, observerLatitude, lstDegrees, nightVision }) {
  const paths = useDerivedValue(() => {
    const regularPath = Skia.Path.Make();
    const emphasizedPath = Skia.Path.Make();
    const w = layout.width;
    const h = layout.height;
    const z = zoom.value;
    const rVal = ra.value;
    const dVal = dec.value;

    segments.forEach((item) => {
      const targetPath = item.emphasized ? emphasizedPath : regularPath;
      const segment = projectSkySegment(
        { ra: item.firstRa, dec: item.firstDec },
        { ra: item.secondRa, dec: item.secondDec },
        rVal,
        dVal,
        w,
        h,
        z,
        coordinateMode,
        observerLatitude,
        lstDegrees,
      );

      if (isSkySegmentVisible(segment, w, h, 100, coordinateMode, -5, true)) {
        targetPath.moveTo(segment.p1.x, segment.p1.y);
        targetPath.lineTo(segment.p2.x, segment.p2.y);
      }
    });

    return { regular: regularPath, emphasized: emphasizedPath };
  });

  const regular = useDerivedValue(() => paths.value.regular);
  const emphasized = useDerivedValue(() => paths.value.emphasized);

  const regularColor = nightVision ? 'rgba(255,74,66,0.18)' : 'rgba(120,160,205,0.14)';
  const emphasizedColor = nightVision ? 'rgba(255,105,97,0.62)' : 'rgba(126,190,255,0.62)';
  const regularWidth = useDerivedValue(() => zoom.value > 2 ? 1 : 0.7);
  const emphasizedWidth = useDerivedValue(() => zoom.value > 2 ? 1.7 : 1.25);

  return (
    <Group>
      <Path
        path={regular}
        color={regularColor}
        strokeWidth={regularWidth}
        style="stroke"
      />
      <Path
        path={emphasized}
        color={emphasizedColor}
        strokeWidth={emphasizedWidth}
        style="stroke"
      />
    </Group>
  );
}

const StarPointBatch = React.memo(function StarPointBatch({ batch, ra, dec, zoom, layout, time, coordinateMode, observerLatitude, lstDegrees, hideBelowHorizon, qualityLevel, prevRa, prevDec }) {
  const enableParallax = qualityLevel === 'high' && coordinateMode !== 'horizontal';

  // Animate points dynamically based on current values of shared values
  const points = useDerivedValue(() => {
    const rVal = ra.value;
    const dVal = dec.value;
    const zVal = zoom.value;
    const prVal = prevRa.value;
    const pdVal = prevDec.value;

    return batch.stars.map((star) => {
      const projected = enableParallax
        ? projectWithParallax(
          star,
          star.ra,
          star.dec,
          rVal,
          dVal,
          layout.width,
          layout.height,
          zVal,
          coordinateMode,
          observerLatitude,
          lstDegrees,
          prVal,
          pdVal,
        )
        : project(
          star.ra,
          star.dec,
          rVal,
          dVal,
          layout.width,
          layout.height,
          zVal,
          coordinateMode,
          observerLatitude,
          lstDegrees,
        );

      const visible = projected.x > -20
        && projected.x < layout.width + 20
        && projected.y > -20
        && projected.y < layout.height + 20
        && (!hideBelowHorizon || projected.skyAltitude == null || projected.skyAltitude >= 0);

      return visible
        ? { x: projected.x, y: projected.y }
        : { x: -1000, y: -1000 };
    });
  });

  const phase = batch.key.length * 0.41;
  const opacity = useDerivedValue(() => (
    qualityLevel === 'low' ? 0.92 : 0.91 + Math.sin(time.value * 1.25 + phase) * 0.035
  ));

  return (
    <Points
      points={points}
      mode="points"
      color={batch.color}
      strokeWidth={batch.radius * 2}
      strokeCap="round"
      opacity={opacity}
    />
  );
});

const StarCircle = React.memo(function StarCircle({ star, ra, dec, zoom, layout, time, font, showLabels, suppressLabel, coordinateMode, observerLatitude, lstDegrees, hideBelowHorizon, nightVision, qualityLevel, prevRa, prevDec }) {
  const twinklePhase = (parseFloat(star.id || 0) % 17) * 0.37;
  const isBrightStar = Number(star.mag) <= 2;
  const enableParallax = qualityLevel === 'high' && coordinateMode !== 'horizontal';

  // Add slight uniqueness to each star based on its ID for premium feel
  const starSeed = parseFloat(star.id || 0);
  const starUniqueOffset = (starSeed % 97) / 1000; // Value between 0-0.096
  const starUniqueScale = 0.95 + (starSeed % 13) / 100; // Value between 0.95-1.07
  const starUniqueHue = (starSeed % 31) / 100; // Value between 0-0.31 for subtle hue shift

  // Animate star position dynamically using useDerivedValue
  const starPosition = useDerivedValue(() => {
    const p = enableParallax
      ? projectWithParallax(
        star,
        star.ra,
        star.dec,
        ra.value,
        dec.value,
        layout.width,
        layout.height,
        zoom.value,
        coordinateMode,
        observerLatitude,
        lstDegrees,
        prevRa.value,
        prevDec.value,
      )
      : project(
        star.ra,
        star.dec,
        ra.value,
        dec.value,
        layout.width,
        layout.height,
        zoom.value,
        coordinateMode,
        observerLatitude,
        lstDegrees,
      );
    const isVisible = p.x > -30 && p.x < layout.width + 30 && p.y > -30 && p.y < layout.height + 30 && (!hideBelowHorizon || p.skyAltitude == null || p.skyAltitude >= 0);
    const opacity = qualityLevel === 'low' ? 0.92 : 0.9 + Math.sin(time.value * 1.8 + twinklePhase) * 0.08;
    return {
      x: p.x,
      y: p.y,
      isVisible,
      baseOpacity: opacity,
      twinklePhase,
    };
  });

  const cx = useDerivedValue(() => starPosition.value.x);
  const cy = useDerivedValue(() => starPosition.value.y);
  const opacity = useDerivedValue(() => starPosition.value.isVisible ? starPosition.value.baseOpacity : 0);
  const groupOpacity = useDerivedValue(() => starPosition.value.isVisible ? 1 : 0);

  const haloCenter = useDerivedValue(() => vec(starPosition.value.x, starPosition.value.y));

  const labelVisible = useDerivedValue(() => {
    if (suppressLabel || !star.proper) return false;
    return starPosition.value.isVisible && (zoom.value > 2.8 || (showLabels && zoom.value > 1.4));
  });

  const labelOpacity = useDerivedValue(() => labelVisible.value ? 1 : 0);
  const detailLabelOpacity = useDerivedValue(() => labelVisible.value && zoom.value > 4 ? 0.5 : 0);

  // Enhanced star color with slight uniqueness
  const enhancedStarColor = useMemo(() => {
    if (nightVision) return '#FF514A';

    // Parse the original color
    let color = star.color;
    if (color.startsWith('rgba')) {
      // Already has alpha, return as is for night vision compatibility
      return color;
    }

    // Add subtle color variation based on star properties for uniqueness
    // This makes each star slightly different while maintaining spectral accuracy
    const baseColor = color;

    // For premium feel, add tiny variations to make each star unique
    // We'll modify the color slightly in HSL space, then convert back
    // But for simplicity, we'll do a slight RGB shift based on star ID

    // Extract RGB values from hex color
    let r = 0, g = 0, b = 0;
    if (color.length === 7) {
      r = parseInt(color.substring(1, 3), 16);
      g = parseInt(color.substring(3, 5), 16);
      b = parseInt(color.substring(5, 7), 16);
    }

    // Apply subtle unique variation (±3% for each channel)
    const variation = starUniqueOffset * 0.06; // ±3%
    r = Math.min(255, Math.max(0, r + (r * variation * (starSeed % 2 ? 1 : -1))));
    g = Math.min(255, Math.max(0, g + (g * variation * ((starSeed + 1) % 2 ? 1 : -1))));
    b = Math.min(255, Math.max(0, b + (b * variation * ((starSeed + 2) % 2 ? 1 : -1))));

    // Convert back to hex
    const toHex = (n) => n.toString(16).padStart(2, '0');
    return `#${toHex(Math.round(r))}${toHex(Math.round(g))}${toHex(Math.round(b))}`;
  }, [star.color, nightVision, starUniqueOffset, starSeed]);

  const haloRadius = Math.max(8, star.radius * 4.2);
  const haloColors = nightVision
    ? ['rgba(255,105,97,0.5)', 'rgba(255,74,66,0)']
    : [
        // Slightly enhanced halo with lens bloom effect
        `${enhancedStarColor}88`, // Inner halo
        `${enhancedStarColor}22`, // Middle halo
        'rgba(0,0,0,0)'           // Outer transparent
      ];

  const labelX = useDerivedValue(() => starPosition.value.x + star.radius + 6);
  const labelY1 = useDerivedValue(() => starPosition.value.y - star.radius - 4);
  const labelY2 = useDerivedValue(() => starPosition.value.y - star.radius + 8);
  const showDiffractionSpike = isBrightStar && Number(star.mag) < 1.5 && qualityLevel !== 'low';
  const spikeOpacity = useDerivedValue(() => (zoom.value > 2 ? 0.3 : 0));
  const spikeSoftOpacity = useDerivedValue(() => (zoom.value > 2 ? 0.2 : 0));
  const verticalSpikeP1 = useDerivedValue(() => vec(starPosition.value.x, starPosition.value.y - haloRadius * 0.8));
  const verticalSpikeP2 = useDerivedValue(() => vec(starPosition.value.x, starPosition.value.y + haloRadius * 0.8));
  const horizontalSpikeP1 = useDerivedValue(() => vec(starPosition.value.x - haloRadius * 0.8, starPosition.value.y));
  const horizontalSpikeP2 = useDerivedValue(() => vec(starPosition.value.x + haloRadius * 0.8, starPosition.value.y));
  const diagonalSpikeP1 = useDerivedValue(() => vec(starPosition.value.x - haloRadius * 0.6, starPosition.value.y - haloRadius * 0.6));
  const diagonalSpikeP2 = useDerivedValue(() => vec(starPosition.value.x + haloRadius * 0.6, starPosition.value.y + haloRadius * 0.6));
  const diagonalSpikeP3 = useDerivedValue(() => vec(starPosition.value.x + haloRadius * 0.6, starPosition.value.y - haloRadius * 0.6));
  const diagonalSpikeP4 = useDerivedValue(() => vec(starPosition.value.x - haloRadius * 0.6, starPosition.value.y + haloRadius * 0.6));

  return (
    <Group opacity={groupOpacity}>
      {isBrightStar && qualityLevel !== 'low' && (
        <>
          {/* Enhanced glow effect for bright stars */}
          <Circle
            cx={cx}
            cy={cy}
            r={haloRadius * 1.2}
            opacity={nightVision ? 0.12 : 0.2}
          >
            <RadialGradient
              c={haloCenter}
              r={haloRadius * 1.2}
              colors={[
                `${enhancedStarColor}33`, // Very subtle outer glow
                `${enhancedStarColor}00`, // Transparent edge
              ]}
            />
          </Circle>

          {/* Main halo with lens bloom effect */}
          <Circle
            cx={cx}
            cy={cy}
            r={haloRadius}
            opacity={nightVision ? 0.18 : 0.34}
          >
            <RadialGradient
              c={haloCenter}
              r={haloRadius}
              colors={haloColors}
            />
          </Circle>

          {/* Very low level diffraction spike for bright stars */}
          {/* Only visible on very bright stars (mag < 1.5) and only at higher zoom */}
          {showDiffractionSpike && (
            <>
              {/* Vertical spike */}
              <Line
                p1={verticalSpikeP1}
                p2={verticalSpikeP2}
                strokeWidth={0.5}
                color={nightVision ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.15)'}
                opacity={spikeOpacity}
              />
              {/* Horizontal spike */}
              <Line
                p1={horizontalSpikeP1}
                p2={horizontalSpikeP2}
                strokeWidth={0.5}
                color={nightVision ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.15)'}
                opacity={spikeOpacity}
              />
              {/* Diagonal spikes */}
              <Line
                p1={diagonalSpikeP1}
                p2={diagonalSpikeP2}
                strokeWidth={0.3}
                color={nightVision ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.12)'}
                opacity={spikeSoftOpacity}
              />
              <Line
                p1={diagonalSpikeP3}
                p2={diagonalSpikeP4}
                strokeWidth={0.3}
                color={nightVision ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.12)'}
                opacity={spikeSoftOpacity}
              />
            </>
          )}
        </>
      )}

      {/* Main star body with unique color */}
      <Circle
        cx={cx}
        cy={cy}
        r={star.radius * starUniqueScale}
        color={enhancedStarColor}
        opacity={opacity}
      />

      {/* Inner bright core */}
      {isBrightStar && (
        <Circle
          cx={cx}
          cy={cy}
          r={Math.max(0.5, star.radius * 0.25)}
          color={nightVision ? '#FFD4D0' : '#FFFFFF'}
          opacity={0.8}
        />
      )}

      {font && star.proper && (
        <Group opacity={labelOpacity}>
           <SkiaText
             x={labelX}
             y={labelY1}
             text={star.proper.toUpperCase()}
             font={font}
             color={nightVision ? 'rgba(255,74,66,0.76)' : 'rgba(255,255,255,0.7)'}
           />
           <SkiaText
             x={labelX}
             y={labelY2}
             text={`MAG: ${star.mag?.toFixed(2)}`}
             font={font}
             color={nightVision ? 'rgba(255,74,66,0.45)' : 'rgba(0, 204, 255, 0.4)'}
             opacity={detailLabelOpacity}
           />
        </Group>
      )}
    </Group>
  );
});

function getOwnedRingColor(star, nightVision) {
  if (nightVision) return '#FF4A42';
  const mag = Number(star?.mag);
  if (Number.isFinite(mag) && mag < 1) return '#E6C05A';
  if (Number.isFinite(mag) && mag < 2.5) return '#7DC7FF';
  if (Number.isFinite(mag) && mag < 4) return '#79D39B';
  return '#B5C0D0';
}

const OwnedStarRing = React.memo(function OwnedStarRing({
  star,
  ra,
  dec,
  zoom,
  layout,
  coordinateMode,
  observerLatitude,
  lstDegrees,
  hideBelowHorizon,
  nightVision,
}) {
  const starPosition = useDerivedValue(() => {
    const projected = project(
      star.ra,
      star.dec,
      ra.value,
      dec.value,
      layout.width,
      layout.height,
      zoom.value,
      coordinateMode,
      observerLatitude,
      lstDegrees,
    );

    const isVisible = projected.x > -30
      && projected.x < layout.width + 30
      && projected.y > -30
      && projected.y < layout.height + 30
      && (!hideBelowHorizon || projected.skyAltitude == null || projected.skyAltitude >= 0);

    return {
      x: projected.x,
      y: projected.y,
      isVisible,
    };
  });

  const cx = useDerivedValue(() => starPosition.value.x);
  const cy = useDerivedValue(() => starPosition.value.y);
  const opacity = useDerivedValue(() => (starPosition.value.isVisible ? 0.95 : 0));
  const ringRadius = Math.max(4.5, Number(star?.radius || 1) + 3.6);

  return (
    <Circle
      cx={cx}
      cy={cy}
      r={ringRadius}
      color={getOwnedRingColor(star, nightVision)}
      style="stroke"
      strokeWidth={1.25}
      opacity={opacity}
    />
  );
});

function PlanetMarker({ planet, ra, dec, zoom, layout, font, coordinateMode, observerLatitude, lstDegrees, nightVision, time }) {
  const pos = useDerivedValue(() => project(planet.ra, planet.dec, ra.value, dec.value, layout.width, layout.height, zoom.value, coordinateMode, observerLatitude, lstDegrees));
  const isVisible = useDerivedValue(() => (
    pos.value.x > -40
    && pos.value.x < layout.width + 40
    && pos.value.y > -40
    && pos.value.y < layout.height + 40
    && (coordinateMode !== 'horizontal' || pos.value.skyAltitude >= 0)
  ));

  const pulse = useDerivedValue(() => 1 + Math.sin(time.value * 2) * 0.15);
  const planetDetailVisible = useDerivedValue(() => zoom.value > 2.5 ? 0.5 : 0);
  const accent = nightVision ? '#FF4A42' : planet.color;

  const cx = useDerivedValue(() => pos.value.x);
  const cy = useDerivedValue(() => pos.value.y);
  const opacity = useDerivedValue(() => isVisible.value ? 1 : 0);
  const outerRadius = useDerivedValue(() => 14 * pulse.value * (zoom.value > 2 ? 1.4 : 1));
  const midRadius = useDerivedValue(() => 8 * (zoom.value > 2 ? 1.4 : 1));
  const innerRadius = useDerivedValue(() => 4 * (zoom.value > 2 ? 1.4 : 1));
  const labelOpacity = useDerivedValue(() => zoom.value > 0.8 ? 1 : 0);
  const labelX = useDerivedValue(() => pos.value.x + 16);
  const labelY1 = useDerivedValue(() => pos.value.y + 4);
  const labelY2 = useDerivedValue(() => pos.value.y + 16);

  return (
    <Group opacity={opacity}>
      {/* Outer Glow / Pulse */}
      <Circle
        cx={cx}
        cy={cy}
        r={outerRadius}
        color={accent}
        opacity={0.15}
      />

      {/* Target Ring */}
      <Circle
        cx={cx}
        cy={cy}
        r={midRadius}
        color={accent}
        style="stroke"
        strokeWidth={1}
        opacity={0.6}
      />

      {/* Solid Core */}
      <Circle
        cx={cx}
        cy={cy}
        r={innerRadius}
        color={accent}
      />

      {/* Planet Label with High Visibility */}
      {font && (
        <Group opacity={labelOpacity}>
          <SkiaText
            x={labelX}
            y={labelY1}
            text={planet.name}
            font={font}
            color="#fff"
          />
          <SkiaText
            x={labelX}
            y={labelY2}
            text="SYSTEM_OBJECT"
            font={font}
            color={accent}
            opacity={planetDetailVisible}
          />
        </Group>
      )}
    </Group>
  );
}

function DSOMarker({ dso, ra, dec, zoom, layout, font, coordinateMode, observerLatitude, lstDegrees, nightVision, time }) {
  const pos = useDerivedValue(() => project(dso.ra, dso.dec, ra.value, dec.value, layout.width, layout.height, zoom.value, coordinateMode, observerLatitude, lstDegrees));
  const isVisible = useDerivedValue(() => (
    pos.value.x > -60
    && pos.value.x < layout.width + 60
    && pos.value.y > -60
    && pos.value.y < layout.height + 60
    && (coordinateMode !== 'horizontal' || pos.value.skyAltitude >= 0)
  ));

  const accent = nightVision ? '#FF4A42' : dso.color;
  const pulse = useDerivedValue(() => 0.6 + Math.sin(time.value * 1.5) * 0.2);
  const dsoLabelVisible = useDerivedValue(() => zoom.value > 1.8 ? 1 : 0);

  const cx = useDerivedValue(() => pos.value.x);
  const cy = useDerivedValue(() => pos.value.y);
  const opacity = useDerivedValue(() => isVisible.value ? 1 : 0);
  const clusterRadius = useDerivedValue(() => 10 * (zoom.value / 2));
  const rectX = useDerivedValue(() => pos.value.x - 12 * (zoom.value / 2));
  const rectY = useDerivedValue(() => pos.value.y - 4 * (zoom.value / 2));
  const rectWidth = useDerivedValue(() => 24 * (zoom.value / 2));
  const rectHeight = useDerivedValue(() => 8 * (zoom.value / 2));
  const nebX = useDerivedValue(() => pos.value.x - 8);
  const nebY = useDerivedValue(() => pos.value.y - 8);
  const labelX = useDerivedValue(() => pos.value.x + 14);
  const labelY1 = useDerivedValue(() => pos.value.y - 4);
  const labelY2 = useDerivedValue(() => pos.value.y + 8);

  return (
    <Group opacity={opacity}>
      {dso.type === 'galaxy' && (
        <Group>
          <Circle cx={cx} cy={cy} r={clusterRadius} color={accent} opacity={0.1} />
          <Rect
            x={rectX}
            y={rectY}
            width={rectWidth}
            height={rectHeight}
            color={accent}
            opacity={0.4}
            style="stroke"
            strokeWidth={1}
          />
        </Group>
      )}

      {dso.type === 'nebula' && (
        <Rect
          x={nebX}
          y={nebY}
          width={16}
          height={16}
          color={accent}
          style="stroke"
          strokeWidth={1}
          opacity={pulse}
        />
      )}

      {dso.type === 'cluster' && (
        <Circle
          cx={cx}
          cy={cy}
          r={10}
          color={accent}
          style="stroke"
          strokeWidth={1}
          strokeCap="round"
          opacity={0.5}
        />
      )}

      {/* Identity Label */}
      {font && (
        <Group opacity={dsoLabelVisible}>
          <SkiaText
            x={labelX}
            y={labelY1}
            text={dso.name.toUpperCase()}
            font={font}
            color="#fff"
          />
          <SkiaText
            x={labelX}
            y={labelY2}
            text={dso.type.toUpperCase()}
            font={font}
            color={accent}
            opacity={0.6}
          />
        </Group>
      )}
    </Group>
  );
}

// Shooting star effect for premium feel
function ShootingStar({ time, layout }) {
  const [meteor, setMeteor] = useState(null);

  useEffect(() => {
    if (!layout.width || !layout.height) return undefined;
    let launchTimer;
    let clearTimer;
    let cancelled = false;
    const schedule = () => {
      const delay = 15000 + Math.random() * 30000;
      launchTimer = setTimeout(() => {
        if (cancelled) return;
        setMeteor({
          x: Math.random() * layout.width,
          y: Math.random() * layout.height * 0.75,
          length: 80 + Math.random() * 120,
          angle: Math.random() * Math.PI * 2,
          start: Date.now() / 1000,
        });
        clearTimer = setTimeout(() => {
          if (cancelled) return;
          setMeteor(null);
          schedule();
        }, 1200);
      }, delay);
    };
    schedule();
    return () => {
      cancelled = true;
      clearTimeout(launchTimer);
      clearTimeout(clearTimer);
    };
  }, [layout.width, layout.height]);

  const activeMeteor = meteor || { x: -1000, y: -1000, length: 0, angle: 0, start: 0 };
  const progress = useDerivedValue(() => {
    if (!meteor) return 0;
    const raw = Math.max(0, Math.min(1, (time.value - activeMeteor.start) / 1.05));
    return 1 - Math.pow(1 - raw, 3);
  });
  const p1 = useMemo(() => vec(activeMeteor.x, activeMeteor.y), [activeMeteor.x, activeMeteor.y]);
  const p2 = useDerivedValue(() => vec(
    activeMeteor.x + Math.cos(activeMeteor.angle) * activeMeteor.length * progress.value,
    activeMeteor.y + Math.sin(activeMeteor.angle) * activeMeteor.length * progress.value,
  ));
  const opacity = useDerivedValue(() => (meteor ? Math.max(0, 0.82 * (1 - progress.value * 0.35)) : 0));
  const headX = useDerivedValue(() => p2.value.x);
  const headY = useDerivedValue(() => p2.value.y);

  return (
    <Group>
      <Line
        p1={p1}
        p2={p2}
        strokeWidth={2}
        color="#FFFFFF"
        opacity={opacity}
      />
      <Circle
        cx={headX}
        cy={headY}
        r={1.5}
        color="#FFFFFF"
        opacity={opacity}
      />
    </Group>
  );
}

function MythologyFigure({ data, ra, dec, zoom, layout, coordinateMode, observerLatitude, lstDegrees }) {
  const image = useImage(data.url);
  const pos = useDerivedValue(() => project(data.ra, data.dec, ra.value, dec.value, layout.width, layout.height, zoom.value, coordinateMode, observerLatitude, lstDegrees));
  const size = useDerivedValue(() => 320 * (data.scale || 1.0) * (zoom.value / 2.0));
  const isVisible = useDerivedValue(() => pos.value.x > -size.value && pos.value.x < layout.width + size.value && pos.value.y > -size.value && pos.value.y < layout.height + size.value);

  const opacity = useDerivedValue(() => isVisible.value ? 0.2 : 0);
  const imageX = useDerivedValue(() => pos.value.x - size.value / 2);
  const imageY = useDerivedValue(() => pos.value.y - size.value / 2);

  if (!image) return null;
  return (
    <Group opacity={opacity}>
      <SkiaImage image={image} x={imageX} y={imageY} width={size} height={size} fit="contain" />
    </Group>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  transparentContainer: { backgroundColor: 'transparent' },
  canvas: { flex: 1 },
  controls: {
    position: 'absolute',
    right: 12,
    bottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: 120
  },
  zoomButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.06)', marginBottom: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  zoomText: { color: '#fff', fontSize: 20, fontWeight: '300' },
  fpsText: { color: '#fff', fontSize: 14, fontWeight: '600' }
});
