import React, { useMemo, useRef, Suspense, useState, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera, Float, Html } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import * as THREE from "three";
import { useT } from "../lib/i18n";
import PlanetarySystem from "./PlanetarySystem";
import ErrorBoundary from "./ui/ErrorBoundary";

// --- CONSTANTS & DATA ---
const STAR_CATALOG = [
  { name: "Sirius", color: "#9bb0ff", ra: 6.75, dec: -16.7, mag: -1.46, class: "A1V" },
  { name: "Canopus", color: "#f8f7ff", ra: 6.4, dec: -52.7, mag: -0.74, class: "A9" },
  { name: "Arcturus", color: "#ffd2a1", ra: 14.25, dec: 19.1, mag: -0.05, class: "K1" },
  { name: "Vega", color: "#cad7ff", ra: 18.6, dec: 38.8, mag: 0.03, class: "A0" },
  { name: "Rigel", color: "#aabfff", ra: 5.24, dec: -8.2, mag: 0.12, class: "B8" },
  { name: "Betelgeuse", color: "#ffcc6f", ra: 5.9, dec: 7.4, mag: 0.42, class: "M1" },
  { name: "Antares", color: "#ff6b35", ra: 16.49, dec: -26.4, mag: 0.96, class: "M1" },
];

const CONSTELLATIONS = [
  { name: "Orion", stars: [{ra:5.9, dec:7.4}, {ra:5.4, dec:-0.3}, {ra:5.2, dec:-8.2}, {ra:5.6, dec:-9.7}, {ra:5.4, dec:-0.3}, {ra:5.5, dec:6.3}] },
  { name: "Leo", stars: [{ra:10.1, dec:11.9}, {ra:10.3, dec:19.8}, {ra:11.2, dec:20.5}, {ra:11.8, dec:14.5}, {ra:11.1, dec:15.4}] },
  { name: "Ursa Major", stars: [{ra:11.0, dec:61.7}, {ra:11.0, dec:56.4}, {ra:11.9, dec:53.7}, {ra:12.2, dec:57.0}, {ra:12.9, dec:55.9}, {ra:13.4, dec:49.3}, {ra:13.8, dec:49.3}] }
];

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
      gl_PointSize = size * (450.0 / -mvPosition.z) * (0.85 + twinkle * 0.3);
      gl_Position = projectionMatrix * mvPosition;
    }
  `,
  fragmentShader: `
    varying vec3 vColor;
    varying float vTwinkle;
    void main() {
      float r = distance(gl_PointCoord, vec2(0.5));
      if (r > 0.5) discard;
      float strength = pow(1.0 - r * 2.0, 1.8);
      gl_FragColor = vec4(vColor, strength * (0.7 + vTwinkle * 0.3));
    }
  `
};

// --- COMPONENTS ---

function StarEngine({ count = 45000 }) {
  const meshRef = useRef();
  const [positions, colors, sizes] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const siz = new Float32Array(count);
    const color = new THREE.Color();
    for (let i = 0; i < count; i++) {
      const radius = 750 + Math.random() * 200;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      pos[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = radius * Math.cos(phi);
      const h = Math.random() > 0.85 ? 0.04 : (Math.random() * 0.12 + 0.58);
      color.setHSL(h, 0.3, 0.85);
      col[i * 3] = color.r; col[i * 3 + 1] = color.g; col[i * 3 + 2] = color.b;
      siz[i] = Math.random() * 1.5 + 0.4;
    }
    return [pos, col, siz];
  }, [count]);

  const uniforms = useMemo(() => ({ time: { value: 0 } }), []);
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.material.uniforms.time.value = state.clock.getElapsedTime();
      meshRef.current.rotation.y = state.clock.getElapsedTime() * 0.0003;
    }
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-customColor" count={count} array={colors} itemSize={3} />
        <bufferAttribute attach="attributes-size" count={count} array={sizes} itemSize={1} />
      </bufferGeometry>
      <shaderMaterial uniforms={uniforms} vertexShader={starShader.vertexShader} fragmentShader={starShader.fragmentShader} transparent blending={THREE.AdditiveBlending} depthWrite={false} />
    </points>
  );
}

function ConstellationLines() {
  return (
    <group>
      {CONSTELLATIONS.map((c, i) => {
        const points = c.stars.map(s => {
          const r = 580;
          const raRad = (s.ra / 24) * Math.PI * 2;
          const decRad = (s.dec / 180) * Math.PI;
          return new THREE.Vector3(r * Math.cos(decRad) * Math.cos(raRad), r * Math.sin(decRad), r * Math.cos(decRad) * Math.sin(raRad));
        });
        return (
          <line key={i}>
            <bufferGeometry attach="geometry" setFromPoints={points} />
            <lineBasicMaterial attach="material" color="#fcd34d" transparent opacity={0.08} />
          </line>
        );
      })}
    </group>
  );
}

function CinematicCamera({ target, viewMode, introFinished }) {
  const { camera } = useThree();
  const vec = new THREE.Vector3();
  const lookAtVec = new THREE.Vector3();

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    
    if (!introFinished) {
      // INTRO: Smoothly rise from ground to sky
      vec.set(0, 0, 0);
      lookAtVec.set(0, 100, -100);
      camera.position.lerp(vec, 0.02);
      camera.lookAt(lookAtVec);
      return;
    }

    if (viewMode === 'observatory') {
      vec.set(0, 0, 0);
      camera.position.lerp(vec, 0.05);
    } else if (target) {
      // Warp toward target
      vec.copy(target).multiplyScalar(0.95).add(new THREE.Vector3(0, 2, 10));
      camera.position.lerp(vec, 0.05);
      camera.lookAt(target);
    } else {
      // Cinematic orbit
      const dist = 100;
      const angle = t * 0.01;
      vec.set(Math.cos(angle) * dist, 20, Math.sin(angle) * dist);
      camera.position.lerp(vec, 0.02);
      camera.lookAt(0, 0, 0);
    }
  });
  return null;
}

function LuxuryHorizon() {
  return (
    <group position={[0, -10, 0]}>
      {/* Ground Silhuette */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[500, 64]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.95} />
      </mesh>
      {/* Atmospheric Glow on Horizon */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.1, 0]}>
        <ringGeometry args={[490, 500, 64]} />
        <meshBasicMaterial color="#3b0764" transparent opacity={0.3} blending={THREE.AdditiveBlending} />
      </mesh>
      {/* Golden Compass */}
      {['NORTH', 'EAST', 'SOUTH', 'WEST'].map((dir, i) => (
        <Html key={dir} position={[Math.cos(i * Math.PI/2) * 180, 0, Math.sin(i * Math.PI/2) * 180]}>
          <div className="text-[10px] tracking-[1em] text-sc-gold/20 font-display font-bold whitespace-nowrap">{dir}</div>
        </Html>
      ))}
    </group>
  );
}

function NebulaBackground() {
  const size = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = size; canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#010205'; ctx.fillRect(0, 0, size, size);
  const nebula = [{ c: 'rgba(40, 10, 100, 0.04)', x: 0.2, y: 0.3, r: 600 }, { c: 'rgba(120, 20, 40, 0.03)', x: 0.8, y: 0.7, r: 700 }];
  nebula.forEach(n => {
    const grad = ctx.createRadialGradient(size*n.x, size*n.y, 0, size*n.x, size*n.y, n.r);
    grad.addColorStop(0, n.c); grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(size*n.x, size*n.y, n.r, 0, Math.PI * 2); ctx.fill();
  });
  const texture = new THREE.CanvasTexture(canvas);
  return (
    <mesh>
      <sphereGeometry args={[1000, 64, 64]} />
      <meshBasicMaterial map={texture} side={THREE.BackSide} />
    </mesh>
  );
}

export default function SkySphere({ stars }) {
  const { lang } = useT();
  const [target, setTarget] = useState(null);
  const [viewMode, setViewMode] = useState('observatory');
  const [introFinished, setIntroFinished] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIntroFinished(true), 3500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="relative overflow-hidden rounded-3xl border border-sc-gold/10 bg-black h-[700px] lg:h-[900px] shadow-[0_0_100px_rgba(0,0,0,1)]">
      <Canvas shadows gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}>
        <PerspectiveCamera makeDefault position={[0, -2, 5]} fov={65} />
        <OrbitControls enableDamping dampingFactor={0.06} maxDistance={980} minDistance={0.1} enablePan={false} />
        
        <Suspense fallback={null}>
          <NebulaBackground />
          <ambientLight intensity={0.1} />
          
          <Float speed={0.1} rotationIntensity={0.02}>
            <ErrorBoundary fallback={null}>
              <PlanetarySystem onSelect={(p) => setTarget(new THREE.Vector3(p.x, p.y, p.z))} viewMode={viewMode} />
            </ErrorBoundary>
          </Float>

          <StarEngine count={60000} />
          <ConstellationLines />
          {viewMode === 'observatory' && <LuxuryHorizon />}
          
          <CinematicCamera target={target} viewMode={viewMode} introFinished={introFinished} />

          <EffectComposer disableNormalPass>
            <Bloom intensity={2.0} luminanceThreshold={0.2} mipmapBlur />
          </EffectComposer>
        </Suspense>
      </Canvas>

      {/* LUXURY APP HUD */}
      <div className="absolute inset-0 pointer-events-none p-8 flex flex-col justify-between overflow-hidden">
        {/* Top Header */}
        <div className="flex justify-between items-start">
          <div className="glass px-6 py-4 rounded-2xl border-white/5 backdrop-blur-xl pointer-events-auto transition-all hover:border-sc-gold/20">
            <div className="text-[10px] tracking-[0.6em] uppercase text-sc-gold mb-1 font-display">Observatory Active</div>
            <div className="text-[14px] text-white/90 font-display italic">
               {viewMode === 'observatory' ? (lang === "TR" ? "Yeryüzü Gözlemi" : "Earth Observation") : (lang === "TR" ? "Gezegenler Arası" : "Interplanetary")}
            </div>
          </div>
          
          <div className="flex gap-3 pointer-events-auto">
             <button onClick={() => setViewMode('observatory')} className={`px-5 py-3 rounded-2xl border text-[10px] uppercase tracking-widest font-display transition-all ${viewMode === 'observatory' ? 'bg-sc-gold text-black border-sc-gold shadow-[0_0_30px_rgba(251,191,36,0.3)]' : 'bg-black/60 text-white border-white/10 hover:border-sc-gold/40'}`}>
               {lang === "TR" ? "Gözlemevi" : "Observatory"}
             </button>
             <button onClick={() => setViewMode('system')} className={`px-5 py-3 rounded-2xl border text-[10px] uppercase tracking-widest font-display transition-all ${viewMode === 'system' ? 'bg-sc-gold text-black border-sc-gold shadow-[0_0_30px_rgba(251,191,36,0.3)]' : 'bg-black/60 text-white border-white/10 hover:border-sc-gold/40'}`}>
               {lang === "TR" ? "Sistem" : "System"}
             </button>
          </div>
        </div>

        {/* Bottom Metadata */}
        <div className="flex justify-between items-end">
          <div className="hidden lg:block opacity-40">
             <div className="text-[9px] text-white tracking-[0.5em] uppercase font-display mb-2">Live Telemetry</div>
             <div className="text-[8px] text-sc-gold/60 font-mono">LAT: 41.0082° N | LON: 28.9784° E</div>
             <div className="text-[8px] text-sc-gold/60 font-mono uppercase tracking-widest">Real-time mapping active</div>
          </div>
          <div className="text-right">
             <div className="text-[8px] tracking-[1em] uppercase text-sc-gold/40 font-display mb-1">StarClaim Premium</div>
             <div className="text-[10px] text-white/20 uppercase tracking-widest">Atmospheric Engine v6.0</div>
          </div>
        </div>
      </div>
      
      {/* Cinematic Intro Overlay */}
      {!introFinished && (
        <div className="absolute inset-0 bg-black z-50 flex items-center justify-center transition-opacity duration-1000">
           <div className="text-center animate-pulse">
              <div className="text-sc-gold text-[12px] tracking-[1.5em] uppercase font-display mb-4">Initializing</div>
              <div className="h-[1px] w-48 bg-sc-gold/20 mx-auto"></div>
           </div>
        </div>
      )}
    </div>
  );
}
