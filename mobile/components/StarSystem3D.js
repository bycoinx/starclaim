import React, { useRef, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { GLView } from 'expo-gl';
import { Renderer } from 'expo-three';
import * as THREE from 'three';
import { colorForSpectrum, raDecDistToXYZ } from '../src/utils/astronomy';

export default function StarSystem3D({ stars = [] }) {
  const timeoutRef = useRef();

  const onContextCreate = async (gl) => {
    const { drawingBufferWidth: width, drawingBufferHeight: height } = gl;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 2000);
    camera.position.z = 5;

    const renderer = new Renderer({ gl });
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 1);

    // Create Starfield using Points
    const geometry = new THREE.BufferGeometry();
    const positions = [];
    const colors = [];
    const sizes = [];

    stars.forEach((star) => {
      const { x, y, z } = raDecDistToXYZ(star.ra, star.dec, 100 + Math.random() * 50);
      positions.push(x, y, z);
      
      const color = new THREE.Color(colorForSpectrum(star.spect));
      colors.push(color.r, color.g, color.b);
      
      const size = Math.max(0.5, 5 - star.mag);
      sizes.push(size);
    });

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));

    const material = new THREE.PointsMaterial({
      size: 1.5,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
    });

    const points = new THREE.Points(geometry, material);
    scene.add(points);

    // Animation Loop
    const render = () => {
      timeoutRef.current = requestAnimationFrame(render);
      points.rotation.y += 0.0005;
      renderer.render(scene, camera);
      gl.endFrameEXP();
    };
    render();
  };

  return (
    <View style={styles.container}>
      <GLView style={styles.glView} onContextCreate={onContextCreate} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  glView: { flex: 1 },
});
