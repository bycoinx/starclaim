import React, { useMemo, useRef } from "react";
import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { NASA_LANDMARKS } from "../data/nasaLandmarks";
import { raDecToVector3 } from "../lib/astro";

function LandmarkBeacon({ landmark, onSelect }) {
  const groupRef = useRef();
  const position = useMemo(() => raDecToVector3(landmark.ra, landmark.dec, 430), [landmark]);
  const color = useMemo(() => new THREE.Color(landmark.hue), [landmark.hue]);

  useFrame((state) => {
    if (!groupRef.current) return;
    const pulse = 1 + Math.sin(state.clock.getElapsedTime() * 2.2 + position.x) * 0.08;
    groupRef.current.scale.setScalar(pulse);
    groupRef.current.lookAt(state.camera.position);
  });

  return (
    <group
      ref={groupRef}
      position={position}
      onClick={(event) => {
        event.stopPropagation();
        onSelect({
          ...landmark,
          star_id: landmark.code,
          tier: "nasa-landmark",
          isLandmark: true,
          price: 0,
          x: position.x,
          y: position.y,
          z: position.z,
        });
      }}
    >
      <mesh>
        <sphereGeometry args={[4.8, 32, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.85} blending={THREE.AdditiveBlending} />
      </mesh>
      <mesh>
        <ringGeometry args={[8, 9.5, 64]} />
        <meshBasicMaterial color={color} transparent opacity={0.45} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} />
      </mesh>
      <mesh>
        <ringGeometry args={[13, 13.5, 64]} />
        <meshBasicMaterial color={color} transparent opacity={0.22} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} />
      </mesh>
      <Html center distanceFactor={18} className="pointer-events-none select-none">
        <div className="rounded-full border border-cyan-300/40 bg-black/70 px-3 py-1 font-mono text-[9px] uppercase tracking-[0.24em] text-cyan-100 shadow-[0_0_20px_rgba(56,189,248,0.25)]">
          {landmark.code}
        </div>
      </Html>
    </group>
  );
}

export default function NasaLandmarks({ onSelect }) {
  return (
    <group name="nasa-landmark-system">
      {NASA_LANDMARKS.map((landmark) => (
        <LandmarkBeacon key={landmark.code} landmark={landmark} onSelect={onSelect} />
      ))}
    </group>
  );
}
