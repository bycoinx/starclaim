import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import * as THREE from 'three';
import { OrbitControls, Stars, Float, Text, Trail } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import loadHygStars from '../../data/hygdata_v3_sample';
import CameraRig from './CameraRig';

// --- ASTRONOMICAL DATA & CONSTANTS ---

const PLANET_DATA = {
  mercury: { a: 0.387, e: 0.205, i: 7.0, L: 252.25, wBar: 77.45, Omega: 48.33, color: "#A5A5AF", size: 0.8, texture: "/tex/mercury.jpg" },
  venus: { a: 0.723, e: 0.006, i: 3.39, L: 181.98, wBar: 131.53, Omega: 76.68, color: "#E3BB76", size: 1.2, texture: "/tex/venus.jpg" },
  earth: { a: 1.0, e: 0.016, i: 0.0, L: 100.46, wBar: 102.94, Omega: -11.26, color: "#2271B3", size: 1.2, texture: "/tex/earth.jpg" },
  mars: { a: 1.524, e: 0.093, i: 1.85, L: 355.45, wBar: 336.04, Omega: 49.58, color: "#E27B58", size: 1.0, texture: "/tex/mars.jpg" },
  jupiter: { a: 5.203, e: 0.048, i: 1.3, L: 34.4, wBar: 14.75, Omega: 100.55, color: "#D39C7E", size: 4.5, texture: "/tex/jupiter.jpg" },
  saturn: { a: 9.537, e: 0.054, i: 2.48, L: 49.94, wBar: 92.43, Omega: 113.71, color: "#C5AB6E", size: 3.8, texture: "/tex/saturn.jpg", hasRings: true },
  uranus: { a: 19.191, e: 0.047, i: 0.77, L: 313.23, wBar: 170.96, Omega: 74.23, color: "#B5E3E3", size: 2.5, texture: "/tex/uranus.jpg" },
  neptune: { a: 30.069, e: 0.008, i: 1.77, L: 304.88, wBar: 44.97, Omega: 131.72, color: "#6081FF", size: 2.5, texture: "/tex/neptune.jpg" },
};

// --- SHADERS ---

const BULGE_FRAGMENT = `
  uniform float uTime;
  varying vec2 vUv;
  
  float noise(vec3 p) {
    return fract(sin(dot(p, vec3(12.9898, 78.233, 45.164))) * 43758.5453);
  }

  void main() {
    float d = distance(vUv, vec2(0.5));
    if (d > 0.5) discard;
    
    // Volumetric noise effect
    float n = noise(vec3(vUv * 5.0, uTime * 0.1));
    float strength = exp(-6.0 * d) * (0.8 + 0.2 * n);
    
    vec3 color = mix(vec3(1.0, 0.8, 0.5), vec3(1.0, 0.4, 0.2), d * 2.0);
    gl_FragColor = vec4(color * 2.5, strength);
  }
`;

// --- COMPONENTS ---

function Planet({ name, data, solarScale }) {
  const meshRef = useRef();
  const texture = useLoader(THREE.TextureLoader, data.texture);
  
  // Calculate position using Keplerian elements
  const position = useMemo(() => {
    const a = data.a;
    const e = data.e;
    const i = THREE.MathUtils.degToRad(data.i);
    const L = THREE.MathUtils.degToRad(data.L);
    const wBar = THREE.MathUtils.degToRad(data.wBar);
    const Omega = THREE.MathUtils.degToRad(data.Omega);
    
    const M = L - wBar;
    const w = wBar - Omega;

    // Solve Kepler's Equation (Approx)
    let E = M;
    for(let n=0; n<5; n++) E = E - (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));

    const xP = a * (Math.cos(E) - e);
    const yP = a * Math.sqrt(1 - e * e) * Math.sin(E);

    const x = (Math.cos(Omega) * Math.cos(w) - Math.sin(Omega) * Math.sin(w) * Math.cos(i)) * xP +
              (-Math.cos(Omega) * Math.sin(w) - Math.sin(Omega) * Math.cos(w) * Math.cos(i)) * yP;
    const y = (Math.sin(Omega) * Math.cos(w) + Math.cos(Omega) * Math.sin(w) * Math.cos(i)) * xP +
              (-Math.sin(Omega) * Math.sin(w) + Math.cos(Omega) * Math.cos(w) * Math.cos(i)) * yP;
    const z = (Math.sin(w) * Math.sin(i)) * xP + (Math.cos(w) * Math.sin(i)) * yP;

    return new THREE.Vector3(x * solarScale, z * solarScale, -y * solarScale);
  }, [data, solarScale]);

  useFrame(({ clock }) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.01;
    }
  });

  return (
    <group position={position}>
      <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.5}>
        <mesh ref={meshRef}>
          <sphereGeometry args={[data.size * 0.5, 32, 32]} />
          <meshStandardMaterial map={texture} emissive={data.color} emissiveIntensity={0.2} />
        </mesh>
        
        {data.hasRings && (
          <mesh rotation={[Math.PI / 2.5, 0, 0]}>
            <ringGeometry args={[data.size * 0.8, data.size * 1.5, 64]} />
            <meshStandardMaterial color={data.color} transparent opacity={0.4} side={THREE.DoubleSide} />
          </mesh>
        )}
        
        <Text
          position={[0, data.size + 1, 0]}
          fontSize={0.8}
          color="white"
          font="/fonts/Cinzel-Bold.ttf"
          anchorX="center"
        >
          {name.toUpperCase()}
        </Text>
      </Float>
      
      {/* Orbit Line */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[data.a * solarScale - 0.1, data.a * solarScale + 0.1, 128]} />
        <meshBasicMaterial color="white" transparent opacity={0.05} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

function SolarSystem() {
  const solarScale = 15; // 1 AU = 15 units
  return (
    <group position={[0, 0, 0]}>
      {/* The Sun */}
      <mesh>
        <sphereGeometry args={[3, 32, 32]} />
        <meshBasicMaterial color="#FFDD44" />
        <pointLight intensity={15} color="#FFDD44" distance={500} />
      </mesh>
      
      {Object.entries(PLANET_DATA).map(([name, data]) => (
        <Planet key={name} name={name} data={data} solarScale={solarScale} />
      ))}
    </group>
  );
}

function ProfessionalMilkyWay() {
  const starRef = useRef();
  const bulgeRef = useRef();
  
  const parameters = useMemo(() => ({
    count: 80000,
    radius: 2000,
    branches: 4,
    spin: 1.5,
    randomness: 0.15,
    insideColor: "#ffaa44",
    outsideColor: "#4488ff"
  }), []);

  const { positions, colors, sizes } = useMemo(() => {
    const pos = new Float32Array(parameters.count * 3);
    const col = new Float32Array(parameters.count * 3);
    const siz = new Float32Array(parameters.count);
    const colorInside = new THREE.Color(parameters.insideColor);
    const colorOutside = new THREE.Color(parameters.outsideColor);

    for (let i = 0; i < parameters.count; i++) {
      const i3 = i * 3;
      const radius = Math.random() * parameters.radius;
      const spinAngle = radius * parameters.spin * 0.01;
      const branchAngle = (i % parameters.branches) / parameters.branches * Math.PI * 2;

      const randomX = Math.pow(Math.random(), 3) * (Math.random() < 0.5 ? 1 : -1) * parameters.randomness * radius;
      const randomY = Math.pow(Math.random(), 3) * (Math.random() < 0.5 ? 1 : -1) * parameters.randomness * radius * 0.2;
      const randomZ = Math.pow(Math.random(), 3) * (Math.random() < 0.5 ? 1 : -1) * parameters.randomness * radius;

      pos[i3] = Math.cos(branchAngle + spinAngle) * radius + randomX;
      pos[i3 + 1] = randomY;
      pos[i3 + 2] = Math.sin(branchAngle + spinAngle) * radius + randomZ;

      const mixedColor = colorInside.clone().lerp(colorOutside, radius / parameters.radius);
      col[i3] = mixedColor.r; col[i3 + 1] = mixedColor.g; col[i3 + 2] = mixedColor.b;
      siz[i] = Math.random() * 2 + 1;
    }
    return { positions: pos, colors: col, sizes: siz };
  }, [parameters]);

  useFrame(({ clock }) => {
    if (starRef.current) starRef.current.rotation.y = clock.getElapsedTime() * 0.002;
    if (bulgeRef.current) bulgeRef.current.material.uniforms.uTime.value = clock.getElapsedTime();
  });

  return (
    <group position={[0, -500, -2000]} rotation={[0.4, 0, 0.2]}>
      <points ref={starRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={parameters.count} array={positions} itemSize={3} />
          <bufferAttribute attach="attributes-color" count={parameters.count} array={colors} itemSize={3} />
          <bufferAttribute attach="attributes-size" count={parameters.count} array={sizes} itemSize={1} />
        </bufferGeometry>
        <shaderMaterial
          vertexShader={`
            attribute float size;
            attribute vec3 color;
            varying vec3 vColor;
            void main() {
              vColor = color;
              vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
              gl_PointSize = size * (1500.0 / -mvPosition.z);
              gl_Position = projectionMatrix * mvPosition;
            }
          `}
          fragmentShader={`
            varying vec3 vColor;
            void main() {
              float d = distance(gl_PointCoord, vec2(0.5));
              if (d > 0.5) discard;
              gl_FragColor = vec4(vColor * 2.0, pow(1.0 - d * 2.0, 4.0));
            }
          `}
          transparent depthWrite={false} blending={THREE.AdditiveBlending} vertexColors
        />
      </points>

      {/* Textured Bulge */}
      <mesh ref={bulgeRef}>
        <sphereGeometry args={[150, 32, 32]} />
        <shaderMaterial
          uniforms={{ uTime: { value: 0 } }}
          vertexShader={`varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`}
          fragmentShader={BULGE_FRAGMENT}
          transparent depthWrite={false} blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}

export default function GalaxyScene({ onStarClick }) {
  const [stars, setStars] = useState(null);
  const [selected, setSelected] = useState(null);

  useEffect(() => { loadHygStars({ limit: 30000 }).then(setStars); }, []);

  return (
    <div style={{ width: '100%', height: '100vh', background: '#000', position: 'relative' }}>
      <Canvas camera={{ position: [0, 150, 400], fov: 60, far: 50000 }}>
        <Suspense fallback={null}>
          <color attach="background" args={["#000002"]} />
          <ambientLight intensity={0.5} />
          
          <Stars radius={5000} depth={200} count={20000} factor={7} saturation={0} fade speed={1} />
          
          <ProfessionalMilkyWay />
          <SolarSystem />

          {stars && (
            <points onPointerDown={(e) => { e.stopPropagation(); const s=stars[e.index]; setSelected(s); onStarClick?.(s); }}>
              <bufferGeometry>
                <bufferAttribute attach="attributes-position" count={stars.length} array={new Float32Array(stars.flatMap(s=>[s.threeX, s.threeY, s.threeZ]))} itemSize={3} />
                <bufferAttribute attach="attributes-color" count={stars.length} array={new Float32Array(stars.flatMap(s=>{const c=new THREE.Color(s.color||"#fff"); return [c.r,c.g,c.b]}))} itemSize={3} />
                <bufferAttribute attach="attributes-size" count={stars.length} array={new Float32Array(stars.map(s=>Math.max(3, 12-(s.mag||6))))} itemSize={1} />
              </bufferGeometry>
              <shaderMaterial
                vertexShader={`attribute float size; attribute vec3 color; varying vec3 vColor; void main() { vColor = color; vec4 mvPosition = modelViewMatrix * vec4(position, 1.0); gl_PointSize = size * (1200.0 / -mvPosition.z); gl_Position = projectionMatrix * mvPosition; }`}
                fragmentShader={`varying vec3 vColor; void main() { float d = distance(gl_PointCoord, vec2(0.5)); if (d > 0.5) discard; gl_FragColor = vec4(vColor * 3.0, pow(1.0 - d * 2.0, 3.0)); }`}
                transparent depthWrite={false} blending={THREE.AdditiveBlending} vertexColors
              />
            </points>
          )}

          {selected && (
            <group position={[selected.threeX, selected.threeY, selected.threeZ]}>
              <mesh><sphereGeometry args={[1, 16, 16]} /><meshBasicMaterial color="#C9A84C" /></mesh>
              <pointLight intensity={10} color="#C9A84C" distance={150} />
            </group>
          )}

          <CameraRig enableCinematic={!selected} />
          <OrbitControls enablePan={false} maxDistance={10000} makeDefault />
          
          <EffectComposer>
            <Bloom intensity={2.5} luminanceThreshold={0.02} radius={0.8} />
          </EffectComposer>
        </Suspense>
      </Canvas>
    </div>
  );
}
