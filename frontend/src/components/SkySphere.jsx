import React, { useMemo, useRef, Suspense, useState, useEffect, useCallback } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera, Float } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import * as THREE from "three";
import { useT } from "../lib/i18n";
import PlanetarySystem from "./PlanetarySystem";
import NasaLandmarks from "./NasaLandmarks";
import StarHUD from "./StarHUD";
import ErrorBoundary from "./ui/ErrorBoundary";
import { NASA_LANDMARKS } from "../data/nasaLandmarks";
import { raDecToVector3 as astroRaDecToVector3 } from "../lib/astro";

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
    uniform vec3 cameraPos;
    uniform vec3 cameraDir;
    attribute float size;
    attribute vec3 customColor;
    attribute float isGhost;
    varying vec3 vColor;
    varying float vTwinkle;
    varying float vObserverCoherence;

    void main() {
      vColor = customColor;
      
      // Calculate dot product between camera direction and star direction from camera
      vec3 worldPos = position;
      vec3 toStar = normalize(worldPos - cameraPos);
      float alignment = dot(cameraDir, toStar);
      
      // Coherence increases when looking directly at the star
      // alignment is 1.0 when perfectly looking at it
      vObserverCoherence = smoothstep(0.85, 0.98, alignment);
      
      float twinkleScale = mix(1.0, 0.2, isGhost);
      float twinkle = sin(time * 3.0 + position.x * 10.0) * 0.5 + 0.5;
      vTwinkle = twinkle * twinkleScale;
      
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      
      // Ghost stars are smaller until observed
      float ghostFactor = isGhost > 0.5 ? mix(0.1, 1.0, vObserverCoherence) : 1.0;
      gl_PointSize = size * ghostFactor * (600.0 / -mvPosition.z) * (0.8 + vTwinkle * 0.4);
      gl_Position = projectionMatrix * mvPosition;
    }
  `,
  fragmentShader: `
    varying vec3 vColor;
    varying float vTwinkle;
    varying float vObserverCoherence;
    void main() {
      float r = distance(gl_PointCoord, vec2(0.5));
      if (r > 0.5) discard;
      float strength = pow(1.0 - r * 2.0, 1.5);
      
      // Observer Effect: Reality is more "solid" when observed
      float alpha = strength * (0.6 + vTwinkle * 0.4);
      float finalAlpha = mix(alpha * 0.3, alpha, vObserverCoherence);
      
      gl_FragColor = vec4(vColor, finalAlpha);
    }
  `
};

// --- COMPONENTS ---

function RealStars({ stars = [], onSelect, onObserverUpdate }) {
  const meshRef = useRef();
  const { camera } = useThree();
  const frustum = useMemo(() => new THREE.Frustum(), []);
  const projScreenMatrix = useMemo(() => new THREE.Matrix4(), []);

  const [positions, colors, sizes, ghosts] = useMemo(() => {
    if (!Array.isArray(stars) || stars.length === 0) {
       return [new Float32Array(0), new Float32Array(0), new Float32Array(0), new Float32Array(0)];
    }
    const count = stars.length;
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const siz = new Float32Array(count);
    const gho = new Float32Array(count);
    
    const color = new THREE.Color();
    stars.forEach((s, i) => {
      try {
        const v = raDecToVector3(s.ra, s.dec, 480 + Math.random() * 20);
        pos[i * 3] = v.x; pos[i * 3 + 1] = v.y; pos[i * 3 + 2] = v.z;
        
        const tierColor = s.tier === 'legendary' ? '#ffd700' : s.tier === 'zodiac' ? '#a78bfa' : '#f0f9ff';
        color.set(tierColor);
        col[i * 3] = color.r; col[i * 3 + 1] = color.g; col[i * 3 + 2] = color.b;
        
        siz[i] = s.tier === 'legendary' ? 6.0 : s.tier === 'zodiac' ? 4.5 : 3.0;
        
        // Randomly assign ghost property for demo (e.g., 20% of stars)
        gho[i] = Math.random() < 0.2 ? 1.0 : 0.0;
      } catch (e) {
        console.error("Star coordinate parse error:", e, s);
      }
    });
    return [pos, col, siz, gho];
  }, [stars]);

  const uniforms = useMemo(() => ({ 
    time: { value: 0 },
    cameraPos: { value: new THREE.Vector3() },
    cameraDir: { value: new THREE.Vector3() }
  }), []);

  const lastUpdateRef = useRef(0);

  useFrame((state) => {
    if (meshRef.current && meshRef.current.material.uniforms) {
       const t = state.clock.getElapsedTime();
       meshRef.current.material.uniforms.time.value = t;
       meshRef.current.material.uniforms.cameraPos.value.copy(camera.position);
       
       const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
       meshRef.current.material.uniforms.cameraDir.value.copy(dir);

       // Observer Protocol: Quantum Reality Collapse Logic
       // Throttled update to avoid performance hit and render loops
       if (onObserverUpdate && t - lastUpdateRef.current > 0.5) {
         lastUpdateRef.current = t;
         
         projScreenMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
         frustum.setFromProjectionMatrix(projScreenMatrix);
         
         let visibleCount = 0;
         const tempPos = new THREE.Vector3();
         for (let i = 0; i < stars.length; i++) {
           tempPos.set(positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2]);
           if (frustum.containsPoint(tempPos)) visibleCount++;
         }
         
         onObserverUpdate({
           visibleCount,
           totalCount: stars.length,
           coherence: 0.85 + Math.sin(t) * 0.05
         });
       }
    }
  });

  if (positions.length === 0) return null;

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
        <bufferAttribute attach="attributes-isGhost" count={stars.length} array={ghosts} itemSize={1} />
      </bufferGeometry>
      <shaderMaterial 
        uniforms={uniforms} 
        vertexShader={starShader.vertexShader} 
        fragmentShader={starShader.fragmentShader} 
        transparent 
        blending={THREE.AdditiveBlending} 
        depthWrite={false} 
      />
    </points>
  );
}

function ObserverHUD({ metrics }) {
  const { lang } = useT();
  if (!metrics) return null;
  
  const loadPercent = Math.round((metrics.visibleCount / metrics.totalCount) * 100);
  
  return (
    <div className="absolute top-8 right-8 z-40 pointer-events-none">
      <div className="glass-dark border border-cyan-400/30 rounded-2xl p-4 w-56 backdrop-blur-xl relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />
        
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
            <span className="text-[10px] uppercase tracking-[0.2em] text-cyan-400 font-display">Observer Link</span>
          </div>
          <span className="text-[9px] font-mono text-cyan-400/60">v4.6_GHST</span>
        </div>

        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-[9px] uppercase tracking-widest text-sc-text-muted mb-1.5">
              <span>Reality Coherence</span>
              <span className="text-cyan-200">{Math.round(metrics.coherence * 100)}%</span>
            </div>
            <div className="h-1 bg-white/5 rounded-full overflow-hidden">
               <div className="h-full bg-cyan-400 transition-all duration-500" style={{ width: `${metrics.coherence * 100}%` }} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
             <div className="bg-white/5 rounded-xl p-2 border border-white/5">
                <div className="text-[8px] uppercase tracking-tighter text-sc-text-muted mb-0.5">Frustum Load</div>
                <div className="text-sm font-mono text-white">{loadPercent}%</div>
             </div>
             <div className="bg-white/5 rounded-xl p-2 border border-white/5">
                <div className="text-[8px] uppercase tracking-tighter text-sc-text-muted mb-0.5">Ghost Count</div>
                <div className="text-sm font-mono text-white">{Math.round(metrics.totalCount * 0.2)}</div>
             </div>
          </div>

          <div className="pt-2 flex items-center gap-2 border-t border-white/5">
             <div className="text-[8px] uppercase tracking-widest text-sc-text-muted">
                {lang === "TR" ? "Gözlemci Etkisi: AKTİF" : "Observer Effect: ACTIVE"}
             </div>
          </div>
        </div>
      </div>
    </div>
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
      <meshBasicMaterial side={THREE.BackSide} transparent opacity={0.4} color="#050515" />
    </mesh>
  );
}

function LandmarkNavigator({ landmarks, activeCode, onSelect }) {
  const { lang } = useT();

  return (
    <div className="absolute bottom-8 left-8 right-8 z-40 pointer-events-auto">
      <div className="glass-dark border border-cyan-300/20 rounded-2xl p-4 backdrop-blur-xl">
        <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-[10px] uppercase tracking-[0.32em] text-cyan-200">
            {lang === "TR" ? "NASA Landmark Sistemi" : "NASA Landmark System"}
          </div>
          <div className="text-[9px] uppercase tracking-[0.24em] text-sc-text-muted">
            J2000 RA/Dec deep-space warp targets
          </div>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {landmarks.map((landmark) => (
            <button
              key={landmark.code}
              type="button"
              onClick={() => onSelect({
                ...landmark,
                star_id: landmark.code,
                tier: "nasa-landmark",
                isLandmark: true,
              })}
              className={`min-w-[170px] rounded-xl border px-3 py-2 text-left transition-all ${
                activeCode === landmark.code
                  ? "border-cyan-200 bg-cyan-300/15 text-white shadow-[0_0_20px_rgba(56,189,248,0.2)]"
                  : "border-white/10 bg-black/35 text-sc-text-muted hover:border-cyan-300/40 hover:text-white"
              }`}
            >
              <div className="font-display text-sm">{lang === "TR" ? landmark.nameTr : landmark.name}</div>
              <div className="mt-1 font-mono text-[9px] uppercase tracking-widest">{landmark.catalog}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function SkySphere({ stars, onClaim }) {
  const { lang } = useT();
  const [selectedStar, setSelectedStar] = useState(null);
  const [targetPos, setTargetPos] = useState(null);
  const [viewMode, setViewMode] = useState('observatory');
  const [introFinished, setIntroFinished] = useState(false);
  const [observerMetrics, setObserverMetrics] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => setIntroFinished(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  const handleSelect = useCallback((star) => {
    setSelectedStar(star);
    const pos = star.x !== undefined
      ? new THREE.Vector3(star.x, star.y || 0, star.z || 0)
      : astroRaDecToVector3(star.ra, star.dec, star.isLandmark ? 430 : 480);
    setTargetPos(pos);
  }, []);

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/5 bg-black h-[700px] lg:h-[900px]">
      <Canvas shadows gl={{ antialias: true }}>
        <PerspectiveCamera makeDefault position={[0, 0, 100]} fov={60} />
        <OrbitControls enableDamping dampingFactor={0.06} maxDistance={950} minDistance={0.1} />
        
        <Suspense fallback={null}>
          <ambientLight intensity={0.2} />
          <RealStars 
            stars={stars} 
            onSelect={handleSelect} 
            onObserverUpdate={setObserverMetrics}
          />
          <NasaLandmarks onSelect={handleSelect} />
          
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

      <ObserverHUD metrics={observerMetrics} />

      <LandmarkNavigator
        landmarks={NASA_LANDMARKS}
        activeCode={selectedStar?.code}
        onSelect={handleSelect}
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
