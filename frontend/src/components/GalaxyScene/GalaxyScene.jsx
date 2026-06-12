import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import * as THREE from 'three';
import { OrbitControls, Stars, Float, Text, Html } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import loadHygStars from '../../data/hygdata_v3_sample';
import CameraRig from './CameraRig';

// --- ACCURATE JPL DATA (J2000) ---
const PLANET_DATA = {
  mercury: { a: 0.387, e: 0.205, i: 7.0, L: 252.25, wBar: 77.45, Omega: 48.33, color: "#A5A5AF", size: 1.2, speed: 0.5, tex: "/tex/mercury.jpg" },
  venus: { a: 0.723, e: 0.006, i: 3.39, L: 181.98, wBar: 131.53, Omega: 76.68, color: "#E3BB76", size: 2.2, speed: 0.3, tex: "/tex/venus.jpg" },
  earth: { a: 1.0, e: 0.016, i: 0.0, L: 100.46, wBar: 102.94, Omega: -11.26, color: "#2271B3", size: 2.5, speed: 0.2, tex: "/tex/earth.jpg", hasAtmosphere: true },
  mars: { a: 1.524, e: 0.093, i: 1.85, L: 355.45, wBar: 336.04, Omega: 49.58, color: "#E27B58", size: 1.8, speed: 0.15, tex: "/tex/mars.jpg" },
  jupiter: { a: 5.203, e: 0.048, i: 1.3, L: 34.4, wBar: 14.75, Omega: 100.55, color: "#D39C7E", size: 8.5, speed: 0.08, tex: "/tex/jupiter.jpg" },
  saturn: { a: 9.537, e: 0.054, i: 2.48, L: 49.94, wBar: 92.43, Omega: 113.71, color: "#C5AB6E", size: 7.2, speed: 0.05, tex: "/tex/saturn.jpg", hasRings: true },
  uranus: { a: 19.191, e: 0.047, i: 0.77, L: 313.23, wBar: 170.96, Omega: 74.23, color: "#B5E3E3", size: 4.5, speed: 0.03, tex: "/tex/uranus.jpg" },
  neptune: { a: 30.069, e: 0.008, i: 1.77, L: 304.88, wBar: 44.97, Omega: 131.72, color: "#6081FF", size: 4.5, speed: 0.02, tex: "/tex/neptune.jpg" },
};

const SCALE = 35; // 1 AU = 35 Three.js units

// --- MATHEMATICAL CORE ---

function calcKeplerPosition(data, time, scale = SCALE) {
  const { a, e, i: incDeg, L: meanLongDeg, wBar: longPeriDeg, Omega: nodeDeg } = data;
  
  const i = THREE.MathUtils.degToRad(incDeg);
  const Omega = THREE.MathUtils.degToRad(nodeDeg);
  const wBar = THREE.MathUtils.degToRad(meanLongDeg);
  const w = THREE.MathUtils.degToRad(longPeriDeg) - Omega;

  // Mean Anomaly (Simplified time progression)
  const M = wBar + time * data.speed;
  
  // Solve Kepler's Equation for Eccentric Anomaly (E)
  let E = M;
  for (let n = 0; n < 5; n++) E = E - (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));

  // Orbital Plane Coordinates
  const xP = a * (Math.cos(E) - e);
  const yP = a * Math.sqrt(1 - e * e) * Math.sin(E);

  // Rotate to 3D Ecliptic
  const x = (Math.cos(Omega) * Math.cos(w) - Math.sin(Omega) * Math.sin(w) * Math.cos(i)) * xP +
            (-Math.cos(Omega) * Math.sin(w) - Math.sin(Omega) * Math.cos(w) * Math.cos(i)) * yP;
  const y = (Math.sin(Omega) * Math.cos(w) + Math.cos(Omega) * Math.sin(w) * Math.cos(i)) * xP +
            (-Math.sin(Omega) * Math.sin(w) + Math.cos(Omega) * Math.cos(w) * Math.cos(i)) * yP;
  const z = (Math.sin(w) * Math.sin(i)) * xP + (Math.cos(w) * Math.sin(i)) * yP;

  // Map to Three.js (Y-up)
  return new THREE.Vector3(x * scale, z * scale, -y * scale);
}

// --- COMPONENTS ---

function OrbitLine({ data }) {
  const points = useMemo(() => {
    const pts = [];
    for (let t = 0; n < 128; n++) {
        // Use full calculation for 128 points to draw the true 3D elliptical orbit
    }
    // Optimization: Generate once
    const curveArr = [];
    for(let i=0; i<=128; i++) {
        const angle = (i/128) * Math.PI * 2;
        curveArr.push(calcKeplerPosition({...data, L: 0, speed: 0}, angle));
    }
    return curveArr;
  }, [data]);

  return (
    <line>
      <bufferGeometry attach="geometry">
        <bufferAttribute attach="attributes-position" count={points.length} array={new Float32Array(points.flatMap(p=>[p.x, p.y, p.z]))} itemSize={3} />
      </bufferGeometry>
      <lineBasicMaterial color="white" transparent opacity={0.1} />
    </line>
  );
}

function Planet({ name, data }) {
  const ref = useRef();
  const tex = useLoader(THREE.TextureLoader, data.tex);

  useFrame(({ clock }) => {
    const pos = calcKeplerPosition(data, clock.elapsedTime * 0.2);
    ref.current.position.copy(pos);
    ref.current.rotation.y += 0.01;
  });

  return (
    <group ref={ref}>
      <Float speed={2} rotationIntensity={0.2}>
        <mesh castShadow receiveShadow>
          <sphereGeometry args={[data.size, 32, 32]} />
          <meshStandardMaterial map={tex} roughness={0.8} metalness={0.1} />
        </mesh>
        
        {data.hasAtmosphere && (
          <mesh scale={[1.15, 1.15, 1.15]}>
            <sphereGeometry args={[data.size, 32, 32]} />
            <meshBasicMaterial color={data.color} transparent opacity={0.15} side={THREE.BackSide} />
          </mesh>
        )}

        {data.hasRings && (
          <mesh rotation={[Math.PI / 2.5, 0, 0]}>
            <ringGeometry args={[data.size * 1.5, data.size * 2.5, 64]} />
            <meshStandardMaterial color={data.color} transparent opacity={0.3} side={THREE.DoubleSide} />
          </mesh>
        )}

        <Html distanceFactor={50} position={[0, data.size + 2, 0]}>
          <div className="px-3 py-1 bg-black/60 border border-white/10 rounded backdrop-blur-md">
            <span className="text-[9px] font-black text-white tracking-widest uppercase">{name}</span>
          </div>
        </Html>
      </Float>
    </group>
  );
}

function Sun() {
  return (
    <group>
      <mesh>
        <sphereGeometry args={[12, 32, 32]} />
        <meshBasicMaterial color="#FFDD44" />
      </mesh>
      <pointLight intensity={10} color="#FFCC33" distance={2000} decay={2} />
      {/* Corona Effect */}
      <Stars radius={50} depth={10} count={100} factor={10} fade speed={5} />
    </group>
  );
}

function AsteroidBelt() {
  const count = 1000;
  const pts = useMemo(() => {
    const arr = [];
    for(let i=0; i<count; i++) {
      const r = 160 + Math.random() * 30;
      const a = Math.random() * Math.PI * 2;
      arr.push(Math.cos(a)*r, (Math.random()-0.5)*8, Math.sin(a)*r);
    }
    return new Float32Array(arr);
  }, []);
  return (
    <points>
      <bufferGeometry><bufferAttribute attach="attributes-position" count={count} array={pts} itemSize={3} /></bufferGeometry>
      <pointsMaterial size={0.5} color="#666" transparent opacity={0.4} />
    </points>
  );
}

export default function GalaxyScene({ onStarClick }) {
  const [stars, setStars] = useState(null);
  useEffect(() => { loadHygStars({ limit: 15000 }).then(setStars); }, []);

  return (
    <div style={{ width: '100%', height: '100vh', background: '#000', position: 'relative' }}>
      <Canvas shadows camera={{ position: [300, 200, 500], fov: 40, far: 50000 }}>
        <Suspense fallback={null}>
          <color attach="background" args={["#000003"]} />
          
          <Stars radius={6000} depth={200} count={20000} factor={6} saturation={0} fade speed={0.5} />
          
          <Sun />
          <AsteroidBelt />
          
          {Object.entries(PLANET_DATA).map(([name, data]) => (
            <group key={name}>
              <OrbitLine data={data} />
              <Planet name={name} data={data} />
            </group>
          ))}

          {/* Background Starscape (Static) */}
          {stars && (
            <points>
              <bufferGeometry>
                <bufferAttribute attach="attributes-position" count={stars.length} array={new Float32Array(stars.flatMap(s=>[s.threeX * 15, s.threeY * 15, s.threeZ * 15]))} itemSize={3} />
              </bufferGeometry>
              <pointsMaterial size={1.0} color="#556688" transparent opacity={0.2} />
            </points>
          )}

          <OrbitControls enablePan={false} maxDistance={3000} makeDefault />
          
          <EffectComposer>
            <Bloom intensity={2.0} luminanceThreshold={0.05} radius={0.8} />
          </EffectComposer>
        </Suspense>
      </Canvas>
    </div>
  );
}
