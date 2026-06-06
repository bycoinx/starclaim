import { Suspense, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { OrbitControls } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import CameraRig from './CameraRig';

function GalaxyDemoStars({ count = 9000 }) {
  const geometry = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);

    const getStarColor = () => {
      const p = Math.random();
      let h, s, l;
      if (p < 0.02) { h = 0.61; s = 0.92; l = 0.84; } // O / B
      else if (p < 0.12) { h = 0.58; s = 0.80; l = 0.87; } // A
      else if (p < 0.25) { h = 0.55; s = 0.68; l = 0.88; } // F
      else if (p < 0.45) { h = 0.53; s = 0.50; l = 0.88; } // G
      else if (p < 0.70) { h = 0.10; s = 0.70; l = 0.84; } // K
      else { h = 0.04; s = 0.84; l = 0.78; } // M
      return new THREE.Color().setHSL(h + (Math.random() - 0.5) * 0.02, s - Math.random() * 0.12, l - Math.random() * 0.14);
    };

    const spiralArm = (armId, t) => {
      const armOffset = (Math.random() - 0.5) * 0.16;
      const radius = 20 + Math.pow((t + 0.5) * 18, 1.03);
      const theta = armId * (Math.PI / 2) + t + armOffset + (Math.random() - 0.5) * 0.2;
      return { x: Math.cos(theta) * radius, z: Math.sin(theta) * radius, theta, radius };
    };

    const haloPoint = () => {
      const u = Math.random();
      const r = 190 + Math.pow(u, 0.25) * 80;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      return {
        x: Math.sin(phi) * Math.cos(theta) * r,
        y: Math.sin(phi) * Math.sin(theta) * r,
        z: Math.cos(phi) * r,
      };
    };

    for (let i = 0; i < count; i++) {
      const population = Math.random();
      let x, y, z;
      let size = 1.4 + Math.random() * 4.6;

      if (population < 0.16) {
        // Bulge
        const r = Math.pow(Math.random(), 0.5) * 24;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        x = Math.sin(phi) * Math.cos(theta) * r;
        y = Math.sin(phi) * Math.sin(theta) * r * 0.65;
        z = Math.cos(phi) * r;
        size *= 1.1;
      } else if (population < 0.88) {
        // Disk + spiral arms
        if (Math.random() < 0.75) {
          const arm = spiralArm(Math.floor(Math.random() * 4), Math.random() * 5.2);
          x = arm.x + (Math.random() - 0.5) * 8;
          z = arm.z + (Math.random() - 0.5) * 8;
          y = (Math.random() - 0.5) * (1.5 + arm.radius * 0.03);
          size *= 1.05;
        } else {
          const radius = 25 + Math.pow(Math.random(), 0.4) * 130;
          const angle = Math.random() * Math.PI * 2;
          x = Math.cos(angle) * radius;
          z = Math.sin(angle) * radius;
          y = (Math.random() - 0.5) * 3.2 * (1 - radius / 180);
        }
      } else {
        const p = haloPoint();
        x = p.x; y = p.y; z = p.z;
        size *= 0.5;
      }

      const color = getStarColor();
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
      sizes[i] = size;
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
      ref.current.rotation.y = clock.getElapsedTime() * 0.0022;
      ref.current.rotation.x = Math.sin(clock.getElapsedTime() * 0.06) * 0.002;
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
             gl_PointSize = size * clamp(190.0 / -mvPosition.z, 0.3, 36.0);
             gl_Position = projectionMatrix * mvPosition;
           }`
        }
        fragmentShader={
          `varying vec3 vColor;
           void main() {
             vec2 coord = gl_PointCoord - vec2(0.5);
             float dist = length(coord);
             if (dist > 0.6) discard;
             float alpha = smoothstep(0.6, 0.08, dist);
             alpha *= 1.0 - dist * 0.78;
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
  const geometry = useMemo(() => new THREE.RingGeometry(26, 170, 320, 1), []);
  return (
    <mesh geometry={geometry} rotation={[Math.PI / 2, 0.1, 0]} position={[0, 0, 0]}>
      <shaderMaterial
        transparent
        side={THREE.DoubleSide}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        vertexShader={
          `varying vec2 vUv;
           void main() {
             vUv = uv;
             gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
           }`
        }
        fragmentShader={
          `varying vec2 vUv;
           void main() {
             vec2 uv = vUv - vec2(0.5);
             float dist = length(uv);
             float band = smoothstep(0.42, 0.38, dist) * (1.0 - smoothstep(0.48, 0.52, dist));
             float glow = smoothstep(0.35, 0.28, dist) * 0.2;
             vec3 base = mix(vec3(0.02, 0.03, 0.08), vec3(0.08, 0.06, 0.16), 1.0 - dist);
             vec3 color = base + vec3(0.18, 0.12, 0.22) * band;
             float alpha = band * 0.32 + glow * 0.06;
             gl_FragColor = vec4(color, alpha);
           }`
        }
      />
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
             float band = pow(max(0.0, dot(dir, vec3(0.0, 0.08, 1.0))), 13.0);
             float detail = noise(dir * 18.0 + vec3(0.0, time * 0.025, 0.0));
             float plane = smoothstep(0.05, 0.28, abs(dir.y) * 1.16 + detail * 0.22);
             float glow = smoothstep(0.20, 0.72, detail + band * 1.1);
             vec3 color = mix(vec3(0.01, 0.02, 0.05), vec3(0.08, 0.07, 0.16), band);
             vec3 dust = mix(vec3(0.03, 0.025, 0.05), vec3(0.09, 0.08, 0.13), band);
             color = mix(color * 0.62, dust, plane);
             color += vec3(0.16, 0.11, 0.18) * glow * 0.9;
             float alpha = pow(glow, 1.5) * 0.42 + band * 0.09;
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
