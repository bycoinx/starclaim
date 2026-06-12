import React, { useMemo, useState, useEffect } from 'react';
import { StyleSheet, View, Text, Dimensions, TouchableOpacity } from 'react-native';
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
}) {
  const [layout, setLayout] = useState({ width: SCREEN_WIDTH, height: SCREEN_HEIGHT });
  
  const ra = useSharedValue(initialRa);
  const dec = useSharedValue(initialDec);
  const zoom = useSharedValue(initialZoom);
  const time = useSharedValue(0);

  const planetData = useMemo(() => getPlanetPositions(), []);
  const dsoData = useMemo(() => DSO_CATALOG, []);

  useFrameCallback((info) => {
    time.value = info.timestamp / 1000;
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

  const tapGesture = Gesture.Tap().onEnd((e) => {
    if (!onSelect) return;
    let closestStar = null;
    let minDistance = 25;
    stars.forEach((star) => {
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
      const dist = Math.sqrt(Math.pow(p.x - e.x, 2) + Math.pow(p.y - e.y, 2));
      if (dist < minDistance) {
        minDistance = dist;
        closestStar = star;
      }
    });
    if (closestStar) runOnJS(onSelect)(closestStar);
  });

  const combinedGesture = Gesture.Simultaneous(panGesture, pinchGesture, tapGesture);

  // OPTIMIZATION: Only render stars within a certain magnitude or proximity for better FPS
  const starElements = useMemo(() => {
    const ownedIds = new Set(ownedStarIds.map((id) => String(id)));
    return stars.map((star) => ({
      ...star,
      radius: radiusForMag(star.mag, star.spect),
      color: colorForSpectrum(star.spect),
      owned: ownedIds.has(String(star.id)) || ownedIds.has(String(star.hip)),
    }));
  }, [ownedStarIds, stars]);

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

  return (
    <GestureHandlerRootView style={styles.container}>
      <GestureDetector gesture={combinedGesture}>
        <View style={styles.container} onLayout={(e) => setLayout(e.nativeEvent.layout)}>
          <Canvas style={styles.canvas}>
            {!transparentBackground && (
              <Rect x={0} y={0} width={layout.width} height={layout.height}>
                <RadialGradient c={vec(layout.width / 2, layout.height / 2)} r={layout.width * 1.5} colors={['#050B1A', '#000000']} />
              </Rect>
            )}

            {coordinateMode === 'horizontal' && (
              <HorizonOverlay
                ra={ra}
                dec={dec}
                zoom={zoom}
                layout={layout}
                font={boldFont}
              />
            )}

            {showMythology && Object.keys(MYTHOLOGY_ASSETS).map((key) => (
              <MythologyFigure key={key} data={MYTHOLOGY_ASSETS[key]} ra={ra} dec={dec} zoom={zoom} layout={layout} coordinateMode={coordinateMode} observerLatitude={observerLatitude} lstDegrees={lstDegrees} />
            ))}

            {showDSOs && dsoData.map((dso) => (
              <DSOMarker key={dso.id} dso={dso} ra={ra} dec={dec} zoom={zoom} layout={layout} font={font} coordinateMode={coordinateMode} observerLatitude={observerLatitude} lstDegrees={lstDegrees} />
            ))}

            {showConstellations && constellations.features && constellations.features.map((f, i) => (
              <ConstellationFeature key={i} feature={f} ra={ra} dec={dec} zoom={zoom} layout={layout} coordinateMode={coordinateMode} observerLatitude={observerLatitude} lstDegrees={lstDegrees} />
            ))}

            {starElements.map((star) => (
              <StarCircle key={star.id} star={star} ra={ra} dec={dec} zoom={zoom} layout={layout} time={time} font={font} showLabels={showLabels} coordinateMode={coordinateMode} observerLatitude={observerLatitude} lstDegrees={lstDegrees} hideBelowHorizon={hideBelowHorizon} />
            ))}

            {showPlanets && planetData.map((planet) => (
              <PlanetMarker key={planet.id} planet={planet} ra={ra} dec={dec} zoom={zoom} layout={layout} font={boldFont} coordinateMode={coordinateMode} observerLatitude={observerLatitude} lstDegrees={lstDegrees} />
            ))}

            {selectedStarPos.value && isSelectedVisible.value && (
              <Group>
                <Circle cx={useDerivedValue(() => selectedStarPos.value.x)} cy={useDerivedValue(() => selectedStarPos.value.y)} r={useDerivedValue(() => 22 + Math.sin(time.value * 5) * 4)} color="#C9A84C" style="stroke" strokeWidth={1} opacity={0.3} />
                <Rect x={useDerivedValue(() => selectedStarPos.value.x - 18)} y={useDerivedValue(() => selectedStarPos.value.y - 18)} width={36} height={36} color="#C9A84C" style="stroke" strokeWidth={1.2} opacity={useDerivedValue(() => 0.7 + Math.sin(time.value * 8) * 0.2)} />
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
          </View>
        </View>
      </GestureDetector>
    </GestureHandlerRootView>
  );
}

function HorizonOverlay({ ra, dec, zoom, layout, font }) {
  const horizonY = useDerivedValue(() => (
    projectDegrees(ra.value, 0, ra.value, dec.value, layout.width, layout.height, zoom.value).y
  ));
  const directions = [
    { az: 0, label: 'N' },
    { az: 90, label: 'E' },
    { az: 180, label: 'S' },
    { az: 270, label: 'W' },
  ];

  return (
    <Group>
      <Rect
        x={0}
        y={horizonY}
        width={layout.width}
        height={useDerivedValue(() => Math.max(0, layout.height - horizonY.value))}
        color="rgba(2,5,9,0.82)"
      />
      <Line
        p1={useDerivedValue(() => vec(0, horizonY.value))}
        p2={useDerivedValue(() => vec(layout.width, horizonY.value))}
        color="rgba(201,168,76,0.35)"
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
        />
      ))}
    </Group>
  );
}

function HorizonDirection({ direction, ra, dec, zoom, layout, font }) {
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
        color="#C9A84C"
      />
    </Group>
  );
}

function ConstellationFeature({ feature, ra, dec, zoom, layout, coordinateMode, observerLatitude, lstDegrees }) {
  if (!feature.geometry || feature.geometry.type !== 'MultiLineString') return null;
  return feature.geometry.coordinates.map((path, idx) => (
    <Group key={idx}>
      {path.map((_, i) => {
        if (i === path.length - 1) return null;
        return <ConstellationLine key={i} p1_data={path[i]} p2_data={path[i+1]} ra={ra} dec={dec} zoom={zoom} layout={layout} coordinateMode={coordinateMode} observerLatitude={observerLatitude} lstDegrees={lstDegrees} />;
      })}
    </Group>
  ));
}

function ConstellationLine({ p1_data, p2_data, ra, dec, zoom, layout, coordinateMode, observerLatitude, lstDegrees }) {
  const p1 = useDerivedValue(() => project(p1_data[0] / 15, p1_data[1], ra.value, dec.value, layout.width, layout.height, zoom.value, coordinateMode, observerLatitude, lstDegrees));
  const p2 = useDerivedValue(() => project(p2_data[0] / 15, p2_data[1], ra.value, dec.value, layout.width, layout.height, zoom.value, coordinateMode, observerLatitude, lstDegrees));
  const isVisible = useDerivedValue(() => {
    const onScreen = (
      (p1.value.x > -100 && p1.value.x < layout.width + 100)
      || (p2.value.x > -100 && p2.value.x < layout.width + 100)
    );
    const aboveHorizon = (
      coordinateMode !== 'horizontal'
      || (p1.value.skyAltitude >= 0 && p2.value.skyAltitude >= 0)
    );
    return onScreen && aboveHorizon;
  });
  
  return (
    <Line 
      p1={useDerivedValue(() => vec(p1.value.x, p1.value.y))} 
      p2={useDerivedValue(() => vec(p2.value.x, p2.value.y))} 
      color="rgba(74,144,226,0.12)" 
      strokeWidth={0.8} 
      opacity={useDerivedValue(() => isVisible.value ? 1 : 0)} 
    />
  );
}

function StarCircle({ star, ra, dec, zoom, layout, time, font, showLabels, coordinateMode, observerLatitude, lstDegrees, hideBelowHorizon }) {
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
          color="#C9A84C"
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
             color="rgba(255,255,255,0.7)" 
           />
           {zoom.value > 4 && (
             <SkiaText 
               x={useDerivedValue(() => pos.value.x + star.radius + 6)} 
               y={useDerivedValue(() => pos.value.y - star.radius + 8)} 
               text={`MAG: ${star.mag?.toFixed(2)}`} 
               font={font} 
               color="rgba(0, 204, 255, 0.4)" 
             />
           )}
        </Group>
      )}
    </Group>
  );
}

function PlanetMarker({ planet, ra, dec, zoom, layout, font, coordinateMode, observerLatitude, lstDegrees }) {
  const pos = useDerivedValue(() => project(planet.ra, planet.dec, ra.value, dec.value, layout.width, layout.height, zoom.value, coordinateMode, observerLatitude, lstDegrees));
  const isVisible = useDerivedValue(() => (
    pos.value.x > -20
    && pos.value.x < layout.width + 20
    && pos.value.y > -20
    && pos.value.y < layout.height + 20
    && (coordinateMode !== 'horizontal' || pos.value.skyAltitude >= 0)
  ));
  return (
    <Group opacity={useDerivedValue(() => isVisible.value ? 1 : 0)}>
      <Circle cx={useDerivedValue(() => pos.value.x)} cy={useDerivedValue(() => pos.value.y)} r={useDerivedValue(() => 5 * (zoom.value > 2 ? 1.4 : 1))} color={planet.color} />
      <Circle cx={useDerivedValue(() => pos.value.x)} cy={useDerivedValue(() => pos.value.y)} r={useDerivedValue(() => 10 * (zoom.value > 2 ? 1.4 : 1))} color={planet.color} opacity={0.15} style="stroke" strokeWidth={1} />
      {font && zoom.value > 1.2 && (
        <SkiaText x={useDerivedValue(() => pos.value.x + 12)} y={useDerivedValue(() => pos.value.y + 4)} text={planet.name.toUpperCase()} font={font} color="#fff" />
      )}
    </Group>
  );
}

function DSOMarker({ dso, ra, dec, zoom, layout, font, coordinateMode, observerLatitude, lstDegrees }) {
  const pos = useDerivedValue(() => project(dso.ra, dso.dec, ra.value, dec.value, layout.width, layout.height, zoom.value, coordinateMode, observerLatitude, lstDegrees));
  const isVisible = useDerivedValue(() => (
    pos.value.x > -50
    && pos.value.x < layout.width + 50
    && pos.value.y > -50
    && pos.value.y < layout.height + 50
    && (coordinateMode !== 'horizontal' || pos.value.skyAltitude >= 0)
  ));
  return (
    <Group opacity={useDerivedValue(() => isVisible.value ? 0.7 : 0)}>
      <Circle cx={useDerivedValue(() => pos.value.x)} cy={useDerivedValue(() => pos.value.y)} r={2} color={dso.color} />
      {font && zoom.value > 1.8 && (
        <SkiaText x={useDerivedValue(() => pos.value.x + 10)} y={useDerivedValue(() => pos.value.y - 10)} text={dso.name} font={font} color={dso.color} />
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
  controls: { position: 'absolute', right: 12, bottom: 20, width: 44, alignItems: 'center' },
  zoomButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.06)', marginBottom: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  zoomText: { color: '#fff', fontSize: 20, fontWeight: '300' }
});
