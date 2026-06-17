import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { GLView } from 'expo-gl';
import { Renderer } from 'expo-three';
import * as THREE from 'three';
import { colorForSpectrum, getStarXYZ, getStarDistanceParsec } from '../src/utils/astronomy';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState } from 'react';
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

function getScaledStarPosition({ x, y, z }, scale = 0.24) {
  return new THREE.Vector3(x * scale, y * scale, z * scale);
}

function createTargetRing(material) {
  const ringGeom = new THREE.RingGeometry(1.1, 1.8, 32);
  const ring = new THREE.LineLoop(ringGeom, material);
  ring.rotation.x = Math.PI / 2;
  return ring;
}

export default function StarSystem3D({ stars = [], targetStar = null, onArrival = null }) {
  const timeoutRef = useRef();
  const onArrivalRef = useRef(onArrival);
  const warpActive = useRef(false);
  const warpOffset = useRef(0);
  const targetStarRef = useRef(targetStar);
  const orbitAngle = useRef(0);

  useEffect(() => {
    onArrivalRef.current = onArrival;
  }, [onArrival]);

  useEffect(() => {
    targetStarRef.current = targetStar;
  }, [targetStar]);

  useEffect(() => {
    if (!cameraRef.current || !targetStar) return;
    const worldPos = getScaledStarPosition(getStarXYZ(targetStar));
    startPos.current.copy(worldPos).add(new THREE.Vector3(0, 0, 80));
    endPos.current.copy(worldPos);
    cameraRef.current.position.copy(startPos.current);
    cameraRef.current.lookAt(worldPos);
    if (targetMarkerRef.current) {
      targetMarkerRef.current.position.copy(worldPos);
      targetMarkerRef.current.visible = true;
    }
  }, [targetStar]);

  const warpStartTime = useRef(0);
  const warpDuration = 3000; // 3 seconds
  const cameraRef = useRef();
  const sceneRef = useRef();
  const warpGroupRef = useRef();
  const targetMarkerRef = useRef();
  const startPos = useRef(new THREE.Vector3(0, 0, 120));
  const endPos = useRef(new THREE.Vector3(0, 0, 0));

  const onContextCreate = async (gl) => {
    // Initialize Audio Engine
    SpaceAudio.initialize();
    
    const { drawingBufferWidth: width, drawingBufferHeight: height } = gl;
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    
    const camera = new THREE.PerspectiveCamera(70, width / height, 0.1, 20000);
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
      const { x, y, z } = getStarXYZ(star);
      const scaled = getScaledStarPosition({ x, y, z });
      positions.push(scaled.x, scaled.y, scaled.z);
      const color = new THREE.Color(colorForSpectrum(star.spect || star.spectralType));
      colors.push(color.r, color.g, color.b);
      sizes.push(Math.max(0.8, Math.min(4.5, 5.5 - (star.mag || 3))));
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

    // 2. Target Marker
    const ringMaterial = new THREE.LineBasicMaterial({ color: 0x00f2fe, transparent: true, opacity: 0.85 });
    const targetMarker = createTargetRing(ringMaterial);
    targetMarkerRef.current = targetMarker;
    targetMarker.visible = false;
    scene.add(targetMarker);

    const resetCamera = (star) => {
      if (!star || !camera) {
        camera.position.set(0, 0, 120);
        camera.lookAt(0, 0, 0);
        return;
      }

      const worldPos = getScaledStarPosition(getStarXYZ(star));
      endPos.current.copy(worldPos);
      startPos.current.copy(worldPos).add(new THREE.Vector3(0, 0, 80));
      camera.position.copy(startPos.current);
      camera.lookAt(worldPos);
      targetMarker.position.copy(worldPos);
      targetMarker.visible = true;
    };

    if (targetStar) {
      resetCamera(targetStar);
    } else {
      camera.position.set(0, 0, 120);
      camera.lookAt(0, 0, 0);
    }

    // 3. Warp Streaks Setup (Improved for 3D Travel)
    const warpGroup = new THREE.Group();
    warpGroupRef.current = warpGroup;
    const warpLines = 160;
    const lineGeom = new THREE.BufferGeometry();
    const linePositions = [];
    const lineAlphas = [];
    
    for (let i = 0; i < warpLines; i += 1) {
      const r = 6 + Math.random() * 24;
      const theta = Math.random() * Math.PI * 2;
      const x = r * Math.cos(theta);
      const y = r * Math.sin(theta);
      const zStart = Math.random() * -420;
      const zEnd = zStart + 80 + Math.random() * 80;
      
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
      depthTest: false,
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
        const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

        const destination = new THREE.Vector3(endPos.current.x, endPos.current.y, endPos.current.z + 10);
        camera.position.lerpVectors(startPos.current, destination, ease);
        camera.lookAt(endPos.current);
        camera.fov = 70 + Math.sin(t * Math.PI) * 45;
        camera.updateProjectionMatrix();

        warpGroup.visible = true;
        warpGroup.position.copy(camera.position);
        warpGroup.quaternion.copy(camera.quaternion);
        warpSystem.position.z += 26;
        if (warpSystem.position.z > 520) warpSystem.position.z = -120;

        points.scale.setScalar(1.0 + Math.sin(t * Math.PI) * 1.5);

        if (t >= 1.0) {
          warpActive.current = false;
          camera.fov = 70;
          camera.updateProjectionMatrix();
          warpGroup.visible = false;
          points.scale.setScalar(1.0);
          if (onArrivalRef.current) onArrivalRef.current(targetStarRef.current);
        }
      } else {
        camera.fov = THREE.MathUtils.lerp(camera.fov, 70, 0.05);
        camera.updateProjectionMatrix();
        warpGroup.visible = false;

        if (targetStarRef.current) {
          orbitAngle.current += 0.0004;
          const worldPos = getScaledStarPosition(getStarXYZ(targetStarRef.current));
          const orbitRadius = 64;
          camera.position.set(
            worldPos.x + Math.cos(orbitAngle.current) * orbitRadius,
            worldPos.y + Math.sin(orbitAngle.current) * orbitRadius * 0.45,
            worldPos.z + 48,
          );
          camera.lookAt(worldPos);
        } else {
          points.rotation.y += 0.00025;
          camera.position.applyAxisAngle(new THREE.Vector3(0, 1, 0), 0.00008);
          camera.lookAt(0, 0, 0);
        }
      }

      renderer.render(scene, camera);
      gl.endFrameEXP();
    };

    render();
  };

  const triggerWarp = () => {
      const target = targetStarRef.current;
      if (!target || warpActive.current || !cameraRef.current) return;
      
      const worldPos = getScaledStarPosition(getStarXYZ(target));
      startPos.current.copy(cameraRef.current.position);
      endPos.current.copy(worldPos);
      
      SpaceAudio.playWarp();
      warpStartTime.current = Date.now();
      warpActive.current = true;
  };

  const [ownershipData, setOwnershipData] = useState(null);

  useEffect(() => {
    async function checkOwnershipLocal(star) {
      if (!star) { setOwnershipData(null); return; }
      try {
        const raw = await AsyncStorage.getItem('@purchases');
        const list = raw ? JSON.parse(raw) : [];
        const found = list.find(p => p.starId === star.id || p.hip === star.hip || p.starClaimCode === star.starClaimCode || p.code === star.starClaimCode || p.starId?.toString() === String(star.id));
        if (found) setOwnershipData(found); else setOwnershipData(null);
      } catch (e) { console.warn('Ownership check error', e); setOwnershipData(null); }
    }
    checkOwnershipLocal(targetStar);
  }, [targetStar]);

  const getDistanceDisplay = (star) => {
    try {
      const parsec = getStarDistanceParsec(star);
      const ly = parsec * 3.26156;
      return `${Number(ly || 0).toFixed(2)} LY`;
    } catch (e) { return 'N/A'; }
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) cancelAnimationFrame(timeoutRef.current);
    };
  }, []);

  return (
    <View style={styles.container}>
      <GLView style={styles.glView} onContextCreate={onContextCreate} />
      <View style={styles.telemetry} pointerEvents="none">
        <Text style={styles.telemetryName}>{targetStar ? (targetStar.properName || targetStar.proper || `HIP ${targetStar?.hip || targetStar?.id}`) : 'NO TARGET'}</Text>
        <Text style={styles.telemetryLine}>DISTANCE: <Text style={styles.telemetryValue}>{targetStar ? getDistanceDisplay(targetStar) : 'N/A'}</Text></Text>
        <Text style={styles.telemetryLine}>MAG: <Text style={styles.telemetryValue}>{targetStar ? Number(targetStar.mag || targetStar.magnitude || 0).toFixed(2) : 'N/A'}</Text></Text>
        <Text style={styles.telemetryLine}>OWNER: <Text style={[styles.telemetryValue, ownershipData ? { color: THEME.colors.secondary } : { color: THEME.colors.primary }]}>{ownershipData ? (ownershipData.starClaimCode || ownershipData.code || 'CERTIFIED') : 'UNOWNED'}</Text></Text>
      </View>
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

// Telemetry styles
const telemetryStyles = StyleSheet.create({
  telemetry: {
    position: 'absolute',
    top: 40,
    right: 20,
    backgroundColor: 'rgba(10,10,18,0.6)',
    borderRadius: 12,
    padding: 12,
    zIndex: 40,
    borderWidth: 1,
    borderColor: 'rgba(0,242,254,0.12)'
  },
  telemetryName: { color: '#fff', fontWeight: '900', fontSize: 12, marginBottom: 6, letterSpacing: 1 },
  telemetryLine: { color: 'rgba(255,255,255,0.75)', fontSize: 11, fontWeight: '900', marginBottom: 4 },
  telemetryValue: { color: THEME.colors.primary }
});

// Merge telemetry styles into existing styles object for export
Object.assign(styles, telemetryStyles);
