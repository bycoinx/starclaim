import React, { useMemo, useRef, Suspense, useState, useEffect, useCallback } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera, Float, Html } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import * as THREE from "three";
import { useT } from "../lib/i18n";
import PlanetarySystem from "./PlanetarySystem";
import StarHUD from "./StarHUD";
import ErrorBoundary from "./ui/ErrorBoundary";

// --- COORDINATE HELPERS ---
const raDecToVector3 = (raStr, decStr, radius = 500) => {
  // Convert "6h 45m" or similar to hours
  const parseRA = (s) => {
    if (typeof s === 'number') return s;
    const parts = String(s).match(/(\d+)h?\s*(\d*)m?/);
    if (!parts) return 0;
    const h = parseFloat(parts[1]);
    const m = parts[2] ? parseFloat(parts[2]) : 0;
    return h + m/60;
  };
  const parseDec = (s) => {
    if (typeof s === 'number') return s;
    const parts = String(s).match(/([+-]?\d+)°?\s*(\d*)'?/);
    if (!parts) return 0;
    const d = parseFloat(parts[1]);
    const m = parts[2] ? parseFloat(parts[2]) : 0;
    return d + (d < 0 ? -m/60 : m/60);
  };

  const ra = parseRA(raStr);
  const dec = parseDec(decStr);
  
  const phi = (90 - dec) * (Math.PI / 180);
  const theta = (ra * 15) * (Math.PI / 180);
  
  return new THREE.Vector3(
    radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
};

// --- SHADERS ---
const starShader = {
  vertexShader: `
    uniform float time;
    attribute float size;
    attribute vec3 customColor;
    varying vec3 vColor;
    varying float vTwinkle;
    void main() {
      vColor = customColor;
      float twinkle = sin(time * 3.0 + position.x * 10.0) * 0.5 + 0.5;
      vTwinkle = twinkle;
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      gl_PointSize = size * (600.0 / -mvPosition.z) * (0.8 + twinkle * 0.4);
      gl_Position = projectionMatrix * mvPosition;
    }
  `,
  fragmentShader: `
    varying vec3 vColor;
    varying float vTwinkle;
    void main() {
      float r = distance(gl_PointCoord, vec2(0.5));
      if (r > 0.5) discard;
      float strength = pow(1.0 - r * 2.0, 1.5);
      gl_FragColor = vec4(vColor, strength * (0.6 + vTwinkle * 0.4));
    }
  `
};

// --- COMPONENTS ---

function RealStars({ stars, onSelect }) {
  const meshRef = useRef();
  const { raycaster, mouse, camera } = useThree();

  const [positions, colors, sizes, ids] = useMemo(() => {
    const count = stars.length;
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const siz = new Float32Array(count);
    const starIds = stars.map(s => s.star_id);
    
    const color = new THREE.Color();
    stars.forEach((s, i) => {
      const v = raDecToVector3(s.ra, s.dec, 480 + Math.random() * 20);
      pos[i * 3] = v.x; pos[i * 3 + 1] = v.y; pos[i * 3 + 2] = v.z;
      
      const tierColor = s.tier === 'legendary' ? '#fcd34d' : s.tier === 'zodiac' ? '#a78bfa' : '#ffffff';
      color.set(tierColor);
      col[i * 3] = color.r; col[i * 3 + 1] = color.g; col[i * 3 + 2] = color.b;
      
      siz[i] = s.tier === 'legendary' ? 4.5 : s.tier === 'zodiac' ? 3.5 : 2.5;
    });
    return [pos, col, siz, starIds];
  }, [stars]);

  const uniforms = useMemo(() => ({ time: { value: 0 } }), []);
  useFrame((state) => {
    if (meshRef.current) meshRef.current.material.uniforms.time.value = state.clock.getElapsedTime();
  });

  return (
    <points 
      ref={meshRef}
      onClick={(e) => {
        e.stopPropagation();
        const index = e.index;
        if (index !== undefined && stars[index]) {
          onSelect(stars[index]);
        }
      }}
    >
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={stars.length} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-customColor" count={stars.length} array={colors} itemSize={3} />
        <bufferAttribute attach="attributes-size" count={stars.length} array={sizes} itemSize={1} />
      </bufferGeometry>
      <shaderMaterial uniforms={uniforms} vertexShader={starShader.vertexShader} fragmentShader={starShader.fragmentShader} transparent blending={THREE.AdditiveBlending} depthWrite={false} />
    </points>
  );
}

function CinematicCamera({ targetPos, viewMode, introFinished }) {
  const { camera } = useThree();
  const vec = new THREE.Vector3();

  useFrame((state) => {
    if (!introFinished) return;

    if (viewMode === 'observatory') {
      vec.set(0, 0, 0);
      camera.position.lerp(vec, 0.05);
    } else if (targetPos) {
      // Warp toward target
      vec.copy(targetPos).multiplyScalar(0.92).add(new THREE.Vector3(0, 2, 5));
      camera.position.lerp(vec, 0.05);
      camera.lookAt(targetPos);
    } else {
      const t = state.clock.getElapsedTime();
      const dist = 150;
      const angle = t * 0.015;
      vec.set(Math.cos(angle) * dist, 30, Math.sin(angle) * dist);
      camera.position.lerp(vec, 0.02);
      camera.lookAt(0, 0, 0);
    }
  });
  return null;
}

function NebulaBackground() {
  return (
    <mesh>
      <sphereGeometry args={[990, 64, 64]} />
      <meshBasicMaterial side={THREE.BackSide} transparent opacity={0.6}>
        <gradientTexture stops={[0, 0.5, 1]} colors={['#000005', '#050510', '#000005']} />
      </meshBasicMaterial>
    </mesh>
  );
}

export default function SkySphere({ stars, onClaim }) {
  const { lang } = useT();
  const [selectedStar, setSelectedStar] = useState(null);
  const [targetPos, setTargetPos] = useState(null);
  const [viewMode, setViewMode] = useState('observatory');
  const [introFinished, setIntroFinished] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIntroFinished(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  const handleSelect = useCallback((star) => {
    setSelectedStar(star);
    const pos = raDecToVector3(star.ra, star.dec, 480);
    setTargetPos(pos);
  }, []);

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/5 bg-black h-[700px] lg:h-[900px]">
      <Canvas shadows gl={{ antialias: true }}>
        <PerspectiveCamera makeDefault position={[0, 0, 100]} fov={60} />
        <OrbitControls enableDamping dampingFactor={0.06} maxDistance={950} minDistance={0.1} />
        
        <Suspense fallback={null}>
          <ambientLight intensity={0.2} />
          <RealStars stars={stars} onSelect={handleSelect} />
          
          <Float speed={0.15} rotationIntensity={0.05}>
            <ErrorBoundary fallback={null}>
              <PlanetarySystem onSelect={handleSelect} viewMode={viewMode} />
            </ErrorBoundary>
          </Float>

          <CinematicCamera targetPos={targetPos} viewMode={viewMode} introFinished={introFinished} />

          <EffectComposer disableNormalPass>
            <Bloom intensity={2.0} luminanceThreshold={0.2} mipmapBlur />
          </EffectComposer>
        </Suspense>
      </Canvas>

      <StarHUD 
        star={selectedStar} 
        onClaim={onClaim} 
        onClose={() => { setSelectedStar(null); setTargetPos(null); }} 
      />

      {/* VIEW CONTROLS */}
      <div className="absolute top-8 left-8 flex gap-3 pointer-events-auto">
         <button onClick={() => setViewMode('observatory')} className={`px-6 py-3 rounded-2xl border text-[10px] uppercase tracking-widest font-display transition-all ${viewMode === 'observatory' ? 'bg-sc-gold text-black border-sc-gold' : 'bg-black/60 text-white border-white/10 hover:border-sc-gold/40'}`}>
           {lang === "TR" ? "Gözlemevi" : "Observatory"}
         </button>
         <button onClick={() => setViewMode('system')} className={`px-6 py-3 rounded-2xl border text-[10px] uppercase tracking-widest font-display transition-all ${viewMode === 'system' ? 'bg-sc-gold text-black border-sc-gold' : 'bg-black/60 text-white border-white/10 hover:border-sc-gold/40'}`}>
           {lang === "TR" ? "Sistem" : "System"}
         </button>
      </div>
    </div>
  );
}
