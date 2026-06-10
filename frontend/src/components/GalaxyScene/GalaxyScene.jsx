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
    float glow = exp(-6.0 * r);
    float pulse = 0.85 + 0.15 * sin(time * 2.0 + vSize * 10.0);
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
    for(let i=0; i<250; i++) {
      const x = (Math.random() - 0.5) * 120;
      const y = (Math.random() - 0.5) * 120;
      const z = Math.random() * -1200;
      segments.push(x, y, z, x, y, z + 60);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(segments, 3));
    return g;
  }, []);

  useFrame(() => {
    if (active && ref.current) {
      ref.current.position.z += 30;
      if (ref.current.position.z > 900) ref.current.position.z = 0;
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
    stars.forEach((s, i) => {
      pos[i*3] = s.threeX; pos[i*3+1] = s.threeY; pos[i*3+2] = s.threeZ;
      const c = new THREE.Color(s.color || '#fff');
      col[i*3] = c.r; col[i*3+1] = c.g; col[i*3+2] = c.b;
      siz[i] = Math.max(0.6, 6.5 - (s.mag || 6));
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    g.setAttribute('size', new THREE.BufferAttribute(siz, 1));
    return { starGeometry: g };
  }, [stars]);

  useFrame(({ clock }) => {
    if (refPoints.current) {
      refPoints.current.material.uniforms.time.value = clock.getElapsedTime();
      if (warpActive) {
        refPoints.current.scale.setScalar(THREE.MathUtils.lerp(refPoints.current.scale.x, 2.8, 0.05));
      } else {
        refPoints.current.scale.setScalar(THREE.MathUtils.lerp(refPoints.current.scale.x, 1.0, 0.1));
        refPoints.current.rotation.y += 0.00015;
      }
    }
  });

  if (!starGeometry) return null;
  return (
    <points ref={refPoints} geometry={starGeometry} onPointerDown={(e) => { e.stopPropagation(); onStarClick(stars[e.index]); }}>
      <shaderMaterial vertexShader={STAR_VERTEX_SHADER} fragmentShader={STAR_FRAGMENT_SHADER} uniforms={uniforms} transparent depthWrite={false} blending={THREE.AdditiveBlending} vertexColors />
    </points>
  );
}

function CameraController({ selectedStar }) {
  useFrame(({ camera }) => {
    if (selectedStar) {
      const targetPos = new THREE.Vector3(selectedStar.threeX, selectedStar.threeY, selectedStar.threeZ);
      const offset = new THREE.Vector3().subVectors(camera.position, targetPos).normalize().multiplyScalar(4);
      const idealPos = targetPos.clone().add(offset);
      camera.position.lerp(idealPos, 0.05);
      camera.lookAt(targetPos);
    }
  });
  return null;
}

export default function GalaxyScene({ onStarClick }) {
  const [stars, setStars] = useState(null);
  const [selected, setSelected] = useState(null);
  const [isWarping, setIsWarping] = useState(false);

  useEffect(() => {
    loadHygStars({ limit: 45000 }).then(setStars);
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
    <div style={{ width: '100%', height: '100vh', position: 'relative', background: '#000' }}>
      {!stars && <LoadingOverlay />}
      <Canvas camera={{ position: [0, 40, 100], fov: 60, near: 0.1, far: 10000 }} gl={{ antialias: true, logarithmicDepthBuffer: true }}>
        <Suspense fallback={null}>
          <NebulaBackground />
          <ambientLight intensity={0.25} />
          {stars && <HYGStarField stars={stars} onStarClick={handleStarSelect} warpActive={isWarping} />}
          <CameraRig enableCinematic={!selected && !isWarping} fovBoost={isWarping} />
          <CameraController selectedStar={selected} />
          <WarpStreaks active={isWarping} />
          <EffectComposer>
            <Bloom luminanceThreshold={0.15} intensity={1.8} radius={0.5} />
          </EffectComposer>
          <OrbitControls enablePan={false} minDistance={1} maxDistance={2500} makeDefault />
        </Suspense>
      </Canvas>

      <div style={{ position: 'absolute', bottom: 40, left: '50%', transform: 'translateX(-50%)', zIndex: 100 }}>
          <button 
            onClick={triggerWarp}
            style={{ 
              background: 'rgba(201,168,76,0.1)', 
              color: '#C9A84C', 
              border: '1px solid rgba(201,168,76,0.5)', 
              padding: '12px 32px', 
              borderRadius: '2px', 
              cursor: 'pointer', 
              fontSize: '10px', 
              letterSpacing: '4px', 
              fontWeight: '900',
              textTransform: 'uppercase',
              transition: 'all 0.3s ease'
            }}
          >
            Engage_Warp_Drive
          </button>
      </div>
    </div>
  );
}

function NebulaBackground() {
  const meshRef = useRef();
  const uniforms = useMemo(() => ({ time: { value: 0 } }), []);
  useFrame((state) => { if (meshRef.current) meshRef.current.material.uniforms.time.value = state.clock.getElapsedTime(); });
  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[2500, 64, 64]} />
      <shaderMaterial transparent side={THREE.BackSide} depthWrite={false} blending={THREE.AdditiveBlending} uniforms={uniforms}
        vertexShader={`varying vec3 vWorldPosition; void main() { vec4 wp = modelMatrix * vec4(position, 1.0); vWorldPosition = wp.xyz; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`}
        fragmentShader={`uniform float time; varying vec3 vWorldPosition; float noise(vec3 p) { return fract(sin(dot(p, vec3(12.9898, 78.233, 45.164))) * 43758.5453); }
          void main() { vec3 dir = normalize(vWorldPosition); float n = noise(dir * 5.0 + vec3(0.0, time * 0.01, 0.0)); gl_FragColor = vec4(vec3(0.01, 0.02, 0.04) + vec3(0.1, 0.05, 0.15) * smoothstep(0.4, 0.9, n), 1.0); }`}
      />
    </mesh>
  );
}
