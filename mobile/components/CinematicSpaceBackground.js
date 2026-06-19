import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, StyleSheet, View, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

function seededStars(count) {
  let seed = 92821;
  const next = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };

  return Array.from({ length: count }, (_, index) => ({
    id: index,
    x: next(),
    y: next(),
    size: next() > 0.92 ? 2.4 : next() * 1.25 + 0.45,
    opacity: next() * 0.55 + 0.25,
    color: next() > 0.92 ? '#E9C879' : next() > 0.72 ? '#A9CBFF' : '#FFFFFF',
  }));
}

export default function CinematicSpaceBackground() {
  const { width, height } = useWindowDimensions();
  const [reduceMotion, setReduceMotion] = useState(false);
  const drift = useRef(new Animated.Value(0)).current;
  const meteor = useRef(new Animated.Value(0)).current;
  const stars = useMemo(() => seededStars(width >= 900 ? 110 : 72), [width]);

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (mounted) setReduceMotion(enabled);
    });
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    drift.stopAnimation();
    meteor.stopAnimation();
    drift.setValue(0);
    meteor.setValue(0);
    if (reduceMotion) return undefined;

    const driftLoop = Animated.loop(Animated.sequence([
      Animated.timing(drift, { toValue: 1, duration: 24000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(drift, { toValue: 0, duration: 24000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ]));
    const meteorLoop = Animated.loop(Animated.sequence([
      Animated.delay(18000),
      Animated.timing(meteor, { toValue: 1, duration: 850, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.timing(meteor, { toValue: 0, duration: 1, useNativeDriver: true }),
      Animated.delay(9000),
    ]));
    driftLoop.start();
    meteorLoop.start();

    return () => {
      driftLoop.stop();
      meteorLoop.stop();
    };
  }, [drift, meteor, reduceMotion]);

  const imageTransform = reduceMotion
    ? [{ scale: 1.08 }]
    : [
        { scale: drift.interpolate({ inputRange: [0, 1], outputRange: [1.08, 1.13] }) },
        { translateX: drift.interpolate({ inputRange: [0, 1], outputRange: [-5, 7] }) },
      ];

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      <Animated.Image
        source={require('../assets/sky-nebula-premium.jpg')}
        resizeMode="cover"
        style={[styles.nebula, { width, height }, { transform: imageTransform }]}
      />
      <View style={StyleSheet.absoluteFillObject}>
        {stars.map((star) => (
          <View
            key={star.id}
            style={{
              position: 'absolute',
              left: star.x * width,
              top: star.y * height,
              width: star.size,
              height: star.size,
              borderRadius: star.size,
              backgroundColor: star.color,
              opacity: star.opacity,
            }}
          />
        ))}
      </View>
      {!reduceMotion && (
        <Animated.View
          style={[
            styles.meteor,
            {
              opacity: meteor.interpolate({ inputRange: [0, 0.08, 0.72, 1], outputRange: [0, 0.75, 0.5, 0] }),
              transform: [
                { translateX: meteor.interpolate({ inputRange: [0, 1], outputRange: [width * 0.18, width * 0.62] }) },
                { translateY: meteor.interpolate({ inputRange: [0, 1], outputRange: [height * 0.16, height * 0.42] }) },
                { rotate: '28deg' },
              ],
            },
          ]}
        />
      )}
      <LinearGradient
        colors={['rgba(2,4,10,0.48)', 'rgba(2,4,10,0.1)', 'rgba(2,4,10,0.82)']}
        locations={[0, 0.48, 1]}
        style={StyleSheet.absoluteFillObject}
      />
      <LinearGradient
        colors={['rgba(2,4,10,0.82)', 'rgba(2,4,10,0.14)', 'rgba(2,4,10,0.58)']}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={StyleSheet.absoluteFillObject}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  nebula: { position: 'absolute', left: 0, top: 0 },
  meteor: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 90,
    height: 1,
    borderRadius: 1,
    backgroundColor: '#DDEBFF',
    shadowColor: '#8BC2FF',
    shadowOpacity: 0.8,
    shadowRadius: 5,
  },
});
