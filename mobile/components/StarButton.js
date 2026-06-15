import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import Svg, { Polygon } from 'react-native-svg';
import { THEME } from '../constants/Theme';

export default function StarButton({ title, onPress, active, size = 80, compact }) {
  const strokeColor = active ? THEME.colors.primary : THEME.colors.glassBorder;
  const fillColor = active ? THEME.colors.glassAccent : 'rgba(255, 255, 255, 0.05)';
  const textSize = compact ? 9 : 11;
  const shadowColor = active ? THEME.colors.primary : 'transparent';

  return (
    <TouchableOpacity onPress={onPress} style={[styles.container, compact && styles.compact, { shadowColor }]}>
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size} viewBox="0 0 100 100">
          <Polygon
            points="50,6 61,38 98,38 67,60 78,94 50,74 22,94 33,60 2,38 39,38"
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth="3"
          />
        </Svg>
        <View style={styles.labelOverlay} pointerEvents="none">
          <Text style={[styles.label, { fontSize: textSize, color: active ? THEME.colors.primary : THEME.colors.textMuted }]}>
            {title.toUpperCase()}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    margin: 8,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
  },
  compact: {
    margin: 4,
  },
  labelOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  label: {
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 1,
  },
});
