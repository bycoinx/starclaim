import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { OrbitControls, Stars, Float } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import loadHygStars from '../../data/hygdata_v3_sample';
import CameraRig from './CameraRig';

// --- SHADERS ---

const GALAXY_STAR_VERTEX = `
  attribute float size;
  attribute vec3 color;
  attribute float aRandom;
  varying vec3 vColor;
  uniform float uTime;

  void main() {
    vColor = color;
    vec4 modelPosition = modelMatrix * vec4(position, 1.0);

    // Dynamic rotation based on distance
    float distanceToCenter = length(modelPosition.xz);
    float angle = atan(modelPosition.x, modelPosition.z);
    float angleOffset = (1.0 / distanceToCenter) * uTime * 0.15;
    angle += angleOffset;

    modelPosition.x = cos(angle) * distanceToCenter;
    modelPosition.z = sin(angle) * distanceToCenter;

    // Small twinkle effect
    float twinkle = 0.8 + 0.2 * sin(uTime * 2.0 + aRandom * 100.0);

    vec4 viewPosition = viewMatrix * modelPosition;
    gl_Position = projectionMatrix * viewPosition;
    
    // Perspective sizing
    gl_PointSize = size * (800.0 / -viewPosition.z) * twinkle;
  }
`;

const GALAXY_STAR_FRAGMENT = `
  varying vec3 vColor;
  void main() {
    float d = distance(gl_PointCoord, vec2(0.5));
    if (d > 0.5) discard;
    float strength = pow(1.0 - d * 2.0, 4.0);
    gl_FragColor = vec4(vColor * 2.0, strength);
  }
`;

const GAS_FRAGMENT = `
  varying vec3 vColor;
  void main() {
    float d = distance(gl_PointCoord, vec2(0.5));
    if (d > 0.5) discard;
    float strength = exp(-5.0 * d);
    gl_FragColor = vec4(vColor, strength * 0.3);
  }
`;

// --- COMPONENTS ---

function Nebula() {
  const meshRef = useRef();
  const uniforms = useMemo(() => ({ uTime: { value: 0 } }), []);

  useFrame(({ clock }) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = clock.getElapsedTime() * 0.005;
      meshRef.current.material.uniforms.uTime.value = clock.getElapsedTime();
    }
  });

  return (
    <mesh ref={meshRef} scale={2500}>
      <sphereGeometry args={[1, 64, 64]} />
      <shaderMaterial
        side={THREE.BackSide}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        uniforms={uniforms}
        vertexShader={`
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
        fragmentShader={`
          uniform float uTime;
          varying vec2 vUv;
          
          float noise(vec2 p) {
            return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
          }

          void main() {
            vec2 p = vUv * 4.0;
            float n = noise(p + uTime * 0.01);
            vec3 col = mix(vec3(0.01, 0.02, 0.05), vec3(0.05, 0.02, 0.08), n);
            float mask = pow(1.0 - distance(vUv, vec2(0.5)) * 2.0, 3.0);
            gl_FragColor = vec4(col, mask * 0.2);
          }
        `}
      />
    </mesh>
  );
}

function ProfessionalMilkyWay() {
  const starRef = useRef();
  const gasRef = useRef();
  
  const parameters = {
    count: 60000,
    size: 2,
    radius: 1200,
    branches: 4,
    spin: 1.2,
    randomness: 0.2,
    randomnessPower: 3,
    insideColor: "#ffaa44",
    outsideColor: "#4488ff"
  };

  const { positions, colors, sizes, randomness, gasPositions, gasColors } = useMemo(() => {
    const pos = new Float32Array(parameters.count * 3);
    const col = new Float32Array(parameters.count * 3);
    const siz = new Float32Array(parameters.count);
    const rand = new Float32Array(parameters.count);
    
    const gasPos = new Float32Array(parameters.count * 0.5 * 3);
    const gasCol = new Float32Array(parameters.count * 0.5 * 3);

    const colorInside = new THREE.Color(parameters.insideColor);
    const colorOutside = new THREE.Color(parameters.outsideColor);

    for (let i = 0; i < parameters.count; i++) {
      const i3 = i * 3;
      const radius = Math.random() * parameters.radius;
      const spinAngle = radius * parameters.spin * 0.01;
      const branchAngle = (i % parameters.branches) / parameters.branches * Math.PI * 2;

      const randomX = Math.pow(Math.random(), parameters.randomnessPower) * (Math.random() < 0.5 ? 1 : -1) * parameters.randomness * radius;
      const randomY = Math.pow(Math.random(), parameters.randomnessPower) * (Math.random() < 0.5 ? 1 : -1) * parameters.randomness * radius * 0.3;
      const randomZ = Math.pow(Math.random(), parameters.randomnessPower) * (Math.random() < 0.5 ? 1 : -1) * parameters.randomness * radius;

      pos[i3] = Math.cos(branchAngle + spinAngle) * radius + randomX;
      pos[i3 + 1] = randomY;
      pos[i3 + 2] = Math.sin(branchAngle + spinAngle) * radius + randomZ;

      const mixedColor = colorInside.clone().lerp(colorOutside, radius / parameters.radius);
      col[i3] = mixedColor.r;
      col[i3 + 1] = mixedColor.g;
      col[i3 + 2] = mixedColor.b;

      siz[i] = Math.random() * parameters.size + 1;
      rand[i] = Math.random();

      // Gas layer (H-alpha)
      if (i < parameters.count * 0.5) {
        gasPos[i3] = pos[i3] * 1.05;
        gasPos[i3 + 1] = pos[i3 + 1] * 1.2;
        gasPos[i3 + 2] = pos[i3 + 2] * 1.05;
        
        const gasColor = new THREE.Color(i % 10 === 0 ? "#ff22aa" : "#4444ff"); // Pink/Purple gas
        gasCol[i3] = gasColor.r;
        gasCol[i3 + 1] = gasColor.g;
        gasCol[i3 + 2] = gasColor.b;
      }
    }

    return { positions: pos, colors: col, sizes: siz, randomness: rand, gasPositions: gasPos, gasColors: gasCol };
  }, []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (starRef.current) starRef.current.material.uniforms.uTime.value = t;
    if (gasRef.current) gasRef.current.rotation.y = t * 0.005;
  });

  return (
    <group position={[0, -100, -800]} rotation={[0.4, 0, 0.2]}>
      {/* Stars Layer */}
      <points ref={starRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={parameters.count} array={positions} itemSize={3} />
          <bufferAttribute attach="attributes-color" count={parameters.count} array={colors} itemSize={3} />
          <bufferAttribute attach="attributes-size" count={parameters.count} array={sizes} itemSize={1} />
          <bufferAttribute attach="attributes-aRandom" count={parameters.count} array={randomness} itemSize={1} />
        </bufferGeometry>
        <shaderMaterial
          vertexShader={GALAXY_STAR_VERTEX}
          fragmentShader={GALAXY_STAR_FRAGMENT}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          vertexColors
          uniforms={{ uTime: { value: 0 } }}
        />
      </points>

      {/* Gas/Nebula Layer (H-alpha) */}
      <points ref={gasRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={parameters.count * 0.5} array={gasPositions} itemSize={3} />
          <bufferAttribute attach="attributes-color" count={parameters.count * 0.5} array={gasColors} itemSize={3} />
        </bufferGeometry>
        <shaderMaterial
          vertexShader={GALAXY_STAR_VERTEX.replace('gl_PointSize = size', 'gl_PointSize = 40.0')}
          fragmentShader={GAS_FRAGMENT}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          vertexColors
          uniforms={{ uTime: { value: 0 } }}
        />
      </points>

      {/* Volumetric Bulge Core */}
      <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
        <mesh>
          <sphereGeometry args={[80, 32, 32]} />
          <meshBasicMaterial color="#ffccaa" transparent opacity={0.15} blending={THREE.AdditiveBlending} />
        </mesh>
        <pointLight intensity={10} color="#ffccaa" distance={500} />
      </Float>
    </group>
  );
}

function WarpStreaks({ active }) {
  const ref = useRef();
  const geom = useMemo(() => {
    const pts = [];
    for(let i=0; i<1000; i++) {
      const x = (Math.random()-0.5) * 400;
      const y = (Math.random()-0.5) * 400;
      const z = Math.random() * -2000;
      pts.push(x, y, z, x, y, z + 200);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    return g;
  }, []);

  useFrame(() => {
    if(active && ref.current) {
      ref.current.position.z += 80;
      if(ref.current.position.z > 1500) ref.current.position.z = 0;
    }
  });

  if(!active) return null;

  return (
    <lineSegments ref={ref} geometry={geom}>
      <lineBasicMaterial color="#88ccff" transparent opacity={0.4} />
    </lineSegments>
  );
}

export default function GalaxyScene({ onStarClick }) {
  const [stars, setStars] = useState(null);
  const [selected, setSelected] = useState(null);
  const [warp, setWarp] = useState(false);

  useEffect(() => {
    loadHygStars({ limit: 40000 }).then(setStars);
  }, []);

  const triggerWarp = () => {
    setWarp(true);
    setTimeout(() => setWarp(false), 3000);
  };

  return (
    <div style={{ width: '100%', height: '100vh', background: '#000', position: 'relative' }}>
      <Canvas camera={{ position: [0, 80, 250], fov: 60, far: 20000 }}>
        <Suspense fallback={null}>
          <color attach="background" args={["#000002"]} />
          
          <Stars radius={3000} depth={100} count={15000} factor={6} saturation={0} fade speed={1} />
          
          <Nebula />
          <ProfessionalMilkyWay />
          <WarpStreaks active={warp} />

          {stars && (
            <points onPointerDown={(e) => { e.stopPropagation(); const s=stars[e.index]; setSelected(s); onStarClick?.(s); }}>
              <bufferGeometry>
                <bufferAttribute attach="attributes-position" count={stars.length} array={new Float32Array(stars.flatMap(s=>[s.threeX, s.threeY, s.threeZ]))} itemSize={3} />
                <bufferAttribute attach="attributes-color" count={stars.length} array={new Float32Array(stars.flatMap(s=>{const c=new THREE.Color(s.color||"#fff"); return [c.r,c.g,c.b]}))} itemSize={3} />
                <bufferAttribute attach="attributes-size" count={stars.length} array={new Float32Array(stars.map(s=>Math.max(2, 10-(s.mag||6))))} itemSize={1} />
              </bufferGeometry>
              <shaderMaterial
                vertexShader={GALAXY_STAR_VERTEX}
                fragmentShader={GALAXY_STAR_FRAGMENT}
                transparent
                depthWrite={false}
                blending={THREE.AdditiveBlending}
                vertexColors
                uniforms={{ uTime: { value: 0 } }}
              />
            </points>
          )}

          {selected && (
            <group position={[selected.threeX, selected.threeY, selected.threeZ]}>
              <mesh>
                <sphereGeometry args={[0.8, 16, 16]} />
                <meshBasicMaterial color="#C9A84C" />
              </mesh>
              <pointLight intensity={8} color="#C9A84C" distance={100} />
            </group>
          )}

          <CameraRig enableCinematic={!selected && !warp} fovBoost={warp} />
          <OrbitControls enablePan={false} maxDistance={5000} makeDefault />
          
          <EffectComposer>
            <Bloom intensity={2.0} luminanceThreshold={0.05} radius={0.7} />
          </EffectComposer>
        </Suspense>
      </Canvas>

      <div style={{ position: 'absolute', bottom: 40, left: '50%', transform: 'translateX(-50%)' }}>
        <button 
          onClick={triggerWarp}
          style={{ 
            background: 'rgba(201,168,76,0.1)', 
            color: '#C9A84C', 
            border: '1px solid #C9A84C', 
            padding: '12px 40px', 
            borderRadius: '100px', 
            cursor: 'pointer', 
            letterSpacing: '5px', 
            fontWeight: '900',
            backdropFilter: 'blur(10px)',
            transition: 'all 0.3s'
          }}
          onMouseEnter={(e) => e.target.style.background = 'rgba(201,168,76,0.2)'}
          onMouseLeave={(e) => e.target.style.background = 'rgba(201,168,76,0.1)'}
        >
          ENGAGE_WARP_DRIVE
        </button>
      </div>
    </div>
  );
}
