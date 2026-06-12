import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import * as THREE from 'three';
import { OrbitControls, Stars, Float, Text, Html } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import loadHygStars from '../../data/hygdata_v3_sample';
import CameraRig from './CameraRig';

// --- DATA & CONSTANTS ---
const PLANETS = [
  { name: "Mercury", color: "#A5A5AF", dist: 40, size: 1.2, speed: 0.04, tex: "/tex/mercury.jpg" },
  { name: "Venus", color: "#E3BB76", dist: 60, size: 2.2, speed: 0.015, tex: "/tex/venus.jpg" },
  { name: "Earth", color: "#2271B3", dist: 85, size: 2.5, speed: 0.01, tex: "/tex/earth.jpg", hasAtmosphere: true },
  { name: "Mars", color: "#E27B58", dist: 110, size: 1.8, speed: 0.008, tex: "/tex/mars.jpg" },
  { name: "Jupiter", color: "#D39C7E", dist: 160, size: 8.5, speed: 0.002, tex: "/tex/jupiter.jpg" },
  { name: "Saturn", color: "#C5AB6E", dist: 220, size: 7.2, speed: 0.0009, tex: "/tex/saturn.jpg", hasRings: true },
  { name: "Uranus", color: "#B5E3E3", dist: 280, size: 4.5, speed: 0.0004, tex: "/tex/uranus.jpg" },
  { name: "Neptune", color: "#6081FF", dist: 330, size: 4.5, speed: 0.0001, tex: "/tex/neptune.jpg" },
];

// --- SHADERS ---
const SUN_FRAGMENT = `
  varying vec2 vUv;
  uniform float uTime;
  void main() {
    float d = distance(vUv, vec2(0.5));
    if (d > 0.5) discard;
    float strength = exp(-5.0 * d);
    vec3 color = mix(vec3(1.0, 0.9, 0.2), vec3(1.0, 0.4, 0.0), d * 2.0);
    gl_FragColor = vec4(color * 3.0, strength);
  }
`;

const ATMOSPHERE_VERTEX = `
  varying vec3 vNormal;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const ATMOSPHERE_FRAGMENT = `
  varying vec3 vNormal;
  uniform vec3 uColor;
  void main() {
    float intensity = pow(0.7 - dot(vNormal, vec3(0, 0, 1.0)), 3.0);
    gl_FragColor = vec4(uColor, intensity);
  }
`;

// --- COMPONENTS ---

function Sun() {
  const meshRef = useRef();
  useFrame(({ clock }) => {
    if (meshRef.current) meshRef.current.scale.setScalar(1 + Math.sin(clock.elapsedTime * 2) * 0.02);
  });
  return (
    <group>
      <mesh ref={meshRef}>
        <sphereGeometry args={[15, 32, 32]} />
        <shaderMaterial
          vertexShader="varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }"
          fragmentShader={SUN_FRAGMENT}
          uniforms={{ uTime: { value: 0 } }}
          transparent
        />
      </mesh>
      <pointLight intensity={20} color="#FFDD44" distance={1000} />
    </group>
  );
}

function PlanetBody({ planet }) {
  const ref = useRef();
  const tex = useLoader(THREE.TextureLoader, planet.tex);
  
  useFrame(({ clock }) => {
    const angle = clock.elapsedTime * planet.speed;
    ref.current.position.x = Math.cos(angle) * planet.dist;
    ref.current.position.z = Math.sin(angle) * planet.dist;
    ref.current.rotation.y += 0.01;
  });

  return (
    <group ref={ref}>
      <Float speed={2} rotationIntensity={0.2} floatIntensity={0.5}>
        <mesh castShadow receiveShadow>
          <sphereGeometry args={[planet.size, 32, 32]} />
          <meshStandardMaterial map={tex} roughness={0.7} metalness={0.2} emissive={planet.color} emissiveIntensity={0.1} />
        </mesh>

        {planet.hasAtmosphere && (
          <mesh scale={[1.2, 1.2, 1.2]}>
            <sphereGeometry args={[planet.size, 32, 32]} />
            <shaderMaterial
              vertexShader={ATMOSPHERE_VERTEX}
              fragmentShader={ATMOSPHERE_FRAGMENT}
              uniforms={{ uColor: { value: new THREE.Color(planet.color) } }}
              side={THREE.BackSide}
              transparent
            />
          </mesh>
        )}

        {planet.hasRings && (
           <mesh rotation={[Math.PI / 2.5, 0, 0]}>
             <ringGeometry args={[planet.size * 1.4, planet.size * 2.2, 64]} />
             <meshStandardMaterial color={planet.color} transparent opacity={0.4} side={THREE.DoubleSide} />
           </mesh>
        )}

        <Html distanceFactor={40} position={[0, planet.size + 2, 0]}>
          <div className="px-3 py-1 bg-black/80 border border-white/20 rounded text-[8px] font-bold text-white tracking-[0.2em] whitespace-nowrap uppercase">
            {planet.name}
          </div>
        </Html>
      </Float>

      {/* Orbit Trace */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[planet.dist - 0.2, planet.dist + 0.2, 128]} />
        <meshBasicMaterial color="white" transparent opacity={0.05} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

function AsteroidBelt() {
  const count = 400;
  const pts = useMemo(() => {
    const arr = [];
    for(let i=0; i<count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = 130 + Math.random() * 15;
      arr.push(Math.cos(angle)*r, (Math.random()-0.5)*5, Math.sin(angle)*r);
    }
    return new Float32Array(arr);
  }, []);
  return (
    <points>
      <bufferGeometry><bufferAttribute attach="attributes-position" count={count} array={pts} itemSize={3} /></bufferGeometry>
      <pointsMaterial size={0.8} color="#888" transparent opacity={0.4} />
    </points>
  );
}

export default function GalaxyScene({ onStarClick }) {
  const [stars, setStars] = useState(null);
  useEffect(() => { loadHygStars({ limit: 20000 }).then(setStars); }, []);

  return (
    <div style={{ width: '100%', height: '100vh', background: '#000', position: 'relative' }}>
      <Canvas shadows camera={{ position: [200, 150, 400], fov: 45, far: 20000 }}>
        <Suspense fallback={null}>
          <color attach="background" args={["#000002"]} />
          <ambientLight intensity={0.2} />
          
          <Stars radius={5000} depth={100} count={10000} factor={6} saturation={0} fade speed={1} />
          
          <Sun />
          <AsteroidBelt />
          {PLANETS.map(p => <PlanetBody key={p.name} planet={p} />)}

          {/* Background Stars (Static) */}
          {stars && (
            <points>
              <bufferGeometry>
                <bufferAttribute attach="attributes-position" count={stars.length} array={new Float32Array(stars.flatMap(s=>[s.threeX * 10, s.threeY * 10, s.threeZ * 10]))} itemSize={3} />
              </bufferGeometry>
              <pointsMaterial size={1.2} color="#445566" transparent opacity={0.3} />
            </points>
          )}

          <OrbitControls enablePan={false} maxDistance={1500} makeDefault />
          <EffectComposer>
            <Bloom intensity={1.5} luminanceThreshold={0.1} radius={0.8} />
          </EffectComposer>
        </Suspense>
      </Canvas>
    </div>
  );
}
