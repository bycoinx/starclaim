import React, { forwardRef, useImperativeHandle, useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { StyleSheet, View, Text, Dimensions, TouchableOpacity, PixelRatio, InteractionManager } from 'react-native';
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
  useFrameCallback,
  runOnJS,
  withSpring
} from 'react-native-reanimated';
import { radiusForMag, colorForStar } from '../src/utils/astronomy';
import { MYTHOLOGY_ASSETS } from '../src/data/mythologyData';
import { getPlanetPositions } from '../src/utils/solarSystem';
import {
  isSkySegmentVisible,
  projectSkySegment,
} from '../src/utils/skyProjection';
import {
  estimateLayerNodes,
  getBaseRenderQuality,
  getHeapPressure,
  updateAdaptiveQuality,
} from '../src/utils/renderQuality';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const deg2rad = (deg) => {
  'worklet';
  return deg * Math.PI / 180;
};
const SPRING_CONFIG = { damping: 20, stiffness: 90 };
const TAP_CELL_SIZE = 56;
const VIEWPORT_PADDING = 140;
const STAR_RENDER_BUDGET = { low: 100, medium: 200, high: 300 };
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

// Calculate parallax offset for a star based on its distance and view movement
// Returns { raOffset, decOffset } in degrees to add to star's position
function calculateParallaxOffset(star, prevRa, prevDec, currRa, currDec, layoutWidth, layoutHeight, zoomValue) {
  'worklet';
  // Get star distance in parsecs
  const distanceParsec = getStarDistanceParsec(star);

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
  const longitudeDiff = normalizeRaDelta(longitude - centerLongitude);
  const latitudeDiff = latitude - centerLatitude;
  const field = 90 / Math.max(0.1, zoom);
  const scale = width / field;
  const x = width / 2 + longitudeDiff * scale * Math.cos(deg2rad(centerLatitude));
  const y = height / 2 - latitudeDiff * scale;
  return { x, y };
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
) {
  'worklet';
  // Calculate parallax offset based on view movement
  const parallaxOffset = calculateParallaxOffset(
    star,
    prevRaRef.current,
    prevDecRef.current,
    centerRa,
    centerDec,
    width,
    height,
    zoom
  );

  // Apply parallax offset to star's position
  const adjustedRa = normalizeRaDelta(starRa + parallaxOffset.raOffset);
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

function magnitudeLimitForZoom(zoom) {
  if (zoom < 0.8) return 6.2;
  if (zoom < 1.5) return 7.2;
  if (zoom < 3) return 8.4;
  return 9.5;
}

function isCoarselyVisible(ra, dec, virtualCenter, zoom, layout) {
  'worklet';
  const fovDegrees = 90 / Math.max(0.1, zoom);
  const padding = 15;
  const halfFovX = (fovDegrees / 2) + padding;
  const halfFovY = (fovDegrees / 2) + padding;

  const decDiff = Math.abs(dec - virtualCenter.dec);
  if (decDiff > halfFovY) return false;

  let raDiff = Math.abs(ra * 15 - virtualCenter.ra);
  while (raDiff > 180) raDiff = 360 - raDiff;

  const cosDec = Math.cos((virtualCenter.dec * Math.PI) / 180);
  // Avoid division by zero or near-zero
  const cosDecAdjusted = Math.max(0.001, cosDec);
  const maxRaDiff = halfFovX / cosDecAdjusted;

  return raDiff <= maxRaDiff;
}

function getCellKey(x, y) {
  return `${Math.floor(x / TAP_CELL_SIZE)}:${Math.floor(y / TAP_CELL_SIZE)}`;
}

function isSelectedConstellation(feature, selectedStar) {
  'worklet';
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

  // Very subtle nebula - only 5% opacity as per document
  const nebulaOpacity = 0.05;

  return (
    <Group opacity={nebulaOpacity}>
      {/* Very light blue nebula */}
      <Rect x={0} y={0} width={layout.width} height={layout.height}>
        <RadialGradient
          c={blueCenter}
          r={layout.width * 0.8}
          colors={['rgba(30, 60, 120, 0.03)', 'rgba(10, 20, 40, 0.01)', 'rgba(0,0,0,0)']}
        />
      </Rect>

      {/* Very light purple nebula */}
      <Rect x={0} y={0} width={layout.width} height={layout.height}>
        <RadialGradient
          c={purpleCenter}
          r={layout.width * 0.7}
          colors={['rgba(60, 30, 80, 0.025)', 'rgba(20, 10, 30, 0.005)', 'rgba(0,0,0,0)']}
        />
      </Rect>

      {/* Very light navy nebula */}
      <Rect x={0} y={0} width={layout.width} height={layout.height}>
        <RadialGradient
          c={navyCenter}
          r={layout.width * 0.6}
          colors={['rgba(10, 20, 60, 0.02)', 'rgba(5, 10, 20, 0.005)', 'rgba(0,0,0,0)']}
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
}) {
  const path = useDerivedValue(() => {
    const result = Skia.Path.Make();
    let previous = null;
    GALACTIC_PLANE.forEach((point) => {
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

  // Milky Way at 10-15% opacity as per document (using 12%)
  const milkyWayOpacity = 0.12;
  const widthScale = qualityLevel === 'low' ? 0.6 : qualityLevel === 'medium' ? 0.8 : 1;

  return (
    <Group opacity={milkyWayOpacity}>
      {/* Main Milky Way band - very subtle */}
      <Path path={path} color='#1A1A2E' style="stroke" strokeWidth={80 * widthScale} strokeCap="round" opacity={0.4} />
      <Path path={path} color='#16213E' style="stroke" strokeWidth={60 * widthScale} strokeCap="round" opacity={0.3} />
      <Path path={path} color='#0F3460' style="stroke" strokeWidth={40 * widthScale} strokeCap="round" opacity={0.2} />

      {/* Very subtle glow */}
      <Path path={path} color='#533483' style="stroke" strokeWidth={120 * widthScale} strokeCap="round" opacity={0.08} />
      <Path path={path} color='#7209B7' style="stroke" strokeWidth={100 * widthScale} strokeCap="round" opacity={0.05} />
    </Group>
  );
}

function DeepSpaceAtmosphere({ layout, nightVision }) {
  if (nightVision) return null;
  return (
    <Group>
      <Rect x={0} y={0} width={layout.width} height={layout.height} opacity={0.42}>
        <RadialGradient
          c={vec(layout.width * 0.18, layout.height * 0.2)}
          r={layout.width * 0.78}
          colors={['rgba(18,48,96,0.58)', 'rgba(5,11,28,0.12)', 'rgba(0,0,0,0)']}
        />
      </Rect>
      <Rect x={0} y={0} width={layout.width} height={layout.height} opacity={0.32}>
        <RadialGradient
          c={vec(layout.width * 0.82, layout.height * 0.68)}
          r={layout.width * 0.68}
          colors={['rgba(75,35,112,0.42)', 'rgba(9,14,38,0.1)', 'rgba(0,0,0,0)']}
        />
      </Rect>
    </Group>
  );
}

const StarCanvasBase = forwardRef(function StarCanvas({
  stars,
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
  constellations = [],
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
  const [dsoData, setDsoData] = useState([]);
  const [virtualCenter, setVirtualCenter] = useState({ ra: initialRa, dec: initialDec });
  const virtualCenterRef = useRef({ ra: initialRa, dec: initialDec });
  // For parallax effect: track reference center to calculate movement
  const refCenterRef = useRef({ ra: initialRa, dec: initialDec });

  const ra = useSharedValue(initialRa);
  const dec = useSharedValue(initialDec);
  const zoom = useSharedValue(initialZoom);
  const time = useSharedValue(0);
  const fpsShared = useSharedValue(0);
  const readyShared = useSharedValue(false);
  const gestureFrame = useSharedValue(0);
  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(0);
  const lastVisualTickRef = useRef(0);
  const readyDetailsRef = useRef(null);
  const onReadyRef = useRef(onReady);
  const onTelemetryRef = useRef(onTelemetry);
  // For parallax effect: track previous center to calculate movement delta
  const prevRaRef = useRef(initialRa);
  const prevDecRef = useRef(initialDec);
  const qualityRef = useRef({ level: 'high', maximum: 'high', lowSamples: 0, highSamples: 0 });

  useImperativeHandle(ref, () => ({
    setView(nextRa, nextDec) {
      if (!Number.isFinite(nextRa) || !Number.isFinite(nextDec)) return;
      ra.value = nextRa;
      dec.value = Math.max(-90, Math.min(90, nextDec));
      const nextDecClamped = Math.max(-90, Math.min(90, nextDec));
      const current = virtualCenterRef.current;
      if (Math.abs(normalizeRaDelta(nextRa - current.ra)) >= 8 || Math.abs(nextDecClamped - current.dec) >= 6) {
        const next = { ra: nextRa, dec: nextDecClamped };
        virtualCenterRef.current = next;
        setVirtualCenter(next);
      }
    },
  }), [dec, ra]);

  useEffect(() => {
    onReadyRef.current = onReady;
    onTelemetryRef.current = onTelemetry;
  }, [onInteractionStateChange, onReady, onTelemetry]);

  const reportTelemetry = (fps) => {
    const heapPressure = getHeapPressure();
    const next = updateAdaptiveQuality({
      current: qualityRef.current.level,
      maximum: qualityRef.current.maximum,
      fps,
      heapPressure,
      lowSamples: qualityRef.current.lowSamples,
      highSamples: qualityRef.current.highSamples,
    });
    qualityRef.current = { ...qualityRef.current, ...next };
    setQualityLevel((current) => current === next.level ? current : next.level);
    onTelemetryRef.current?.({
      fps,
      heapPressure,
      quality: next.level,
      layerNodes: readyDetailsRef.current?.layerNodes,
      totalDrawNodes: readyDetailsRef.current?.totalDrawNodes,
    });
  };

  const reportReady = () => {
    onReadyRef.current?.(readyDetailsRef.current);
  };

  const planetData = useMemo(() => getPlanetPositions(), []);

  useEffect(() => {
    if (!showDSOs || dsoData.length) return undefined;
    let cancelled = false;
    const task = InteractionManager.runAfterInteractions(() => {
      import('../src/data/dsoData')
        .then(({ DSO_CATALOG }) => {
          if (!cancelled) setDsoData(DSO_CATALOG);
        })
        .catch(() => {});
    });
    return () => {
      cancelled = true;
      task.cancel?.();
    };
  }, [dsoData.length, showDSOs]);

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

  useFrameCallback((info) => {
    const now = info.timestamp;
    if (!readyShared.value) {
      readyShared.value = true;
      runOnJS(reportReady)();
    }
    frameCountRef.current++;
    if (now - lastTimeRef.current >= 1000) {
      const measuredFps = Math.round((frameCountRef.current * 1000) / (now - lastTimeRef.current));
      fpsShared.value = measuredFps;
      frameCountRef.current = 0;
      lastTimeRef.current = now;
      runOnJS(reportTelemetry)(measuredFps);
    }
    if (now - lastVisualTickRef.current >= 33) {
      lastVisualTickRef.current = now;
      time.value = now / 1000;
    }
    // Update previous center values for parallax calculation
    prevRaRef.current = ra.value;
    prevDecRef.current = dec.value;
  }, active);

  useEffect(() => {
    ra.value = withSpring(initialRa, SPRING_CONFIG);
    dec.value = withSpring(initialDec, SPRING_CONFIG);
    zoom.value = withSpring(initialZoom, SPRING_CONFIG);
    const next = { ra: initialRa, dec: initialDec };
    virtualCenterRef.current = next;
    setVirtualCenter(next);
  }, [initialRa, initialDec, initialZoom]);

  const panGesture = Gesture.Pan()
    .onBegin(() => {
      if (onInteractionStateChange) runOnJS(onInteractionStateChange)(true);
    })
    .onUpdate((e) => {
      gestureFrame.value = (gestureFrame.value + 1) % 2;
      if (gestureFrame.value !== 0) return;
      const field = 90 / zoom.value;
      const scale = layout.width / field;
      const raMove = (e.changeX / scale) / Math.cos(deg2rad(dec.value));
      const decMove = (e.changeY / scale);
      ra.value -= raMove;
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

  const renderedStars = useMemo(() => {
    const qualityMagnitudeOffset = qualityLevel === 'low' ? -0.5 : qualityLevel === 'medium' ? -0.2 : 0;
    const magnitudeLimit = magnitudeLimitForZoom(initialZoom) + qualityMagnitudeOffset;
    const poolLimit = STAR_RENDER_BUDGET[qualityLevel] || STAR_RENDER_BUDGET.medium;
    const importantStars = [];
    const regularStars = [];

    stars.forEach((star) => {
      const owned = (
        ownedIdSet.has(String(star.id))
        || ownedIdSet.has(String(star.hip))
      );
      const important = owned || String(selectedStar?.id) === String(star.id);
      if (!important && Number(star.mag) > magnitudeLimit) return;

      const prepared = {
        ...star,
        radius: radiusForMag(star.mag, star.spect),
        color: nightVision ? '#FF514A' : colorForStar(star),
        owned,
      };
      if (coordinateMode === 'horizontal') {
        const horizontal = equatorialToHorizontal(
          star.ra,
          star.dec,
          observerLatitude,
          lstDegrees,
        );
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
          initialZoom,
        )
        : projectDegrees(
          star.ra * 15,
          star.dec,
          virtualCenter.ra,
          virtualCenter.dec,
          layout.width,
          layout.height,
          initialZoom,
        );
      const inVirtualViewport = projected.x >= -VIEWPORT_PADDING
        && projected.x <= layout.width + VIEWPORT_PADDING
        && projected.y >= -VIEWPORT_PADDING
        && projected.y <= layout.height + VIEWPORT_PADDING;
      if (!important && !inVirtualViewport) return;
      if (important) importantStars.push(prepared);
      else regularStars.push(prepared);
    });

    // Sort regular stars by magnitude (brightest first), handling invalid values
    regularStars.sort((a, b) => {
      const magA = Number(a.mag);
      const magB = Number(b.mag);
      // Treat invalid magnitudes as infinity so they appear at the end
      const safeA = isNaN(magA) ? Infinity : magA;
      const safeB = isNaN(magB) ? Infinity : magB;
      return safeA - safeB;
    });
    return [...importantStars, ...regularStars.slice(0, poolLimit)];
  }, [
    initialZoom,
    nightVision,
    ownedIdSet,
    qualityLevel,
    coordinateMode,
    observerLatitude,
    lstDegrees,
    layout.height,
    layout.width,
    selectedStar?.id,
    stars,
    virtualCenter.dec,
    virtualCenter.ra,
  ]);

  const starBatches = useMemo(() => {
    const batches = new Map();
    renderedStars.forEach((star) => {
      const radius = Math.max(0.75, Math.min(3, Math.round(star.radius * 2) / 2));
      const key = `${star.color}:${radius}`;
      const batch = batches.get(key) || { key, color: star.color, radius, stars: [] };
      batch.stars.push(star);
      batches.set(key, batch);
    });
    return [...batches.values()];
  }, [renderedStars]);

  const overlayStars = useMemo(() => renderedStars
    .filter((star) => star.owned || (star.proper && (showLabels || initialZoom > 2.8)))
    .slice(0, 24), [initialZoom, renderedStars, showLabels]);

  const visibleDSOs = useMemo(() => {
    if (!showDSOs) return [];

    // Pre-calculate viewport bounds for efficiency
    const fovDegrees = 90 / Math.max(0.1, initialZoom);
    const halfFovX = (fovDegrees / 2) + 15; // padding
    const halfFovY = (fovDegrees / 2) + 15; // padding

    return dsoData.filter(dso => {
      // Simple bounding box check
      return isCoarselyVisible(dso.ra, dso.dec, virtualCenter, initialZoom, layout);
    });
  }, [dsoData, showDSOs, virtualCenter, initialZoom, layout]);

  const visiblePlanets = useMemo(() => {
    if (!showPlanets) return [];

    // Pre-calculate viewport bounds for efficiency
    const fovDegrees = 90 / Math.max(0.1, initialZoom);
    const halfFovX = (fovDegrees / 2) + 15; // padding
    const halfFovY = (fovDegrees / 2) + 15; // padding

    return planetData.filter(planet => {
      // Simple bounding box check
      return isCoarselyVisible(planet.ra, planet.dec, virtualCenter, initialZoom, layout);
    });
  }, [planetData, showPlanets, virtualCenter, initialZoom, layout]);

  const visibleConstellationLabels = useMemo(() => {
    if (!showConstellationLabels || !constellations.labels?.features) return [];

    // Pre-calculate viewport bounds for efficiency
    const fovDegrees = 90 / Math.max(0.1, initialZoom);
    const halfFovX = (fovDegrees / 2) + 15; // padding
    const halfFovY = (fovDegrees / 2) + 15; // padding

    return constellations.labels.features.filter(feature => {
      const coords = feature.geometry?.coordinates;
      if (!coords) return false;

      // Simple bounding box check for label position
      const ra = coords[0] / 15;
      const dec = coords[1];
      return isCoarselyVisible(ra, dec, virtualCenter, initialZoom, layout);
    });
  }, [constellations.labels?.features, showConstellationLabels, virtualCenter, initialZoom, layout]);

  const visibleConstellationLines = useMemo(() => {
    if (!showConstellations || !constellations.lines?.features) return [];

    // Pre-calculate viewport bounds for efficiency
    const fovDegrees = 90 / Math.max(0.1, initialZoom);
    const halfFovX = (fovDegrees / 2) + 15; // padding
    const halfFovY = (fovDegrees / 2) + 15; // padding

    return constellations.lines.features.filter(feature => {
      if (!feature.geometry?.coordinates) return false;

      // First check if feature's bounding box intersects viewport
      const coords = feature.geometry.coordinates.flat();
      if (coords.length === 0) return false;

      let minRa = Infinity, maxRa = -Infinity;
      let minDec = Infinity, maxDec = -Infinity;

      for (let i = 0; i < coords.length; i += 2) {
        const ra = coords[i] / 15;
        const dec = coords[i + 1];
        if (ra < minRa) minRa = ra;
        if (ra > maxRa) maxRa = ra;
        if (dec < minDec) minDec = dec;
        if (dec > maxDec) maxDec = dec;
      }

      // Normalize RA for wraparound
      let raDiff = maxRa - minRa;
      if (raDiff > 180) raDiff = 360 - raDiff;

      // Check if bounding box intersects viewport (simplified)
      const decIntersects = !(minDec > virtualCenter.dec + halfFovY || maxDec < virtualCenter.dec - halfFovY);
      const raIntersects = !(minRa > virtualCenter.dec + halfFovX || maxRa < virtualCenter.dec - halfFovX); // Simplified

      if (!decIntersects || !raIntersects) return false;

      // If bounding box intersects, do detailed check
      return feature.geometry.coordinates.some(linePoints =>
        linePoints.some(pt => isCoarselyVisible(pt[0] / 15, pt[1], virtualCenter, initialZoom, layout))
      );
    });
  }, [constellations.lines?.features, showConstellations, virtualCenter, initialZoom, layout]);

  const visibleBoundaries = useMemo(() => {
    if (!showConstellationBoundaries || !constellations.boundaries?.features) return [];

    // Pre-calculate viewport bounds for efficiency
    const fovDegrees = 90 / Math.max(0.1, initialZoom);
    const halfFovX = (fovDegrees / 2) + 15; // padding
    const halfFovY = (fovDegrees / 2) + 15; // padding

    return constellations.boundaries.features.filter(feature => {
      const paths = getBoundaryPaths(feature);

      // First check if feature's bounding box intersects viewport
      let intersects = false;
      for (const pathPoints of paths) {
        const coords = pathPoints.flat();
        if (coords.length === 0) continue;

        let minRa = Infinity, maxRa = -Infinity;
        let minDec = Infinity, maxDec = -Infinity;

        for (let i = 0; i < coords.length; i += 2) {
          const ra = coords[i] / 15;
          const dec = coords[i + 1];
          if (ra < minRa) minRa = ra;
          if (ra > maxRa) maxRa = ra;
          if (dec < minDec) minDec = dec;
          if (dec > maxDec) maxDec = dec;
        }

        // Normalize RA for wraparound (simplified check)
        let raDiff = maxRa - minRa;
        if (raDiff > 180) raDiff = 360 - raDiff;

        // Check if bounding box intersects viewport (simplified)
        const decIntersects = !(minDec > virtualCenter.dec + halfFovY || maxDec < virtualCenter.dec - halfFovY);
        const raIntersects = !(minRa > virtualCenter.dec + halfFovX || maxRa < virtualCenter.dec - halfFovX); // Simplified

        if (decIntersects && raIntersects) {
          // If bounding box intersects, do detailed check
          intersects = pathPoints.some(pt =>
            isCoarselyVisible(pt[0] / 15, pt[1], virtualCenter, initialZoom, layout)
          );
          if (intersects) break; // Early exit if we found an intersecting path
        }
      }

      return intersects;
    });
  }, [constellations.boundaries?.features, showConstellationBoundaries, virtualCenter, initialZoom, layout]);

  const layerNodeEstimate = useMemo(() => {
    const countSegments = (features = []) => features.reduce((total, feature) => {
      const coordinates = feature.geometry?.coordinates || [];
      const paths = feature.geometry?.type === 'MultiPolygon'
        ? coordinates.flat()
        : coordinates;
      return total + paths.reduce((pathTotal, path) => pathTotal + Math.max(0, path.length - 1), 0);
    }, 0);
    return estimateLayerNodes({
      renderedStars,
      starBatchCount: starBatches.length,
      starOverlayCount: overlayStars.length,
      showGrid,
      showNebula,
      showConstellations,
      showConstellationLabels,
      showConstellationBoundaries,
      showDSOs,
      showPlanets,
      showMythology,
      coordinateMode,
      constellationLines: countSegments(visibleConstellationLines),
      constellationLabels: visibleConstellationLabels.length,
      constellationBoundaries: countSegments(visibleBoundaries),
      dsoCount: visibleDSOs.length,
      planetCount: visiblePlanets.length,
      mythologyCount: Object.keys(MYTHOLOGY_ASSETS).length,
      quality: qualityLevel,
    });
  }, [
    renderedStars,
    starBatches.length,
    overlayStars.length,
    showGrid,
    showNebula,
    showConstellations,
    showConstellationLabels,
    showConstellationBoundaries,
    showDSOs,
    showPlanets,
    showMythology,
    coordinateMode,
    visibleConstellationLines,
    visibleConstellationLabels,
    visibleBoundaries,
    visibleDSOs,
    visiblePlanets,
    qualityLevel,
  ]);

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
      console.debug(`[StarCanvas] render set: ${renderedStars.length}/${stars.length}`);
    }
  }, [renderedStars.length, stars.length]);

  const selectNearestStar = (x, y) => {
    if (!onSelect) return;
    let closestStar = null;
    let minDistance = 25;
    renderedStars.forEach((star) => {
      const p = project(
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
      const dist = Math.sqrt(Math.pow(p.x - x, 2) + Math.pow(p.y - y, 2));
      if (dist < minDistance) {
        minDistance = dist;
        closestStar = star;
      }
    });
    if (closestStar) onSelect(closestStar);
  };

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

            {!transparentBackground && <DeepSpaceAtmosphere layout={layout} nightVision={nightVision} />}

            {showNebula && qualityLevel !== 'low' && !transparentBackground && !nightVision && (
              <NebulaBackground
                ra={ra}
                dec={dec}
                layout={layout}
                qualityLevel={qualityLevel}
              />
            )}

            {showNebula && !transparentBackground && (
              <MilkyWayDensity
                ra={ra}
                dec={dec}
                zoom={zoom}
                layout={layout}
                coordinateMode={coordinateMode}
                observerLatitude={observerLatitude}
                lstDegrees={lstDegrees}
                qualityLevel={qualityLevel}
                nightVision={nightVision}
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

            {showGrid && (
              <CelestialGrid
                ra={ra}
                dec={dec}
                zoom={zoom}
                layout={layout}
                font={font}
                coordinateMode={coordinateMode}
                observerLatitude={observerLatitude}
                lstDegrees={lstDegrees}
                nightVision={nightVision}
              />
            )}

            {showMythology && qualityLevel === 'high' && Object.keys(MYTHOLOGY_ASSETS).map((key) => {
              const data = MYTHOLOGY_ASSETS[key];
              if (!isCoarselyVisible(data.ra, data.dec, virtualCenter, initialZoom, layout)) return null;
              return (
                <MythologyFigure key={key} data={data} ra={ra} dec={dec} zoom={zoom} layout={layout} coordinateMode={coordinateMode} observerLatitude={observerLatitude} lstDegrees={lstDegrees} />
              );
            })}

            {showDSOs && visibleDSOs.map((dso) => (
              <DSOMarker key={dso.id} dso={dso} ra={ra} dec={dec} zoom={zoom} layout={layout} font={font} coordinateMode={coordinateMode} observerLatitude={observerLatitude} lstDegrees={lstDegrees} nightVision={nightVision} time={time} />
            ))}

            {showConstellationBoundaries && (
              <ConstellationBoundariesPath
                features={visibleBoundaries}
                ra={ra}
                dec={dec}
                zoom={zoom}
                layout={layout}
                coordinateMode={coordinateMode}
                observerLatitude={observerLatitude}
                lstDegrees={lstDegrees}
                nightVision={nightVision}
              />
            )}

            {showConstellations && (
              <ConstellationsPath
                lines={visibleConstellationLines}
                selectedStar={selectedStar}
                ra={ra}
                dec={dec}
                zoom={zoom}
                layout={layout}
                coordinateMode={coordinateMode}
                observerLatitude={observerLatitude}
                lstDegrees={lstDegrees}
                nightVision={nightVision}
              />
            )}

            {starBatches.map((batch) => (
              <StarPointBatch key={batch.key} batch={batch} ra={ra} dec={dec} zoom={zoom} layout={layout} time={time} coordinateMode={coordinateMode} observerLatitude={observerLatitude} lstDegrees={lstDegrees} hideBelowHorizon={hideBelowHorizon} qualityLevel={qualityLevel} />
            ))}

            {overlayStars.map((star) => (
              <StarCircle key={`overlay-${star.canonicalId || star.id}`} star={star} ra={ra} dec={dec} zoom={zoom} layout={layout} time={time} font={font} showLabels={showLabels} suppressLabel={selectedStar?.canonicalId === star.canonicalId || selectedStar?.id === star.id} coordinateMode={coordinateMode} observerLatitude={observerLatitude} lstDegrees={lstDegrees} hideBelowHorizon={hideBelowHorizon} nightVision={nightVision} qualityLevel={qualityLevel} />
            ))}

            {showConstellationLabels && qualityLevel !== 'low' && visibleConstellationLabels.map((feature, index) => (
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

            {showPlanets && visiblePlanets.map((planet) => (
              <PlanetMarker key={planet.id} planet={planet} ra={ra} dec={dec} zoom={zoom} layout={layout} font={boldFont} coordinateMode={coordinateMode} observerLatitude={observerLatitude} lstDegrees={lstDegrees} nightVision={nightVision} time={time} />
            ))}

            {/* Shooting star effect */}
            <ShootingStar time={time} layout={layout} />

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

const areEqual = (prevProps, nextProps) => {
  // Ignore ref prop as it's always a new object
  if (prevProps.ref !== nextProps.ref) {
    // Check all other props
    const prevKeys = Object.keys(prevProps).filter(key => key !== 'ref');
    const nextKeys = Object.keys(nextProps).filter(key => key !== 'ref');

    if (prevKeys.length !== nextKeys.length) return false;

    for (const key of prevKeys) {
      if (prevProps[key] !== nextProps[key]) return false;
    }

    return true;
  }
  return true;
};

export default React.memo(StarCanvas, areEqual);

const CelestialGrid = React.memo(function CelestialGrid({ ra, dec, zoom, layout, font, coordinateMode, observerLatitude, lstDegrees, nightVision }) {
  const raSteps = [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22];
  const decSteps = [-75, -60, -45, -30, -15, 0, 15, 30, 45, 60, 75];

  const gridLines = useMemo(() => {
    const lines = [];
    raSteps.forEach((raStep) => {
      const linePoints = [];
      for (let d = -85; d <= 85; d += 5) {
        linePoints.push({ ra: raStep, dec: d });
      }
      lines.push(linePoints);
    });
    decSteps.forEach((decStep) => {
      const linePoints = [];
      for (let r = 0; r <= 24; r += 1) {
        linePoints.push({ ra: r, dec: decStep });
      }
      lines.push(linePoints);
    });
    return lines;
  }, []);

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

function getBoundaryPaths(feature) {
  'worklet';
  if (feature.geometry?.type === 'Polygon') return feature.geometry.coordinates;
  if (feature.geometry?.type === 'MultiPolygon') return feature.geometry.coordinates.flat();
  return [];
}

function ConstellationBoundariesPath({ boundaries, ra, dec, zoom, layout, coordinateMode, observerLatitude, lstDegrees, nightVision }) {
  const features = boundaries?.features || [];

  const path = useDerivedValue(() => {
    const p = Skia.Path.Make();
    const w = layout.width;
    const h = layout.height;
    const z = zoom.value;
    const rVal = ra.value;
    const dVal = dec.value;

    if (z < 0.75) return p;

    features.forEach((feature) => {
      const paths = getBoundaryPaths(feature);
      paths.forEach((pathPoints) => {
        let isDrawing = false;
        for (let i = 0; i < pathPoints.length - 1; i++) {
          const segment = projectSkySegment(
            { ra: pathPoints[i][0] / 15, dec: pathPoints[i][1] },
            { ra: pathPoints[i + 1][0] / 15, dec: pathPoints[i + 1][1] },
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
  const label = feature.properties?.tr || feature.properties?.name || feature.id;
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

  const labelX = useDerivedValue(() => pos.value.x - 40);
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

function ConstellationsPath({ constellations, selectedStar, ra, dec, zoom, layout, coordinateMode, observerLatitude, lstDegrees, nightVision }) {
  const lines = constellations.lines?.features || [];

  const paths = useDerivedValue(() => {
    const regularPath = Skia.Path.Make();
    const emphasizedPath = Skia.Path.Make();
    const w = layout.width;
    const h = layout.height;
    const z = zoom.value;
    const rVal = ra.value;
    const dVal = dec.value;

    lines.forEach((feature) => {
      if (!feature.geometry || feature.geometry.type !== 'MultiLineString') return;
      const emphasized = isSelectedConstellation(feature, selectedStar);
      const targetPath = emphasized ? emphasizedPath : regularPath;

      feature.geometry.coordinates.forEach((linePoints) => {
        let isDrawing = false;
        for (let i = 0; i < linePoints.length - 1; i++) {
          const segment = projectSkySegment(
            { ra: linePoints[i][0] / 15, dec: linePoints[i][1] },
            { ra: linePoints[i + 1][0] / 15, dec: linePoints[i + 1][1] },
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
            if (!isDrawing) {
              targetPath.moveTo(segment.p1.x, segment.p1.y);
              isDrawing = true;
            }
            targetPath.lineTo(segment.p2.x, segment.p2.y);
          } else {
            isDrawing = false;
          }
        }
      });
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

const StarPointBatch = React.memo(function StarPointBatch({ batch, ra, dec, zoom, layout, time, coordinateMode, observerLatitude, lstDegrees, hideBelowHorizon, qualityLevel }) {
  // Pre-calculate star positions when dependencies change, not every frame
  const starPositions = useMemo(() => {
    return batch.stars.map((star) => {
      'worklet';
      const projected = coordinateMode === 'horizontal'
        && Number.isFinite(star.horizontalAz)
        && Number.isFinite(star.horizontalAlt)
        ? {
          ...projectWithParallax(
            star,
            star.horizontalAz,
            star.horizontalAlt,
            ra.value,
            dec.value,
            layout.width,
            layout.height,
            zoom.value,
          ),
          skyAltitude: star.horizontalAlt,
        }
        : projectWithParallax(
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
        );
      const visible = projected.x > -20
        && projected.x < layout.width + 20
        && projected.y > -20
        && projected.y < layout.height + 20
        && (!hideBelowHorizon || projected.skyAltitude == null || projected.skyAltitude >= 0);
      return visible
        ? { x: projected.x, y: projected.y, visible: true }
        : { x: -1000, y: -1000, visible: false };
    });
  }, [batch.stars, ra, dec, zoom, layout, coordinateMode, observerLatitude, lstDegrees, hideBelowHorizon]);

  // Animate points based on pre-calculated positions
  const points = useDerivedValue(() =>
    starPositions.map(starPos =>
      starPos.visible
        ? { x: starPos.x, y: starPos.y }
        : { x: -1000, y: -1000 }
    )
  );

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

const StarCircle = React.memo(function StarCircle({ star, ra, dec, zoom, layout, time, font, showLabels, suppressLabel, coordinateMode, observerLatitude, lstDegrees, hideBelowHorizon, nightVision, qualityLevel }) {
  const twinklePhase = (parseFloat(star.id || 0) % 17) * 0.37;
  const isBrightStar = Number(star.mag) <= 2;

  // Add slight uniqueness to each star based on its ID for premium feel
  const starSeed = parseFloat(star.id || 0);
  const starUniqueOffset = (starSeed % 97) / 1000; // Value between 0-0.096
  const starUniqueScale = 0.95 + (starSeed % 13) / 100; // Value between 0.95-1.07
  const starUniqueHue = (starSeed % 31) / 100; // Value between 0-0.31 for subtle hue shift

  // Pre-calculate star position when dependencies change
  const starPosition = useMemo(() => {
    'worklet';
    const p = projectWithParallax(
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
  }, [star, ra, dec, zoom, layout, coordinateMode, observerLatitude, lstDegrees, hideBelowHorizon, qualityLevel, time]);

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
          {Number(star.mag) < 1.5 && zoom.value > 2 && (
            <>
              {/* Vertical spike */}
              <Line
                p1={{ x: cx, y: cy - haloRadius * 0.8 }}
                p2={{ x: cx, y: cy + haloRadius * 0.8 }}
                strokeWidth={0.5}
                color={nightVision ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.15)'}
                opacity={0.3}
              />
              {/* Horizontal spike */}
              <Line
                p1={{ x: cx - haloRadius * 0.8, y: cy }}
                p2={{ x: cx + haloRadius * 0.8, y: cy }}
                strokeWidth={0.5}
                color={nightVision ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.15)'}
                opacity={0.3}
              />
              {/* Diagonal spikes */}
              <Line
                p1={{ x: cx - haloRadius * 0.6, y: cy - haloRadius * 0.6 }}
                p2={{ x: cx + haloRadius * 0.6, y: cy + haloRadius * 0.6 }}
                strokeWidth={0.3}
                color={nightVision ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.12)'}
                opacity={0.2}
              />
              <Line
                p1={{ x: cx + haloRadius * 0.6, y: cy - haloRadius * 0.6 }}
                p2={{ x: cx - haloRadius * 0.6, y: cy + haloRadius * 0.6 }}
                strokeWidth={0.3}
                color={nightVision ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.12)'}
                opacity={0.2}
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

      {star.owned && (
        <Circle
          cx={cx}
          cy={cy}
          r={star.radius + 6}
          color={nightVision ? '#FF4A42' : '#C9A84C'}
          style="stroke"
          strokeWidth={1.4}
          opacity={0.85}
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
  // Create a shooting star every 90 seconds on average
  const shootingStarTime = useDerivedValue(() => {
    // Use star field as seed for deterministic but seemingly random shooting stars
    const baseTime = 90000; // 90 seconds in ms
    const cycleTime = (time.value * 1000) % baseTime;
    return cycleTime < 100; // Active for 100ms every 90 seconds
  });

  const [showStar, setShowStar] = useState(false);
  const [starProgress, setStarProgress] = useState(0);
  const [starX, setStarX] = useState(0);
  const [starY, setStarY] = useState(0);
  const [starLength, setStarLength] = useState(0);
  const [starAngle, setStarAngle] = useState(0);

  useEffect(() => {
    if (shootingStarTime.value) {
      // Randomly decide to show a shooting star
      if (Math.random() < 0.02) { // 2% chance each frame when timing is right
        setShowStar(true);
        // Random position across the sky
        setStarX(Math.random() * layout.width);
        setStarY(Math.random() * layout.height * 0.8); // Mostly in upper 80% of sky
        // Random length and angle
        setStarLength(80 + Math.random() * 120); // 80-200px length
        setStarAngle(Math.random() * Math.PI * 2); // Random angle
        setStarProgress(0);
      }
    }

    if (showStar) {
      // Animate the shooting star
      const timer = setInterval(() => {
        setStarProgress(prev => {
          const next = prev + 0.02; // Adjust speed as needed
          if (next >= 1) {
            setShowStar(false);
            return 0;
          }
          return next;
        });
      }, 16); // ~60fps

      return () => clearInterval(timer);
    }
  }, [showStar, shootingStarTime.value, layout.width, layout.height]);

  if (!showStar) return null;

  // Calculate current position based on progress
  const progress = Math.min(1, starProgress);
  const easeOut = 1 - Math.pow(1 - progress, 3); // Smooth easing
  const currentLength = starLength * easeOut;
  const endX = starX + Math.cos(starAngle) * currentLength;
  const endY = starY + Math.sin(starAngle) * currentLength;

  // Create fading tail effect
  const tailLength = 20;
  const tailSegments = 5;

  return (
    <Group>
      {/* Main shooting star line */}
      <Line
        p1={{ x: starX, y: starY }}
        p2={{ x: endX, y: endY }}
        strokeWidth={2}
        color="#FFFFFF"
        opacity={0.8}
      />

      {/* Tail segments for fading effect */}
      {[...Array(tailSegments)].map((_, i) => {
        const segmentProgress = i / tailSegments;
        const segmentStart = {
          x: starX + Math.cos(starAngle) * (currentLength * (1 - segmentProgress) - tailLength),
          y: starY + Math.sin(starAngle) * (currentLength * (1 - segmentProgress) - tailLength)
        };
        const segmentEnd = {
          x: starX + Math.cos(starAngle) * (currentLength * (1 - segmentProgress)),
          y: starY + Math.sin(starAngle) * (currentLength * (1 - segmentProgress))
        };

        const segmentOpacity = 0.3 * (1 - segmentProgress);
        return (
          <Line
            key={i}
            p1={segmentStart}
            p2={segmentEnd}
            strokeWidth={1}
            color="#FFFFFF"
            opacity={segmentOpacity}
          );
        );
      })}

      {/* Bright head */}
      <Circle
        cx={endX}
        cy={endY}
        r={1.5}
        color="#FFFFFF"
        opacity={0.9}
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
