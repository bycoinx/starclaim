import React, { useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Stars, Html } from "@react-three/drei";
import { EffectComposer, Bloom, ChromaticAberration, Vignette, DepthOfField, GodRays } from "@react-three/postprocessing";
import * as THREE from "three";

function SpiralArm({ color, offset, seed }) {
  const ref = useRef();
  const geometry = useMemo(() => {
    const count = 520;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const base = new THREE.Color(color);

    for (let i = 0; i < count; i += 1) {
      const t = i / (count - 1);
      const angle = t * Math.PI * 4.6 + offset;
      const radius = 8 + Math.pow(t, 1.04) * 27;
      const height = (Math.sin(t * 14 + seed) * 0.42 + (Math.random() - 0.5) * 0.2) * (1 - t) * 1.9;
      const spiralOffset = (Math.random() - 0.5) * 0.8 * (1 - t);

      positions[i * 3] = Math.cos(angle) * radius + spiralOffset;
      positions[i * 3 + 1] = height;
      positions[i * 3 + 2] = Math.sin(angle) * radius + spiralOffset;

      const tone = 0.9 + Math.sin(t * Math.PI * 3 + seed) * 0.16;
      colors[i * 3] = base.r * tone;
      colors[i * 3 + 1] = base.g * tone;
      colors[i * 3 + 2] = base.b * tone;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    return geo;
  }, [color, offset, seed]);

  useFrame(() => {
    if (ref.current) ref.current.rotation.y += 0.0003;
  });

  return (
    <points ref={ref} geometry={geometry}>
      <pointsMaterial
        vertexColors
        size={0.18}
        sizeAttenuation
        transparent
        opacity={0.9}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

function NebulaCloud({ color, radius, height, density }) {
  const ref = useRef();
  const geometry = useMemo(() => {
    const count = 600;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const base = new THREE.Color(color);

    for (let i = 0; i < count; i += 1) {
      const angle = Math.random() * Math.PI * 2;
      const r = radius + (Math.random() - 0.5) * density;
      const y = height * (Math.random() - 0.5);
      const depth = (Math.random() - 0.5) * density * 0.6;

      positions[i * 3] = Math.cos(angle) * r;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = Math.sin(angle) * r + depth;

      const tone = 0.5 + Math.random() * 0.6;
      colors[i * 3] = base.r * tone;
      colors[i * 3 + 1] = base.g * tone;
      colors[i * 3 + 2] = base.b * tone;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    return geo;
  }, [color, radius, height, density]);

  useFrame(() => {
    if (ref.current) ref.current.rotation.y -= 0.00015;
  });

  return (
    <points ref={ref} geometry={geometry}>
      <pointsMaterial
        vertexColors
        size={0.24}
        sizeAttenuation
        transparent
        opacity={0.22}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

function NebulaVolume() {
  const ref = useRef();
  const geometry = useMemo(() => {
    const count = 1000;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    for (let i = 0; i < count; i += 1) {
      const theta = Math.random() * Math.PI * 2;
      const phi = (Math.random() - 0.5) * Math.PI * 0.2;
      const radius = 16 + Math.random() * 14;
      const x = Math.cos(theta) * radius;
      const y = Math.sin(phi) * 7 * (1 - radius / 32);
      const z = Math.sin(theta) * radius;

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      const color = new THREE.Color("#8faeff");
      const tone = 0.45 + Math.random() * 0.24;
      colors[i * 3] = color.r * tone;
      colors[i * 3 + 1] = color.g * tone;
      colors[i * 3 + 2] = color.b * tone;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    return geo;
  }, []);

  useFrame(() => {
    if (ref.current) ref.current.rotation.y += 0.00018;
  });

  return (
    <points ref={ref} geometry={geometry}>
      <pointsMaterial
        vertexColors
        size={0.22}
        sizeAttenuation
        transparent
        opacity={0.18}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

const TARGET_STARS = [
  { id: "aria", label: "Aria Cluster", position: [-14, 2.4, 9], color: "#ffc26d", description: "Kırılgan beyaz yıldız kümeleri ve gölge gaz halkaları." },
  { id: "nova", label: "Nova Nexus", position: [12, 1.2, -7], color: "#80d9ff", description: "Yoğun yüksek enerjili parıltı, keşif için ideal" },
  { id: "halo", label: "Halo Spire", position: [8, -0.6, 18], color: "#b9a8ff", description: "Sisli bulutlar içinde gizlenmiş bir hedef yıldız dizisi." },
];

function TargetMarker({ target, selected, onSelect }) {
  const ref = useRef();

  useFrame(() => {
    if (ref.current) ref.current.rotation.y += 0.004;
  });

  return (
    <group ref={ref} position={target.position}>
      <mesh
        scale={selected ? [1.25, 1.25, 1.25] : [1, 1, 1]}
        onPointerDown={(event) => {
          event.stopPropagation();
          onSelect(target);
        }}
      >
        <sphereGeometry args={[0.7, 18, 18]} />
        <meshBasicMaterial color={target.color} transparent opacity={0.92} />
      </mesh>
      <Html center distanceFactor={7} style={{ pointerEvents: "none" }}>
        <div
          className={`rounded-full px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-white/90 ${
            selected ? "border border-cyan-300 bg-black/75" : "border border-white/10 bg-black/40"
          }`}
        >
          {target.label}
        </div>
      </Html>
    </group>
  );
}

function GalaxyCore() {
  const ref = useRef();

  useFrame(() => {
    if (ref.current) ref.current.rotation.y += 0.0018;
  });

  return (
    <group ref={ref}>
      <mesh>
        <sphereGeometry args={[4.2, 64, 64]} />
        <meshStandardMaterial
          color="#fff9d9"
          emissive="#fff0b8"
          emissiveIntensity={1.7}
          roughness={0.14}
          metalness={0.08}
        />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[8.2, 1.35, 26, 240]} />
        <meshBasicMaterial
          color="#85bfff"
          transparent
          opacity={0.14}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

function GalaxyScene() {
  const sunRef = useRef();
  const [selectedTarget, setSelectedTarget] = useState(TARGET_STARS[0]);

  return (
    <div className="relative min-h-screen w-full bg-black">
      <Canvas
        camera={{ position: [0, 18, 38], fov: 38, near: 0.1, far: 320 }}
        gl={{ antialias: true }}
        style={{ width: "100%", height: "100vh" }}
      >
        <fog attach="fog" args={["#000000", 34, 140]} />
        <color attach="background" args={["#000000"]} />

        <ambientLight intensity={0.18} />
        <pointLight position={[0, 0, 0]} intensity={1.35} color="#ffffff" />
        <pointLight position={[18, 10, 24]} intensity={0.28} color="#95c9ff" />
        <pointLight position={[-20, 8, -12]} intensity={0.14} color="#8d9bff" />

        <Stars radius={190} depth={100} count={1800} factor={5} saturation={0.45} fade speed={0.15} />
        <NebulaCloud color="#74a3ff" radius={32} height={5} density={16} />
        <NebulaCloud color="#c8d9ff" radius={22} height={3.8} density={10} />

        <mesh ref={sunRef} position={[0, 0, 0]}>
          <sphereGeometry args={[1.6, 32, 32]} />
          <meshBasicMaterial color="#fff7ce" transparent opacity={0.78} />
        </mesh>

        <NebulaVolume />
        <GalaxyCore />
        <SpiralArm color="#c8e9ff" offset={0} seed={1.9} />
        <SpiralArm color="#95d2ff" offset={Math.PI * 0.7} seed={3.9} />
        <SpiralArm color="#b0dbff" offset={Math.PI * 1.4} seed={5.5} />

        {TARGET_STARS.map((target) => (
          <TargetMarker
            key={target.id}
            target={target}
            selected={selectedTarget?.id === target.id}
            onSelect={setSelectedTarget}
          />
        ))}

        <OrbitControls
          enableZoom
          enablePan
          enableRotate
          zoomSpeed={0.72}
          panSpeed={0.55}
          minDistance={16}
          maxDistance={120}
        />

        <EffectComposer multisampling={4}>
          <Bloom luminanceThreshold={0.1} luminanceSmoothing={0.9} intensity={1.25} mipmapBlur />
          <GodRays sun={sunRef} intensity={0.28} decay={0.96} density={0.52} exponent={1.4} />
          <DepthOfField focusDistance={0.015} focalLength={0.015} bokehScale={2.5} height={480} />
          <ChromaticAberration offset={[0.0009, 0.0012]} />
          <Vignette eskil={false} offset={0.22} darkness={0.36} />
        </EffectComposer>
      </Canvas>

      <div className="pointer-events-none absolute right-4 top-4 z-20 w-[240px] rounded-3xl border border-white/10 bg-black/70 p-4 text-white text-xs backdrop-blur-sm">
        <h3 className="mb-2 text-sm uppercase tracking-[0.3em] text-cyan-200">Hedef Yıldızlar</h3>
        <div className="space-y-2">
          {TARGET_STARS.map((target) => (
            <button
              key={target.id}
              type="button"
              onClick={() => setSelectedTarget(target)}
              className={`pointer-events-auto w-full rounded-2xl border px-3 py-2 text-left transition ${
                selectedTarget?.id === target.id
                  ? "border-cyan-300 bg-cyan-500/10 text-cyan-100"
                  : "border-white/10 bg-white/5 text-white/80 hover:border-white/20 hover:bg-white/10"
              }`}
            >
              <div className="text-[11px] font-semibold">{target.label}</div>
              <div className="mt-1 text-[10px] text-white/60">{target.description}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default GalaxyScene;
