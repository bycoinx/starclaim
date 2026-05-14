import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Torus, Ring } from "@react-three/drei";
import * as THREE from "three";

export default function HolographicRings() {
  const groupRef = useRef();
  const ring1 = useRef();
  const ring2 = useRef();
  const ring3 = useRef();

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (groupRef.current) {
      groupRef.current.rotation.z = t * 0.1;
    }
    if (ring1.current) {
      ring1.current.rotation.x = t * 0.5;
      ring1.current.rotation.y = t * 0.2;
    }
    if (ring2.current) {
      ring2.current.rotation.y = -t * 0.4;
      ring2.current.rotation.z = t * 0.3;
    }
    if (ring3.current) {
      ring3.current.rotation.x = -t * 0.3;
      ring3.current.rotation.z = -t * 0.5;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Central Core */}
      <mesh>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshBasicMaterial color="#00f2ff" transparent opacity={0.3} wireframe />
      </mesh>

      {/* Outer Rings */}
      <group ref={ring1}>
        <Torus args={[2, 0.02, 16, 100]}>
          <meshBasicMaterial color="#00f2ff" transparent opacity={0.5} />
        </Torus>
      </group>

      <group ref={ring2}>
        <Torus args={[2.5, 0.01, 16, 100]}>
          <meshBasicMaterial color="#ff0055" transparent opacity={0.4} />
        </Torus>
        <Ring args={[2.4, 2.45, 64]}>
          <meshBasicMaterial color="#ff0055" transparent opacity={0.2} side={THREE.DoubleSide} />
        </Ring>
      </group>

      <group ref={ring3}>
        <Torus args={[3, 0.03, 8, 100]}>
          <meshBasicMaterial color="#00f2ff" transparent opacity={0.3} />
        </Torus>
      </group>

      {/* Laser Scanning Effect (Vertical Ring) */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <Ring args={[3.2, 3.22, 128]}>
          <meshBasicMaterial color="#00f2ff" transparent opacity={0.1} side={THREE.DoubleSide} />
        </Ring>
      </mesh>
    </group>
  );
}
