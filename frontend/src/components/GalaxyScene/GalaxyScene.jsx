import { Suspense, useMemo, useRef } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { Html, OrbitControls } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';

const PLANETS = [
  { name: 'MERCURY', orbit: 18, size: 0.65, speed: 0.52, color: '#b9b3aa', tex: '/tex/mercury.jpg' },
  { name: 'VENUS', orbit: 28, size: 1.0, speed: 0.38, color: '#dfbd7c', tex: '/tex/venus.jpg' },
  { name: 'EARTH', orbit: 39, size: 1.08, speed: 0.31, color: '#4e9fe6', tex: '/tex/earth.jpg', atmosphere: '#6fb7ff' },
  { name: 'MARS', orbit: 52, size: 0.82, speed: 0.25, color: '#d56f48', tex: '/tex/mars.jpg' },
  { name: 'JUPITER', orbit: 92, size: 3.4, speed: 0.13, color: '#d7a77e', tex: '/tex/jupiter.jpg' },
  { name: 'SATURN', orbit: 128, size: 3.0, speed: 0.09, color: '#d7c186', tex: '/tex/saturn.jpg', rings: true },
  { name: 'URANUS', orbit: 166, size: 1.75, speed: 0.065, color: '#99dce0', tex: '/tex/uranus.jpg' },
  { name: 'NEPTUNE', orbit: 202, size: 1.72, speed: 0.048, color: '#5d78ff', tex: '/tex/neptune.jpg' },
];

const STAR_VERTEX_SHADER = `
  attribute float size;
  attribute float phase;
  varying vec3 vColor;
  varying float vAlpha;
  uniform float uTime;

  void main() {
    vColor = color;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    float depthScale = clamp(180.0 / -mvPosition.z, 0.22, 9.0);
    float pulse = 0.72 + 0.28 * sin(uTime * 0.85 + phase);
    gl_PointSize = size * depthScale * pulse;
    vAlpha = clamp(depthScale * 0.42, 0.18, 1.0);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const STAR_FRAGMENT_SHADER = `
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    vec2 uv = gl_PointCoord - vec2(0.5);
    float d = length(uv);
    if (d > 0.5) discard;
    float core = smoothstep(0.18, 0.0, d);
    float halo = smoothstep(0.5, 0.04, d) * 0.42;
    float alpha = (core + halo) * vAlpha;
    gl_FragColor = vec4(vColor * (1.05 + core * 0.9), alpha);
  }
`;

function seededRandom(seed) {
  let value = seed % 2147483647;
  return () => {
    value = (value * 16807) % 2147483647;
    return (value - 1) / 2147483646;
  };
}

function spectralColor(rand, bias = 0) {
  const p = rand() + bias;
  if (p < 0.05) return new THREE.Color('#8fb3ff');
  if (p < 0.18) return new THREE.Color('#b9ccff');
  if (p < 0.42) return new THREE.Color('#f7fbff');
  if (p < 0.68) return new THREE.Color('#fff1bf');
  if (p < 0.86) return new THREE.Color('#ffd08d');
  return new THREE.Color('#ff8f6c');
}

function PremiumStarField({ count = 32000 }) {
  const materialRef = useRef();
  const groupRef = useRef();

  const geometry = useMemo(() => {
    const rand = seededRandom(90210);
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const phases = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const layer = rand();
      const theta = rand() * Math.PI * 2;
      const phi = Math.acos(2 * rand() - 1);
      const radius = layer < 0.72
        ? 420 + Math.pow(rand(), 0.42) * 520
        : 130 + Math.pow(rand(), 0.55) * 380;
      const diskBias = layer > 0.72 ? 0.18 : 1;

      let x = Math.sin(phi) * Math.cos(theta) * radius;
      let y = Math.sin(phi) * Math.sin(theta) * radius * diskBias;
      let z = Math.cos(phi) * radius;

      if (layer > 0.72) {
        const arm = Math.floor(rand() * 4) * (Math.PI / 2);
        const spiral = radius * 0.018 + arm;
        x = Math.cos(theta + spiral) * radius + (rand() - 0.5) * 36;
        z = Math.sin(theta + spiral) * radius + (rand() - 0.5) * 36;
        y += (rand() - 0.5) * 12;
      }

      const color = spectralColor(rand, layer > 0.72 ? -0.08 : 0);
      const sparkle = rand() > 0.965 ? 2.3 : 1;
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
      sizes[i] = (1.8 + Math.pow(rand(), 2.4) * 7.5) * sparkle;
      phases[i] = rand() * Math.PI * 2;
    }

    const bufferGeometry = new THREE.BufferGeometry();
    bufferGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    bufferGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    bufferGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    bufferGeometry.setAttribute('phase', new THREE.BufferAttribute(phases, 1));
    return bufferGeometry;
  }, [count]);

  useFrame(({ clock }) => {
    if (materialRef.current) materialRef.current.uniforms.uTime.value = clock.elapsedTime;
    if (groupRef.current) groupRef.current.rotation.y = clock.elapsedTime * 0.004;
  });

  return (
    <points ref={groupRef} geometry={geometry}>
      <shaderMaterial
        ref={materialRef}
        vertexColors
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        uniforms={{ uTime: { value: 0 } }}
        vertexShader={STAR_VERTEX_SHADER}
        fragmentShader={STAR_FRAGMENT_SHADER}
      />
    </points>
  );
}

function OrbitLine({ radius }) {
  const points = useMemo(() => {
    const values = [];
    for (let i = 0; i <= 192; i++) {
      const a = (i / 192) * Math.PI * 2;
      values.push(Math.cos(a) * radius, 0, Math.sin(a) * radius);
    }
    return new Float32Array(values);
  }, [radius]);

  return (
    <line>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={points.length / 3} array={points} itemSize={3} />
      </bufferGeometry>
      <lineBasicMaterial color="#b7c7df" transparent opacity={0.13} />
    </line>
  );
}

function Planet({ planet, index }) {
  const groupRef = useRef();
  const texture = useLoader(THREE.TextureLoader, planet.tex);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime * planet.speed + index * 0.82;
    const ellipse = 1 - index * 0.012;
    groupRef.current.position.set(
      Math.cos(t) * planet.orbit,
      Math.sin(t * 0.37) * 1.6,
      Math.sin(t) * planet.orbit * ellipse,
    );
    groupRef.current.rotation.y += 0.006;
  });

  return (
    <group ref={groupRef}>
      <mesh>
        <sphereGeometry args={[planet.size, 40, 40]} />
        <meshStandardMaterial map={texture} color={planet.color} roughness={0.82} metalness={0.05} />
      </mesh>
      {planet.atmosphere && (
        <mesh scale={[1.12, 1.12, 1.12]}>
          <sphereGeometry args={[planet.size, 32, 32]} />
          <meshBasicMaterial color={planet.atmosphere} transparent opacity={0.16} side={THREE.BackSide} />
        </mesh>
      )}
      {planet.rings && (
        <mesh rotation={[Math.PI / 2.65, 0, 0]}>
          <ringGeometry args={[planet.size * 1.55, planet.size * 2.65, 96]} />
          <meshBasicMaterial color="#d8c891" transparent opacity={0.42} side={THREE.DoubleSide} />
        </mesh>
      )}
    </group>
  );
}

function AsteroidBelt({ count = 1800 }) {
  const geometry = useMemo(() => {
    const rand = seededRandom(3047);
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const radius = 66 + rand() * 12;
      const angle = rand() * Math.PI * 2;
      const color = new THREE.Color(rand() > 0.84 ? '#d8c79a' : '#6d7480');
      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = (rand() - 0.5) * 5;
      positions[i * 3 + 2] = Math.sin(angle) * radius;
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }

    const bufferGeometry = new THREE.BufferGeometry();
    bufferGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    bufferGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return bufferGeometry;
  }, [count]);

  return (
    <points geometry={geometry}>
      <pointsMaterial vertexColors size={0.65} transparent opacity={0.46} depthWrite={false} />
    </points>
  );
}

function Sun() {
  const ref = useRef();
  const texture = useLoader(THREE.TextureLoader, '/tex/sun.jpg');

  useFrame(({ clock }) => {
    if (ref.current) ref.current.rotation.y = clock.elapsedTime * 0.035;
  });

  return (
    <group>
      <mesh ref={ref}>
        <sphereGeometry args={[8.5, 64, 64]} />
        <meshBasicMaterial map={texture} color="#ffe26a" />
      </mesh>
      <mesh>
        <sphereGeometry args={[14, 48, 48]} />
        <meshBasicMaterial color="#ffbf37" transparent opacity={0.13} side={THREE.BackSide} />
      </mesh>
      <pointLight color="#ffd16a" intensity={7} distance={520} decay={1.8} />
    </group>
  );
}

function MobileSignal() {
  return (
    <Html position={[92, 52, -92]} transform distanceFactor={24} occlude>
      <div className="w-44 border border-sc-gold/25 bg-black/45 px-4 py-3 text-left shadow-[0_0_30px_rgba(214,177,82,0.14)] backdrop-blur-md">
        <div className="mb-1 text-[8px] font-black uppercase tracking-[0.28em] text-sc-gold">Mobile Cockpit</div>
        <div className="text-[10px] font-mono uppercase leading-relaxed text-white/70">
          2D Sky Map / 3D Star Voyage
        </div>
      </div>
    </Html>
  );
}

function SceneRig() {
  const groupRef = useRef();

  useFrame(({ clock }) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(clock.elapsedTime * 0.05) * 0.035;
      groupRef.current.rotation.x = -0.12 + Math.sin(clock.elapsedTime * 0.04) * 0.015;
    }
  });

  return (
    <group ref={groupRef}>
      <PremiumStarField />
      <Sun />
      <AsteroidBelt />
      {PLANETS.map((planet, index) => (
        <group key={planet.name}>
          <OrbitLine radius={planet.orbit} />
          <Planet planet={planet} index={index} />
        </group>
      ))}
      <MobileSignal />
    </group>
  );
}

export default function GalaxyScene() {
  return (
    <div style={{ width: '100%', height: '100vh', background: '#000', position: 'relative' }}>
      <Canvas
        camera={{ position: [150, 90, 250], fov: 42, near: 0.1, far: 3000 }}
        gl={{ antialias: true, logarithmicDepthBuffer: true, powerPreference: 'high-performance' }}
        dpr={[1, 1.5]}
      >
        <Suspense fallback={null}>
          <color attach="background" args={['#010207']} />
          <fog attach="fog" args={['#010207', 360, 1180]} />
          <ambientLight intensity={0.22} />
          <SceneRig />
          <OrbitControls
            enablePan={false}
            enableDamping
            dampingFactor={0.045}
            rotateSpeed={0.34}
            zoomSpeed={0.62}
            minDistance={74}
            maxDistance={660}
            target={[0, 0, 0]}
            makeDefault
          />
          <EffectComposer multisampling={2}>
            <Bloom luminanceThreshold={0.08} luminanceSmoothing={0.78} intensity={1.28} radius={0.72} />
            <Vignette eskil={false} offset={0.18} darkness={0.72} />
          </EffectComposer>
        </Suspense>
      </Canvas>
    </div>
  );
}
