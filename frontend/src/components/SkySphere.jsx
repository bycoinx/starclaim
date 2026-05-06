import React, { useMemo, useRef, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera, Stars, Text } from "@react-three/drei";
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

function ConstellationLabels({ stars = [] }) {
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

      {featured.map((star) => (
        <Text
          key={`${star.constellation}-${star.code}`}
          position={[star.position.x, star.position.y + 4, star.position.z]}
          fontSize={4.2}
          color="#dbeafe"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.04}
          outlineColor="#0b1228"
        >
          {String(star.constellation).toUpperCase()}
        </Text>
      ))}
    </group>
  );
}

function NebulaVeil() {
  const ref = useRef();
  useFrame((state) => {
    if (ref.current) ref.current.rotation.z = state.clock.elapsedTime * 0.01;
  });

  return (
    <group ref={ref} position={[0, 0, -120]}>
      <mesh>
        <sphereGeometry args={[190, 48, 48]} />
        <meshBasicMaterial color="#19325f" transparent opacity={0.08} side={THREE.BackSide} />
      </mesh>
      <mesh rotation={[0.3, 0.4, 0.2]}>
        <torusGeometry args={[115, 3, 12, 180]} />
        <meshBasicMaterial color="#67e8f9" transparent opacity={0.16} blending={THREE.AdditiveBlending} />
      </mesh>
      <mesh rotation={[0.45, -0.35, -0.18]}>
        <torusGeometry args={[82, 2, 12, 180]} />
        <meshBasicMaterial color="#fbbf24" transparent opacity={0.12} blending={THREE.AdditiveBlending} />
      </mesh>
    </group>
  );
}

export default function SkySphere({ stars }) {
  const { lang } = useT();

  return (
    <div className="relative overflow-hidden rounded-3xl border border-sc-gold/20 bg-[#020617] h-[650px] lg:h-[850px] shadow-[0_35px_90px_-35px_rgba(67,178,255,0.55)]">
      <Canvas
        shadows
        dpr={[1, 1.6]}
        gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
        camera={{ position: [0, 52, 178], fov: 46 }}
      >
        <PerspectiveCamera makeDefault position={[0, 52, 178]} fov={46} />
        <OrbitControls
          enableDamping
          dampingFactor={0.045}
          maxDistance={260}
          minDistance={58}
          autoRotate
          autoRotateSpeed={0.32}
          enablePan={false}
        />

        <Suspense fallback={null}>
          <color attach="background" args={["#020617"]} />
          <fog attach="fog" args={["#020617", 130, 360]} />

          <ambientLight intensity={0.42} />
          <hemisphereLight args={["#9bdcff", "#111827", 1.05]} />
          <directionalLight position={[60, 80, 90]} intensity={1.45} color="#e0f2fe" />
          <pointLight position={[0, 8, 0]} intensity={5.5} color="#facc15" distance={260} />

          <NebulaVeil />
          <CatalogStars stars={stars} />
          <ConstellationLabels stars={stars} />

          <ErrorBoundary fallback={null}>
            <PlanetarySystem />
          </ErrorBoundary>

          <Stars radius={240} depth={90} count={9000} factor={5} saturation={0.25} fade speed={0.45} />
        </Suspense>
      </Canvas>

      <div className="absolute inset-0 pointer-events-none rounded-3xl bg-[radial-gradient(circle_at_50%_38%,transparent_0%,rgba(2,6,23,0.05)_42%,rgba(2,6,23,0.58)_100%)]" />

      <div className="absolute left-6 top-6 right-6 pointer-events-none flex items-start justify-between gap-4">
        <div className="glass rounded-xl px-4 py-3 border border-sc-gold/20 backdrop-blur-md">
          <div className="text-[9px] tracking-[0.45em] uppercase text-sc-gold mb-1 font-display">Star Atlas</div>
          <div className="text-[11px] text-sc-text-muted">
            {lang === "TR" ? "Gezegenler, orbitler ve takim yildizi katmani" : "Planets, orbits and constellation layer"}
          </div>
        </div>
        <div className="hidden md:block glass rounded-xl px-4 py-3 border border-cyan-300/10 text-right">
          <div className="text-[9px] tracking-[0.35em] uppercase text-cyan-200/80">Live Catalog</div>
          <div className="text-[11px] text-sc-text-muted">{Array.isArray(stars) ? stars.length : 0} StarClaim assets</div>
        </div>
      </div>

      <div className="absolute bottom-7 left-1/2 -translate-x-1/2 pointer-events-none text-center">
        <div className="text-[10px] tracking-[0.55em] uppercase text-sc-gold/55 font-display">
          {lang === "TR" ? "Orbitleri surukleyerek incele" : "Drag to inspect the orbits"}
        </div>
      </div>
    </div>
  );
}
