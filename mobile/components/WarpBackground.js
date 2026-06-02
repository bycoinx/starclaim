import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Animated, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');
const STAR_COUNT = 80;

export default function WarpBackground() {
  const stars = useRef([...Array(STAR_COUNT)].map(() => ({
    x: Math.random() * width,
    y: Math.random() * height,
    size: Math.random() * 2 + 1,
    opacity: new Animated.Value(Math.random()),
    speed: Math.random() * 2000 + 1000,
  }))).current;

  useEffect(() => {
    stars.forEach((star) => {
      const animate = () => {
        star.opacity.setValue(0);
        Animated.timing(star.opacity, {
          toValue: 0.8,
          duration: star.speed,
          useNativeDriver: true,
        }).start(() => {
          Animated.timing(star.opacity, {
            toValue: 0,
            duration: star.speed,
            useNativeDriver: true,
          }).start(animate);
        });
      };
      animate();
    });
  }, []);

  return (
    <View style={StyleSheet.absoluteFill}>
      {stars.map((star, i) => (
        <Animated.View
          key={i}
          style={[
            styles.star,
            {
              left: star.x,
              top: star.y,
              width: star.size,
              height: star.size,
              opacity: star.opacity,
              transform: [{ scale: star.opacity }],
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  star: {
    position: 'absolute',
    backgroundColor: '#fff',
    borderRadius: 5,
  },
});
