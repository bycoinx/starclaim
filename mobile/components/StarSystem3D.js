import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  PixelRatio,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { GLView } from 'expo-gl';
import { Renderer } from 'expo-three';
import * as THREE from 'three';
import { colorForSpectrum, getStarDistanceParsec, getStarXYZ } from '../src/utils/astronomy';
import { THEME } from '../constants/Theme';
import { SpaceAudio } from '../src/utils/audioEngine';

const PARSEC_TO_LIGHT_YEARS = 3.26156;
const STAR_SCALE = 0.15;
const DEFAULT_ORBIT_RADIUS = 68;
const MIN_ORBIT_RADIUS = 10;
const MAX_ORBIT_RADIUS = 260;
const WARP_DURATION_MS = 3600;
const QUALITY_LIMITS = { low: 3500, medium: 7000, high: 10000 };
const GALAXY_LIMITS = { low: 2400, medium: 4800, high: 8000 };
const QUALITY_ORDER = ['low', 'medium', 'high'];
const SCENE_MODES = { galaxy: 'galaxy', sector: 'sector', target: 'target' };

const starVertexShader = `
  attribute float size;
  attribute vec3 customColor;
  varying vec3 vColor;
  varying float vSeed;

  void main() {
    vColor = customColor;
    vSeed = size;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    float depth = max(1.0, -mvPosition.z);
    float perspectiveSize = clamp(360.0 / depth, 0.45, 12.0);
    gl_PointSize = clamp(size * perspectiveSize, 1.0, 34.0);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const starFragmentShader = `
  uniform float time;
  uniform float layerOpacity;
  varying vec3 vColor;
  varying float vSeed;

  void main() {
    vec2 p = gl_PointCoord - vec2(0.5);
    float radius = length(p);
    if (radius > 0.5) discard;

    float core = smoothstep(0.16, 0.0, radius);
    float halo = smoothstep(0.38, 0.08, radius) * 0.58;
    float outerHalo = smoothstep(0.5, 0.2, radius) * 0.2;
    float diffraction = (
      smoothstep(0.045, 0.0, abs(p.x))
      + smoothstep(0.045, 0.0, abs(p.y))
    ) * smoothstep(0.5, 0.08, radius) * 0.12;
    float pulse = 0.94 + 0.06 * sin(time * 1.7 + vSeed * 2.3);
    float alpha = min(1.0, (core + halo + outerHalo + diffraction) * pulse);
    vec3 color = vColor * (0.82 + core * 1.25 + diffraction * 0.7);
    gl_FragColor = vec4(color, alpha * layerOpacity);
  }
`;

const targetVertexShader = `
  varying vec3 vNormal;
  varying vec3 vPosition;

  void main() {
    vNormal = normalize(normalMatrix * normal);
    vPosition = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const targetFragmentShader = `
  uniform float time;
  uniform float reveal;
  uniform vec3 starColor;
  varying vec3 vNormal;
  varying vec3 vPosition;

  float hash(vec3 p) {
    p = fract(p * 0.3183099 + 0.1);
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }

  void main() {
    float grain = hash(floor((vPosition + time * 0.025) * 13.0));
    float facing = max(0.0, dot(normalize(vNormal), vec3(0.0, 0.0, 1.0)));
    float rim = pow(1.0 - facing, 2.2);
    vec3 surface = starColor * (0.82 + grain * 0.45);
    gl_FragColor = vec4(surface + starColor * rim * 0.75, reveal);
  }
`;

const warpVertexShader = `
  attribute float alpha;
  varying float vAlpha;

  void main() {
    vAlpha = alpha;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const warpFragmentShader = `
  uniform vec3 warpColor;
  uniform float certified;
  varying float vAlpha;

  void main() {
    vec3 certifiedHighlight = vec3(1.0, 0.94, 0.72);
    vec3 color = mix(warpColor, certifiedHighlight, vAlpha * certified * 0.42);
    float intensity = 0.72 + certified * 0.16;
    gl_FragColor = vec4(color, vAlpha * intensity);
  }
`;

const nebulaVertexShader = `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const nebulaFragmentShader = `
  uniform float time;
  uniform float opacity;
  uniform float seed;
  uniform vec3 tint;
  varying vec2 vUv;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
      u.y
    );
  }

  float fbm(vec2 p) {
    float value = 0.0;
    value += noise(p) * 0.52;
    p = p * 2.03 + 13.7;
    value += noise(p) * 0.27;
    p = p * 2.01 + 7.1;
    value += noise(p) * 0.14;
    p = p * 2.04 + 3.9;
    value += noise(p) * 0.07;
    return value;
  }

  void main() {
    vec2 p = (vUv - 0.5) * 2.0;
    float radius = length(p);
    float angle = atan(p.y, p.x);
    float spiral = sin(angle * 4.0 - radius * 13.0 + seed) * 0.5 + 0.5;
    vec2 drift = vec2(time * 0.0025, -time * 0.0018);
    float cloud = fbm(p * (2.6 + seed * 0.08) + drift + seed * 4.1);
    float detail = fbm(p * 5.4 - drift * 1.7 + seed * 8.3);
    float density = cloud * 0.62 + detail * 0.18 + spiral * 0.2;
    float radialMask = 1.0 - smoothstep(0.42, 1.0, radius);
    float coreCut = smoothstep(0.03, 0.24, radius);
    float alpha = smoothstep(0.49, 0.82, density) * radialMask * coreCut * opacity;
    vec3 color = tint * (0.68 + detail * 0.62);
    gl_FragColor = vec4(color, alpha);
  }
`;

function toWorldPosition(star) {
  const { x, y, z } = getStarXYZ(star);
  return new THREE.Vector3(x * STAR_SCALE, y * STAR_SCALE, z * STAR_SCALE);
}

function getDistanceLightYears(star) {
  const parsecs = getStarDistanceParsec(star);
  return Number.isFinite(parsecs) && parsecs > 0 ? parsecs * PARSEC_TO_LIGHT_YEARS : null;
}

function easeInOutCubic(value) {
  return value < 0.5
    ? 4 * value * value * value
    : 1 - Math.pow(-2 * value + 2, 3) / 2;
}

function getOrbitPosition(focus, radius, yaw, pitch) {
  const cosPitch = Math.cos(pitch);
  return new THREE.Vector3(
    focus.x + radius * cosPitch * Math.sin(yaw),
    focus.y + radius * Math.sin(pitch),
    focus.z + radius * cosPitch * Math.cos(yaw),
  );
}

function getInitialQuality() {
  const density = PixelRatio.get();
  return density >= 3 ? 'medium' : 'high';
}

function nextQuality(current, direction) {
  const index = QUALITY_ORDER.indexOf(current);
  const nextIndex = Math.max(0, Math.min(QUALITY_ORDER.length - 1, index + direction));
  return QUALITY_ORDER[nextIndex];
}

function disposeMaterial(material) {
  if (!material) return;
  Object.values(material).forEach((value) => {
    if (value?.isTexture) value.dispose();
  });
  material.dispose();
}

function disposeScene(scene, renderer) {
  if (scene) {
    scene.traverse((object) => {
      object.geometry?.dispose();
      if (Array.isArray(object.material)) object.material.forEach(disposeMaterial);
      else disposeMaterial(object.material);
    });
    scene.clear();
  }
  renderer?.dispose();
}

function createWarpSystem(lineCount) {
  const positions = new Float32Array(lineCount * 2 * 3);
  const alphas = new Float32Array(lineCount * 2);

  for (let index = 0; index < lineCount; index += 1) {
    const radius = 5 + Math.random() * 34;
    const angle = Math.random() * Math.PI * 2;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    const startZ = -320 - Math.random() * 260;
    const offset = index * 6;
    positions[offset] = x;
    positions[offset + 1] = y;
    positions[offset + 2] = startZ;
    positions[offset + 3] = x;
    positions[offset + 4] = y;
    positions[offset + 5] = startZ + 90 + Math.random() * 120;
    alphas[index * 2] = 0.05;
    alphas[index * 2 + 1] = 1;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('alpha', new THREE.BufferAttribute(alphas, 1));
  const material = new THREE.ShaderMaterial({
    uniforms: {
      warpColor: { value: new THREE.Color(0x40c7ff) },
      certified: { value: 0 },
    },
    vertexShader: warpVertexShader,
    fragmentShader: warpFragmentShader,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthTest: false,
    depthWrite: false,
  });
  return new THREE.LineSegments(geometry, material);
}

function createSeededRandom(seed = 9417) {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

function createGalaxyGeometry(count = GALAXY_LIMITS.high) {
  const random = createSeededRandom();
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const warmCore = new THREE.Color(0xffd38a);
  const coolArm = new THREE.Color(0x79a8ff);
  const violetDust = new THREE.Color(0xa47cff);

  for (let index = 0; index < count; index += 1) {
    const inCore = random() < 0.18;
    const radius = inCore
      ? Math.pow(random(), 1.8) * 13
      : Math.pow(random(), 0.68) * 52;
    const arm = Math.floor(random() * 4);
    const armAngle = arm * Math.PI * 0.5;
    const angle = armAngle + radius * 0.19 + (random() - 0.5) * (inCore ? 1.9 : 0.62);
    const thickness = inCore ? 8 * (1 - radius / 16) : 2.8 * (1 - radius / 58);
    const offset = index * 3;
    positions[offset] = Math.cos(angle) * radius + (random() - 0.5) * 1.8;
    positions[offset + 1] = (random() - 0.5) * Math.max(0.35, thickness);
    positions[offset + 2] = Math.sin(angle) * radius + (random() - 0.5) * 1.8;

    const radialMix = THREE.MathUtils.clamp(radius / 52, 0, 1);
    const color = warmCore.clone().lerp(coolArm, radialMix);
    if (!inCore && random() < 0.28) color.lerp(violetDust, 0.45);
    colors.set([color.r, color.g, color.b], offset);
    sizes[index] = inCore ? 2.2 + random() * 1.8 : 0.8 + random() * 1.7;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('customColor', new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
  return geometry;
}

function createNebulaGroup(quality) {
  const group = new THREE.Group();
  const layerSpecs = [
    { color: 0x315fa8, opacity: 0.2, seed: 0.8, y: -0.8, rotation: 0.1, scale: 1 },
    { color: 0x70448f, opacity: 0.145, seed: 2.4, y: 0.35, rotation: 0.68, scale: 0.92 },
    { color: 0xc39a52, opacity: 0.075, seed: 4.7, y: 1.15, rotation: 1.18, scale: 0.72 },
  ];
  const visibleLayers = quality === 'low' ? 1 : quality === 'medium' ? 2 : 3;

  layerSpecs.forEach((spec, index) => {
    const uniforms = {
      time: { value: 0 },
      opacity: { value: spec.opacity },
      seed: { value: spec.seed },
      tint: { value: new THREE.Color(spec.color) },
    };
    const material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader: nebulaVertexShader,
      fragmentShader: nebulaFragmentShader,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      depthTest: false,
      side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(116, 116, 1, 1), material);
    mesh.rotation.x = -Math.PI / 2;
    mesh.rotation.z = spec.rotation;
    mesh.position.y = spec.y;
    mesh.scale.setScalar(spec.scale);
    mesh.visible = index < visibleLayers;
    mesh.renderOrder = -2 + index * 0.01;
    mesh.userData.baseOpacity = spec.opacity;
    mesh.userData.layerIndex = index;
    group.add(mesh);
  });

  group.rotation.x = -0.12;
  return group;
}

function applyNebulaQuality(group, quality) {
  if (!group) return;
  const visibleLayers = quality === 'low' ? 1 : quality === 'medium' ? 2 : 3;
  group.children.forEach((layer) => {
    layer.visible = layer.userData.layerIndex < visibleLayers;
  });
}

function getStarLabel(star) {
  return star?.properName || star?.proper || null;
}

function createSectorStarGeometry(stars) {
  const positions = new Float32Array(stars.length * 3);
  const colors = new Float32Array(stars.length * 3);
  const sizes = new Float32Array(stars.length);

  stars.forEach((star, index) => {
    const position = toWorldPosition(star);
    const color = new THREE.Color(colorForSpectrum(star.spect || star.spectralType));
    const magnitude = Number.isFinite(Number(star.mag)) ? Number(star.mag) : 5;
    positions.set([position.x, position.y, position.z], index * 3);
    colors.set([color.r, color.g, color.b], index * 3);
    sizes[index] = THREE.MathUtils.clamp(1.15 + Math.sqrt(Math.max(0, 6.6 - magnitude)) * 1.45, 1, 6);
  });

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('customColor', new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
  return geometry;
}

function getRenderableSectorStars(stars) {
  return stars
    .filter((star) => Number.isFinite(getStarDistanceParsec(star)) && getStarDistanceParsec(star) > 0)
    .slice(0, QUALITY_LIMITS.high);
}

function buildLabelCandidates(stars, ownedStarIds) {
  const seen = new Set();
  const candidates = [];
  const addCandidate = (star) => {
    const id = String(star.id);
    if (seen.has(id)) return;
    seen.add(id);
    candidates.push({ star, position: toWorldPosition(star) });
  };

  stars
    .filter((star) => getStarLabel(star) && Number(star.mag) <= 4)
    .slice(0, 48)
    .forEach(addCandidate);
  stars.filter((star) => ownedStarIds.has(String(star.id))).forEach(addCandidate);
  return candidates;
}

function syncOwnedMarkers(group, ownedStars) {
  if (!group) return;
  group.clear();
  group.userData.geometry?.dispose();
  group.userData.material?.dispose();
  group.userData.hitGeometry?.dispose();
  group.userData.hitMaterial?.dispose();

  const validOwnedStars = ownedStars.filter(
    (star) => Number.isFinite(getStarDistanceParsec(star)) && getStarDistanceParsec(star) > 0,
  );
  if (validOwnedStars.length === 0) return;

  const geometry = new THREE.TorusGeometry(1.15, 0.075, 8, 40);
  const material = new THREE.MeshBasicMaterial({
    color: 0xffcf57,
    transparent: true,
    opacity: 0.88,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const hitGeometry = new THREE.CircleGeometry(2.35, 24);
  const hitMaterial = new THREE.MeshBasicMaterial({
    transparent: true,
    opacity: 0,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  group.userData.geometry = geometry;
  group.userData.material = material;
  group.userData.hitGeometry = hitGeometry;
  group.userData.hitMaterial = hitMaterial;

  validOwnedStars.forEach((star) => {
    const marker = new THREE.Mesh(geometry, material);
    marker.position.copy(toWorldPosition(star));
    marker.userData.starId = String(star.id);
    marker.renderOrder = 5;
    const hitTarget = new THREE.Mesh(hitGeometry, hitMaterial);
    hitTarget.userData.starId = String(star.id);
    marker.add(hitTarget);
    group.add(marker);
  });
}

function buildProjectedLabels({
  candidates,
  targetStar,
  targetPosition,
  camera,
  viewport,
  quality,
  orbitRadius,
  ownedStarIds,
}) {
  const budget = quality === 'low' ? 5 : quality === 'medium' ? 10 : 16;
  const magnitudeLimit = orbitRadius > 140
    ? 0.7
    : orbitRadius > 90
      ? 1.3
      : orbitRadius > 55
        ? 2.1
        : orbitRadius > 30
          ? 3
          : 4;
  const queue = [];
  const seenStars = new Set();

  if (targetStar) {
    queue.push({
      star: targetStar,
      position: targetPosition.clone(),
      target: true,
      magnitude: -10,
    });
    seenStars.add(String(targetStar.id));
  }

  candidates.forEach((candidate) => {
    const magnitude = Number(candidate.star.mag);
    const id = String(candidate.star.id);
    const owned = ownedStarIds.has(id);
    if (seenStars.has(id) || (!owned && magnitude > magnitudeLimit)) return;
    queue.push({ ...candidate, target: false, magnitude: owned ? -9 : magnitude });
    seenStars.add(id);
  });

  const occupiedCells = new Set();
  const labels = [];
  queue.sort((a, b) => a.magnitude - b.magnitude);
  camera.updateMatrixWorld();

  for (const candidate of queue) {
    if (labels.length >= budget) break;
    const projected = candidate.position.clone().project(camera);
    if (projected.z < -1 || projected.z > 1 || Math.abs(projected.x) > 1 || Math.abs(projected.y) > 1) continue;
    const screenX = (projected.x * 0.5 + 0.5) * viewport.width;
    const screenY = (-projected.y * 0.5 + 0.5) * viewport.height;
    if (screenX < 16 || screenX > viewport.width - 16 || screenY < 54 || screenY > viewport.height - 128) continue;
    if (screenX > viewport.width - 178 && screenY < 148) continue;
    const cell = `${Math.floor(screenX / 104)}:${Math.floor(screenY / 34)}`;
    if (occupiedCells.has(cell)) continue;
    occupiedCells.add(cell);
    labels.push({
      id: String(candidate.star.id),
      name: getStarLabel(candidate.star) || `HIP ${candidate.star.hip || candidate.star.id}`,
      x: THREE.MathUtils.clamp(screenX + 8, 8, viewport.width - 128),
      y: THREE.MathUtils.clamp(screenY - 11, 48, viewport.height - 76),
      target: candidate.target,
      owned: ownedStarIds.has(String(candidate.star.id)),
    });
  }

  return labels;
}

export default function StarSystem3D({
  stars = [],
  targetStar = null,
  ownedStars = [],
  onArrival = null,
  onTargetChange = null,
  onOwnedStarPress = null,
  onReady = null,
  onRenderError = null,
  onTelemetry = null,
  loadedSectorCount = 0,
}) {
  const animationFrameRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const pointsRef = useRef(null);
  const renderedStarsRef = useRef([]);
  const labelCandidatesRef = useRef([]);
  const labelsVisibleRef = useRef(false);
  const galaxyPointsRef = useRef(null);
  const nebulaGroupRef = useRef(null);
  const targetMarkerRef = useRef(null);
  const targetBodyRef = useRef(null);
  const targetGlowRef = useRef(null);
  const ownedMarkersRef = useRef(null);
  const warpGroupRef = useRef(null);
  const warpActiveRef = useRef(false);
  const warpStartedAtRef = useRef(0);
  const warpStartRef = useRef(new THREE.Vector3());
  const warpDestinationRef = useRef(new THREE.Vector3());
  const targetPositionRef = useRef(new THREE.Vector3());
  const cameraFocusRef = useRef(new THREE.Vector3());
  const sectorFocusRef = useRef(targetStar ? toWorldPosition(targetStar) : new THREE.Vector3());
  const targetLockStartedAtRef = useRef(0);
  const targetStarRef = useRef(targetStar);
  const ownedStarsRef = useRef(ownedStars);
  const onReadyRef = useRef(onReady);
  const onRenderErrorRef = useRef(onRenderError);
  const onTelemetryRef = useRef(onTelemetry);
  const ownedStarIdsRef = useRef(new Set(ownedStars.map((star) => String(star.id))));
  const onArrivalRef = useRef(onArrival);
  const onTargetChangeRef = useRef(onTargetChange);
  const onOwnedStarPressRef = useRef(onOwnedStarPress);
  const arrivedRef = useRef(false);
  const arrivalRevealStartedAtRef = useRef(0);
  const sceneModeRef = useRef(targetStar ? SCENE_MODES.sector : SCENE_MODES.galaxy);
  const sceneTransitionRef = useRef({
    active: false,
    startedAt: 0,
    duration: 1150,
    fromMode: sceneModeRef.current,
    toMode: sceneModeRef.current,
    fromPosition: new THREE.Vector3(),
    toPosition: new THREE.Vector3(),
    fromFocus: new THREE.Vector3(),
    toFocus: new THREE.Vector3(),
  });
  const orbitYawRef = useRef(0.55);
  const orbitPitchRef = useRef(0.18);
  const orbitRadiusRef = useRef(targetStar ? DEFAULT_ORBIT_RADIUS : 112);
  const gestureRef = useRef({ x: 0, y: 0, startX: 0, startY: 0, pinchDistance: 0, moved: false });
  const viewportRef = useRef({ width: 1, height: 1 });
  const raycasterRef = useRef(new THREE.Raycaster());
  const qualityRef = useRef(getInitialQuality());
  const qualityRecoveryRef = useRef(0);
  const mountedRef = useRef(true);
  const [quality, setQuality] = useState(qualityRef.current);
  const [fps, setFps] = useState(0);
  const [warpActive, setWarpActive] = useState(false);
  const [warpOwned, setWarpOwned] = useState(false);
  const [sceneMode, setSceneMode] = useState(sceneModeRef.current);
  const [lockedTarget, setLockedTarget] = useState(targetStar);
  const [visibleLabels, setVisibleLabels] = useState([]);

  useEffect(() => {
    onReadyRef.current = onReady;
    onRenderErrorRef.current = onRenderError;
    onTelemetryRef.current = onTelemetry;
  }, [onReady, onRenderError, onTelemetry]);

  useEffect(() => {
    ownedStarsRef.current = ownedStars;
    ownedStarIdsRef.current = new Set(ownedStars.map((star) => String(star.id)));
    labelCandidatesRef.current = buildLabelCandidates(
      renderedStarsRef.current,
      ownedStarIdsRef.current,
    );
    syncOwnedMarkers(ownedMarkersRef.current, ownedStars);
  }, [ownedStars]);

  useEffect(() => {
    const points = pointsRef.current;
    if (!points) return;
    const validStars = getRenderableSectorStars(stars);
    const nextGeometry = createSectorStarGeometry(validStars);
    nextGeometry.setDrawRange(0, Math.min(validStars.length, QUALITY_LIMITS[qualityRef.current]));
    const previousGeometry = points.geometry;
    points.geometry = nextGeometry;
    previousGeometry?.dispose();
    renderedStarsRef.current = validStars;
    labelCandidatesRef.current = buildLabelCandidates(validStars, ownedStarIdsRef.current);
  }, [stars]);

  useEffect(() => {
    const previousMode = sceneModeRef.current;
    targetStarRef.current = targetStar;
    setLockedTarget(targetStar || null);
    arrivedRef.current = false;
    if (sceneModeRef.current === SCENE_MODES.target) {
      sceneModeRef.current = SCENE_MODES.sector;
      setSceneMode(SCENE_MODES.sector);
      orbitRadiusRef.current = DEFAULT_ORBIT_RADIUS;
    }
    if (!targetStar) {
      sectorFocusRef.current.set(0, 0, 0);
      targetMarkerRef.current && (targetMarkerRef.current.visible = false);
      targetBodyRef.current && (targetBodyRef.current.visible = false);
      targetGlowRef.current && (targetGlowRef.current.visible = false);
      return;
    }

    const position = toWorldPosition(targetStar);
    targetPositionRef.current.copy(position);
    sectorFocusRef.current.copy(position);
    targetLockStartedAtRef.current = Date.now();
    if (cameraRef.current) {
      const transition = sceneTransitionRef.current;
      transition.active = true;
      transition.startedAt = Date.now();
      transition.duration = previousMode === SCENE_MODES.galaxy ? 1150 : 850;
      transition.fromMode = previousMode;
      transition.toMode = SCENE_MODES.sector;
      transition.fromPosition.copy(cameraRef.current.position);
      transition.toPosition.copy(previousMode === SCENE_MODES.sector
        ? cameraRef.current.position
        : getOrbitPosition(
          new THREE.Vector3(),
          DEFAULT_ORBIT_RADIUS,
          orbitYawRef.current,
          0.18,
        ));
      transition.fromFocus.copy(cameraFocusRef.current);
      transition.toFocus.copy(position);
      if (previousMode !== SCENE_MODES.sector) {
        orbitRadiusRef.current = DEFAULT_ORBIT_RADIUS;
        orbitPitchRef.current = 0.18;
      }
      if (previousMode !== SCENE_MODES.sector) {
        sceneModeRef.current = SCENE_MODES.sector;
        setSceneMode(SCENE_MODES.sector);
      }
    }
    if (targetMarkerRef.current) {
      targetMarkerRef.current.position.copy(position);
      targetMarkerRef.current.visible = true;
    }
  }, [targetStar]);

  useEffect(() => {
    onArrivalRef.current = onArrival;
  }, [onArrival]);

  useEffect(() => {
    onTargetChangeRef.current = onTargetChange;
  }, [onTargetChange]);

  useEffect(() => {
    onOwnedStarPressRef.current = onOwnedStarPress;
  }, [onOwnedStarPress]);

  const updateQuality = useCallback((next) => {
    if (next === qualityRef.current) return;
    qualityRef.current = next;
    pointsRef.current?.geometry.setDrawRange(
      0,
      Math.min(pointsRef.current.geometry.attributes.position.count, QUALITY_LIMITS[next]),
    );
    galaxyPointsRef.current?.geometry.setDrawRange(
      0,
      Math.min(galaxyPointsRef.current.geometry.attributes.position.count, GALAXY_LIMITS[next]),
    );
    applyNebulaQuality(nebulaGroupRef.current, next);
    if (mountedRef.current) setQuality(next);
  }, []);

  const onContextCreate = useCallback(async (gl) => {
    disposeScene(sceneRef.current, rendererRef.current);
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);

    const width = gl.drawingBufferWidth;
    const height = gl.drawingBufferHeight;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(67, width / height, 0.08, 50000);
    const renderer = new Renderer({ gl });
    renderer.setSize(width, height);
    renderer.setPixelRatio(1);
    renderer.setClearColor(0x000106, 1);
    sceneRef.current = scene;
    cameraRef.current = camera;
    rendererRef.current = renderer;

    const validStars = getRenderableSectorStars(stars);
    renderedStarsRef.current = validStars;
    labelCandidatesRef.current = buildLabelCandidates(validStars, ownedStarIdsRef.current);
    const starGeometry = createSectorStarGeometry(validStars);
    starGeometry.setDrawRange(0, Math.min(validStars.length, QUALITY_LIMITS[qualityRef.current]));
    const starUniforms = { time: { value: 0 }, layerOpacity: { value: 1 } };
    const starMaterial = new THREE.ShaderMaterial({
      uniforms: starUniforms,
      vertexShader: starVertexShader,
      fragmentShader: starFragmentShader,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const points = new THREE.Points(starGeometry, starMaterial);
    pointsRef.current = points;
    scene.add(points);

    const ownedMarkers = new THREE.Group();
    ownedMarkers.visible = false;
    ownedMarkersRef.current = ownedMarkers;
    syncOwnedMarkers(ownedMarkers, ownedStarsRef.current);
    scene.add(ownedMarkers);

    const galaxyGeometry = createGalaxyGeometry();
    galaxyGeometry.setDrawRange(0, GALAXY_LIMITS[qualityRef.current]);
    const galaxyUniforms = { time: { value: 0 }, layerOpacity: { value: 1 } };
    const galaxyMaterial = new THREE.ShaderMaterial({
      uniforms: galaxyUniforms,
      vertexShader: starVertexShader,
      fragmentShader: starFragmentShader,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const galaxyPoints = new THREE.Points(galaxyGeometry, galaxyMaterial);
    galaxyPoints.rotation.x = -0.12;
    galaxyPointsRef.current = galaxyPoints;
    galaxyPoints.renderOrder = 1;
    scene.add(galaxyPoints);

    const nebulaGroup = createNebulaGroup(qualityRef.current);
    nebulaGroupRef.current = nebulaGroup;
    scene.add(nebulaGroup);

    const markerMaterial = new THREE.MeshBasicMaterial({
      color: 0x00d9ff,
      transparent: true,
      opacity: 0.72,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const targetMarker = new THREE.Mesh(new THREE.TorusGeometry(2.2, 0.055, 8, 64), markerMaterial);
    targetMarker.visible = false;
    targetMarkerRef.current = targetMarker;
    scene.add(targetMarker);

    const targetUniforms = {
      time: { value: 0 },
      reveal: { value: 0 },
      starColor: { value: new THREE.Color(0xffdf80) },
    };
    const targetBody = new THREE.Mesh(
      new THREE.SphereGeometry(2.8, 32, 24),
      new THREE.ShaderMaterial({
        uniforms: targetUniforms,
        vertexShader: targetVertexShader,
        fragmentShader: targetFragmentShader,
        transparent: true,
      }),
    );
    targetBody.visible = false;
    targetBodyRef.current = targetBody;
    scene.add(targetBody);

    const glow = new THREE.Mesh(
      new THREE.SphereGeometry(4.6, 20, 16),
      new THREE.MeshBasicMaterial({
        color: 0xffc35a,
        transparent: true,
        opacity: 0.14,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.BackSide,
      }),
    );
    glow.visible = false;
    targetGlowRef.current = glow;
    scene.add(glow);

    const warpGroup = new THREE.Group();
    warpGroup.add(createWarpSystem(qualityRef.current === 'low' ? 70 : 130));
    warpGroup.visible = false;
    warpGroupRef.current = warpGroup;
    scene.add(warpGroup);

    camera.position.set(0, 18, 92);
    camera.lookAt(0, 0, 0);
    if (targetStarRef.current) {
      const position = toWorldPosition(targetStarRef.current);
      targetPositionRef.current.copy(position);
      targetMarker.position.copy(position);
      targetMarker.visible = true;
    }

    SpaceAudio.initialize();
    let startedAt = Date.now();
    let fpsWindowAt = startedAt;
    let labelsUpdatedAt = 0;
    let frameCount = 0;

    const render = () => {
      animationFrameRef.current = requestAnimationFrame(render);
      const now = Date.now();
      const elapsed = (now - startedAt) / 1000;
      frameCount += 1;
      starUniforms.time.value = elapsed;
      galaxyUniforms.time.value = elapsed * 0.42;
      targetUniforms.time.value = elapsed;
      const activeMode = sceneModeRef.current;
      const sceneTransition = sceneTransitionRef.current;
      let galaxyOpacity = activeMode === SCENE_MODES.galaxy ? 1 : 0;
      let sectorOpacity = activeMode === SCENE_MODES.galaxy ? 0 : 1;
      let transitionControlsCamera = false;

      if (sceneTransition.active && !warpActiveRef.current) {
        const rawProgress = Math.min(1, (now - sceneTransition.startedAt) / sceneTransition.duration);
        const transitionProgress = easeInOutCubic(rawProgress);
        const fromGalaxy = sceneTransition.fromMode === SCENE_MODES.galaxy ? 1 : 0;
        const toGalaxy = sceneTransition.toMode === SCENE_MODES.galaxy ? 1 : 0;
        galaxyOpacity = THREE.MathUtils.lerp(fromGalaxy, toGalaxy, transitionProgress);
        sectorOpacity = 1 - galaxyOpacity;
        camera.position.lerpVectors(
          sceneTransition.fromPosition,
          sceneTransition.toPosition,
          transitionProgress,
        );
        cameraFocusRef.current.lerpVectors(
          sceneTransition.fromFocus,
          sceneTransition.toFocus,
          transitionProgress,
        );
        camera.lookAt(cameraFocusRef.current);
        transitionControlsCamera = true;
        if (rawProgress >= 1) sceneTransition.active = false;
      }

      galaxyUniforms.layerOpacity.value = galaxyOpacity;
      starUniforms.layerOpacity.value = sectorOpacity;
      galaxyPoints.visible = galaxyOpacity > 0.01;
      points.visible = sectorOpacity > 0.01;
      ownedMarkers.visible = activeMode === SCENE_MODES.sector
        && sectorOpacity > 0.1
        && !warpActiveRef.current;
      if (ownedMarkers.visible) {
        const markerPulse = 1 + Math.sin(elapsed * 1.8) * 0.08;
        ownedMarkers.children.forEach((marker) => {
          marker.quaternion.copy(camera.quaternion);
          marker.rotateZ(elapsed * 0.22);
          const markerDistance = camera.position.distanceTo(marker.position);
          marker.scale.setScalar(THREE.MathUtils.clamp(markerDistance / 58, 0.55, 12) * markerPulse);
        });
      }
      galaxyPoints.rotation.y += 0.00016;
      nebulaGroup.visible = galaxyOpacity > 0.01;
      nebulaGroup.rotation.y = galaxyPoints.rotation.y;
      const qualityOpacity = qualityRef.current === 'low' ? 0.58 : qualityRef.current === 'medium' ? 0.82 : 1;
      nebulaGroup.children.forEach((layer) => {
        layer.material.uniforms.time.value = elapsed * 0.34;
        layer.material.uniforms.opacity.value = layer.userData.baseOpacity * galaxyOpacity * qualityOpacity;
      });

      if (warpActiveRef.current && targetStarRef.current) {
        const progress = Math.min(1, (now - warpStartedAtRef.current) / WARP_DURATION_MS);
        const eased = progress < 0.5
          ? 4 * progress * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 3) / 2;
        camera.position.lerpVectors(warpStartRef.current, warpDestinationRef.current, eased);
        camera.lookAt(targetPositionRef.current);
        camera.fov = 67 + Math.sin(progress * Math.PI) * 36;
        camera.updateProjectionMatrix();
        warpGroup.visible = true;
        warpGroup.position.copy(camera.position);
        warpGroup.quaternion.copy(camera.quaternion);
        warpGroup.children[0].position.z += 34;
        if (warpGroup.children[0].position.z > 360) warpGroup.children[0].position.z = -180;

        if (progress >= 1) {
          warpActiveRef.current = false;
          arrivedRef.current = true;
          arrivalRevealStartedAtRef.current = now;
          sceneModeRef.current = SCENE_MODES.target;
          const arrivalOffset = camera.position.clone().sub(targetPositionRef.current);
          const arrivalRadius = Math.max(MIN_ORBIT_RADIUS, arrivalOffset.length());
          orbitRadiusRef.current = arrivalRadius;
          orbitPitchRef.current = Math.asin(THREE.MathUtils.clamp(arrivalOffset.y / arrivalRadius, -1, 1));
          orbitYawRef.current = Math.atan2(arrivalOffset.x, arrivalOffset.z);
          camera.fov = 67;
          camera.updateProjectionMatrix();
          warpGroup.visible = false;
          if (mountedRef.current) {
            setWarpActive(false);
            setSceneMode(SCENE_MODES.target);
          }
          onArrivalRef.current?.(targetStarRef.current);
        }
      } else if (!transitionControlsCamera) {
        const orbitCenter = activeMode === SCENE_MODES.target && arrivedRef.current && targetStarRef.current
          ? targetPositionRef.current
          : new THREE.Vector3(0, 0, 0);
        const focus = activeMode === SCENE_MODES.sector && targetStarRef.current
          ? sectorFocusRef.current
          : orbitCenter;
        camera.position.copy(getOrbitPosition(
          orbitCenter,
          orbitRadiusRef.current,
          orbitYawRef.current,
          orbitPitchRef.current,
        ));
        cameraFocusRef.current.copy(focus);
        camera.lookAt(focus);
      }

      if (targetStarRef.current) {
        targetMarker.visible = activeMode !== SCENE_MODES.galaxy;
        targetMarker.position.copy(targetPositionRef.current);
        targetMarker.quaternion.copy(camera.quaternion);
        targetMarker.rotation.z += 0.005;
        const distanceToTarget = camera.position.distanceTo(targetPositionRef.current);
        const markerScale = THREE.MathUtils.clamp(distanceToTarget / 45, 0.7, 18);
        const lockElapsed = Math.max(0, now - targetLockStartedAtRef.current);
        const lockDecay = 1 - THREE.MathUtils.clamp(lockElapsed / 950, 0, 1);
        const lockPulse = 1 + Math.sin(lockElapsed * 0.045) * 0.2 * lockDecay;
        targetMarker.scale.setScalar(markerScale * lockPulse);
        const showSurface = activeMode === SCENE_MODES.target && arrivedRef.current && distanceToTarget < 45;
        targetBody.visible = showSurface;
        glow.visible = showSurface;
        if (showSurface) {
          const reveal = THREE.MathUtils.clamp((now - arrivalRevealStartedAtRef.current) / 900, 0, 1);
          const easedReveal = easeInOutCubic(reveal);
          targetUniforms.reveal.value = easedReveal;
          targetBody.position.copy(targetPositionRef.current);
          targetBody.scale.setScalar(0.72 + easedReveal * 0.28);
          glow.position.copy(targetPositionRef.current);
          const spectralColor = colorForSpectrum(
            targetStarRef.current.spect || targetStarRef.current.spectralType,
          );
          targetUniforms.starColor.value.set(spectralColor);
          glow.material.color.set(spectralColor);
          glow.material.opacity = 0.14 * easedReveal;
          glow.scale.setScalar(1 + Math.sin(elapsed * 1.4) * 0.025);
          targetMarker.material.opacity = 0.72 * (1 - easedReveal * 0.76);
        } else {
          targetUniforms.reveal.value = 0;
          targetMarker.material.opacity = 0.72;
        }
      }

      if (now - labelsUpdatedAt >= 250) {
        labelsUpdatedAt = now;
        const canShowLabels = activeMode === SCENE_MODES.sector
          && !sceneTransition.active
          && !warpActiveRef.current;
        if (canShowLabels) {
          const labels = buildProjectedLabels({
            candidates: labelCandidatesRef.current,
            targetStar: targetStarRef.current,
            targetPosition: targetPositionRef.current,
            camera,
            viewport: viewportRef.current,
            quality: qualityRef.current,
            orbitRadius: orbitRadiusRef.current,
            ownedStarIds: ownedStarIdsRef.current,
          });
          labelsVisibleRef.current = labels.length > 0;
          if (mountedRef.current) setVisibleLabels(labels);
        } else if (labelsVisibleRef.current) {
          labelsVisibleRef.current = false;
          if (mountedRef.current) setVisibleLabels([]);
        }
      }

      if (now - fpsWindowAt >= 1000) {
        const measuredFps = Math.round((frameCount * 1000) / (now - fpsWindowAt));
        frameCount = 0;
        fpsWindowAt = now;
        if (mountedRef.current) setFps(measuredFps);
        onTelemetryRef.current?.({
          fps: measuredFps,
          quality: qualityRef.current,
          renderedStarCount: validStars.length,
          loadedSectorCount,
        });

        if (measuredFps < 28) {
          qualityRecoveryRef.current = 0;
          updateQuality(nextQuality(qualityRef.current, -1));
        } else if (measuredFps >= 52) {
          qualityRecoveryRef.current += 1;
          if (qualityRecoveryRef.current >= 5) {
            updateQuality(nextQuality(qualityRef.current, 1));
            qualityRecoveryRef.current = 0;
          }
        } else {
          qualityRecoveryRef.current = 0;
        }
      }

      renderer.render(scene, camera);
      gl.endFrameEXP();
    };

    onReadyRef.current?.({ starCount: validStars.length });
    render();
  }, [loadedSectorCount, stars, updateQuality]);

  useEffect(() => () => {
    mountedRef.current = false;
    warpActiveRef.current = false;
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    disposeScene(sceneRef.current, rendererRef.current);
    sceneRef.current = null;
    rendererRef.current = null;
    SpaceAudio.stopAll();
  }, []);

  const beginWarp = () => {
    const camera = cameraRef.current;
    const star = targetStarRef.current;
    if (!camera || !star || warpActiveRef.current) return;

    const certifiedWarp = ownedStarIdsRef.current.has(String(star.id));
    const warpMaterial = warpGroupRef.current?.children?.[0]?.material;
    if (warpMaterial?.uniforms) {
      warpMaterial.uniforms.warpColor.value.set(certifiedWarp ? 0xffc94d : 0x40c7ff);
      warpMaterial.uniforms.certified.value = certifiedWarp ? 1 : 0;
    }
    setWarpOwned(certifiedWarp);

    const targetPosition = toWorldPosition(star);
    const approachDirection = targetPosition.clone().sub(camera.position);
    if (approachDirection.lengthSq() < 0.001) approachDirection.set(0, 0, -1);
    approachDirection.normalize();
    targetPositionRef.current.copy(targetPosition);
    warpStartRef.current.copy(camera.position);
    warpDestinationRef.current.copy(targetPosition).addScaledVector(approachDirection, -18);
    warpStartedAtRef.current = Date.now();
    warpActiveRef.current = true;
    sceneTransitionRef.current.active = false;
    arrivedRef.current = false;
    sceneModeRef.current = SCENE_MODES.sector;
    setSceneMode(SCENE_MODES.sector);
    setWarpActive(true);
    SpaceAudio.playWarp();
  };

  const changeSceneMode = (nextMode) => {
    if (
      warpActiveRef.current
      || sceneTransitionRef.current.active
      || nextMode === sceneModeRef.current
    ) return;
    let nextRadius = DEFAULT_ORBIT_RADIUS;
    let nextPitch = 0.18;
    let nextFocus = nextMode === SCENE_MODES.sector && targetStarRef.current
      ? sectorFocusRef.current.clone()
      : new THREE.Vector3();
    if (nextMode === SCENE_MODES.target) {
      if (!targetStarRef.current) return;
      if (!arrivedRef.current) {
        beginWarp();
        return;
      }
      nextRadius = Math.min(orbitRadiusRef.current, 24);
      nextPitch = orbitPitchRef.current;
      nextFocus = targetPositionRef.current.clone();
    } else if (nextMode === SCENE_MODES.galaxy) {
      nextRadius = 112;
      nextPitch = 0.34;
    }
    const transition = sceneTransitionRef.current;
    transition.active = true;
    transition.startedAt = Date.now();
    transition.duration = 1150;
    transition.fromMode = sceneModeRef.current;
    transition.toMode = nextMode;
    transition.fromPosition.copy(cameraRef.current?.position || new THREE.Vector3(0, 18, 92));
    transition.toPosition.copy(getOrbitPosition(nextFocus, nextRadius, orbitYawRef.current, nextPitch));
    transition.fromFocus.copy(cameraFocusRef.current);
    transition.toFocus.copy(nextFocus);
    orbitRadiusRef.current = nextRadius;
    orbitPitchRef.current = nextPitch;
    sceneModeRef.current = nextMode;
    setSceneMode(nextMode);
  };

  const handleTouchStart = (event) => {
    const touches = event.nativeEvent.touches;
    if (touches.length >= 2) {
      const dx = touches[0].pageX - touches[1].pageX;
      const dy = touches[0].pageY - touches[1].pageY;
      gestureRef.current.pinchDistance = Math.hypot(dx, dy);
      gestureRef.current.moved = true;
      return;
    }
    if (touches[0]) {
      gestureRef.current.x = touches[0].pageX;
      gestureRef.current.y = touches[0].pageY;
      gestureRef.current.startX = touches[0].pageX;
      gestureRef.current.startY = touches[0].pageY;
      gestureRef.current.moved = false;
    }
  };

  const handleTouchMove = (event) => {
    if (warpActiveRef.current) return;
    const touches = event.nativeEvent.touches;
    if (touches.length >= 2) {
      const dx = touches[0].pageX - touches[1].pageX;
      const dy = touches[0].pageY - touches[1].pageY;
      const distance = Math.hypot(dx, dy);
      const previous = gestureRef.current.pinchDistance || distance;
      orbitRadiusRef.current = THREE.MathUtils.clamp(
        orbitRadiusRef.current * (previous / Math.max(1, distance)),
        MIN_ORBIT_RADIUS,
        MAX_ORBIT_RADIUS,
      );
      gestureRef.current.pinchDistance = distance;
      return;
    }
    if (!touches[0]) return;
    const deltaX = touches[0].pageX - gestureRef.current.x;
    const deltaY = touches[0].pageY - gestureRef.current.y;
    const totalX = touches[0].pageX - gestureRef.current.startX;
    const totalY = touches[0].pageY - gestureRef.current.startY;
    if (Math.hypot(totalX, totalY) > 6) gestureRef.current.moved = true;
    orbitYawRef.current -= deltaX * 0.006;
    orbitPitchRef.current = THREE.MathUtils.clamp(
      orbitPitchRef.current + deltaY * 0.006,
      -Math.PI * 0.47,
      Math.PI * 0.47,
    );
    gestureRef.current.x = touches[0].pageX;
    gestureRef.current.y = touches[0].pageY;
  };

  const pickSectorStar = (x, y) => {
    if (
      sceneModeRef.current !== SCENE_MODES.sector
      || sceneTransitionRef.current.active
      || warpActiveRef.current
      || !cameraRef.current
      || !pointsRef.current
    ) return;

    const { width, height } = viewportRef.current;
    const pointer = new THREE.Vector2((x / width) * 2 - 1, -(y / height) * 2 + 1);
    const raycaster = raycasterRef.current;
    raycaster.params.Points.threshold = THREE.MathUtils.clamp(orbitRadiusRef.current * 0.018, 0.75, 3.2);
    raycaster.setFromCamera(pointer, cameraRef.current);

    if (ownedMarkersRef.current?.visible) {
      const ownedIntersection = raycaster.intersectObject(ownedMarkersRef.current, true)[0];
      const ownedId = ownedIntersection?.object?.userData?.starId
        || ownedIntersection?.object?.parent?.userData?.starId;
      const ownedStar = ownedId
        ? ownedStarsRef.current.find((candidate) => String(candidate.id) === String(ownedId))
        : null;
      if (ownedStar) {
        onOwnedStarPressRef.current?.(ownedStar);
        SpaceAudio.triggerImpact();
        return;
      }
    }

    const intersection = raycaster.intersectObject(pointsRef.current, false)[0];
    const star = intersection ? renderedStarsRef.current[intersection.index] : null;
    if (!star) return;

    targetStarRef.current = star;
    targetPositionRef.current.copy(toWorldPosition(star));
    sectorFocusRef.current.copy(targetPositionRef.current);
    targetLockStartedAtRef.current = Date.now();
    arrivedRef.current = false;
    arrivalRevealStartedAtRef.current = 0;
    if (targetMarkerRef.current) {
      targetMarkerRef.current.position.copy(targetPositionRef.current);
      targetMarkerRef.current.visible = true;
    }
    setLockedTarget(star);
    onTargetChangeRef.current?.(star);
    SpaceAudio.triggerImpact();
  };

  const handleTouchEnd = (event) => {
    if (!gestureRef.current.moved && gestureRef.current.pinchDistance === 0) {
      pickSectorStar(event.nativeEvent.locationX, event.nativeEvent.locationY);
    }
    gestureRef.current.pinchDistance = 0;
    gestureRef.current.moved = false;
  };

  const targetDistance = lockedTarget ? getDistanceLightYears(lockedTarget) : null;

  return (
    <View style={styles.container}>
      <View
        style={styles.glView}
        onLayout={(event) => { viewportRef.current = event.nativeEvent.layout; }}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderGrant={handleTouchStart}
        onResponderMove={handleTouchMove}
        onResponderRelease={handleTouchEnd}
        onResponderTerminate={() => { gestureRef.current.pinchDistance = 0; }}
      >
        <GLView
          style={StyleSheet.absoluteFill}
          onContextCreate={(gl) => onContextCreate(gl).catch((error) => onRenderErrorRef.current?.(error))}
        />
      </View>

      <View style={styles.labelLayer} pointerEvents="none">
        {visibleLabels.map((label) => (
          <View
            key={label.id}
            style={[
              styles.starLabel,
              { left: label.x, top: label.y },
              label.owned && styles.starLabelOwned,
              label.target && styles.starLabelTarget,
            ]}
          >
            <View style={[
              styles.starLabelDot,
              label.owned && styles.starLabelDotOwned,
              label.target && styles.starLabelDotTarget,
            ]} />
            <Text style={[
              styles.starLabelText,
              label.owned && styles.starLabelTextOwned,
              label.target && styles.starLabelTextTarget,
            ]} numberOfLines={1}>
              {label.name.toUpperCase()}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.telemetry} pointerEvents="none">
        <Text style={styles.telemetryName} numberOfLines={1}>
          {lockedTarget ? (lockedTarget.properName || lockedTarget.proper || `HIP ${lockedTarget.hip || lockedTarget.id}`) : 'LOCAL_SECTOR'}
        </Text>
        <Text style={styles.telemetryLine}>FPS <Text style={styles.telemetryValue}>{fps || '--'}</Text></Text>
        <Text style={styles.telemetryLine}>QUALITY <Text style={styles.telemetryValue}>{quality.toUpperCase()}</Text></Text>
        <Text style={styles.telemetryLine}>VIEW <Text style={styles.telemetryValue}>{sceneMode.toUpperCase()}</Text></Text>
        <Text style={styles.telemetryLine}>TILES <Text style={styles.telemetryValue}>{loadedSectorCount || '--'}</Text></Text>
        <Text style={styles.telemetryLine}>STARS <Text style={styles.telemetryValue}>{stars.length}</Text></Text>
        {lockedTarget && (
          <>
            <Text style={styles.telemetryLine}>MAG <Text style={styles.telemetryValue}>{Number(lockedTarget.mag).toFixed(2)}</Text></Text>
            <Text style={styles.telemetryLine}>SPECTRUM <Text style={styles.telemetryValue}>{lockedTarget.spect || lockedTarget.spectralType || 'N/A'}</Text></Text>
          </>
        )}
        <Text style={styles.telemetryLine}>
          DISTANCE <Text style={styles.telemetryValue}>{Number.isFinite(targetDistance) ? `${targetDistance.toFixed(2)} LY` : 'UNKNOWN'}</Text>
        </Text>
      </View>

      <View style={styles.controls} pointerEvents="box-none">
        <View style={styles.sceneTabs}>
          <SceneTab label="GALAXY" active={sceneMode === SCENE_MODES.galaxy} onPress={() => changeSceneMode(SCENE_MODES.galaxy)} />
          <SceneTab label="SECTOR" active={sceneMode === SCENE_MODES.sector} onPress={() => changeSceneMode(SCENE_MODES.sector)} />
          <SceneTab label="TARGET" active={sceneMode === SCENE_MODES.target} disabled={!lockedTarget} onPress={() => changeSceneMode(SCENE_MODES.target)} />
        </View>
        {sceneMode === SCENE_MODES.sector && (
          <TouchableOpacity
            style={[
              styles.warpButton,
              lockedTarget && ownedStarIdsRef.current.has(String(lockedTarget.id)) && styles.warpButtonOwned,
              (!lockedTarget || warpActive) && styles.warpButtonDisabled,
            ]}
            disabled={!lockedTarget || warpActive}
            onPress={beginWarp}
          >
            <Text style={[
              styles.warpButtonText,
              lockedTarget && ownedStarIdsRef.current.has(String(lockedTarget.id)) && styles.warpButtonTextOwned,
            ]}>
              {warpActive
                ? warpOwned ? 'CERTIFIED_WARP_ACTIVE' : 'WARP_IN_PROGRESS'
                : lockedTarget
                  ? ownedStarIdsRef.current.has(String(lockedTarget.id)) ? 'ENGAGE_CERTIFIED_WARP' : 'ENGAGE_WARP'
                  : 'SELECT_A_TARGET'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

function SceneTab({ label, active, disabled = false, onPress }) {
  return (
    <TouchableOpacity
      style={[styles.sceneTab, active && styles.sceneTabActive, disabled && styles.sceneTabDisabled]}
      disabled={disabled}
      onPress={onPress}
    >
      <Text style={[styles.sceneTabText, active && styles.sceneTabTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000106' },
  glView: { flex: 1 },
  labelLayer: { ...StyleSheet.absoluteFillObject },
  starLabel: {
    position: 'absolute',
    width: 120,
    height: 22,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    opacity: 0.72,
  },
  starLabelTarget: { opacity: 1 },
  starLabelOwned: { opacity: 1 },
  starLabelDot: { width: 3, height: 3, borderRadius: 2, backgroundColor: 'rgba(180,205,255,0.82)' },
  starLabelDotOwned: { width: 5, height: 5, backgroundColor: '#ffcf57' },
  starLabelDotTarget: { width: 5, height: 5, backgroundColor: THEME.colors.primary },
  starLabelText: { flex: 1, color: 'rgba(215,228,255,0.76)', fontSize: 8, fontWeight: '800' },
  starLabelTextOwned: { color: '#ffcf57', fontSize: 9, fontWeight: '900' },
  starLabelTextTarget: { color: THEME.colors.primary, fontSize: 9, fontWeight: '900' },
  telemetry: {
    position: 'absolute',
    top: 18,
    right: 18,
    minWidth: 132,
    padding: 12,
    backgroundColor: 'rgba(3, 9, 18, 0.76)',
    borderWidth: 1,
    borderColor: 'rgba(0, 217, 255, 0.22)',
    borderRadius: 8,
  },
  telemetryName: { color: '#fff', fontSize: 11, fontWeight: '800', marginBottom: 8 },
  telemetryLine: { color: 'rgba(255,255,255,0.48)', fontSize: 9, fontWeight: '700', marginTop: 3 },
  telemetryValue: { color: THEME.colors.primary },
  controls: { position: 'absolute', left: 0, right: 0, bottom: 24, alignItems: 'center', gap: 10 },
  sceneTabs: {
    width: 276,
    height: 38,
    padding: 3,
    flexDirection: 'row',
    borderRadius: 7,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(3, 9, 18, 0.82)',
  },
  sceneTab: { flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 4 },
  sceneTabActive: { backgroundColor: 'rgba(0, 217, 255, 0.14)' },
  sceneTabDisabled: { opacity: 0.3 },
  sceneTabText: { color: 'rgba(255,255,255,0.42)', fontSize: 9, fontWeight: '900' },
  sceneTabTextActive: { color: THEME.colors.primary },
  warpButton: {
    minWidth: 190,
    minHeight: 46,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: THEME.colors.primary,
    backgroundColor: 'rgba(0, 217, 255, 0.1)',
  },
  warpButtonDisabled: { opacity: 0.42 },
  warpButtonOwned: { borderColor: '#ffcf57', backgroundColor: 'rgba(255, 207, 87, 0.1)' },
  warpButtonText: { color: THEME.colors.primary, fontSize: 10, fontWeight: '900' },
  warpButtonTextOwned: { color: '#ffcf57' },
});
