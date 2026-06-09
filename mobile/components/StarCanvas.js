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
import Animated, { 
  useSharedValue, 
  useDerivedValue,
  runOnJS,
  withSpring,
  withTiming
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
  float twinkle = sin(iTime * 3.0 + fragCoord.x * 0.1 + fragCoord.y * 0.1) * 0.15 + 0.85;
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

function project(starRa, starDec, centerRa, centerDec, width, height, zoom) {
  'worklet';
  const raDiff = normalizeRaDelta(starRa * 15 - centerRa);
  const decDiff = starDec - centerDec;
  const field = 90 / Math.max(0.1, zoom);
  const scale = width / field;
  const x = width / 2 + raDiff * scale * Math.cos(deg2rad(centerDec));
  const y = height / 2 - decDiff * scale;
  return { x, y };
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
  showDSOs = true
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
    // Smooth transition (Fly-to effect)
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
      const p = project(star.ra, star.dec, ra.value, dec.value, layout.width, layout.height, zoom.value);
      const dist = Math.sqrt(Math.pow(p.x - e.x, 2) + Math.pow(p.y - e.y, 2));
      if (dist < minDistance) {
        minDistance = dist;
        closestStar = star;
      }
    });
    if (closestStar) runOnJS(onSelect)(closestStar);
  });

  const combinedGesture = Gesture.Simultaneous(panGesture, pinchGesture, tapGesture);

  const starElements = useMemo(() => {
    return stars.map(s => ({
      ...s,
      radius: radiusForMag(s.mag, s.spect),
      color: colorForSpectrum(s.spect)
    }));
  }, [stars]);

  const constellationLines = useMemo(() => {
    if (!showConstellations || !constellations.features) return [];
    const lines = [];
    constellations.features.forEach((feature) => {
      if (feature.geometry && feature.geometry.type === 'MultiLineString') {
        feature.geometry.coordinates.forEach((path) => {
          for (let i = 0; i < path.length - 1; i++) {
            lines.push({ ra1: path[i][0], dec1: path[i][1], ra2: path[i+1][0], dec2: path[i+1][1], id: `${feature.id}-${i}` });
          }
        });
      }
    });
    return lines;
  }, [constellations, showConstellations]);

  const font = useFont(null, 10);
  const boldFont = useFont(null, 11);

  const selectedStarPos = useDerivedValue(() => {
    if (!selectedStar) return null;
    return project(selectedStar.ra, selectedStar.dec, ra.value, dec.value, layout.width, layout.height, zoom.value);
  });

  const isSelectedVisible = useDerivedValue(() => {
    if (!selectedStarPos.value) return false;
    return selectedStarPos.value.x > 0 && selectedStarPos.value.x < layout.width &&
           selectedStarPos.value.y > 0 && selectedStarPos.value.y < layout.height;
  });

  const arrowAngle = useDerivedValue(() => {
    if (!selectedStarPos.value) return 0;
    const dx = selectedStarPos.value.x - layout.width / 2;
    const dy = selectedStarPos.value.y - layout.height / 2;
    return Math.atan2(dy, dx);
  });

  return (
    <GestureHandlerRootView style={styles.container}>
      <GestureDetector gesture={combinedGesture}>
        <View style={styles.container} onLayout={(e) => setLayout(e.nativeEvent.layout)}>
          <Canvas style={styles.canvas}>
            <Rect x={0} y={0} width={layout.width} height={layout.height}>
              <RadialGradient c={vec(layout.width / 2, layout.height / 2)} r={layout.width * 1.5} colors={['#050B1A', '#000000']} />
            </Rect>

            {/* Mythology Layer */}
            {showMythology && Object.keys(MYTHOLOGY_ASSETS).map((key) => (
              <MythologyFigure 
                key={key} 
                data={MYTHOLOGY_ASSETS[key]} 
                ra={ra} 
                dec={dec} 
                zoom={zoom} 
                layout={layout} 
              />
            ))}

            <Group opacity={0.08}>
              <Rect x={0} y={0} width={layout.width} height={layout.height}>
                <LinearGradient start={vec(0, layout.height * 0.2)} end={vec(layout.width, layout.height * 0.8)} colors={['transparent', '#4A90E2', 'transparent']} />
              </Rect>
            </Group>

            {showDSOs && dsoData.map((dso) => (
              <DSOMarker key={dso.id} dso={dso} ra={ra} dec={dec} zoom={zoom} layout={layout} font={font} />
            ))}

            {constellationLines.map((line) => (
              <ConstellationLine key={line.id} line={line} ra={ra} dec={dec} zoom={zoom} layout={layout} />
            ))}

            {starElements.map((star) => (
              <StarCircle key={star.id} star={star} ra={ra} dec={dec} zoom={zoom} layout={layout} time={time} font={font} showLabels={showLabels} />
            ))}

            {showPlanets && planetData.map((planet) => (
              <PlanetMarker key={planet.id} planet={planet} ra={ra} dec={dec} zoom={zoom} layout={layout} font={boldFont} />
            ))}

            {!isSelectedVisible.value && selectedStarPos.value && (
              <Group origin={vec(layout.width/2, layout.height/2)} transform={useDerivedValue(() => [{ rotate: arrowAngle.value }])}>
                 <Circle cx={layout.width/2 + 100} cy={layout.height/2} r={6} color="#C9A84C" opacity={0.8} />
              </Group>
            )}

            {selectedStarPos.value && isSelectedVisible.value && (
              <Group>
                <Circle cx={useDerivedValue(() => selectedStarPos.value.x)} cy={useDerivedValue(() => selectedStarPos.value.y)} r={useDerivedValue(() => 20 + Math.sin(time.value * 4) * 4)} color="#C9A84C" style="stroke" strokeWidth={1} opacity={0.4} />
                <Rect x={useDerivedValue(() => selectedStarPos.value.x - 15)} y={useDerivedValue(() => selectedStarPos.value.y - 15)} width={30} height={30} color="#C9A84C" style="stroke" strokeWidth={1.5} opacity={useDerivedValue(() => 0.6 + Math.sin(time.value * 6) * 0.2)} />
              </Group>
            )}
          </Canvas>
          
          <View style={styles.controls} pointerEvents="box-none">
            <TouchableOpacity style={styles.zoomButton} onPress={() => { zoom.value = Math.min(15, zoom.value + 0.5); if(onZoomChange) runOnJS(onZoomChange)(zoom.value); }}>
              <Text style={styles.zoomText}>+</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.zoomButton} onPress={() => { zoom.value = Math.max(0.2, zoom.value - 0.5); if(onZoomChange) runOnJS(onZoomChange)(zoom.value); }}>
              <Text style={styles.zoomText}>-</Text>
            </TouchableOpacity>
          </View>
        </View>
      </GestureDetector>
    </GestureHandlerRootView>
  );
}

function PlanetMarker({ planet, ra, dec, zoom, layout, font }) {
  const pos = useDerivedValue(() => project(planet.ra, planet.dec, ra.value, dec.value, layout.width, layout.height, zoom.value));
  const isVisible = useDerivedValue(() => pos.value.x > -20 && pos.value.x < layout.width + 20 && pos.value.y > -20 && pos.value.y < layout.height + 20);
  
  return (
    <Group opacity={useDerivedValue(() => isVisible.value ? 1 : 0)}>
      <Circle cx={useDerivedValue(() => pos.value.x)} cy={useDerivedValue(() => pos.value.y)} r={useDerivedValue(() => 4 * (zoom.value > 2 ? 1.5 : 1))} color={planet.color} />
      <Circle cx={useDerivedValue(() => pos.value.x)} cy={useDerivedValue(() => pos.value.y)} r={useDerivedValue(() => 8 * (zoom.value > 2 ? 1.5 : 1))} color={planet.color} opacity={0.2} style="stroke" strokeWidth={1} />
      {font && (
        <SkiaText 
          x={useDerivedValue(() => pos.value.x + 10)} 
          y={useDerivedValue(() => pos.value.y + 4)} 
          text={planet.name} 
          font={font} 
          color="#fff" 
        />
      )}
    </Group>
  );
}

function DSOMarker({ dso, ra, dec, zoom, layout, font }) {
  const pos = useDerivedValue(() => project(dso.ra, dso.dec, ra.value, dec.value, layout.width, layout.height, zoom.value));
  const isVisible = useDerivedValue(() => pos.value.x > -50 && pos.value.x < layout.width + 50 && pos.value.y > -50 && pos.value.y < layout.height + 50);
  
  return (
    <Group opacity={useDerivedValue(() => isVisible.value ? 0.6 : 0)}>
      {dso.type === 'galaxy' && (
        <Circle 
          cx={useDerivedValue(() => pos.value.x)} 
          cy={useDerivedValue(() => pos.value.y)} 
          r={useDerivedValue(() => 15 * dso.size * (zoom.value / 2))} 
          color={dso.color} 
          style="stroke" 
          strokeWidth={1} 
          opacity={0.3}
        />
      )}
      {dso.type === 'nebula' && (
        <Rect 
          x={useDerivedValue(() => pos.value.x - 10)} 
          y={useDerivedValue(() => pos.value.y - 10)} 
          width={20} 
          height={20} 
          color={dso.color} 
          style="stroke" 
          strokeWidth={1} 
          opacity={0.3}
        />
      )}
      <Circle cx={useDerivedValue(() => pos.value.x)} cy={useDerivedValue(() => pos.value.y)} r={2} color={dso.color} />
      {font && zoom.value > 1.5 && (
        <SkiaText 
          x={useDerivedValue(() => pos.value.x + 10)} 
          y={useDerivedValue(() => pos.value.y - 10)} 
          text={dso.name} 
          font={font} 
          color={dso.color} 
        />
      )}
    </Group>
  );
}

function MythologyFigure({ data, ra, dec, zoom, layout }) {
  const image = useImage(data.url);
  
  const pos = useDerivedValue(() => project(data.ra, data.dec, ra.value, dec.value, layout.width, layout.height, zoom.value));
  
  const size = useDerivedValue(() => {
    const baseSize = 300 * (data.scale || 1.0);
    return baseSize * (zoom.value / 2.0);
  });

  const isVisible = useDerivedValue(() => {
    return pos.value.x > -size.value && pos.value.x < layout.width + size.value &&
           pos.value.y > -size.value && pos.value.y < layout.height + size.value;
  });

  if (!image) return null;

  return (
    <Group opacity={useDerivedValue(() => isVisible.value ? 0.25 : 0)}>
      <SkiaImage
        image={image}
        x={useDerivedValue(() => pos.value.x - size.value / 2)}
        y={useDerivedValue(() => pos.value.y - size.value / 2)}
        width={size}
        height={size}
        fit="contain"
      />
    </Group>
  );
}

function StarCircle({ star, ra, dec, zoom, layout, time, font, showLabels }) {
  const pos = useDerivedValue(() => project(star.ra, star.dec, ra.value, dec.value, layout.width, layout.height, zoom.value));
  const isVisible = useDerivedValue(() => pos.value.x > -20 && pos.value.x < layout.width + 20 && pos.value.y > -20 && pos.value.y < layout.height + 20);
  const twinkleUniforms = useDerivedValue(() => ({ iTime: time.value + (parseFloat(star.id) % 10) }));
  const labelVisible = useDerivedValue(() => isVisible.value && !!star.proper && (zoom.value > 2.5 || (showLabels && zoom.value > 1.2)));

  return (
    <Group opacity={useDerivedValue(() => isVisible.value ? 1 : 0)}>
      <Circle cx={useDerivedValue(() => pos.value.x)} cy={useDerivedValue(() => pos.value.y)} r={star.radius} color={star.color}>
        <RuntimeEffect source={twinkleEffect} uniforms={twinkleUniforms} />
      </Circle>
      {star.mag < 2.2 && <Circle cx={useDerivedValue(() => pos.value.x)} cy={useDerivedValue(() => pos.value.y)} r={star.radius * 2.5} color={star.color} opacity={0.06} />}
      {font && star.proper && (
        <SkiaText x={useDerivedValue(() => pos.value.x + star.radius + 4)} y={useDerivedValue(() => pos.value.y - star.radius - 2)} text={star.proper} font={font} color="rgba(255,255,255,0.6)" opacity={useDerivedValue(() => labelVisible.value ? 1 : 0)} />
      )}
    </Group>
  );
}

function ConstellationLine({ line, ra, dec, zoom, layout }) {
  const p1 = useDerivedValue(() => project(line.ra1 / 15, line.dec1, ra.value, dec.value, layout.width, layout.height, zoom.value));
  const p2 = useDerivedValue(() => project(line.ra2 / 15, line.dec2, ra.value, dec.value, layout.width, layout.height, zoom.value));
  const isVisible = useDerivedValue(() => (p1.value.x > -layout.width && p1.value.x < layout.width * 2) || (p2.value.x > -layout.width && p2.value.x < layout.width * 2));
  return <Line p1={useDerivedValue(() => vec(p1.value.x, p1.value.y))} p2={useDerivedValue(() => vec(p2.value.x, p2.value.y))} color="rgba(74,144,226,0.15)" strokeWidth={1} opacity={useDerivedValue(() => isVisible.value ? 1 : 0)} />;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  canvas: { flex: 1 },
  controls: { position: 'absolute', right: 12, bottom: 20, width: 44, alignItems: 'center' },
  zoomButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.08)', marginBottom: 10, alignItems: 'center', justifyContent: 'center' },
  zoomText: { color: '#fff', fontSize: 18, fontWeight: '700' }
});
