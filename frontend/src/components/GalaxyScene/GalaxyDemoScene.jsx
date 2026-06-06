import { Suspense, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { OrbitControls } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import CameraRig from './CameraRig';

function GalaxyDemoStars({ count = 5400 }) {
  const geometry = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const radius = Math.pow(Math.random(), 0.58) * 140 + 10;
      const angle = Math.random() * Math.PI * 2;
      const height = (Math.random() - 0.5) * 16 * (1 - Math.pow(radius / 160, 2));
      const x = Math.cos(angle) * radius;
      const y = height;
      const z = Math.sin(angle) * radius;

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      const hue = 0.54 + (Math.random() - 0.5) * 0.1;
      const saturation = 0.5 + Math.random() * 0.3;
      const lightness = 0.75 + Math.random() * 0.2;
      const color = new THREE.Color().setHSL(hue, saturation, lightness);

      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
      sizes[i] = 1.6 + Math.random() * 4.1;
    }

    const bufferGeometry = new THREE.BufferGeometry();
    bufferGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    bufferGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    bufferGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    return bufferGeometry;
  }, [count]);

  const ref = useRef();

  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.rotation.y = clock.getElapsedTime() * 0.0025;
      ref.current.rotation.x = Math.sin(clock.getElapsedTime() * 0.08) * 0.003;
    }
  });

  return (
    <points ref={ref} geometry={geometry}>
      <shaderMaterial
        vertexColors
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        vertexShader={
          `attribute float size;
           varying vec3 vColor;
           void main() {
             vColor = color;
             vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
             gl_PointSize = size * clamp(170.0 / -mvPosition.z, 0.4, 28.0);
             gl_Position = projectionMatrix * mvPosition;
           }`
        }
        fragmentShader={
          `varying vec3 vColor;
           void main() {
             vec2 coord = gl_PointCoord - vec2(0.5);
             float dist = length(coord);
             if (dist > 0.55) discard;
             float alpha = smoothstep(0.55, 0.06, dist);
             alpha *= 1.0 - dist * 0.85;
             gl_FragColor = vec4(vColor, alpha);
           }`
        }
      />
    </points>
  );
}

function DistantStarfield({ count = 1600 }) {
  const geometry = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 380 + Math.random() * 30;
      positions[i * 3] = Math.sin(phi) * Math.cos(theta) * r;
      positions[i * 3 + 1] = Math.sin(phi) * Math.sin(theta) * r;
      positions[i * 3 + 2] = Math.cos(phi) * r;
      colors[i * 3] = 0.85 + Math.random() * 0.12;
      colors[i * 3 + 1] = 0.88 + Math.random() * 0.08;
      colors[i * 3 + 2] = 0.95;
      sizes[i] = 0.9 + Math.random() * 1.2;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    return geometry;
  }, [count]);

  return (
    <points geometry={geometry}>
      <shaderMaterial
        vertexColors
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        vertexShader={
          `attribute float size;
           varying vec3 vColor;
           void main() {
             vColor = color;
             vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
             gl_PointSize = size * clamp(180.0 / -mvPosition.z, 0.15, 22.0);
             gl_Position = projectionMatrix * mvPosition;
           }`
        }
        fragmentShader={
          `varying vec3 vColor;
           void main() {
             float alpha = 1.0 - length(gl_PointCoord - vec2(0.5));
             gl_FragColor = vec4(vColor, alpha * 0.65);
           }`
        }
      />
    </points>
  );
}

function GalaxyGrid() {
  const lines = useMemo(() => {
    const positions = [];
    const radius = 165;
    for (let ring = 0; ring < 6; ring++) {
      const currentRadius = 20 + ring * 22;
      const segments = 120;
      for (let i = 0; i < segments; i++) {
        const theta = (i / segments) * Math.PI * 2;
        const x = Math.cos(theta) * currentRadius;
        const z = Math.sin(theta) * currentRadius;
        positions.push(x, -1.5, z);
        const nextTheta = ((i + 1) / segments) * Math.PI * 2;
        const nx = Math.cos(nextTheta) * currentRadius;
        const nz = Math.sin(nextTheta) * currentRadius;
        positions.push(nx, -1.5, nz);
      }
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    return geometry;
  }, []);

  return (
    <lineSegments geometry={lines}>
      <lineBasicMaterial color="#3d5f9f" transparent opacity={0.14} />
    </lineSegments>
  );
}

function CoreGlow() {
  return (
    <group>
      <mesh>
        <sphereGeometry args={[8.8, 32, 32]} />
        <meshBasicMaterial color="#fff3c5" transparent opacity={0.28} />
      </mesh>
      <mesh>
        <sphereGeometry args={[16, 32, 32]} />
        <meshBasicMaterial color="#ffd7a2" transparent opacity={0.16} />
      </mesh>
      <mesh>
        <torusGeometry args={[18, 2.6, 16, 128]} />
        <meshBasicMaterial color="#f7d79d" transparent opacity={0.08} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
    </group>
  );
}

function MilkyWayBand() {
  const geometry = useMemo(() => new THREE.TorusGeometry(120, 12, 120, 320, Math.PI * 1.88), []);
  return (
    <mesh geometry={geometry} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
      <meshBasicMaterial color="#6b9cff" transparent opacity={0.14} side={THREE.DoubleSide} depthWrite={false} />
    </mesh>
  );
}

function NebulaSphere() {
  const meshRef = useRef();
  const uniforms = useMemo(() => ({ time: { value: 0 } }), []);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.material.uniforms.time.value = state.clock.getElapsedTime();
    }
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[250, 64, 64]} />
      <shaderMaterial
        transparent
        side={THREE.BackSide}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        uniforms={uniforms}
        vertexShader={
          `varying vec3 vWorldPosition;
           void main() {
             vec4 worldPosition = modelMatrix * vec4(position, 1.0);
             vWorldPosition = worldPosition.xyz;
             gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
           }`
        }
        fragmentShader={
          `uniform float time;
           varying vec3 vWorldPosition;

           float hash(vec3 p) {
             return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453123);
           }

           float noise(vec3 p) {
             vec3 i = floor(p);
             vec3 f = fract(p);
             f = f * f * (3.0 - 2.0 * f);
             float n = mix(mix(mix(hash(i + vec3(0.0,0.0,0.0)), hash(i + vec3(1.0,0.0,0.0)), f.x),
                               mix(hash(i + vec3(0.0,1.0,0.0)), hash(i + vec3(1.0,1.0,0.0)), f.x), f.y),
                           mix(mix(hash(i + vec3(0.0,0.0,1.0)), hash(i + vec3(1.0,0.0,1.0)), f.x),
                               mix(hash(i + vec3(0.0,1.0,1.0)), hash(i + vec3(1.0,1.0,1.0)), f.x), f.y), f.z);
             return n;
           }

           void main() {
             vec3 dir = normalize(vWorldPosition);
             float band = pow(max(0.0, dot(dir, vec3(0.0, 0.1, 1.0))), 12.0);
             float detail = noise(dir * 16.0 + vec3(0.0, time * 0.02, 0.0));
             float glow = smoothstep(0.2, 0.75, detail + band * 1.2);
             vec3 color = mix(vec3(0.02, 0.03, 0.08), vec3(0.07, 0.06, 0.16), band);
             color += vec3(0.18, 0.14, 0.22) * glow * 0.9;
             float alpha = pow(glow, 1.4) * 0.45;
             gl_FragColor = vec4(color, alpha);
           }`
        }
      />
    </mesh>
  );
}

function GalacticCore() {
  return (
    <mesh>
      <sphereGeometry args={[10, 32, 32]} />
      <meshStandardMaterial emissive="#fff1d0" emissiveIntensity={3.5} color="#fff4d8" transparent opacity={0.95} />
    </mesh>
  );
}

export default function GalaxyDemoScene() {
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <div style={{ position: 'absolute', top: 14, left: 14, zIndex: 20, padding: '12px 16px', background: 'rgba(2,8,20,0.75)', color: '#d8e6ff', borderRadius: 12, maxWidth: 320, fontSize: 12, lineHeight: 1.45, border: '1px solid rgba(120,170,255,0.12)' }}>
        <div style={{ fontWeight: 700, marginBottom: 8 }}>Milky Way Demo</div>
        <div>Web demo is view-only. Star catalog ve satın alma akışı Marketplace üzerinden devam eder.</div>
      </div>
      <Canvas camera={{ position: [0, 35, 120], fov: 58, near: 0.1, far: 800 }} gl={{ antialias: true, logarithmicDepthBuffer: true }} style={{ width: '100%', height: '100%' }}>
        <Suspense fallback={null}>
          <color attach="background" args={["#030812"]} />
          <fog attach="fog" args={["#02030c", 40, 260]} />
          <ambientLight intensity={0.28} />
          <pointLight position={[0, 0, 0]} intensity={1.8} distance={190} color="#fff9dd" />
          <GalaxyDemoStars />
          <DistantStarfield />
          <MilkyWayBand />
          <CoreGlow />
          <GalacticCore />
          <GalaxyGrid />
          <NebulaSphere />
          <CameraRig enableCinematic={true} />
          <OrbitControls enablePan enableZoom enableRotate zoomSpeed={0.8} minDistance={40} maxDistance={250} makeDefault />
          <EffectComposer multisampling={4}>
            <Bloom luminanceThreshold={0.24} luminanceSmoothing={0.82} intensity={1.35} />
          </EffectComposer>
        </Suspense>
      </Canvas>
    </div>
  );
}
