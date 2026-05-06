import React, { useMemo, useRef, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera, Stars } from "@react-three/drei";
import * as THREE from "three";
import { useT } from "../lib/i18n";
import PlanetarySystem from "./PlanetarySystem";
import ErrorBoundary from "./ui/ErrorBoundary";

function parseRa(ra = "0h") {
  const hMatch = String(ra).match(/(-?\d+(?:\.\d+)?)h/);
  const mMatch = String(ra).match(/(\d+(?:\.\d+)?)m/);
  const h = hMatch ? Number(hMatch[1]) : Math.random() * 24;
  const m = mMatch ? Number(mMatch[1]) : 0;
  return ((h + m / 60) / 24) * Math.PI * 2;
}

function parseDec(dec = "0") {
  const match = String(dec).match(/[-+]?\d+(?:\.\d+)?/);
  return THREE.MathUtils.degToRad(match ? Number(match[0]) : Math.random() * 180 - 90);
}

function toSkyPosition(star, radius = 118) {
  const ra = parseRa(star?.ra);
  const dec = parseDec(star?.dec);
  return new THREE.Vector3(
    radius * Math.cos(dec) * Math.cos(ra),
    radius * Math.sin(dec),
    radius * Math.cos(dec) * Math.sin(ra),
  );
}

function CatalogStars({ stars = [] }) {
  const pointsRef = useRef();
  const { positions, colors } = useMemo(() => {
    const source = Array.isArray(stars) && stars.length ? stars : [];
    const count = Math.max(700, Math.min(2200, source.length * 24 || 900));
    const positionArray = new Float32Array(count * 3);
    const colorArray = new Float32Array(count * 3);

    for (let i = 0; i < count; i += 1) {
      const star = source[i % Math.max(source.length, 1)];
      const jitter = new THREE.Vector3(
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 10,
      );
      const pos = source.length ? toSkyPosition(star, 125 + Math.random() * 90).add(jitter) : new THREE.Vector3().randomDirection().multiplyScalar(130 + Math.random() * 110);
      positionArray.set([pos.x, pos.y, pos.z], i * 3);

      const tierHue = star?.tier === "legendary" ? 0.13 : star?.tier === "zodiac" ? 0.72 : 0.58 + Math.random() * 0.08;
      const color = new THREE.Color().setHSL(tierHue, 0.55, 0.72 + Math.random() * 0.24);
      colorArray.set([color.r, color.g, color.b], i * 3);
    }

    return { positions: positionArray, colors: colorArray };
  }, [stars]);

  useFrame((state) => {
    if (!pointsRef.current) return;
    pointsRef.current.rotation.y = state.clock.elapsedTime * 0.012;
    pointsRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.08) * 0.02;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.9}
        vertexColors
        transparent
        opacity={0.88}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

function ConstellationTraces({ stars = [] }) {
  const featured = useMemo(() => {
    const unique = [];
    const seen = new Set();
    for (const star of stars) {
      if (!star?.constellation || seen.has(star.constellation)) continue;
      seen.add(star.constellation);
      unique.push({ ...star, position: toSkyPosition(star, 108) });
      if (unique.length === 7) break;
    }
    return unique;
  }, [stars]);

  const linePositions = useMemo(() => {
    if (featured.length < 2) return new Float32Array();
    const coords = [];
    featured.forEach((star, index) => {
      const next = featured[(index + 1) % featured.length];
      coords.push(star.position.x, star.position.y, star.position.z, next.position.x, next.position.y, next.position.z);
    });
    return new Float32Array(coords);
  }, [featured]);

  if (featured.length === 0) return null;

  return (
    <group rotation={[0.1, -0.25, 0]}>
      <lineSegments>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[linePositions, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color="#82d7ff" transparent opacity={0.2} blending={THREE.AdditiveBlending} />
      </lineSegments>
    </group>
  );
}

function MilkyWayDust() {
  const ref = useRef();
  const { positions, colors } = useMemo(() => {
    const count = 5200;
    const positionArray = new Float32Array(count * 3);
    const colorArray = new Float32Array(count * 3);

    for (let i = 0; i < count; i += 1) {
      const t = (Math.random() - 0.5) * Math.PI * 1.45;
      const radius = 92 + Math.random() * 132;
      const thickness = THREE.MathUtils.randFloatSpread(13);
      const armWave = Math.sin(t * 3.2) * 15;
      const x = Math.cos(t) * radius + armWave;
      const y = thickness + Math.sin(t * 1.7) * 8;
      const z = Math.sin(t) * radius * 0.42 - 96;
      positionArray.set([x, y, z], i * 3);

      const color = new THREE.Color().setHSL(0.58 + Math.random() * 0.08, 0.28, 0.35 + Math.random() * 0.35);
      colorArray.set([color.r, color.g, color.b], i * 3);
    }

    return { positions: positionArray, colors: colorArray };
  }, []);

  useFrame((state) => {
    if (ref.current) ref.current.rotation.y = state.clock.elapsedTime * 0.004;
  });

  return (
    <points ref={ref} rotation={[0.18, -0.4, -0.12]}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={1.15}
        vertexColors
        transparent
        opacity={0.28}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

export default function SkySphere({ stars }) {
  const { lang } = useT();

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-black h-[650px] lg:h-[850px] shadow-[0_35px_110px_-45px_rgba(15,23,42,0.9)]">
      <Canvas
        shadows
        dpr={[1, 1.6]}
        gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
        camera={{ position: [0, 42, 178], fov: 42 }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 0.72;
          gl.outputColorSpace = THREE.SRGBColorSpace;
        }}
      >
        <PerspectiveCamera makeDefault position={[0, 42, 178]} fov={42} />
        <OrbitControls
          enableDamping
          dampingFactor={0.045}
          maxDistance={250}
          minDistance={72}
          autoRotate
          autoRotateSpeed={0.18}
          enablePan={false}
        />

        <Suspense fallback={null}>
          <color attach="background" args={["#00030a"]} />
          <fog attach="fog" args={["#00030a", 150, 390]} />

          <ambientLight intensity={0.08} />
          <hemisphereLight args={["#6ea8ff", "#030712", 0.35]} />
          <directionalLight position={[-80, 55, 120]} intensity={0.7} color="#dbeafe" />
          <pointLight position={[0, 4, 0]} intensity={7.5} color="#ffd27a" distance={280} />

          <MilkyWayDust />
          <CatalogStars stars={stars} />
          <ConstellationTraces stars={stars} />

          <ErrorBoundary fallback={null}>
            <PlanetarySystem />
          </ErrorBoundary>

          <Stars radius={260} depth={120} count={14000} factor={4.6} saturation={0.15} fade speed={0.18} />
        </Suspense>
      </Canvas>

      <div className="absolute inset-0 pointer-events-none rounded-3xl bg-[radial-gradient(circle_at_50%_42%,transparent_0%,rgba(0,3,10,0.22)_48%,rgba(0,0,0,0.78)_100%)]" />

      <div className="absolute left-6 top-6 right-6 pointer-events-none flex items-start justify-between gap-4">
        <div className="rounded-xl px-4 py-3 border border-white/10 bg-black/30 backdrop-blur-md">
          <div className="text-[9px] tracking-[0.45em] uppercase text-sc-gold/80 mb-1 font-display">Deep Space View</div>
          <div className="text-[11px] text-slate-400">
            {lang === "TR" ? "Dusuk isik, gercekci orbit ve yildiz tozu" : "Low light, realistic orbits and stellar dust"}
          </div>
        </div>
        <div className="hidden md:block rounded-xl px-4 py-3 border border-white/10 bg-black/25 text-right backdrop-blur-md">
          <div className="text-[9px] tracking-[0.35em] uppercase text-cyan-100/60">Catalog Lock</div>
          <div className="text-[11px] text-slate-400">{Array.isArray(stars) ? stars.length : 0} mapped stars</div>
        </div>
      </div>
    </div>
  );
}
