import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { OrbitControls, Stars, Float } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import loadHygStars from '../../data/hygdata_v3_sample';
import CameraRig from './CameraRig';

// --- SHADERS (Proven High-Visibility) ---

const STAR_VERTEX_SHADER = `
  attribute float size;
  varying vec3 vColor;
  void main() {
    vColor = color;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = size * (400.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const STAR_FRAGMENT_SHADER = `
  varying vec3 vColor;
  void main() {
    float r = distance(gl_PointCoord, vec2(0.5));
    if (r > 0.5) discard;
    float glow = exp(-5.0 * r);
    gl_FragColor = vec4(vColor * glow * 1.5, glow);
  }
`;

// --- COMPONENTS ---

function ProGalaxy() {
  const ref = useRef();
  const { positions, colors, sizes } = useMemo(() => {
    const count = 40000;
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const siz = new Float32Array(count);
    const color = new THREE.Color();
    
    for(let i=0; i<count; i++) {
      const r = Math.random() * 1200;
      const branch = i % 4;
      const angle = (r * 0.005) + (branch * Math.PI * 0.5);
      const dispersion = (r * 0.15) + 30;
      
      pos[i*3] = Math.cos(angle) * r + (Math.random()-0.5) * dispersion;
      pos[i*3+1] = (Math.random()-0.5) * (dispersion * 0.4);
      pos[i*3+2] = Math.sin(angle) * r + (Math.random()-0.5) * dispersion;
      
      const mixed = color.set(i < 8000 ? "#ffccaa" : "#aabbff").lerp(new THREE.Color("#ffffff"), Math.random());
      col[i*3]=mixed.r; col[i*3+1]=mixed.g; col[i*3+2]=mixed.b;
      siz[i] = Math.random() * 4 + 2;
    }
    return { positions: pos, colors: col, sizes: siz };
  }, []);

  useFrame(({ clock }) => {
    if (ref.current) ref.current.rotation.y = clock.getElapsedTime() * 0.005;
  });

  return (
    <group position={[0, -200, -1000]} rotation={[0.4, 0, 0.2]}>
       {/* Central Glow (Bulge) */}
       <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
          <mesh>
            <sphereGeometry args={[100, 32, 32]} />
            <meshBasicMaterial color="#ffccaa" transparent opacity={0.15} blending={THREE.AdditiveBlending} />
          </mesh>
          <pointLight intensity={10} color="#ffccaa" distance={600} />
       </Float>

       {/* Galaxy Particles */}
       <points ref={ref}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" count={40000} array={positions} itemSize={3} />
            <bufferAttribute attach="attributes-color" count={40000} array={colors} itemSize={3} />
            <bufferAttribute attach="attributes-size" count={40000} array={sizes} itemSize={1} />
          </bufferGeometry>
          <shaderMaterial
            vertexShader={STAR_VERTEX_SHADER}
            fragmentShader={STAR_FRAGMENT_SHADER}
            transparent depthWrite={false} blending={THREE.AdditiveBlending}
            vertexColors
          />
       </points>
    </group>
  );
}

function Warp({ active }) {
  const ref = useRef();
  const pts = useMemo(() => {
    const arr = [];
    for(let i=0; i<300; i++) arr.push((Math.random()-0.5)*200, (Math.random()-0.5)*200, Math.random()*-2000);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(arr, 3));
    return g;
  }, []);
  useFrame(() => { if(active && ref.current) { ref.current.position.z += 60; if(ref.current.position.z > 1500) ref.current.position.z = 0; } });
  if(!active) return null;
  return <lineSegments ref={ref} geometry={pts}><lineBasicMaterial color="#4488ff" transparent opacity={0.4} /></lineSegments>;
}

export default function GalaxyScene({ onStarClick }) {
  const [stars, setStars] = useState(null);
  const [selected, setSelected] = useState(null);
  const [warp, setWarp] = useState(false);

  useEffect(() => { loadHygStars({ limit: 30000 }).then(setStars); }, []);

  return (
    <div style={{ width: '100%', height: '100vh', background: '#000', position: 'relative' }}>
      <Canvas camera={{ position: [0, 100, 400], fov: 60, far: 50000 }}>
        <Suspense fallback={null}>
          <color attach="background" args={["#010105"]} />
          
          {/* Base Atmosphere from Home Page Logic */}
          <Stars radius={4000} depth={100} count={15000} factor={6} saturation={0} fade speed={1} />
          
          {/* Procedural Galactic Structure */}
          <ProGalaxy />
          
          <Warp active={warp} />

          {/* Foreground Star Field */}
          {stars && (
            <points onPointerDown={(e) => { e.stopPropagation(); const s=stars[e.index]; setSelected(s); onStarClick?.(s); }}>
              <bufferGeometry>
                <bufferAttribute attach="attributes-position" count={stars.length} array={new Float32Array(stars.flatMap(s=>[s.threeX, s.threeY, s.threeZ]))} itemSize={3} />
                <bufferAttribute attach="attributes-color" count={stars.length} array={new Float32Array(stars.flatMap(s=>{const c=new THREE.Color(s.color||"#fff"); return [c.r,c.g,c.b]}))} itemSize={3} />
                <bufferAttribute attach="attributes-size" count={stars.length} array={new Float32Array(stars.map(s=>Math.max(2, 9-(s.mag||6))))} itemSize={1} />
              </bufferGeometry>
              <shaderMaterial
                vertexShader={STAR_VERTEX_SHADER}
                fragmentShader={STAR_FRAGMENT_SHADER}
                transparent depthWrite={false} blending={THREE.AdditiveBlending}
                vertexColors
              />
            </points>
          )}

          {selected && (
            <group position={[selected.threeX, selected.threeY, selected.threeZ]}>
              <mesh><sphereGeometry args={[1, 16, 16]} /><meshBasicMaterial color="#C9A84C" /></mesh>
              <pointLight intensity={10} color="#C9A84C" distance={150} />
            </group>
          )}

          <CameraRig enableCinematic={!selected && !warp} fovBoost={warp} />
          <OrbitControls enablePan={false} maxDistance={10000} makeDefault />
          
          <EffectComposer>
            <Bloom intensity={2.0} luminanceThreshold={0.01} radius={0.8} />
          </EffectComposer>
        </Suspense>
      </Canvas>

      <div style={{ position: 'absolute', bottom: 40, left: '50%', transform: 'translateX(-50%)' }}>
        <button 
          onClick={() => { setWarp(true); setTimeout(()=>setWarp(false), 3000); }} 
          style={{ background: 'rgba(201,168,76,0.1)', color: '#C9A84C', border: '1px solid #C9A84C', padding: '12px 40px', borderRadius: '100px', cursor: 'pointer', letterSpacing: '5px', fontWeight: '900', backdropFilter: 'blur(10px)' }}
        >
          ENGAGE_WARP_DRIVE
        </button>
      </div>
    </div>
  );
}
