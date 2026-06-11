import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { OrbitControls, Stars } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import loadHygStars from '../../data/hygdata_v3_sample';
import CameraRig from './CameraRig';

// EXTREME STAR SHADER
const STAR_VERTEX_SHADER = `
  attribute float size;
  varying vec3 vColor;
  void main() {
    vColor = color;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = size * (1000.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const STAR_FRAGMENT_SHADER = `
  uniform float time;
  varying vec3 vColor;
  void main() {
    float r = distance(gl_PointCoord, vec2(0.5, 0.5));
    if (r > 0.5) discard;
    float glow = exp(-4.0 * r);
    float pulse = 0.8 + 0.2 * sin(time * 3.0);
    gl_FragColor = vec4(vColor * glow * pulse * 2.0, glow);
  }
`;

const NEBULA_VERTEX_SHADER = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const NEBULA_FRAGMENT_SHADER = `
  uniform float time;
  varying vec2 vUv;

  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
  }

  void main() {
    float n = noise(vUv * 2.0 + time * 0.05);
    n += 0.5 * noise(vUv * 4.0 - time * 0.02);
    
    vec3 col = mix(vec3(0.1, 0.0, 0.3), vec3(0.0, 0.2, 0.4), n);
    float mask = pow(1.0 - distance(vUv, vec2(0.5)) * 2.0, 2.0);
    gl_FragColor = vec4(col * 2.0, n * 0.3 * mask);
  }
`;

function Nebula() {
  const ref = useRef();
  const uniforms = useMemo(() => ({ time: { value: 0 } }), []);
  useFrame(({ clock }) => {
    if (ref.current) ref.current.material.uniforms.time.value = clock.getElapsedTime();
  });
  return (
    <mesh ref={ref} scale={1500}>
      <sphereGeometry args={[1, 32, 32]} />
      <shaderMaterial 
        vertexShader={NEBULA_VERTEX_SHADER} 
        fragmentShader={NEBULA_FRAGMENT_SHADER} 
        uniforms={uniforms} 
        side={THREE.BackSide} 
        transparent 
        depthWrite={false} 
        blending={THREE.AdditiveBlending} 
      />
    </mesh>
  );
}

function MilkyWay() {
  const ref = useRef();
  const { positions, colors, sizes } = useMemo(() => {
    const count = 30000;
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const siz = new Float32Array(count);
    const color = new THREE.Color();
    for(let i=0; i<count; i++) {
      const r = Math.random() * 1000;
      const branch = i % 4;
      const angle = (r * 0.005) + (branch * Math.PI * 0.5);
      const dist = (Math.random() - 0.5) * (r * 0.15 + 20);
      pos[i*3] = Math.cos(angle) * r + (Math.random()-0.5)*dist;
      pos[i*3+1] = (Math.random()-0.5) * (r * 0.05 + 10);
      pos[i*3+2] = Math.sin(angle) * r + (Math.random()-0.5)*dist;
      color.set(i < 5000 ? "#ffccaa" : "#aabbff").lerp(new THREE.Color("#ffffff"), Math.random());
      col[i*3]=color.r; col[i*3+1]=color.g; col[i*3+2]=color.b;
      siz[i] = Math.random() * 3 + 2;
    }
    return { positions: pos, colors: col, sizes: siz };
  }, []);

  useFrame(({ clock }) => {
    if (ref.current) ref.current.rotation.y = clock.getElapsedTime() * 0.01;
  });

  return (
    <points ref={ref} position={[0, -100, -600]} rotation={[0.4, 0, 0.2]}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={30000} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-color" count={30000} array={colors} itemSize={3} />
        <bufferAttribute attach="attributes-size" count={30000} array={sizes} itemSize={1} />
      </bufferGeometry>
      <shaderMaterial vertexShader={STAR_VERTEX_SHADER} fragmentShader={STAR_FRAGMENT_SHADER} transparent depthWrite={false} blending={THREE.AdditiveBlending} vertexColors uniforms={{time:{value:0}}} />
    </points>
  );
}

function Warp({ active }) {
  const ref = useRef();
  const geom = useMemo(() => {
    const pts = [];
    for(let i=0; i<500; i++) pts.push((Math.random()-0.5)*200, (Math.random()-0.5)*200, Math.random()*-2000);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    return g;
  }, []);
  useFrame(() => {
    if(active && ref.current) {
      ref.current.position.z += 50;
      if(ref.current.position.z > 1000) ref.current.position.z = 0;
    }
  });
  if(!active) return null;
  return (
    <lineSegments ref={ref} geometry={geom}>
      <lineBasicMaterial color="#4488ff" transparent opacity={0.5} />
    </lineSegments>
  );
}

export default function GalaxyScene({ onStarClick }) {
  const [stars, setStars] = useState(null);
  const [selected, setSelected] = useState(null);
  const [warp, setWarp] = useState(false);

  useEffect(() => { loadHygStars({ limit: 40000 }).then(setStars); }, []);

  return (
    <div style={{ width: '100%', height: '100vh', background: '#000' }}>
      <Canvas camera={{ position: [0, 50, 200], fov: 60, far: 20000 }}>
        <Suspense fallback={null}>
          <color attach="background" args={["#000005"]} />
          <Stars radius={3000} depth={50} count={10000} factor={4} saturation={0} fade speed={1} />
          <Nebula />
          <MilkyWay />
          <Warp active={warp} />
          {stars && (
            <points onPointerDown={(e) => { e.stopPropagation(); const s=stars[e.index]; setSelected(s); onStarClick?.(s); }}>
              <bufferGeometry>
                <bufferAttribute attach="attributes-position" count={stars.length} array={new Float32Array(stars.flatMap(s=>[s.threeX, s.threeY, s.threeZ]))} itemSize={3} />
                <bufferAttribute attach="attributes-color" count={stars.length} array={new Float32Array(stars.flatMap(s=>{const c=new THREE.Color(s.color||"#fff"); return [c.r,c.g,c.b]}))} itemSize={3} />
                <bufferAttribute attach="attributes-size" count={stars.length} array={new Float32Array(stars.map(s=>Math.max(2, 8-(s.mag||6))))} itemSize={1} />
              </bufferGeometry>
              <shaderMaterial vertexShader={STAR_VERTEX_SHADER} fragmentShader={STAR_FRAGMENT_SHADER} transparent depthWrite={false} blending={THREE.AdditiveBlending} vertexColors uniforms={{time:{value:0}}} />
            </points>
          )}
          {selected && (
            <mesh position={[selected.threeX, selected.threeY, selected.threeZ]}>
              <sphereGeometry args={[0.5, 16, 16]} />
              <meshBasicMaterial color="#C9A84C" />
              <pointLight intensity={5} color="#C9A84C" />
            </mesh>
          )}
          <CameraRig enableCinematic={!selected && !warp} fovBoost={warp} />
          <OrbitControls enablePan={false} makeDefault />
          <EffectComposer>
            <Bloom intensity={1.5} luminanceThreshold={0.1} radius={0.8} />
          </EffectComposer>
        </Suspense>
      </Canvas>
      <div style={{ position: 'absolute', bottom: 40, left: '50%', transform: 'translateX(-50%)' }}>
        <button onClick={() => { setWarp(true); setTimeout(()=>setWarp(false), 3000); }} style={{ background: 'rgba(201,168,76,0.1)', color: '#C9A84C', border: '1px solid #C9A84C', padding: '10px 30px', borderRadius: '20px', cursor: 'pointer', letterSpacing: '2px', fontWeight: 'bold' }}>ENGAGE_WARP_DRIVE</button>
      </div>
    </div>
  );
}
