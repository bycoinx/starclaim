import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import * as THREE from 'three';
import { OrbitControls } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import loadHygStars from '../../data/hygdata_v3_sample';
import { PLANETS, SUN, SOLAR_SCALE } from '../../data/solarSystemData';
import CameraRig from './CameraRig';

// Celestia-Grade Star Shader
const STAR_VERTEX_SHADER = `
  attribute float size;
  varying vec3 vColor;
  varying float vSize;
  void main() {
    vColor = color;
    vSize = size;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = size * (300.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const STAR_FRAGMENT_SHADER = `
  uniform float time;
  varying vec3 vColor;
  varying float vSize;
  void main() {
    float r = distance(gl_PointCoord, vec2(0.5, 0.5));
    if (r > 0.5) discard;
    float glow = exp(-5.0 * r);
    float pulse = 0.8 + 0.2 * sin(time * 2.0 + vSize * 10.0);
    gl_FragColor = vec4(vColor * glow * pulse, glow * 1.5);
  }
`;

const WARP_VERTEX_SHADER = `
  varying float vOpacity;
  void main() {
    vOpacity = clamp(position.z / 200.0, 0.0, 1.0);
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const WARP_FRAGMENT_SHADER = `
  varying float vOpacity;
  void main() {
    gl_FragColor = vec4(0.4, 0.7, 1.0, vOpacity * 0.6);
  }
`;

function LoadingOverlay() {
  return (
    <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',zIndex:100}}>
      <div style={{background:'rgba(0,0,0,0.8)',padding:24,borderRadius:16,border:'1px solid rgba(255,255,255,0.1)',textAlign:'center'}}>
        <div style={{width:40,height:40,border:'2px solid #C9A84C',borderTopColor:'transparent',borderRadius:'50%',animation:'spin 1s linear infinite',margin:'0 auto 16px auto'}} />
        <div style={{fontSize:10,letterSpacing:4,fontWeight:'900',color:'#C9A84C'}}>AEGIS_SPACE_LOADER</div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function WarpStreaks({ active }) {
  const ref = useRef();
  const lineGeom = useMemo(() => {
    const segments = [];
    for(let i=0; i<300; i++) {
      const x = (Math.random() - 0.5) * 150;
      const y = (Math.random() - 0.5) * 150;
      const z = Math.random() * -1500;
      segments.push(x, y, z, x, y, z + 80);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(segments, 3));
    return g;
  }, []);

  useFrame(() => {
    if (active && ref.current) {
      ref.current.position.z += 40;
      if (ref.current.position.z > 1000) ref.current.position.z = 0;
    }
  });

  if (!active) return null;

  return (
    <lineSegments ref={ref} geometry={lineGeom}>
      <shaderMaterial vertexShader={WARP_VERTEX_SHADER} fragmentShader={WARP_FRAGMENT_SHADER} transparent blending={THREE.AdditiveBlending} />
    </lineSegments>
  );
}

function HYGStarField({ stars, onStarClick, warpActive }) {
  const refPoints = useRef();
  const uniforms = useMemo(() => ({ time: { value: 0 } }), []);

  const { starGeometry } = useMemo(() => {
    if (!stars || !stars.length) return { starGeometry: null };
    const pos = new Float32Array(stars.length * 3);
    const col = new Float32Array(stars.length * 3);
    const siz = new Float32Array(stars.length);
    
    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      pos[i * 3] = s.threeX;
      pos[i * 3 + 1] = s.threeY;
      pos[i * 3 + 2] = s.threeZ;
      
      const c = new THREE.Color(s.color || '#ffffff');
      col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
      
      // Fixed: Ensure minimum visibility for all stars
      const mag = s.mag || 6.5;
      siz[i] = Math.max(1.2, 7.5 - mag);
    }
    
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(col, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(siz, 1));
    return { starGeometry: geometry };
  }, [stars]);

  useFrame(({ clock }) => {
    if (refPoints.current) {
      refPoints.current.material.uniforms.time.value = clock.getElapsedTime();
      if (warpActive) {
        refPoints.current.scale.setScalar(THREE.MathUtils.lerp(refPoints.current.scale.x, 3.0, 0.04));
      } else {
        refPoints.current.scale.setScalar(THREE.MathUtils.lerp(refPoints.current.scale.x, 1.0, 0.08));
        refPoints.current.rotation.y += 0.0001;
      }
    }
  });

  const handlePointerDown = (e) => {
    e.stopPropagation();
    const idx = e.index;
    if (idx != null && stars[idx]) {
      onStarClick(stars[idx]);
    }
  };

  if (!starGeometry) return null;

  return (
    <points ref={refPoints} geometry={starGeometry} onPointerDown={handlePointerDown}>
      <shaderMaterial 
        vertexShader={STAR_VERTEX_SHADER}
        fragmentShader={STAR_FRAGMENT_SHADER}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        vertexColors
      />
    </points>
  );
}

function StarSelectionMarker({ star }) {
  if (!star) return null;
  return (
    <mesh position={[star.threeX, star.threeY, star.threeZ]}>
      <sphereGeometry args={[0.25, 16, 16]} />
      <meshBasicMaterial color="#C9A84C" transparent opacity={0.3} />
      <pointLight intensity={3} distance={10} color="#C9A84C" />
    </mesh>
  );
}

function ShootingStar() {
  const meshRef = useRef();
  const [active, setActive] = useState(false);
  const startPos = useRef(new THREE.Vector3());
  const endPos = useRef(new THREE.Vector3());
  const progress = useRef(0);

  useEffect(() => {
    const spawn = () => {
      if (Math.random() < 0.3) {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI;
        const r = 400 + Math.random() * 200;
        startPos.current.set(r * Math.sin(phi) * Math.cos(theta), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(theta));
        endPos.current.copy(startPos.current).add(new THREE.Vector3((Math.random()-0.5)*100, -200, (Math.random()-0.5)*100));
        progress.current = 0;
        setActive(true);
      }
    };
    const interval = setInterval(spawn, 3000);
    return () => clearInterval(interval);
  }, []);

  useFrame((_, delta) => {
    if (active && meshRef.current) {
      progress.current += delta * 0.8;
      if (progress.current >= 1) { setActive(false); return; }
      meshRef.current.position.lerpVectors(startPos.current, endPos.current, progress.current);
    }
  });

  if (!active) return null;

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[0.4, 8, 8]} />
      <meshBasicMaterial color="#fff" />
      <pointLight intensity={2} distance={20} color="#fff" />
    </mesh>
  );
}

function SpaceBackground() {
  return (
    <>
      <color attach="background" args={["#010208"]} />
      <fog attach="fog" args={["#010208", 100, 4000]} />
      <mesh rotation={[0, 0, 0]}>
        <sphereGeometry args={[3000, 32, 32]} />
        <meshBasicMaterial color="#020512" side={THREE.BackSide} transparent opacity={1} />
      </mesh>
      {/* Distant stars for depth */}
      <points>
         <bufferGeometry>
            <bufferAttribute 
               attach="attributes-position"
               count={5000}
               array={new Float32Array(Array.from({length: 15000}, () => (Math.random() - 0.5) * 3000))}
               itemSize={3}
            />
         </bufferGeometry>
         <pointsMaterial size={1.5} color="#445566" transparent opacity={0.4} />
      </points>
    </>
  );
}

export default function GalaxyScene({ onStarClick }) {
  const [stars, setStars] = useState(null);
  const [selected, setSelected] = useState(null);
  const [isWarping, setIsWarping] = useState(false);

  useEffect(() => {
    loadHygStars({ limit: 40000 }).then(setStars);
  }, []);

  const handleStarSelect = (star) => {
    setSelected(star);
    if (onStarClick) onStarClick(star);
  };

  const triggerWarp = () => {
    setIsWarping(true);
    setTimeout(() => setIsWarping(false), 3000);
  };

  return (
    <div style={{ width: '100%', height: '100vh', position: 'relative', background: '#010208' }}>
      {!stars && <LoadingOverlay />}
      <Canvas camera={{ position: [0, 40, 120], fov: 60, near: 1, far: 10000 }} gl={{ antialias: true, alpha: false }}>
        <Suspense fallback={null}>
          <SpaceBackground />
          <ambientLight intensity={0.4} />
          <HYGStarField stars={stars} onStarClick={handleStarSelect} warpActive={isWarping} />
          {selected && <StarSelectionMarker star={selected} />}
          <CameraRig enableCinematic={!selected && !isWarping} fovBoost={isWarping} />
          <ShootingStar />
          <WarpStreaks active={isWarping} />
          <EffectComposer>
            <Bloom luminanceThreshold={0.1} intensity={2.0} radius={0.6} />
          </EffectComposer>
          <OrbitControls enablePan={false} minDistance={10} maxDistance={3000} makeDefault />
        </Suspense>
      </Canvas>

      <div style={{ position: 'absolute', bottom: 40, left: '50%', transform: 'translateX(-50%)', zIndex: 100 }}>
          <button 
            onClick={triggerWarp}
            style={{ 
              background: 'rgba(201,168,76,0.05)', 
              color: '#C9A84C', 
              border: '1px solid rgba(201,168,76,0.4)', 
              padding: '12px 40px', 
              borderRadius: '100px', 
              cursor: 'pointer', 
              fontSize: '10px', 
              letterSpacing: '5px', 
              fontWeight: '900',
              textTransform: 'uppercase',
              backdropFilter: 'blur(10px)',
              transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
            onMouseEnter={(e) => {
               e.target.style.background = 'rgba(201,168,76,0.15)';
               e.target.style.boxShadow = '0 0 30px rgba(201,168,76,0.2)';
               e.target.style.borderColor = '#C9A84C';
            }}
            onMouseLeave={(e) => {
               e.target.style.background = 'rgba(201,168,76,0.05)';
               e.target.style.boxShadow = 'none';
               e.target.style.borderColor = 'rgba(201,168,76,0.4)';
            }}
          >
            Engage_Warp_Drive
          </button>
      </div>
    </div>
  );
}
