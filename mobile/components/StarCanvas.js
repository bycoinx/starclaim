import React, { useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, PanResponder, TouchableOpacity } from 'react-native';
import { projectRaDec, radiusForMag, colorForSpectrum } from '../src/utils/astronomy';

export default function StarCanvas({ stars, centerRa, centerDec, zoom, onCenterChange, onZoomChange, onSelect, ownedStarIds = [] }) {
  const [layout, setLayout] = useState({ width: 0, height: 0 });
  const offsetRef = useRef({ x: 0, y: 0 });

  const panResponder = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: () => {
      offsetRef.current = { x: 0, y: 0 };
    },
    onPanResponderMove: (evt, gestureState) => {
      const dx = gestureState.dx - offsetRef.current.x;
      const dy = gestureState.dy - offsetRef.current.y;
      offsetRef.current = { x: gestureState.dx, y: gestureState.dy };
      const raMove = (dx / Math.max(layout.width, 1)) * 90 / zoom;
      const decMove = (dy / Math.max(layout.height, 1)) * 90 / zoom;
      onCenterChange({ ra: centerRa - raMove, dec: centerDec + decMove });
    },
    onPanResponderRelease: () => {},
    onPanResponderTerminationRequest: () => true
  })).current;

  const visibleStars = useMemo(() => {
    if (!layout.width || !layout.height) return [];
    return stars
      .map((star) => {
        const { x, y } = projectRaDec(star, centerRa, centerDec, layout.width, layout.height, zoom);
        return { ...star, x, y };
      })
      .filter((star) => star.x >= -40 && star.x <= layout.width + 40 && star.y >= -40 && star.y <= layout.height + 40);
  }, [stars, centerRa, centerDec, layout, zoom]);

  return (
    <View
      style={styles.canvas}
      {...panResponder.panHandlers}
      onLayout={(e) => {
        const { width, height } = e.nativeEvent.layout;
        setLayout({ width, height });
      }}
    >
      {visibleStars.map((star) => {
        const radius = radiusForMag(star.mag);
        const color = colorForSpectrum(star.spect);
        return (
          <TouchableOpacity key={star.id} style={[styles.star, { left: star.x - radius, top: star.y - radius, width: radius * 2, height: radius * 2, borderRadius: radius, backgroundColor: color }]} onPress={() => onSelect && onSelect(star)}>
            {star.proper ? <Text style={[styles.label, { left: star.x + radius + 2, top: star.y - radius - 8 }]}>{star.proper}</Text> : null}
            {ownedStarIds.includes(star.id) ? <Text style={[styles.owned, { left: star.x + radius + 2, top: star.y + radius + 2 }]}>★</Text> : null}
          </TouchableOpacity>
        );
      })}
      <View style={styles.controls} pointerEvents="box-none">
        <TouchableOpacity style={styles.zoomButton} onPress={() => onZoomChange(Math.min(6, zoom + 0.4))}><Text style={styles.zoomText}>+</Text></TouchableOpacity>
        <TouchableOpacity style={styles.zoomButton} onPress={() => onZoomChange(Math.max(0.6, zoom - 0.4))}><Text style={styles.zoomText}>-</Text></TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  canvas: { flex: 1, backgroundColor: '#000' },
  star: { position: 'absolute' },
  label: { position: 'absolute', color: '#fff', fontSize: 10, fontWeight: '600' },
  owned: { position: 'absolute', color: '#FFD700', fontSize: 12, fontWeight: '900' },
  controls: { position: 'absolute', right: 12, bottom: 20, width: 44, alignItems: 'center' },
  zoomButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.08)', marginBottom: 10, alignItems: 'center', justifyContent: 'center' },
  zoomText: { color: '#fff', fontSize: 18, fontWeight: '700' }
});
