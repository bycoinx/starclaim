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
      
      vec3 worldPos = position;
      vec3 toStar = normalize(worldPos - cameraPos);
      float alignment = dot(cameraDir, toStar);
      
      vObserverCoherence = smoothstep(0.85, 0.98, alignment);
      
      // Organic "breathing" effect instead of simple sin wave
      float twinkleScale = mix(1.0, 0.3, isGhost);
      float noise = sin(time * 0.8 + position.x) * cos(time * 0.5 + position.y);
      float breathe = sin(time * 1.2 + position.z * 2.0) * 0.5 + 0.5;
      vTwinkle = mix(breathe, noise * 0.5 + 0.5, 0.4) * twinkleScale;
      
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      
      float ghostFactor = isGhost > 0.5 ? mix(0.1, 1.0, vObserverCoherence) : 1.0;
      // Adjusted size for better perspective and organic feel
      gl_PointSize = size * ghostFactor * (800.0 / -mvPosition.z) * (0.85 + vTwinkle * 0.45);
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
      
      // Smoother Gaussian-like falloff for a more realistic star glow
      float strength = exp(-r * 4.5);
      
      float alpha = strength * (0.7 + vTwinkle * 0.3);
      float finalAlpha = mix(alpha * 0.25, alpha, vObserverCoherence);
      
      // Add a slight core brightness
      vec3 finalColor = vColor + (strength * 0.4);
      
      gl_FragColor = vec4(finalColor, finalAlpha);
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
    <div className="absolute top-8 right-8 z-40 pointer-events-none animate-in fade-in slide-in-from-right-4 duration-1000">
      <div className="glass-dark border border-cyan-500/30 rounded-2xl p-4 w-60 backdrop-blur-2xl relative overflow-hidden group shadow-[0_0_30px_rgba(6,182,212,0.15)]">
        {/* Futuristic Scanline Effect */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-400/5 to-transparent h-[200%] -translate-y-1/2 animate-scanline pointer-events-none" />
        
        {/* Top Accent Line */}
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-50" />
        
        <div className="flex items-center justify-between mb-4 relative z-10">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_12px_rgba(34,211,238,0.9)]" />
            <span className="text-[11px] uppercase tracking-[0.25em] text-cyan-400 font-display font-bold">Observer Link</span>
          </div>
          <div className="px-2 py-0.5 rounded-md bg-cyan-950/50 border border-cyan-500/20">
            <span className="text-[8px] font-mono text-cyan-400/80">v5.0_AEGIS</span>
          </div>
        </div>

        <div className="space-y-4 relative z-10">
          <div className="bg-black/20 rounded-xl p-3 border border-white/5">
            <div className="flex justify-between text-[9px] uppercase tracking-widest text-sc-text-muted mb-2">
              <span className="flex items-center gap-1.5">
                <div className="w-1 h-1 bg-cyan-400/50 rounded-full" />
                Reality Coherence
              </span>
              <span className="text-cyan-300 font-mono">{Math.round(metrics.coherence * 100)}%</span>
            </div>
            <div className="h-1 bg-white/5 rounded-full overflow-hidden">
               <div className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400 transition-all duration-700 ease-out" style={{ width: `${metrics.coherence * 100}%` }} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
             <div className="bg-cyan-950/20 rounded-xl p-2.5 border border-cyan-500/10 hover:border-cyan-500/30 transition-colors">
                <div className="text-[8px] uppercase tracking-tighter text-cyan-400/60 mb-1">Frustum Load</div>
                <div className="text-sm font-mono text-white flex items-baseline gap-1">
                  {loadPercent}
                  <span className="text-[9px] text-cyan-400/40">%</span>
                </div>
             </div>
             <div className="bg-cyan-950/20 rounded-xl p-2.5 border border-cyan-500/10 hover:border-cyan-500/30 transition-colors">
                <div className="text-[8px] uppercase tracking-tighter text-cyan-400/60 mb-1">Ghost Stars</div>
                <div className="text-sm font-mono text-white">
                  {Math.round(metrics.totalCount * 0.2)}
                </div>
             </div>
          </div>

          <div className="pt-3 flex items-center justify-between border-t border-white/10">
             <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-sm bg-cyan-400/80 rotate-45 animate-spin-slow" />
                <div className="text-[8px] uppercase tracking-[0.15em] text-cyan-300/80 font-medium">
                   {lang === "TR" ? "SİSTEM: AKTİF" : "SYSTEM: ACTIVE"}
                </div>
             </div>
             <div className="w-8 h-[2px] bg-cyan-400/20 rounded-full overflow-hidden">
                <div className="h-full bg-cyan-400 w-1/2 animate-shimmer" />
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

// --- NEBULA SHADER ---
const nebulaShader = {
  vertexShader: `
    varying vec2 vUv;
    varying vec3 vWorldPosition;
    void main() {
      vUv = uv;
      vec4 worldPosition = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPosition.xyz;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform float time;
    varying vec2 vUv;
    varying vec3 vWorldPosition;

    // Simple noise for atmospheric clouds
    float noise(vec3 p) {
      return fract(sin(dot(p, vec3(12.9898, 78.233, 45.164))) * 43758.5453);
    }

    void main() {
      vec3 direction = normalize(vWorldPosition);
      
      // Create layered nebulosity
      float layer1 = sin(direction.x * 2.0 + time * 0.1) * cos(direction.y * 2.0) * sin(direction.z * 2.0);
      float layer2 = cos(direction.x * 4.0 - time * 0.05) * sin(direction.z * 4.0);
      
      vec3 color1 = vec3(0.02, 0.05, 0.15); // Deep space blue
      vec3 color2 = vec3(0.05, 0.02, 0.1);  // Subtle violet
      vec3 color3 = vec3(0.01, 0.08, 0.1);  // Teal dust
      
      vec3 finalColor = mix(color1, color2, layer1 * 0.5 + 0.5);
      finalColor = mix(finalColor, color3, layer2 * 0.3 + 0.3);
      
      // Add a touch of "cosmic dust" glow
      float glow = pow(max(0.0, layer1 + layer2), 3.0) * 0.02;
      finalColor += glow;

      gl_FragColor = vec4(finalColor, 1.0);
    }
  `
};

function NebulaBackground() {
  const meshRef = useRef();
  const uniforms = useMemo(() => ({
    time: { value: 0 }
  }), []);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.material.uniforms.time.value = state.clock.getElapsedTime();
    }
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[995, 64, 64]} />
      <shaderMaterial 
        vertexShader={nebulaShader.vertexShader}
        fragmentShader={nebulaShader.fragmentShader}
        uniforms={uniforms}
        side={THREE.BackSide}
        transparent
      />
    </mesh>
  );
}

function LandmarkNavigator({ landmarks, activeCode, onSelect }) {
  const { lang } = useT();

  return (
    <div className="absolute bottom-8 left-8 right-8 z-40 pointer-events-auto animate-in fade-in slide-in-from-bottom-4 duration-1000">
      <div className="glass-dark border border-cyan-500/20 rounded-2xl p-4 backdrop-blur-2xl relative overflow-hidden shadow-[0_-10px_40px_rgba(6,182,212,0.1)]">
        {/* Subtle Bottom Glow */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-[1px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-30" />
        
        <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between relative z-10">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-3 bg-cyan-500 rounded-full animate-pulse" />
            <div className="text-[11px] uppercase tracking-[0.35em] text-cyan-200 font-display font-bold">
              {lang === "TR" ? "NASA LANDMARK SİSTEMİ" : "NASA LANDMARK SYSTEM"}
            </div>
          </div>
          <div className="text-[9px] uppercase tracking-[0.2em] text-cyan-400/50 font-mono">
            J2000 RA/Dec deep-space warp protocol active
          </div>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide relative z-10">
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
              className={`min-w-[190px] rounded-xl border px-4 py-3 text-left transition-all duration-500 group relative overflow-hidden ${
                activeCode === landmark.code
                  ? "border-cyan-400 bg-cyan-400/10 text-white shadow-[0_0_25px_rgba(34,211,238,0.2)] scale-[1.02]"
                  : "border-white/5 bg-black/40 text-sc-text-muted hover:border-cyan-400/40 hover:bg-cyan-950/20 hover:text-white"
              }`}
            >
              {/* Button Active Glow */}
              {activeCode === landmark.code && (
                <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/10 to-transparent animate-pulse" />
              )}
              
              <div className="relative z-10">
                <div className={`font-display text-[13px] tracking-wide mb-1 transition-colors ${activeCode === landmark.code ? "text-cyan-200" : "group-hover:text-cyan-100"}`}>
                  {lang === "TR" ? landmark.nameTr : landmark.name}
                </div>
                <div className="flex items-center justify-between">
                  <div className="font-mono text-[9px] uppercase tracking-[0.15em] opacity-60">
                    {landmark.catalog}
                  </div>
                  {activeCode === landmark.code && (
                    <div className="w-1 h-1 rounded-full bg-cyan-400 animate-ping" />
                  )}
                </div>
              </div>
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
