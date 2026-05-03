import React, { useEffect, useMemo, useRef, useState, Suspense } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera, Stars } from "@react-three/drei";
import * as THREE from "three";
import { Crown, Gem, LocateFixed, ShoppingBag, Sparkles, Star, Lock, EyeOff, ShieldCheck, Loader2, Zap } from "lucide-react";
import { useT } from "../lib/i18n";
import SpaceTimeGrid from "./SpaceTimeGrid";
import PlanetarySystem from "./PlanetarySystem";

const tierMeta = {
  legendary: { color: "#E0BB6A", aura: "#C9A84C", label: "Tier 1", boost: 2.2, Icon: Crown },
  zodiac: { color: "#B197FC", aura: "#7B5EA7", label: "Tier 1", boost: 1.8, Icon: Gem },
  named: { color: "#7CC4FF", aura: "#4DA6FF", label: "Tier 2", boost: 1.4, Icon: Sparkles },
  constellation: { color: "#5EF0BF", aura: "#2DD4A0", label: "Tier 2", boost: 1.2, Icon: Star },
  standard: { color: "#F0F4FF", aura: "#8899BB", label: "Tier 3", boost: 1.0, Icon: Star },
  protected: { color: "#FFD700", aura: "#FFA500", label: "VAULT", boost: 2.5, Icon: Lock },
};

function parseRa(ra = "0h 0m") {
  const hMatch = ra.match(/(-?\d+(?:\.\d+)?)h/);
  const mMatch = ra.match(/(\d+(?:\.\d+)?)m/);
  const h = hMatch ? Number(hMatch[1]) : 0;
  const m = mMatch ? Number(mMatch[1]) : 0;
  return ((h + m / 60) / 24) * Math.PI * 2;
}

function parseDec(dec = "0") {
  const match = dec.match(/[-+]?\d+(?:\.\d+)?/);
  return THREE.MathUtils.degToRad(match ? Number(match[0]) : 0);
}

function getXYZ(raStr, decStr, radius) {
  const ra = parseRa(raStr);
  const dec = parseDec(decStr);
  return [
    radius * Math.cos(dec) * Math.cos(ra),
    radius * Math.sin(dec),
    radius * Math.cos(dec) * Math.sin(ra)
  ];
}

/**
 * StarEngine: Renders 10,000+ stars using InstancedMesh for maximum performance.
 */
function StarEngine({ stars, onSelect }) {
  const meshRef = useRef();
  
  const starData = useMemo(() => {
    const data = [];
    const count = 10000;
    for (let i = 0; i < count; i++) {
      const s = stars[i % stars.length] || {};
      const radius = 250 + Math.random() * 400;
      const [x, y, z] = getXYZ(s.ra || `${Math.random()*24}h`, s.dec || `${Math.random()*180-90}`, radius);
      const mag = s.magnitude || (Math.random() * 5 + 1);
      const size = Math.max(0.15, (6 - mag) * 0.4);
      const spectralColor = new THREE.Color().setHSL(Math.random() * 0.1 + 0.55, 0.2, 0.95);
      data.push({ x, y, z, size, color: spectralColor, star: s });
    }
    return data;
  }, [stars]);

  useEffect(() => {
    const tempObject = new THREE.Object3D();
    starData.forEach((s, i) => {
      tempObject.position.set(s.x, s.y, s.z);
      tempObject.scale.setScalar(s.size);
      tempObject.updateMatrix();
      meshRef.current.setMatrixAt(i, tempObject.matrix);
      meshRef.current.setColorAt(i, s.color);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
    meshRef.current.instanceColor.needsUpdate = true;
  }, [starData]);

  return (
    <instancedMesh ref={meshRef} args={[null, null, starData.length]}>
      <sphereGeometry args={[1, 6, 6]} />
      <meshBasicMaterial transparent opacity={0.9} vertexColors />
    </instancedMesh>
  );
}

function CameraController({ target }) {
  const { camera, controls } = useThree();
  useFrame(() => {
    if (target && controls) {
      const targetVec = new THREE.Vector3(...target);
      controls.target.lerp(targetVec, 0.05);
      const camPos = new THREE.Vector3(...target).add(new THREE.Vector3(15, 15, 40));
      camera.position.lerp(camPos, 0.05);
    }
  });
  return null;
}

export default function SkySphere({ stars, onClaim }) {
  const { t, lang } = useT();
  const [selected, setSelected] = useState(null);
  const [targetPos, setTargetPos] = useState(null);
  
  const handleSelect = (star) => {
    setSelected(star);
    if (star.ra && star.dec) {
      const radius = star.tier === "protected" ? 30 : 150;
      setTargetPos(getXYZ(star.ra, star.dec, radius));
    }
  };

  return (
    <div className="relative overflow-hidden rounded-3xl border border-sc-gold/20 bg-[#020617] h-[650px] lg:h-[850px]">
      <Canvas shadows gl={{ antialias: true }}>
        <PerspectiveCamera makeDefault position={[0, 100, 300]} fov={45} />
        <OrbitControls 
          enableDamping 
          dampingFactor={0.05} 
          maxDistance={800} 
          minDistance={10} 
          autoRotate={!selected}
          autoRotateSpeed={0.05}
        />
        
        <Suspense fallback={null}>
          <ambientLight intensity={0.5} />
          <pointLight position={[150, 150, 150]} intensity={2} color="#E0BB6A" />
          
          <SpaceTimeGrid massCenters={selected ? [{ x: targetPos?.[0]||0, z: targetPos?.[2]||0, mass: 4, radius: 8 }] : []} />
          <PlanetarySystem onSelect={handleSelect} />
          <StarEngine stars={stars} onSelect={handleSelect} />
          
          <Stars radius={500} depth={100} count={6000} factor={8} saturation={0} fade speed={1} />
          <CameraController target={targetPos} />
        </Suspense>
      </Canvas>

      {/* UI Overlays */}
      <div className="absolute inset-0 pointer-events-none p-8 flex flex-col justify-between">
        <div className="flex justify-between items-start">
          <div className="glass rounded-2xl p-5 border-sc-gold/30 backdrop-blur-xl">
            <div className="text-[10px] tracking-[0.5em] uppercase text-sc-gold mb-1 font-display">StarClaim Original Engine</div>
            <div className="text-sm text-sc-text-muted">{lang === "TR" ? "Vizioner Demo v2.5 — Uzay-Zaman Atlası" : "Visionary Demo v2.5 — Space-Time Atlas"}</div>
          </div>
          <div className="glass rounded-2xl p-5 text-right border-sc-gold/30 backdrop-blur-xl">
            <div className="text-[10px] tracking-[0.4em] uppercase text-sc-text-muted mb-1">Resonance Status</div>
            <div className="text-sm text-sc-blue flex items-center gap-2 justify-end">
              <Zap className="w-4 h-4 animate-pulse" /> Quantum Synchronized
            </div>
          </div>
        </div>

        <div className="flex justify-center">
          <div className="glass-gold rounded-3xl p-8 pointer-events-auto w-full max-w-lg animate-fade-up border-sc-gold/50 shadow-2xl backdrop-blur-2xl">
            {selected ? (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className={`text-[10px] tracking-[0.4em] uppercase px-3 py-1.5 rounded-full bg-sc-gold/10 ${selected.tier === 'protected' ? 'text-sc-gold border border-sc-gold/30' : 'text-sc-text-muted border border-white/10'}`}>
                    {selected.tier === 'protected' ? 'PROHIBITED: Sovereign Territory' : t(`tier_${selected.tier}`)}
                  </div>
                  <div className="font-mono text-xs text-sc-blue">{selected.code}</div>
                </div>
                
                <div className="flex items-end justify-between gap-4 mb-6">
                  <div>
                    <h3 className="font-display text-4xl gold-gradient-text leading-none mb-2 uppercase">{selected.name}</h3>
                    <p className="text-xs text-sc-text-muted tracking-widest uppercase">{selected.constellation || "Deep Space"}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] uppercase tracking-widest text-sc-text-muted mb-1">Distance</div>
                    <div className="text-lg font-display text-sc-gold">{Math.floor(Math.random() * 500 + 10)} LY</div>
                  </div>
                </div>

                {selected.tier === "protected" ? (
                  <div className="space-y-6">
                    <div className="bg-sc-gold/5 rounded-2xl p-5 border border-sc-gold/20 flex flex-col gap-3">
                      <div className="flex items-center gap-3">
                        <Lock className="w-6 h-6 text-sc-gold" />
                        <div className="text-sm text-sc-gold uppercase tracking-[0.2em] font-display">Mutlak Hak Talebi</div>
                      </div>
                      <p className="text-sm italic font-accent text-sc-text/90 leading-relaxed">
                        {selected.description || "Bu cisim, StarClaim Aile Protokolü kapsamında kilitlenmiştir."}
                      </p>
                    </div>
                    <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-sc-gold/60 font-display pt-2 border-t border-sc-gold/10">
                      <span>Resonance: 100% (Absolute)</span>
                      <span>Stability: Synchronized</span>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-3 gap-4 mb-8">
                      <div className="glass rounded-2xl p-4 text-center border-white/5">
                        <div className="text-[10px] uppercase text-sc-text-muted tracking-widest mb-2">RA</div>
                        <div className="text-sm font-mono text-sc-blue">{selected.ra}</div>
                      </div>
                      <div className="glass rounded-2xl p-4 text-center border-white/5">
                        <div className="text-[10px] uppercase text-sc-text-muted tracking-widest mb-2">Dec</div>
                        <div className="text-sm font-mono text-sc-blue">{selected.dec}</div>
                      </div>
                      <div className="glass rounded-2xl p-4 text-center border-white/5">
                        <div className="text-[10px] uppercase text-sc-text-muted tracking-widest mb-2">Mag</div>
                        <div className="text-sm font-mono text-sc-gold">{selected.magnitude || "4.5"}</div>
                      </div>
                    </div>
                    
                    <div className="mb-8">
                      <div className="flex justify-between items-end mb-2">
                        <div className="text-[10px] uppercase tracking-widest text-sc-text-muted font-display">Meaning Resonance</div>
                        <div className="text-xs text-sc-blue font-mono">87.4%</div>
                      </div>
                      <div className="h-1.5 w-full bg-sc-blue/10 rounded-full overflow-hidden border border-sc-blue/10">
                         <div className="h-full bg-sc-blue animate-pulse shadow-[0_0_15px_#3b82f6]" style={{ width: '87.4%' }} />
                      </div>
                    </div>

                    <button 
                      onClick={() => onClaim(selected)} 
                      className="btn-gold w-full flex items-center justify-center gap-3 py-5 text-xl group overflow-hidden relative shadow-2xl"
                    >
                      <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                      <ShoppingBag className="w-6 h-6 relative z-10" /> 
                      <span className="relative z-10 font-display tracking-[0.2em]">{t("picker_claim")} · ${selected.price}</span>
                    </button>
                  </>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-6 py-4">
                <div className="w-20 h-20 rounded-3xl bg-sc-gold/10 flex items-center justify-center border border-sc-gold/20 shadow-inner">
                  <LocateFixed className="w-10 h-10 text-sc-gold animate-spin-slow" />
                </div>
                <div>
                  <div className="font-display text-3xl mb-1 tracking-widest uppercase">Bir Varlık Seçin</div>
                  <p className="text-sm text-sc-text-muted font-accent italic leading-tight">Kuantum koordinatları ve rezonans verileri burada açılır.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="absolute bottom-6 right-8 pointer-events-none opacity-40">
         <div className="text-[9px] tracking-[0.7em] uppercase text-sc-text-muted font-display">StarClaim Original Engine © 2026</div>
      </div>
    </div>
  );
}
