import React, { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const PLANETS = [
  { name: "Mercury", nameTr: "Merkur", dist: 13, size: 0.6, speed: 0.48, color: "#a7a29a", emissive: "#241f1c" },
  { name: "Venus", nameTr: "Venus", dist: 19, size: 1.05, speed: 0.36, color: "#d9a441", emissive: "#3b2308" },
  { name: "Earth", nameTr: "Dunya", dist: 27, size: 1.16, speed: 0.28, color: "#2f80ed", emissive: "#08233f", moon: true },
  { name: "Mars", nameTr: "Mars", dist: 36, size: 0.78, speed: 0.23, color: "#b85634", emissive: "#3a1308" },
  { name: "Jupiter", nameTr: "Jupiter", dist: 52, size: 2.9, speed: 0.14, color: "#d7b07a", emissive: "#3a2512", bands: true },
  { name: "Saturn", nameTr: "Saturn", dist: 72, size: 2.35, speed: 0.1, color: "#d8bd7b", emissive: "#37290d", rings: true },
  { name: "Uranus", nameTr: "Uranus", dist: 92, size: 1.65, speed: 0.075, color: "#6dd6e7", emissive: "#08343c", rings: true },
  { name: "Neptune", nameTr: "Neptune", dist: 110, size: 1.58, speed: 0.06, color: "#3855d6", emissive: "#0b1648" },
];

function OrbitRing({ radius, color = "#93c5fd", opacity = 0.055 }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[radius - 0.045, radius + 0.045, 192]} />
      <meshBasicMaterial color={color} transparent opacity={opacity} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} />
    </mesh>
  );
}

function SunSurface() {
  const texture = useMemo(() => {
    const size = 192;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    const gradient = ctx.createRadialGradient(size * 0.42, size * 0.35, 10, size / 2, size / 2, size * 0.58);
    gradient.addColorStop(0, "#fff7b2");
    gradient.addColorStop(0.42, "#fbbf24");
    gradient.addColorStop(0.72, "#f97316");
    gradient.addColorStop(1, "#7c2d12");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);

    for (let i = 0; i < 900; i += 1) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const r = Math.random() * 6 + 1;
      ctx.fillStyle = `rgba(255,${120 + Math.random() * 95},24,${0.05 + Math.random() * 0.18})`;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    const map = new THREE.CanvasTexture(canvas);
    map.colorSpace = THREE.SRGBColorSpace;
    return map;
  }, []);

  return <meshStandardMaterial map={texture} color="#ffe08a" emissive="#f97316" emissiveIntensity={2.2} roughness={0.35} />;
}

function PlanetSurface({ planet }) {
  const texture = useMemo(() => {
    const size = 128;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    const base = new THREE.Color(planet.color);
    ctx.fillStyle = `rgb(${Math.floor(base.r * 255)},${Math.floor(base.g * 255)},${Math.floor(base.b * 255)})`;
    ctx.fillRect(0, 0, size, size);

    for (let y = 0; y < size; y += 1) {
      const wave = Math.sin(y * 0.18) * 8 + Math.sin(y * 0.07) * 16;
      const alpha = planet.bands ? 0.22 : 0.055;
      ctx.fillStyle = `rgba(255,255,255,${alpha})`;
      ctx.fillRect(0, y, size, 1);
      ctx.fillStyle = `rgba(0,0,0,${alpha * 0.6})`;
      ctx.fillRect(wave, y + 2, size, 1);
    }

    if (planet.name === "Earth") {
      ctx.fillStyle = "rgba(34,197,94,0.85)";
      ctx.beginPath();
      ctx.ellipse(48, 55, 19, 9, -0.5, 0, Math.PI * 2);
      ctx.ellipse(80, 78, 14, 7, 0.7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.55)";
      ctx.fillRect(0, 30, size, 4);
      ctx.fillRect(28, 92, 70, 3);
    }

    if (planet.name === "Mars") {
      ctx.fillStyle = "rgba(255,244,214,0.75)";
      ctx.fillRect(0, 8, size, 7);
      ctx.fillRect(0, size - 15, size, 8);
    }

    const map = new THREE.CanvasTexture(canvas);
    map.colorSpace = THREE.SRGBColorSpace;
    return map;
  }, [planet]);

  return (
    <meshStandardMaterial
      map={texture}
      color={planet.color}
      emissive={planet.emissive}
      emissiveIntensity={0.08}
      roughness={0.72}
      metalness={0.08}
    />
  );
}

function AsteroidBelt() {
  const beltRef = useRef();
  const asteroids = useMemo(() => {
    return Array.from({ length: 360 }, (_, index) => {
      const angle = (index / 360) * Math.PI * 2 + Math.random() * 0.04;
      const radius = 43 + Math.random() * 5;
      return {
        position: [Math.cos(angle) * radius, (Math.random() - 0.5) * 1.4, Math.sin(angle) * radius],
        scale: 0.055 + Math.random() * 0.12,
        rotation: [Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI],
      };
    });
  }, []);

  useFrame((state) => {
    if (beltRef.current) beltRef.current.rotation.y = state.clock.elapsedTime * 0.018;
  });

  return (
    <group ref={beltRef}>
      {asteroids.map((asteroid, index) => (
        <mesh key={index} position={asteroid.position} rotation={asteroid.rotation} scale={asteroid.scale}>
          <dodecahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color="#5f5548" roughness={0.98} metalness={0.14} />
        </mesh>
      ))}
    </group>
  );
}

function Comet({ offset = 0 }) {
  const ref = useRef();
  useFrame((state) => {
    const t = state.clock.elapsedTime * 0.18 + offset;
    const radius = 122;
    if (!ref.current) return;
    ref.current.position.set(Math.cos(t) * radius, 22 + Math.sin(t * 0.7) * 16, Math.sin(t) * 58);
    ref.current.rotation.z = -t;
  });

  return (
    <group ref={ref}>
      <mesh>
        <sphereGeometry args={[0.8, 18, 18]} />
        <meshBasicMaterial color="#dffaff" />
      </mesh>
      <mesh position={[-4, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <coneGeometry args={[1.1, 10, 24, 1, true]} />
        <meshBasicMaterial color="#b7f3ff" transparent opacity={0.26} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
    </group>
  );
}

function Planet({ planet, index }) {
  const groupRef = useRef();
  const initial = index * 0.72;

  useFrame((state) => {
    const t = state.clock.elapsedTime * planet.speed * 0.22 + initial;
    if (!groupRef.current) return;
    groupRef.current.position.set(Math.cos(t) * planet.dist, 0, Math.sin(t) * planet.dist);
    groupRef.current.rotation.y += 0.007 + index * 0.001;
  });

  return (
    <group ref={groupRef}>
      <mesh castShadow receiveShadow>
        <sphereGeometry args={[planet.size, 48, 48]} />
        <PlanetSurface planet={planet} />
      </mesh>

      <mesh scale={planet.size * 1.18}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial color="#93c5fd" transparent opacity={planet.name === "Earth" ? 0.12 : 0.035} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>

      {planet.rings && (
        <mesh rotation={[Math.PI / 2.35, 0.18, 0.08]}>
          <ringGeometry args={[planet.size * 1.55, planet.size * 2.45, 96]} />
          <meshStandardMaterial color={planet.name === "Uranus" ? "#8fe9ff" : "#d7b56c"} transparent opacity={0.58} side={THREE.DoubleSide} roughness={0.35} />
        </mesh>
      )}

      {planet.moon && (
        <group rotation={[0, Date.now() * 0.00004, 0]}>
          <mesh position={[planet.size * 2.8, 0.12, 0]}>
            <sphereGeometry args={[0.28, 20, 20]} />
            <meshStandardMaterial color="#d8dee9" roughness={0.86} />
          </mesh>
        </group>
      )}
    </group>
  );
}

export default function PlanetarySystem() {
  const rootRef = useRef();

  useFrame((state) => {
    if (!rootRef.current) return;
    rootRef.current.rotation.y = state.clock.elapsedTime * 0.018;
  });

  return (
    <group ref={rootRef} rotation={[-0.34, 0, 0]} position={[0, -3, 0]} scale={1.03}>
      <mesh>
        <sphereGeometry args={[5.6, 72, 72]} />
        <SunSurface />
      </mesh>
      <mesh scale={1.55}>
        <sphereGeometry args={[5.6, 48, 48]} />
        <meshBasicMaterial color="#f97316" transparent opacity={0.11} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>

      {PLANETS.map((planet, index) => (
        <React.Fragment key={planet.name}>
          <OrbitRing radius={planet.dist} color={index > 4 ? "#8fe9ff" : "#fcd34d"} opacity={index > 4 ? 0.035 : 0.055} />
          <Planet planet={planet} index={index} />
        </React.Fragment>
      ))}

      <AsteroidBelt />
      <Comet offset={0} />
      <Comet offset={Math.PI * 0.82} />
    </group>
  );
}
