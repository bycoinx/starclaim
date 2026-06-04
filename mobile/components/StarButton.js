import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import Svg, { Polygon } from 'react-native-svg';

export default function StarButton({ title, onPress, active, size = 80, compact }) {
  const strokeColor = active ? '#FFD060' : '#C9A84C';
  const fillColor = active ? '#C9A84C' : 'rgba(201,168,76,0.2)';
  const textSize = compact ? 10 : 12;
  return (
    <TouchableOpacity onPress={onPress} style={[styles.container, compact && styles.compact]}>
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size} viewBox="0 0 100 100">
          <Polygon
            points="50,6 61,38 98,38 67,60 78,94 50,74 22,94 33,60 2,38 39,38"
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth="4"
          />
        </Svg>
        <View style={styles.labelOverlay} pointerEvents="none">
          <Text style={[styles.label, { fontSize: textSize }]}>{title}</Text>
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
    paddingHorizontal: 8,
  },
  label: {
    color: '#000',
    fontWeight: '700',
    textAlign: 'center',
  },
});
