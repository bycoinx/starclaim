import { Suspense, useMemo, useRef } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { Html, OrbitControls } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';

const PLANETS = [
  { name: 'MERCURY', orbit: 18, size: 0.65, speed: 0.085, inclination: 7.0, node: 48.3, color: '#b9b3aa', tex: '/tex/mercury.jpg' },
  { name: 'VENUS', orbit: 28, size: 1.0, speed: 0.062, inclination: 3.4, node: 76.7, color: '#dfbd7c', tex: '/tex/venus.jpg' },
  { name: 'EARTH', orbit: 39, size: 1.2, speed: 0.05, inclination: 0.0, node: 0, color: '#ffffff', tex: '/tex/earth.jpg', earth: true },
  { name: 'MARS', orbit: 52, size: 0.82, speed: 0.041, inclination: 1.8, node: 49.6, color: '#d56f48', tex: '/tex/mars.jpg' },
  { name: 'JUPITER', orbit: 92, size: 3.4, speed: 0.022, inclination: 1.3, node: 100.5, color: '#ffffff', tex: '/tex/jupiter.jpg' },
  { name: 'SATURN', orbit: 128, size: 3.0, speed: 0.015, inclination: 2.5, node: 113.7, color: '#ffffff', tex: '/tex/saturn.jpg', rings: true },
  { name: 'URANUS', orbit: 166, size: 1.75, speed: 0.011, inclination: 0.8, node: 74.0, color: '#ffffff', tex: '/tex/uranus.jpg' },
  { name: 'NEPTUNE', orbit: 202, size: 1.72, speed: 0.008, inclination: 1.8, node: 131.8, color: '#ffffff', tex: '/tex/neptune.jpg' },
  { name: 'PLUTO', orbit: 238, size: 0.48, speed: 0.005, inclination: 17.0, node: 110.3, color: '#c6b9a6', tex: '/tex/moon.jpg' },
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

function Atmosphere({ size, color = '#73b8ff' }) {
  return (
    <mesh scale={[1.09, 1.09, 1.09]}>
      <sphereGeometry args={[size, 48, 48]} />
      <shaderMaterial
        transparent
        side={THREE.BackSide}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        uniforms={{ glowColor: { value: new THREE.Color(color) } }}
        vertexShader={`
          varying vec3 vNormal;
          varying vec3 vPositionNormal;
          void main() {
            vNormal = normalize(normalMatrix * normal);
            vPositionNormal = normalize((modelViewMatrix * vec4(position, 1.0)).xyz);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
        fragmentShader={`
          uniform vec3 glowColor;
          varying vec3 vNormal;
          varying vec3 vPositionNormal;
          void main() {
            float intensity = pow(0.72 - dot(vNormal, vPositionNormal), 2.4);
            gl_FragColor = vec4(glowColor, intensity * 0.78);
          }
        `}
      />
    </mesh>
  );
}

function EarthVisual({ size }) {
  const surfaceRef = useRef();
  const cloudsRef = useRef();
  const [earthTexture, cloudsTexture] = useLoader(THREE.TextureLoader, [
    '/tex/earth.jpg',
    '/tex/earth_clouds.jpg',
  ]);

  useFrame(({ clock }) => {
    if (surfaceRef.current) surfaceRef.current.rotation.y = clock.elapsedTime * 0.018;
    if (cloudsRef.current) cloudsRef.current.rotation.y = clock.elapsedTime * 0.022;
  });

  return (
    <group rotation={[0, 0, THREE.MathUtils.degToRad(23.4)]}>
      <mesh ref={surfaceRef} castShadow receiveShadow>
        <sphereGeometry args={[size, 64, 64]} />
        <meshStandardMaterial
          map={earthTexture}
          roughness={0.72}
          metalness={0.02}
          emissive="#071326"
          emissiveMap={earthTexture}
          emissiveIntensity={0.14}
        />
      </mesh>
      <mesh ref={cloudsRef} scale={[1.012, 1.012, 1.012]}>
        <sphereGeometry args={[size, 64, 64]} />
        <meshStandardMaterial
          map={cloudsTexture}
          alphaMap={cloudsTexture}
          color="#dcecff"
          transparent
          opacity={0.34}
          alphaTest={0.08}
          depthWrite={false}
          roughness={1}
        />
      </mesh>
      <Atmosphere size={size} />
    </group>
  );
}

function SaturnRings({ size }) {
  const ringTexture = useLoader(THREE.TextureLoader, '/tex/saturn_ring.png');

  return (
    <mesh rotation={[Math.PI / 2.65, 0, 0]}>
      <ringGeometry args={[size * 1.45, size * 2.65, 128]} />
      <meshStandardMaterial
        map={ringTexture}
        alphaMap={ringTexture}
        color="#e5d6a4"
        transparent
        opacity={0.72}
        alphaTest={0.04}
        depthWrite={false}
        side={THREE.DoubleSide}
        roughness={0.88}
      />
    </mesh>
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
      0,
      Math.sin(t) * planet.orbit * ellipse,
    );
    groupRef.current.rotation.y += 0.0015;
  });

  return (
    <group ref={groupRef}>
      {planet.earth ? (
        <EarthVisual size={planet.size} />
      ) : (
        <mesh castShadow receiveShadow>
          <sphereGeometry args={[planet.size, 48, 48]} />
          <meshStandardMaterial map={texture} color={planet.color} roughness={0.86} metalness={0.02} />
        </mesh>
      )}
      {planet.rings && <SaturnRings size={planet.size} />}
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
  const glowTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const context = canvas.getContext('2d');
    const gradient = context.createRadialGradient(128, 128, 10, 128, 128, 128);
    gradient.addColorStop(0, 'rgba(255,240,170,1)');
    gradient.addColorStop(0.22, 'rgba(255,190,55,0.72)');
    gradient.addColorStop(0.55, 'rgba(255,116,20,0.22)');
    gradient.addColorStop(1, 'rgba(255,80,0,0)');
    context.fillStyle = gradient;
    context.fillRect(0, 0, 256, 256);
    return new THREE.CanvasTexture(canvas);
  }, []);

  useFrame(({ clock }) => {
    if (ref.current) ref.current.rotation.y = clock.elapsedTime * 0.012;
  });

  return (
    <group>
      <sprite scale={[42, 42, 1]}>
        <spriteMaterial
          map={glowTexture}
          transparent
          opacity={0.74}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </sprite>
      <mesh ref={ref}>
        <sphereGeometry args={[8.5, 64, 64]} />
        <meshBasicMaterial map={texture} color="#fff0a6" />
      </mesh>
      <pointLight color="#ffe1a0" intensity={8.5} distance={620} decay={1.65} />
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
        <group
          key={planet.name}
          rotation={[
            THREE.MathUtils.degToRad(planet.inclination),
            THREE.MathUtils.degToRad(planet.node),
            0,
          ]}
        >
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
