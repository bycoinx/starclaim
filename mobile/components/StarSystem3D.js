import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { GLView } from 'expo-gl';
import { Renderer } from 'expo-three';
import * as THREE from 'three';
import { colorForSpectrum, raDecDistToXYZ } from '../src/utils/astronomy';
import { THEME } from '../constants/Theme';
import { SpaceAudio } from '../src/utils/audioEngine';

// Celestia-Grade Star Shader
const starVertexShader = `
  attribute float size;
  attribute vec3 customColor;
  varying vec3 vColor;
  varying float vSize;
  void main() {
    vColor = customColor;
    vSize = size;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = size * (350.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const starFragmentShader = `
  uniform float time;
  varying vec3 vColor;
  varying float vSize;
  void main() {
    float r = distance(gl_PointCoord, vec2(0.5, 0.5));
    if (r > 0.5) discard;
    float glow = exp(-6.0 * r);
    float pulse = 0.8 + 0.2 * sin(time * 2.5 + vSize);
    vec3 finalColor = vColor * glow * pulse;
    gl_FragColor = vec4(finalColor, glow * 1.5);
  }
`;

// Warp Speed Streak Shader
const warpVertexShader = `
  varying float vOpacity;
  void main() {
    vOpacity = clamp(position.z / 100.0, 0.0, 1.0);
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const warpFragmentShader = `
  varying float vOpacity;
  void main() {
    gl_FragColor = vec4(0.5, 0.8, 1.0, vOpacity * 0.5);
  }
`;

export default function StarSystem3D({ stars = [] }) {
  const timeoutRef = useRef();
  const warpActive = useRef(false);
  const cameraRef = useRef();
  const sceneRef = useRef();
  const warpGroupRef = useRef();

  const onContextCreate = async (gl) => {
    // Initialize Audio Engine
    SpaceAudio.initialize();
    
    const { drawingBufferWidth: width, drawingBufferHeight: height } = gl;
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    
    const camera = new THREE.PerspectiveCamera(70, width / height, 0.1, 5000);
    camera.position.z = 20;
    cameraRef.current = camera;

    const renderer = new Renderer({ gl });
    renderer.setSize(width, height);
    renderer.setClearColor(0x000105, 1);

    // 1. Stars Setup
    const geometry = new THREE.BufferGeometry();
    const positions = [];
    const colors = [];
    const sizes = [];

    stars.forEach((star) => {
      const { x, y, z } = raDecDistToXYZ(star.ra, star.dec, 200 + Math.random() * 300);
      positions.push(x, y, z);
      const color = new THREE.Color(colorForSpectrum(star.spect));
      colors.push(color.r, color.g, color.b);
      sizes.push(Math.max(1.0, 7.0 - (star.mag || 5)));
    });

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('customColor', new THREE.Float32BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));

    const uniforms = { time: { value: 0.0 } };
    const shaderMaterial = new THREE.ShaderMaterial({
      uniforms,
      vertexShader: starVertexShader,
      fragmentShader: starFragmentShader,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const points = new THREE.Points(geometry, shaderMaterial);
    scene.add(points);

    // 2. Warp Streaks Setup
    const warpGroup = new THREE.Group();
    warpGroupRef.current = warpGroup;
    const warpLines = 100;
    const lineGeom = new THREE.BufferGeometry();
    const linePos = [];
    for(let i=0; i<warpLines; i++) {
        const x = (Math.random() - 0.5) * 50;
        const y = (Math.random() - 0.5) * 50;
        const z = Math.random() * -500;
        linePos.push(x, y, z, x, y, z + 20);
    }
    lineGeom.setAttribute('position', new THREE.Float32BufferAttribute(linePos, 3));
    const lineMat = new THREE.ShaderMaterial({
        vertexShader: warpVertexShader,
        fragmentShader: warpFragmentShader,
        transparent: true,
        blending: THREE.AdditiveBlending
    });
    const warpSystem = new THREE.LineSegments(lineGeom, lineMat);
    warpGroup.add(warpSystem);
    warpGroup.visible = false;
    scene.add(warpGroup);

    const startTime = Date.now();

    const render = () => {
      timeoutRef.current = requestAnimationFrame(render);
      const elapsed = (Date.now() - startTime) * 0.001;
      uniforms.time.value = elapsed;

      if (warpActive.current) {
          // Warp Animation
          camera.fov = THREE.MathUtils.lerp(camera.fov, 110, 0.05);
          camera.updateProjectionMatrix();
          warpGroup.visible = true;
          warpGroup.children[0].position.z += 15;
          if(warpGroup.children[0].position.z > 500) warpGroup.children[0].position.z = 0;
          
          points.scale.setScalar(THREE.MathUtils.lerp(points.scale.x, 2.0, 0.02));
      } else {
          // Normal Idle
          camera.fov = THREE.MathUtils.lerp(camera.fov, 70, 0.05);
          camera.updateProjectionMatrix();
          warpGroup.visible = false;
          points.rotation.y += 0.0002;
          points.scale.setScalar(THREE.MathUtils.lerp(points.scale.x, 1.0, 0.05));
      }

      renderer.render(scene, camera);
      gl.endFrameEXP();
    };
    render();
  };

  const triggerWarp = () => {
      SpaceAudio.playWarp();
      warpActive.current = true;
      setTimeout(() => {
          warpActive.current = false;
      }, 2500);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) cancelAnimationFrame(timeoutRef.current);
    };
  }, []);

  return (
    <View style={styles.container}>
      <GLView style={styles.glView} onContextCreate={onContextCreate} />
      <View style={styles.ui}>
          <TouchableOpacity style={styles.warpBtn} onPress={triggerWarp}>
              <Text style={styles.warpText}>ENGAGE_WARP_DRIVE</Text>
          </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  glView: { flex: 1 },
  ui: { position: 'absolute', bottom: 100, width: '100%', alignItems: 'center' },
  warpBtn: { 
      paddingVertical: 15, 
      paddingHorizontal: 40, 
      backgroundColor: 'rgba(0, 204, 255, 0.15)', 
      borderRadius: 4, 
      borderWidth: 1, 
      borderColor: THEME.colors.primary 
  },
  warpText: { color: THEME.colors.primary, fontSize: 10, fontWeight: '900', letterSpacing: 4 }
});
