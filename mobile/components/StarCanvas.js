import React, { useMemo, useState, useEffect, useRef } from 'react';
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
  Skia,
  useFrameCallback,
  RuntimeEffect,
  Image as SkiaImage,
  useImage
} from '@shopify/react-native-skia';
import { 
  Gesture, 
  GestureDetector, 
  GestureHandlerRootView 
} from 'react-native-gesture-handler';
import {
  useSharedValue, 
  useDerivedValue,
  runOnJS,
  withSpring
} from 'react-native-reanimated';
import { radiusForMag, colorForSpectrum } from '../src/utils/astronomy';
import { MYTHOLOGY_ASSETS } from '../src/data/mythologyData';
import { getPlanetPositions } from '../src/utils/solarSystem';
import { DSO_CATALOG } from '../src/data/dsoData';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const deg2rad = (deg) => deg * Math.PI / 180;
const SPRING_CONFIG = { damping: 20, stiffness: 90 };
const TAP_CELL_SIZE = 56;
const VIEWPORT_PADDING = 140;

const TWINKLE_SHADER = `
uniform float iTime;
half4 main(vec2 fragCoord) {
  float twinkle = sin(iTime * 3.5 + fragCoord.x * 0.12 + fragCoord.y * 0.12) * 0.2 + 0.8;
  return half4(twinkle, twinkle, twinkle, 1.0);
}
`;

const twinkleEffect = Skia.RuntimeEffect.Make(TWINKLE_SHADER);

function normalizeRaDelta(delta) {
  'worklet';
  let value = delta;
  while (value > 180) value -= 360;
  while (value < -180) value += 360;
  return value;
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

function magnitudeLimitForZoom(zoom) {
  if (zoom < 0.8) return 3.8;
  if (zoom < 1.5) return 4.7;
  if (zoom < 3) return 5.5;
  return 6.5;
}

function getCellKey(x, y) {
  return `${Math.floor(x / TAP_CELL_SIZE)}:${Math.floor(y / TAP_CELL_SIZE)}`;
}

function NebulaBackground({ ra, dec, layout, qualityLevel }) {
  const image = useImage(require('../assets/sky-nebula-premium.jpg'));
  const imageHeight = layout.height * 1.18;
  const imageWidth = Math.max(layout.width * 1.4, imageHeight * 2);
  const horizontalTravel = Math.max(0, (imageWidth - layout.width) * 0.34);
  const verticalTravel = Math.max(0, (imageHeight - layout.height) * 0.42);
  const x = useDerivedValue(() => (
    (layout.width - imageWidth) / 2
    - Math.sin(deg2rad(ra.value)) * horizontalTravel
  ));
  const y = useDerivedValue(() => (
    (layout.height - imageHeight) / 2
    + Math.max(-1, Math.min(1, dec.value / 90)) * verticalTravel
  ));

  if (!image) return null;

  const opacity = qualityLevel === 'low' ? 0.22 : qualityLevel === 'medium' ? 0.3 : 0.38;
  return (
    <Group opacity={opacity}>
      <SkiaImage
        image={image}
        x={x}
        y={y}
        width={imageWidth}
        height={imageHeight}
        fit="cover"
      />
    </Group>
  );
}

export default function StarCanvas({
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
}) {
  const [layout, setLayout] = useState({ width: SCREEN_WIDTH, height: SCREEN_HEIGHT });

  const ra = useSharedValue(initialRa);
  const dec = useSharedValue(initialDec);
  const zoom = useSharedValue(initialZoom);
  const time = useSharedValue(0);
  const fpsShared = useSharedValue(0);
  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(0);

  const planetData = useMemo(() => getPlanetPositions(), []);
  const dsoData = useMemo(() => DSO_CATALOG, []);

  useFrameCallback((info) => {
    const now = info.timestamp;
    frameCountRef.current++;
    if (now - lastTimeRef.current >= 1000) {
      fpsShared.current = Math.round((frameCountRef.current * 1000) / (now - lastTimeRef.current));
      frameCountRef.current = 0;
      lastTimeRef.current = now;
    }
    time.value = now / 1000;
  });
  
  useEffect(() => {
    ra.value = withSpring(initialRa, SPRING_CONFIG);
    dec.value = withSpring(initialDec, SPRING_CONFIG);
    zoom.value = withSpring(initialZoom, SPRING_CONFIG);
  }, [initialRa, initialDec, initialZoom]);

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
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
    });

  const pinchGesture = Gesture.Pinch()
    .onUpdate((e) => {
      const newZoom = zoom.value * e.scaleChange;
      zoom.value = Math.max(0.2, Math.min(15, newZoom));
    })
    .onEnd(() => {
      if (onZoomChange) runOnJS(onZoomChange)(zoom.value);
    });

  const ownedIdSet = useMemo(
    () => new Set(ownedStarIds.map((id) => String(id))),
    [ownedStarIds],
  );

  const renderedStars = useMemo(() => {
    const magnitudeLimit = magnitudeLimitForZoom(initialZoom);
    return stars.reduce((visible, star) => {
      const owned = (
        ownedIdSet.has(String(star.id))
        || ownedIdSet.has(String(star.hip))
      );
      const important = owned || selectedStar?.id === star.id;
      if (!important && Number(star.mag) > magnitudeLimit) return visible;

      const position = project(
        star.ra,
        star.dec,
        initialRa,
        initialDec,
        layout.width,
        layout.height,
        initialZoom,
        coordinateMode,
        observerLatitude,
        lstDegrees,
      );
      const insidePaddedViewport = (
        position.x >= -VIEWPORT_PADDING
        && position.x <= layout.width + VIEWPORT_PADDING
        && position.y >= -VIEWPORT_PADDING
        && position.y <= layout.height + VIEWPORT_PADDING
      );
      const aboveHorizon = (
        !hideBelowHorizon
        || position.skyAltitude == null
        || position.skyAltitude >= 0
      );
      if (!important && (!insidePaddedViewport || !aboveHorizon)) return visible;

      visible.push({
        ...star,
        radius: radiusForMag(star.mag, star.spect),
        color: nightVision ? '#FF514A' : colorForSpectrum(star.spect),
        owned,
      });
      return visible;
    }, []);
  }, [
    coordinateMode,
    hideBelowHorizon,
    initialDec,
    initialRa,
    initialZoom,
    layout.height,
    layout.width,
    lstDegrees,
    observerLatitude,
    nightVision,
    ownedIdSet,
    selectedStar?.id,
    stars,
  ]);

  const qualityLevel = useMemo(() => {
    const devicePixelRatio = PixelRatio.get();
    let level = 'high';
    if (devicePixelRatio < 1.5) level = 'medium';
    if (devicePixelRatio < 1) level = 'low';
    const starCount = renderedStars.length;
    if (starCount > 1500) {
      if (level === 'high') level = 'medium';
      else if (level === 'medium') level = 'low';
    } else if (starCount > 800) {
      if (level === 'high') level = 'medium';
    }
    return level;
  }, [renderedStars.length]);

  const tapIndex = useMemo(() => {
    const cells = new Map();
    renderedStars.forEach((star) => {
      const position = project(
        star.ra,
        star.dec,
        initialRa,
        initialDec,
        layout.width,
        layout.height,
        initialZoom,
        coordinateMode,
        observerLatitude,
        lstDegrees,
      );
      const key = getCellKey(position.x, position.y);
      const bucket = cells.get(key);
      if (bucket) bucket.push(star);
      else cells.set(key, [star]);
    });
    return cells;
  }, [
    coordinateMode,
    initialDec,
    initialRa,
    initialZoom,
    layout.height,
    layout.width,
    lstDegrees,
    observerLatitude,
    renderedStars,
  ]);

  useEffect(() => {
    if (__DEV__) {
      console.debug(`[StarCanvas] render set: ${renderedStars.length}/${stars.length}`);
    }
  }, [renderedStars.length, stars.length]);

  const selectNearestStar = (x, y) => {
    if (!onSelect) return;
    let closestStar = null;
    let minDistance = 25;
    const cellX = Math.floor(x / TAP_CELL_SIZE);
    const cellY = Math.floor(y / TAP_CELL_SIZE);
    const candidates = [];
    for (let xOffset = -1; xOffset <= 1; xOffset += 1) {
      for (let yOffset = -1; yOffset <= 1; yOffset += 1) {
        const bucket = tapIndex.get(`${cellX + xOffset}:${cellY + yOffset}`);
        if (bucket) candidates.push(...bucket);
      }
    }

    candidates.forEach((star) => {
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

  const fpsDisplay = useDerivedValue(() => `${fpsShared.value} FPS`);

  return (
    <GestureHandlerRootView style={styles.container}>
      <GestureDetector gesture={combinedGesture}>
        <View style={styles.container} onLayout={(e) => setLayout(e.nativeEvent.layout)}>
          <Canvas style={styles.canvas}>
            {!transparentBackground && (
              <Rect x={0} y={0} width={layout.width} height={layout.height}>
                <RadialGradient c={vec(layout.width / 2, layout.height / 2)} r={layout.width * 1.5} colors={nightVision ? ['#160000', '#000000'] : ['#050B1A', '#000000']} />
              </Rect>
            )}

            {showNebula && !transparentBackground && !nightVision && (
              <NebulaBackground
                ra={ra}
                dec={dec}
                layout={layout}
                qualityLevel={qualityLevel}
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

            {showMythology && qualityLevel === 'high' && Object.keys(MYTHOLOGY_ASSETS).map((key) => (
              <MythologyFigure key={key} data={MYTHOLOGY_ASSETS[key]} ra={ra} dec={dec} zoom={zoom} layout={layout} coordinateMode={coordinateMode} observerLatitude={observerLatitude} lstDegrees={lstDegrees} />
            ))}

            {showDSOs && dsoData.map((dso) => (
              <DSOMarker key={dso.id} dso={dso} ra={ra} dec={dec} zoom={zoom} layout={layout} font={font} coordinateMode={coordinateMode} observerLatitude={observerLatitude} lstDegrees={lstDegrees} nightVision={nightVision} time={time} />
            ))}

            {showConstellationBoundaries && constellations.boundaries?.features?.map((feature) => (
              <ConstellationBoundary
                key={feature.id}
                feature={feature}
                ra={ra}
                dec={dec}
                zoom={zoom}
                layout={layout}
                coordinateMode={coordinateMode}
                observerLatitude={observerLatitude}
                lstDegrees={lstDegrees}
                nightVision={nightVision}
              />
            ))}

            {showConstellations && constellations.lines?.features?.map((f, i) => (
              <ConstellationFeature key={i} feature={f} ra={ra} dec={dec} zoom={zoom} layout={layout} coordinateMode={coordinateMode} observerLatitude={observerLatitude} lstDegrees={lstDegrees} nightVision={nightVision} />
            ))}

            {renderedStars.map((star) => (
              <StarCircle key={star.id} star={star} ra={ra} dec={dec} zoom={zoom} layout={layout} time={time} font={font} showLabels={showLabels} coordinateMode={coordinateMode} observerLatitude={observerLatitude} lstDegrees={lstDegrees} hideBelowHorizon={hideBelowHorizon} nightVision={nightVision} />
            ))}

            {showConstellationLabels && qualityLevel !== 'low' && constellations.labels?.features?.map((feature) => (
              <ConstellationLabel
                key={feature.id}
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

            {showPlanets && planetData.map((planet) => (
              <PlanetMarker key={planet.id} planet={planet} ra={ra} dec={dec} zoom={zoom} layout={layout} font={boldFont} coordinateMode={coordinateMode} observerLatitude={observerLatitude} lstDegrees={lstDegrees} nightVision={nightVision} time={time} />
            ))}

            {selectedStarPos.value && isSelectedVisible.value && (
              <Group>
                <Circle cx={useDerivedValue(() => selectedStarPos.value.x)} cy={useDerivedValue(() => selectedStarPos.value.y)} r={useDerivedValue(() => 22 + Math.sin(time.value * 5) * 4)} color={nightVision ? '#FF4A42' : '#00f2fe'} style="stroke" strokeWidth={1} opacity={0.3} />
                <Rect x={useDerivedValue(() => selectedStarPos.value.x - 18)} y={useDerivedValue(() => selectedStarPos.value.y - 18)} width={36} height={36} color={nightVision ? '#FF4A42' : '#00f2fe'} style="stroke" strokeWidth={1.2} opacity={useDerivedValue(() => 0.7 + Math.sin(time.value * 8) * 0.2)} />
              </Group>
            )}
          </Canvas>
          
          <View style={styles.controls} pointerEvents="box-none">
            <TouchableOpacity style={styles.zoomButton} onPress={() => { zoom.value = Math.min(15, zoom.value + 1); if(onZoomChange) runOnJS(onZoomChange)(zoom.value); }}>
              <Text style={styles.zoomText}>+</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.zoomButton} onPress={() => { zoom.value = Math.max(0.2, zoom.value - 1); if(onZoomChange) runOnJS(onZoomChange)(zoom.value); }}>
              <Text style={styles.zoomText}>-</Text>
            </TouchableOpacity>
            <Text style={styles.fpsText}>{fpsDisplay}</Text>
          </View>
        </View>
      </GestureDetector>
    </GestureHandlerRootView>
  );
}

function CelestialGrid({ ra, dec, zoom, layout, font, coordinateMode, observerLatitude, lstDegrees, nightVision }) {
  const raSteps = [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22];
  const decSteps = [-75, -60, -45, -30, -15, 0, 15, 30, 45, 60, 75];

  return (
    <Group>
      {raSteps.map((raStep) => (
        <CelestialGridLine
          key={`ra-${raStep}`}
          type="ra"
          value={raStep}
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
      ))}
      {decSteps.map((decStep) => (
        <CelestialGridLine
          key={`dec-${decStep}`}
          type="dec"
          value={decStep}
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
      ))}
    </Group>
  );
}

function CelestialGridLine({ type, value, ra, dec, zoom, layout, font, coordinateMode, observerLatitude, lstDegrees, nightVision }) {
  const points = useMemo(() => {
    const p = [];
    if (type === 'ra') {
      for (let d = -85; d <= 85; d += 5) p.push({ ra: value, dec: d });
    } else {
      for (let r = 0; r <= 24; r += 1) p.push({ ra: r, dec: value });
    }
    return p;
  }, [type, value]);

  return (
    <Group>
      {points.map((_, i) => {
        if (i === points.length - 1) return null;
        return (
          <CelestialGridSegment
            key={i}
            p1Data={points[i]}
            p2Data={points[i + 1]}
            ra={ra}
            dec={dec}
            zoom={zoom}
            layout={layout}
            coordinateMode={coordinateMode}
            observerLatitude={observerLatitude}
            lstDegrees={lstDegrees}
            nightVision={nightVision}
          />
        );
      })}
    </Group>
  );
}

function CelestialGridSegment({ p1Data, p2Data, ra, dec, zoom, layout, coordinateMode, observerLatitude, lstDegrees, nightVision }) {
  const p1 = useDerivedValue(() => project(p1Data.ra, p1Data.dec, ra.value, dec.value, layout.width, layout.height, zoom.value, coordinateMode, observerLatitude, lstDegrees));
  const p2 = useDerivedValue(() => project(p2Data.ra, p2Data.dec, ra.value, dec.value, layout.width, layout.height, zoom.value, coordinateMode, observerLatitude, lstDegrees));

  const isVisible = useDerivedValue(() => {
    const onScreen = (
      (p1.value.x > -100 && p1.value.x < layout.width + 100 && p1.value.y > -100 && p1.value.y < layout.height + 100)
      || (p2.value.x > -100 && p2.value.x < layout.width + 100 && p2.value.y > -100 && p2.value.y < layout.height + 100)
    );
    const aboveHorizon = (
      coordinateMode !== 'horizontal'
      || (p1.value.skyAltitude >= -2 && p2.value.skyAltitude >= -2)
    );
    return onScreen && aboveHorizon;
  });

  return (
    <Line
      p1={useDerivedValue(() => vec(p1.value.x, p1.value.y))}
      p2={useDerivedValue(() => vec(p2.value.x, p2.value.y))}
      color={nightVision ? 'rgba(255,74,66,0.1)' : 'rgba(0, 242, 254, 0.08)'}
      strokeWidth={0.5}
      opacity={useDerivedValue(() => isVisible.value ? 1 : 0)}
    />
  );
}

function HorizonOverlay({ ra, dec, zoom, layout, font, nightVision }) {
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
}

function HorizonDirection({ direction, ra, dec, zoom, layout, font, nightVision }) {
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

  if (!font) return null;
  return (
    <Group opacity={useDerivedValue(() => isVisible.value ? 1 : 0)}>
      <Circle cx={useDerivedValue(() => pos.value.x)} cy={useDerivedValue(() => pos.value.y)} r={11} color="rgba(0,0,0,0.72)" />
      <SkiaText
        x={useDerivedValue(() => pos.value.x - 4)}
        y={useDerivedValue(() => pos.value.y + 4)}
        text={direction.label}
        font={font}
        color={nightVision ? '#FF4A42' : '#C9A84C'}
      />
    </Group>
  );
}

function getBoundaryPaths(feature) {
  if (feature.geometry?.type === 'Polygon') return feature.geometry.coordinates;
  if (feature.geometry?.type === 'MultiPolygon') return feature.geometry.coordinates.flat();
  return [];
}

function ConstellationBoundary({ feature, ra, dec, zoom, layout, coordinateMode, observerLatitude, lstDegrees, nightVision }) {
  return getBoundaryPaths(feature).map((path, pathIndex) => (
    <Group key={`${feature.id}-${pathIndex}`}>
      {path.map((point, pointIndex) => {
        if (pointIndex === path.length - 1) return null;
        return (
          <ConstellationBoundaryLine
            key={`${feature.id}-${pathIndex}-${pointIndex}`}
            p1Data={point}
            p2Data={path[pointIndex + 1]}
            ra={ra}
            dec={dec}
            zoom={zoom}
            layout={layout}
            coordinateMode={coordinateMode}
            observerLatitude={observerLatitude}
            lstDegrees={lstDegrees}
            nightVision={nightVision}
          />
        );
      })}
    </Group>
  ));
}

function ConstellationBoundaryLine({ p1Data, p2Data, ra, dec, zoom, layout, coordinateMode, observerLatitude, lstDegrees, nightVision }) {
  const p1 = useDerivedValue(() => project(p1Data[0] / 15, p1Data[1], ra.value, dec.value, layout.width, layout.height, zoom.value, coordinateMode, observerLatitude, lstDegrees));
  const p2 = useDerivedValue(() => project(p2Data[0] / 15, p2Data[1], ra.value, dec.value, layout.width, layout.height, zoom.value, coordinateMode, observerLatitude, lstDegrees));
  const isVisible = useDerivedValue(() => {
    const onScreen = (
      (p1.value.x > -60 && p1.value.x < layout.width + 60 && p1.value.y > -60 && p1.value.y < layout.height + 60)
      || (p2.value.x > -60 && p2.value.x < layout.width + 60 && p2.value.y > -60 && p2.value.y < layout.height + 60)
    );
    const aboveHorizon = (
      coordinateMode !== 'horizontal'
      || p1.value.skyAltitude >= 0
      || p2.value.skyAltitude >= 0
    );
    return onScreen && aboveHorizon && zoom.value >= 0.75;
  });

  return (
    <Line
      p1={useDerivedValue(() => vec(p1.value.x, p1.value.y))}
      p2={useDerivedValue(() => vec(p2.value.x, p2.value.y))}
      color={nightVision ? 'rgba(255,74,66,0.13)' : 'rgba(130,160,190,0.11)'}
      strokeWidth={0.65}
      opacity={useDerivedValue(() => isVisible.value ? 1 : 0)}
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

  if (!font || !coordinates) return null;
  return (
    <Group opacity={useDerivedValue(() => isVisible.value ? (zoom.value < 1.0 ? 0.4 : 0.8) : 0)}>
      <SkiaText
        x={useDerivedValue(() => pos.value.x - 40)}
        y={useDerivedValue(() => pos.value.y)}
        text={String(label).toUpperCase()}
        font={font}
        color={nightVision ? '#FF4A42' : '#E6C98C'}
      />
    </Group>
  );
}

function ConstellationFeature({ feature, ra, dec, zoom, layout, coordinateMode, observerLatitude, lstDegrees, nightVision }) {
  if (!feature.geometry || feature.geometry.type !== 'MultiLineString') return null;
  return feature.geometry.coordinates.map((path, idx) => (
    <Group key={idx}>
      {path.map((_, i) => {
        if (i === path.length - 1) return null;
        return <ConstellationLine key={i} p1_data={path[i]} p2_data={path[i+1]} ra={ra} dec={dec} zoom={zoom} layout={layout} coordinateMode={coordinateMode} observerLatitude={observerLatitude} lstDegrees={lstDegrees} nightVision={nightVision} />;
      })}
    </Group>
  ));
}

function ConstellationLine({ p1_data, p2_data, ra, dec, zoom, layout, coordinateMode, observerLatitude, lstDegrees, nightVision }) {
  const p1 = useDerivedValue(() => project(p1_data[0] / 15, p1_data[1], ra.value, dec.value, layout.width, layout.height, zoom.value, coordinateMode, observerLatitude, lstDegrees));
  const p2 = useDerivedValue(() => project(p2_data[0] / 15, p2_data[1], ra.value, dec.value, layout.width, layout.height, zoom.value, coordinateMode, observerLatitude, lstDegrees));
  const isVisible = useDerivedValue(() => {
    const onScreen = (
      (p1.value.x > -100 && p1.value.x < layout.width + 100 && p1.value.y > -100 && p1.value.y < layout.height + 100)
      || (p2.value.x > -100 && p2.value.x < layout.width + 100 && p2.value.y > -100 && p2.value.y < layout.height + 100)
    );
    const aboveHorizon = (
      coordinateMode !== 'horizontal'
      || (p1.value.skyAltitude >= -5 && p2.value.skyAltitude >= -5)
    );
    return onScreen && aboveHorizon;
  });

  return (
    <Line
      p1={useDerivedValue(() => vec(p1.value.x, p1.value.y))}
      p2={useDerivedValue(() => vec(p2.value.x, p2.value.y))}
      color={nightVision ? 'rgba(255,74,66,0.25)' : 'rgba(74,144,226,0.18)'}
      strokeWidth={useDerivedValue(() => zoom.value > 2 ? 1.2 : 0.8)}
      opacity={useDerivedValue(() => isVisible.value ? 1 : 0)}
    />
  );
}

function StarCircle({ star, ra, dec, zoom, layout, time, font, showLabels, coordinateMode, observerLatitude, lstDegrees, hideBelowHorizon, nightVision }) {
  const pos = useDerivedValue(() => project(star.ra, star.dec, ra.value, dec.value, layout.width, layout.height, zoom.value, coordinateMode, observerLatitude, lstDegrees));
  const isVisible = useDerivedValue(() => (
    pos.value.x > -30
    && pos.value.x < layout.width + 30
    && pos.value.y > -30
    && pos.value.y < layout.height + 30
    && (!hideBelowHorizon || pos.value.skyAltitude == null || pos.value.skyAltitude >= 0)
  ));
  const labelVisible = useDerivedValue(() => isVisible.value && !!star.proper && (zoom.value > 2.8 || (showLabels && zoom.value > 1.4)));
  const ownedX = useDerivedValue(() => pos.value.x);
  const ownedY = useDerivedValue(() => pos.value.y);
  
  const uniforms = useDerivedValue(() => ({ iTime: time.value + (parseFloat(star.id || 0) % 5) }));

  return (
    <Group opacity={useDerivedValue(() => isVisible.value ? 1 : 0)}>
      <Circle cx={useDerivedValue(() => pos.value.x)} cy={useDerivedValue(() => pos.value.y)} r={star.radius} color={star.color}>
         <RuntimeEffect source={twinkleEffect} uniforms={uniforms} />
      </Circle>
      {star.owned && (
        <Circle
          cx={ownedX}
          cy={ownedY}
          r={star.radius + 6}
          color={nightVision ? '#FF4A42' : '#C9A84C'}
          style="stroke"
          strokeWidth={1.4}
          opacity={0.85}
        />
      )}
      
      {/* High-Performance Labeling Enhancement */}
      {font && star.proper && (
        <Group opacity={useDerivedValue(() => labelVisible.value ? 1 : 0)}>
           <SkiaText 
             x={useDerivedValue(() => pos.value.x + star.radius + 6)} 
             y={useDerivedValue(() => pos.value.y - star.radius - 4)} 
             text={star.proper.toUpperCase()} 
             font={font} 
             color={nightVision ? 'rgba(255,74,66,0.76)' : 'rgba(255,255,255,0.7)'}
           />
           {zoom.value > 4 && (
             <SkiaText 
               x={useDerivedValue(() => pos.value.x + star.radius + 6)} 
               y={useDerivedValue(() => pos.value.y - star.radius + 8)} 
               text={`MAG: ${star.mag?.toFixed(2)}`} 
               font={font} 
               color={nightVision ? 'rgba(255,74,66,0.45)' : 'rgba(0, 204, 255, 0.4)'}
             />
           )}
        </Group>
      )}
    </Group>
  );
}

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
  const accent = nightVision ? '#FF4A42' : planet.color;

  return (
    <Group opacity={useDerivedValue(() => isVisible.value ? 1 : 0)}>
      {/* Outer Glow / Pulse */}
      <Circle 
        cx={useDerivedValue(() => pos.value.x)} 
        cy={useDerivedValue(() => pos.value.y)} 
        r={useDerivedValue(() => 14 * pulse.value * (zoom.value > 2 ? 1.4 : 1))} 
        color={accent} 
        opacity={0.15} 
      />
      
      {/* Target Ring */}
      <Circle 
        cx={useDerivedValue(() => pos.value.x)} 
        cy={useDerivedValue(() => pos.value.y)} 
        r={useDerivedValue(() => 8 * (zoom.value > 2 ? 1.4 : 1))} 
        color={accent} 
        style="stroke" 
        strokeWidth={1} 
        opacity={0.6} 
      />

      {/* Solid Core */}
      <Circle 
        cx={useDerivedValue(() => pos.value.x)} 
        cy={useDerivedValue(() => pos.value.y)} 
        r={useDerivedValue(() => 4 * (zoom.value > 2 ? 1.4 : 1))} 
        color={accent} 
      />

      {/* Planet Label with High Visibility */}
      {font && (
        <Group opacity={useDerivedValue(() => zoom.value > 0.8 ? 1 : 0)}>
          <SkiaText 
            x={useDerivedValue(() => pos.value.x + 16)} 
            y={useDerivedValue(() => pos.value.y + 4)} 
            text={planet.name} 
            font={font} 
            color="#fff" 
          />
          {zoom.value > 2.5 && (
            <SkiaText 
              x={useDerivedValue(() => pos.value.x + 16)} 
              y={useDerivedValue(() => pos.value.y + 16)} 
              text="SYSTEM_OBJECT" 
              font={font} 
              color={accent} 
              opacity={0.5}
            />
          )}
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

  return (
    <Group opacity={useDerivedValue(() => isVisible.value ? 1 : 0)}>
      {dso.type === 'galaxy' && (
        <Group>
          <Circle cx={useDerivedValue(() => pos.value.x)} cy={useDerivedValue(() => pos.value.y)} r={useDerivedValue(() => 10 * (zoom.value / 2))} color={accent} opacity={0.1} />
          <Rect 
            x={useDerivedValue(() => pos.value.x - 12 * (zoom.value / 2))} 
            y={useDerivedValue(() => pos.value.y - 4 * (zoom.value / 2))} 
            width={useDerivedValue(() => 24 * (zoom.value / 2))} 
            height={useDerivedValue(() => 8 * (zoom.value / 2))} 
            color={accent} 
            opacity={0.4} 
            style="stroke" 
            strokeWidth={1} 
          />
        </Group>
      )}

      {dso.type === 'nebula' && (
        <Rect 
          x={useDerivedValue(() => pos.value.x - 8)} 
          y={useDerivedValue(() => pos.value.y - 8)} 
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
          cx={useDerivedValue(() => pos.value.x)} 
          cy={useDerivedValue(() => pos.value.y)} 
          r={10} 
          color={accent} 
          style="stroke" 
          strokeWidth={1} 
          strokeCap="round"
          opacity={0.5}
        />
      )}

      {/* Identity Label */}
      {font && zoom.value > 1.8 && (
        <Group>
          <SkiaText 
            x={useDerivedValue(() => pos.value.x + 14)} 
            y={useDerivedValue(() => pos.value.y - 4)} 
            text={dso.name.toUpperCase()} 
            font={font} 
            color="#fff" 
          />
          <SkiaText 
            x={useDerivedValue(() => pos.value.x + 14)} 
            y={useDerivedValue(() => pos.value.y + 8)} 
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

function MythologyFigure({ data, ra, dec, zoom, layout, coordinateMode, observerLatitude, lstDegrees }) {
  const image = useImage(data.url);
  const pos = useDerivedValue(() => project(data.ra, data.dec, ra.value, dec.value, layout.width, layout.height, zoom.value, coordinateMode, observerLatitude, lstDegrees));
  const size = useDerivedValue(() => 320 * (data.scale || 1.0) * (zoom.value / 2.0));
  const isVisible = useDerivedValue(() => pos.value.x > -size.value && pos.value.x < layout.width + size.value && pos.value.y > -size.value && pos.value.y < layout.height + size.value);
  if (!image) return null;
  return (
    <Group opacity={useDerivedValue(() => isVisible.value ? 0.2 : 0)}>
      <SkiaImage image={image} x={useDerivedValue(() => pos.value.x - size.value / 2)} y={useDerivedValue(() => pos.value.y - size.value / 2)} width={size} height={size} fit="contain" />
    </Group>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
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
