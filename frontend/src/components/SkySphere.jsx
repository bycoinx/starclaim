import React, { useMemo, useRef, Suspense, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera, Float, Html } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import * as THREE from "three";
import { useT } from "../lib/i18n";
import PlanetarySystem from "./PlanetarySystem";
import ErrorBoundary from "./ui/ErrorBoundary";

// Famous Bright Stars Dataset
const BRIGHT_STARS = [
  { name: "Sirius", color: "#9bb0ff", size: 0.9, ra: 6.75, dec: -16.7, class: "A1V" },
  { name: "Canopus", color: "#f8f7ff", size: 0.8, ra: 6.4, dec: -52.7, class: "A9" },
  { name: "Arcturus", color: "#ffd2a1", size: 0.8, ra: 14.25, dec: 19.1, class: "K1" },
  { name: "Vega", color: "#cad7ff", size: 0.7, ra: 18.6, dec: 38.8, class: "A0" },
  { name: "Rigel", color: "#aabfff", size: 0.9, ra: 5.24, dec: -8.2, class: "B8" },
  { name: "Betelgeuse", color: "#ffcc6f", size: 1.3, ra: 5.9, dec: 7.4, class: "M1" },
];

const CONSTELLATIONS = [
  { 
    name: "Orion", 
    stars: [
      { ra: 5.9, dec: 7.4 },   // Betelgeuse
      { ra: 5.4, dec: -0.3 },  // Alnilam
      { ra: 5.2, dec: -8.2 },  // Rigel
      { ra: 5.6, dec: -9.7 },  // Saiph
      { ra: 5.4, dec: -0.3 },  // Alnilam
      { ra: 5.5, dec: 6.3 }    // Bellatrix
    ]
  },
  {
    name: "Leo",
    stars: [
      { ra: 10.1, dec: 11.9 }, // Regulus
      { ra: 10.3, dec: 19.8 }, // Algieba
      { ra: 11.2, dec: 20.5 }, // Zosma
      { ra: 11.8, dec: 14.5 }, // Denebola
      { ra: 11.1, dec: 15.4 }  // Chertan
    ]
  },
  {
    name: "Ursa Major",
    stars: [
      { ra: 11.0, dec: 61.7 }, // Dubhe
      { ra: 11.0, dec: 56.4 }, // Merak
      { ra: 11.9, dec: 53.7 }, // Phecda
      { ra: 12.2, dec: 57.0 }, // Megrez
      { ra: 12.9, dec: 55.9 }, // Alioth
      { ra: 13.4, dec: 49.3 }, // Mizar
      { ra: 13.8, dec: 49.3 }  // Alkaid
    ]
  }
];

function ConstellationLines() {
  return (
    <group>
      {CONSTELLATIONS.map((c, i) => {
        const points = c.stars.map(s => {
          const r = 480;
          const raRad = (s.ra / 24) * Math.PI * 2;
          const decRad = (s.dec / 180) * Math.PI;
          return new THREE.Vector3(
            r * Math.cos(decRad) * Math.cos(raRad),
            r * Math.sin(decRad),
            r * Math.cos(decRad) * Math.sin(raRad)
          );
        });
        
        return (
          <line key={i}>
            <bufferGeometry attach="geometry" setFromPoints={points} />
            <lineBasicMaterial attach="material" color="#fcd34d" transparent opacity={0.15} blending={THREE.AdditiveBlending} />
          </line>
        );
      })}
    </group>
  );
}

function StarEngine() {
  const meshRef = useRef();
  const starData = useMemo(() => {
    const data = [];
    for (let i = 0; i < 12000; i++) {
      const radius = 500 + Math.random() * 500;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.sin(phi) * Math.sin(theta);
      const z = radius * Math.cos(phi);
      const size = Math.random() * 0.8 + 0.2;
      const color = new THREE.Color().setHSL(Math.random() * 0.2 + 0.55, 0.5, 0.9);
      data.push({ x, y, z, size, color });
    }
    return data;
  }, []);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (meshRef.current) {
      starData.forEach((s, i) => {
        dummy.position.set(s.x, s.y, s.z);
        dummy.scale.setScalar(s.size * (1 + Math.sin(t * 1.5 + i) * 0.2));
        dummy.updateMatrix();
        meshRef.current.setMatrixAt(i, dummy.matrix);
        meshRef.current.setColorAt(i, s.color);
      });
      meshRef.current.instanceMatrix.needsUpdate = true;
      if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
      meshRef.current.rotation.y = t * 0.0015;
    }
  });

  return (
    <instancedMesh ref={meshRef} args={[null, null, starData.length]}>
      <sphereGeometry args={[1, 6, 6]} />
      <meshBasicMaterial transparent opacity={0.7} vertexColors />
    </instancedMesh>
  );
}

function StarFlare({ color, size = 15 }) {
  return (
    <group>
      <mesh scale={[size, size * 0.02, 1]}>
        <planeGeometry />
        <meshBasicMaterial color={color} transparent opacity={0.5} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} />
      </mesh>
      <mesh scale={[size * 0.02, size, 1]}>
        <planeGeometry />
        <meshBasicMaterial color={color} transparent opacity={0.5} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} />
      </mesh>
      <mesh scale={[size * 0.2, size * 0.2, 1]}>
        <circleGeometry args={[1, 16]} />
        <meshBasicMaterial color={color} transparent opacity={0.3} blending={THREE.AdditiveBlending} />
      </mesh>
    </group>
  );
}

function BrightStars() {
  return (
    <group>
      {BRIGHT_STARS.map((s) => {
        const r = 450;
        const raRad = (s.ra / 24) * Math.PI * 2;
        const decRad = (s.dec / 180) * Math.PI;
        const x = r * Math.cos(decRad) * Math.cos(raRad);
        const y = r * Math.sin(decRad);
        const z = r * Math.cos(decRad) * Math.sin(raRad);

        return (
          <group key={s.name} position={[x, y, z]}>
            <mesh>
              <sphereGeometry args={[s.size * 2, 16, 16]} />
              <meshBasicMaterial color={s.color} />
            </mesh>
            <StarFlare color={s.color} size={s.size * 25} />
            <pointLight distance={150} intensity={8} color={s.color} />
            <Html distanceFactor={100}>
              <div className="whitespace-nowrap pointer-events-none select-none">
                <div className="text-[14px] text-white uppercase tracking-[0.2em] font-display font-bold">{s.name}</div>
                <div className="text-[10px] text-sc-gold/60">{s.class}</div>
              </div>
            </Html>
          </group>
        );
      })}
    </group>
  );
}

function CinematicCamera({ target, viewMode }) {
  const { camera } = useThree();
  const vec = new THREE.Vector3();

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    
    if (viewMode === 'observatory') {
      // OBSERVATORY MODE: Camera stays at center (0,0,0) and looks around like Star Walk
      vec.set(0, 0, 0);
      camera.position.lerp(vec, 0.05);
    } else if (target) {
      // TARGET MODE: Focus on a specific planet/star
      vec.set(target.x, target.y + 2, target.z + 10);
      camera.position.lerp(vec, 0.05);
      camera.lookAt(target.x, target.y, target.z);
    } else {
      // DEFAULT SYSTEM MODE: Orbit around Earth
      const dist = 75; // Earth distance
      const angle = t * 0.029 + 1.5;
      const ex = Math.cos(angle) * dist;
      const ez = Math.sin(angle) * dist;
      
      vec.set(ex + 8, 3, ez + 15);
      camera.position.lerp(vec, 0.03);
      camera.lookAt(ex, 0, ez);
    }
  });
  return null;
}

function NebulaBackground() {
  const size = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  
  ctx.fillStyle = '#010208';
  ctx.fillRect(0, 0, size, size);

  const nebulaColors = [
    { c: 'rgba(200, 30, 80, 0.08)', x: 0.3, y: 0.4, r: 400 },
    { c: 'rgba(80, 40, 200, 0.08)', x: 0.7, y: 0.6, r: 500 },
    { c: 'rgba(150, 50, 180, 0.06)', x: 0.5, y: 0.3, r: 450 },
    { c: 'rgba(30, 100, 255, 0.05)', x: 0.2, y: 0.8, r: 350 },
  ];

  nebulaColors.forEach(n => {
    const grad = ctx.createRadialGradient(size*n.x, size*n.y, 0, size*n.x, size*n.y, n.r);
    grad.addColorStop(0, n.c);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(size*n.x, size*n.y, n.r, 0, Math.PI * 2);
    ctx.fill();
  });

  for (let i = 0; i < 10000; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const s = Math.random() * 1.8;
    ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.6})`;
    ctx.fillRect(x, y, s, s);
  }

  const texture = new THREE.CanvasTexture(canvas);
  return (
    <mesh>
      <sphereGeometry args={[950, 64, 64]} />
      <meshBasicMaterial map={texture} side={THREE.BackSide} />
    </mesh>
  );
}

export default function SkySphere({ stars }) {
  const { lang } = useT();
  const [target, setTarget] = useState(null);
  const [viewMode, setViewMode] = useState('system'); // 'system' or 'observatory'

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-black h-[650px] lg:h-[850px] shadow-2xl">
      <Canvas shadows gl={{ antialias: true, alpha: true, toneMapping: THREE.ACESFilmicToneMapping }}>
        <PerspectiveCamera makeDefault position={[0, 10, 100]} fov={viewMode === 'observatory' ? 70 : 45} />
        <OrbitControls 
          enableDamping 
          dampingFactor={0.03} 
          maxDistance={850} 
          minDistance={viewMode === 'observatory' ? 0.1 : 8} 
          enablePan={false}
          autoRotate={viewMode === 'system' && !target}
          autoRotateSpeed={0.1}
        />
        
        <Suspense fallback={null}>
          <NebulaBackground />
          <ambientLight intensity={viewMode === 'observatory' ? 0.8 : 0.6} />
          
          <Float speed={0.4} rotationIntensity={0.15} floatIntensity={0.15}>
            <ErrorBoundary fallback={null}>
              <PlanetarySystem onSelect={(data) => {
                setTarget(null); // Simple reset for now
              }} />
            </ErrorBoundary>
          </Float>

          <StarEngine />
          <BrightStars />
          <ConstellationLines />
          
          <CinematicCamera target={target} viewMode={viewMode} />

          <EffectComposer disableNormalPass>
            <Bloom 
              intensity={2.2} 
              luminanceThreshold={0.1} 
              luminanceSmoothing={0.9} 
              mipmapBlur 
            />
          </EffectComposer>
        </Suspense>
      </Canvas>

      {/* VIEW MODE TOGGLE */}
      <div className="absolute top-6 right-6 flex gap-2 pointer-events-auto">
        <button 
          onClick={() => setViewMode('system')}
          className={`px-4 py-2 rounded-xl border text-[10px] uppercase tracking-widest font-display transition-all backdrop-blur-md ${viewMode === 'system' ? 'bg-sc-gold text-black border-sc-gold' : 'bg-black/40 text-white border-white/10 hover:border-sc-gold/50'}`}
        >
          {lang === "TR" ? "Sistem Görünümü" : "System View"}
        </button>
        <button 
          onClick={() => setViewMode('observatory')}
          className={`px-4 py-2 rounded-xl border text-[10px] uppercase tracking-widest font-display transition-all backdrop-blur-md ${viewMode === 'observatory' ? 'bg-sc-gold text-black border-sc-gold' : 'bg-black/40 text-white border-white/10 hover:border-sc-gold/50'}`}
        >
          {lang === "TR" ? "Gözlemevi Modu" : "Observatory View"}
        </button>
      </div>

      <div className="absolute top-6 left-6 glass rounded-xl p-4 border-white/10 backdrop-blur-md pointer-events-auto cursor-pointer" onClick={() => setTarget(null)}>
        <div className="text-[10px] tracking-[0.4em] uppercase text-sc-gold mb-1 font-display">
          {viewMode === 'observatory' ? (lang === "TR" ? "Gökyüzü Rehberi" : "Sky Guide") : (lang === "TR" ? "Dünya Gözlemi" : "Earth Observation")}
        </div>
        <div className="text-[12px] text-white/80">
          {viewMode === 'observatory' ? (lang === "TR" ? "İçeriden Dışarıya" : "Looking Outward") : (lang === "TR" ? "Dışarıdan İçeriye" : "Looking Inward")}
        </div>
      </div>

      <div className="absolute bottom-6 right-6 pointer-events-none opacity-50">
         <div className="text-[9px] tracking-[1em] uppercase text-sc-gold font-display text-right">HYBRID ENGINE v4.0</div>
      </div>
    </div>
  );
}
