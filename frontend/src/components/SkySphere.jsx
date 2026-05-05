import React, { useMemo, useRef, Suspense } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera, Stars, Float } from "@react-three/drei";
import * as THREE from "three";
import { useT } from "../lib/i18n";
import SpaceTimeGrid from "./SpaceTimeGrid";
import PlanetarySystem from "./PlanetarySystem";
import ErrorBoundary from "./ui/ErrorBoundary";

/**
 * StarEngine: 10,000+ stars with cinematic twinkling
 */
function StarEngine({ stars = [] }) {
  const meshRef = useRef();
  
  const starData = useMemo(() => {
    const data = [];
    const count = 12000;
    const starList = Array.isArray(stars) ? stars : [];
    const len = starList.length;
    for (let i = 0; i < count; i++) {
      const s = len > 0 ? starList[i % len] : {};
      const radius = 300 + Math.random() * 500;
      const ra = typeof s.ra === "string" ? s.ra : `${Math.random()*24}h`;
      const dec = typeof s.dec === "string" ? s.dec : `${Math.random()*180-90}`;
      
      // Conversion logic moved inline for performance
      const hMatch = ra.match(/(-?\d+(?:\.\d+)?)h/);
      const h = hMatch ? Number(hMatch[1]) : Math.random() * 24;
      const r_ra = (h / 24) * Math.PI * 2;
      
      const dMatch = dec.match(/[-+]?\d+(?:\.\d+)?/);
      const d = dMatch ? Number(dMatch[0]) : Math.random() * 180 - 90;
      const r_dec = THREE.MathUtils.degToRad(d);

      const x = radius * Math.cos(r_dec) * Math.cos(r_ra);
      const y = radius * Math.sin(r_dec);
      const z = radius * Math.cos(r_dec) * Math.sin(r_ra);

      const mag = s.magnitude || (Math.random() * 5 + 1);
      const size = Math.max(0.12, (6 - mag) * 0.35);
      const color = new THREE.Color().setHSL(Math.random() * 0.1 + 0.6, 0.3, 0.9);
      data.push({ x, y, z, size, color });
    }
    return data;
  }, [stars]);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (meshRef.current) {
      meshRef.current.rotation.y = t * 0.005;
    }
  });

  return (
    <instancedMesh ref={meshRef} args={[null, null, starData.length]}>
      <sphereGeometry args={[1, 4, 4]} />
      <meshBasicMaterial transparent opacity={0.8} vertexColors />
    </instancedMesh>
  );
}

function CinematicCamera() {
  const { camera } = useThree();
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    camera.position.x = Math.sin(t * 0.1) * 20;
    camera.position.y = Math.cos(t * 0.1) * 10;
    camera.lookAt(0, 0, 0);
  });
  return null;
}

export default function SkySphere({ stars }) {
  const { lang } = useT();

  return (
    <div className="relative overflow-hidden rounded-3xl border border-sc-gold/10 bg-[#020617] h-[650px] lg:h-[850px] shadow-2xl">
      <Canvas shadows gl={{ antialias: true, alpha: true }}>
        <PerspectiveCamera makeDefault position={[0, 50, 400]} fov={40} />
        <OrbitControls 
          enableDamping 
          dampingFactor={0.03} 
          maxDistance={700} 
          minDistance={50} 
          autoRotate
          autoRotateSpeed={0.2}
          enablePan={false}
        />
        
        <Suspense fallback={null}>
          <color attach="background" args={["#010409"]} />
          <fog attach="fog" args={["#010409", 200, 900]} />
          
          <ambientLight intensity={0.2} />
          <pointLight position={[100, 100, 100]} intensity={2} color="#fcd34d" />
          
          <Float speed={1.5} rotationIntensity={0.5} floatIntensity={0.5}>
            <ErrorBoundary fallback={null}>
              <PlanetarySystem onSelect={() => {}} />
            </ErrorBoundary>
          </Float>

          <SpaceTimeGrid massCenters={[]} />
          <StarEngine stars={stars} />
          
          <Stars radius={500} depth={50} count={15000} factor={4} saturation={0} fade speed={1} />
          <CinematicCamera />
        </Suspense>
      </Canvas>

      {/* Decorative Overlay - No Interaction */}
      <div className="absolute inset-0 pointer-events-none p-10 flex flex-col justify-between border border-sc-gold/5 rounded-3xl">
        <div className="flex justify-between items-start opacity-50">
          <div className="glass rounded-xl p-4 border-white/5 backdrop-blur-md">
            <div className="text-[9px] tracking-[0.5em] uppercase text-sc-gold mb-1 font-display">Observation Mode</div>
            <div className="text-[11px] text-sc-text-muted">{lang === "TR" ? "Derin Uzay Atlası — Gerçek Zamanlı" : "Deep Space Atlas — Real-time"}</div>
          </div>
        </div>

        <div className="flex justify-center mb-10">
          <div className="text-center">
            <div className="text-[10px] tracking-[0.8em] uppercase text-sc-gold/40 font-display animate-pulse">
              {lang === "TR" ? "Sonsuzluk İzleniyor" : "Watching Infinity"}
            </div>
          </div>
        </div>
      </div>
      
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 pointer-events-none opacity-20">
         <div className="text-[8px] tracking-[1em] uppercase text-sc-text-muted font-display text-center">StarClaim Cinematic Engine v2.0</div>
      </div>
    </div>
  );
}
