import React, { useMemo, useRef, Suspense, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera, Stars, Float, Html } from "@react-three/drei";
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
      {/* Glow */}
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
                <div className="text-[14px] text-white uppercase tracking-[0.2em] font-display font-bold text-shadow-lg">{s.name}</div>
                <div className="text-[10px] text-sc-gold/60">{s.class}</div>
              </div>
            </Html>
          </group>
        );
      })}
    </group>
  );
}

function CinematicCamera({ target }) {
  const { camera } = useThree();
  const vec = new THREE.Vector3();

  useFrame((state) => {
    if (target) {
      vec.set(target.x, target.y + 2, target.z + 10);
      camera.position.lerp(vec, 0.05);
      camera.lookAt(target.x, target.y, target.z);
    } else {
      // Focus on Earth
      const t = state.clock.getElapsedTime();
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
  
  // Base cosmic background
  ctx.fillStyle = '#010208';
  ctx.fillRect(0, 0, size, size);

  // Layered Nebulae (Reds, Purples, Blues)
  const nebulaColors = [
    { c: 'rgba(200, 30, 80, 0.08)', x: 0.3, y: 0.4, r: 400 }, // Reddish
    { c: 'rgba(80, 40, 200, 0.08)', x: 0.7, y: 0.6, r: 500 }, // Bluish
    { c: 'rgba(150, 50, 180, 0.06)', x: 0.5, y: 0.3, r: 450 }, // Purple
    { c: 'rgba(30, 100, 255, 0.05)', x: 0.2, y: 0.8, r: 350 }, // Cyan
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

  // Dense Starfield
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

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-black h-[650px] lg:h-[850px] shadow-2xl">
      <Canvas shadows gl={{ antialias: true, alpha: true, toneMapping: THREE.ACESFilmicToneMapping }}>
        <PerspectiveCamera makeDefault position={[0, 10, 100]} fov={45} />
        <OrbitControls 
          enableDamping 
          dampingFactor={0.03} 
          maxDistance={850} 
          minDistance={8} 
          enablePan={false}
        />
        
        <Suspense fallback={null}>
          <NebulaBackground />
          <ambientLight intensity={0.6} />
          
          <Float speed={0.4} rotationIntensity={0.15} floatIntensity={0.15}>
            <ErrorBoundary fallback={null}>
              <PlanetarySystem onSelect={() => setTarget(null)} />
            </ErrorBoundary>
          </Float>

          <StarEngine />
          <BrightStars />
          
          <CinematicCamera target={target} />

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

      <div className="absolute top-6 left-6 glass rounded-xl p-4 border-white/10 backdrop-blur-md pointer-events-auto cursor-pointer" onClick={() => setTarget(null)}>
        <div className="text-[10px] tracking-[0.4em] uppercase text-sc-gold mb-1 font-display">Earth Observation</div>
        <div className="text-[12px] text-white/80">{lang === "TR" ? "Dünya Odaklı Görünüm" : "Earth Centered View"}</div>
      </div>

      <div className="absolute bottom-6 right-6 pointer-events-none opacity-50">
         <div className="text-[9px] tracking-[1em] uppercase text-sc-gold font-display text-right">CINEMATIC ENGINE v3.2</div>
      </div>
    </div>
  );
}
