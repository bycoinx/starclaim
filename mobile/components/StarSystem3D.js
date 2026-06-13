import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { GLView } from 'expo-gl';
import { Renderer } from 'expo-three';
import * as THREE from 'three';
import { colorForSpectrum, getStarXYZ } from '../src/utils/astronomy';
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
  attribute float alpha;
  varying float vAlpha;
  void main() {
    vAlpha = alpha;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const warpFragmentShader = `
  varying float vAlpha;
  void main() {
    gl_FragColor = vec4(0.5, 0.8, 1.0, vAlpha * 0.6);
  }
`;

export default function StarSystem3D({ stars = [], targetStar = null }) {
  const timeoutRef = useRef();
  const warpActive = useRef(false);
  const warpStartTime = useRef(0);
  const warpDuration = 3000; // 3 seconds
  const cameraRef = useRef();
  const sceneRef = useRef();
  const warpGroupRef = useRef();
  const startPos = useRef(new THREE.Vector3(0, 0, 20));
  const endPos = useRef(new THREE.Vector3(0, 0, 0));

  const onContextCreate = async (gl) => {
    // Initialize Audio Engine
    SpaceAudio.initialize();
    
    const { drawingBufferWidth: width, drawingBufferHeight: height } = gl;
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    
    const camera = new THREE.PerspectiveCamera(70, width / height, 0.1, 20000);
    cameraRef.current = camera;

    // Set initial camera position based on target
    if (targetStar) {
      const targetPos = getStarXYZ(targetStar);
      endPos.current.set(targetPos.x, targetPos.y, targetPos.z);
      // Start further away for warp effect if coming from catalog/home
      camera.position.set(targetPos.x, targetPos.y, targetPos.z + 200);
      camera.lookAt(targetPos.x, targetPos.y, targetPos.z);
    } else {
      camera.position.z = 20;
    }

    const renderer = new Renderer({ gl });
    renderer.setSize(width, height);
    renderer.setClearColor(0x000105, 1);

    // 1. Stars Setup
    const geometry = new THREE.BufferGeometry();
    const positions = [];
    const colors = [];
    const sizes = [];

    stars.forEach((star) => {
      const { x, y, z } = getStarXYZ(star);
      positions.push(x, y, z);
      const color = new THREE.Color(colorForSpectrum(star.spect || star.spectralType));
      colors.push(color.r, color.g, color.b);
      sizes.push(Math.max(0.5, 6.0 - (star.mag || 5)));
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

    // 2. Warp Streaks Setup (Improved for 3D Travel)
    const warpGroup = new THREE.Group();
    warpGroupRef.current = warpGroup;
    const warpLines = 150;
    const lineGeom = new THREE.BufferGeometry();
    const linePositions = [];
    const lineAlphas = [];
    
    for(let i=0; i<warpLines; i++) {
        const r = 5 + Math.random() * 20;
        const theta = Math.random() * Math.PI * 2;
        const x = r * Math.cos(theta);
        const y = r * Math.sin(theta);
        const zStart = Math.random() * -400;
        const zEnd = zStart + 50 + Math.random() * 50;
        
        linePositions.push(x, y, zStart, x, y, zEnd);
        lineAlphas.push(0, 1);
    }
    
    lineGeom.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
    lineGeom.setAttribute('alpha', new THREE.Float32BufferAttribute(lineAlphas, 1));
    
    const lineMat = new THREE.ShaderMaterial({
        vertexShader: warpVertexShader,
        fragmentShader: warpFragmentShader,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthTest: false
    });
    
    const warpSystem = new THREE.LineSegments(lineGeom, lineMat);
    warpGroup.add(warpSystem);
    warpGroup.visible = false;
    scene.add(warpGroup);

    const startTime = Date.now();

    const render = () => {
      timeoutRef.current = requestAnimationFrame(render);
      const now = Date.now();
      const elapsed = (now - startTime) * 0.001;
      uniforms.time.value = elapsed;

      if (warpActive.current) {
          const warpElapsed = now - warpStartTime.current;
          const t = Math.min(1.0, warpElapsed / warpDuration);
          
          // Smoothstep for acceleration/deceleration
          const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
          
          // Update camera position
          camera.position.lerpVectors(startPos.current, new THREE.Vector3(endPos.current.x, endPos.current.y, endPos.current.z + 10), ease);
          camera.lookAt(endPos.current);
          
          // FOV Distortion
          camera.fov = 70 + Math.sin(t * Math.PI) * 45;
          camera.updateProjectionMatrix();
          
          // Warp Visuals
          warpGroup.visible = true;
          warpGroup.position.copy(camera.position);
          warpGroup.quaternion.copy(camera.quaternion);
          warpGroup.children[0].position.z += 20;
          if(warpGroup.children[0].position.z > 400) warpGroup.children[0].position.z = 0;
          
          points.scale.setScalar(1.0 + Math.sin(t * Math.PI) * 1.5);

          if (t >= 1.0) {
              warpActive.current = false;
              camera.fov = 70;
              camera.updateProjectionMatrix();
              warpGroup.visible = false;
              points.scale.setScalar(1.0);
          }
      } else {
          // Normal Idle / Orbit
          camera.fov = THREE.MathUtils.lerp(camera.fov, 70, 0.05);
          camera.updateProjectionMatrix();
          warpGroup.visible = false;
          points.rotation.y += 0.0002;
      }

      renderer.render(scene, camera);
      gl.endFrameEXP();
    };
    render();
  };

  const triggerWarp = () => {
      if (!targetStar || warpActive.current) return;
      
      const targetPos = getStarXYZ(targetStar);
      startPos.current.copy(cameraRef.current.position);
      endPos.current.set(targetPos.x, targetPos.y, targetPos.z);
      
      SpaceAudio.playWarp();
      warpStartTime.current = Date.now();
      warpActive.current = true;
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
          <TouchableOpacity 
            style={[styles.warpBtn, !targetStar && styles.warpBtnDisabled]} 
            onPress={triggerWarp}
            disabled={!targetStar}
          >
              <Text style={styles.warpText}>{targetStar ? 'ENGAGE_WARP_DRIVE' : 'NO_TARGET_LOCKED'}</Text>
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
  warpBtnDisabled: {
      borderColor: 'rgba(255,255,255,0.2)',
      backgroundColor: 'rgba(255,255,255,0.05)'
  },
  warpText: { color: THEME.colors.primary, fontSize: 10, fontWeight: '900', letterSpacing: 4 }
});
