import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useT } from '../lib/i18n';

const PLANETS = [
  { name: "Mercury", dist: 12, size: 0.25, speed: 0.04, color: "#94a3b8" },
  { name: "Venus", dist: 18, size: 0.5, speed: 0.015, color: "#fbbf24" },
  { name: "Earth", dist: 25, size: 0.55, speed: 0.01, color: "#3b82f6" },
  { name: "Mars", dist: 32, size: 0.4, speed: 0.008, color: "#ef4444", isProtected: true },
  { name: "Jupiter", dist: 48, size: 1.4, speed: 0.002, color: "#d97706", isProtected: true },
  { name: "Saturn", dist: 65, size: 1.2, speed: 0.0009, color: "#fcd34d" },
  { name: "Uranus", dist: 80, size: 0.8, speed: 0.0004, color: "#60a5fa" },
  { name: "Neptune", dist: 95, size: 0.8, speed: 0.0001, color: "#312e81" },
];

export default function PlanetarySystem({ onSelect }) {
  const { lang } = useT();
  const groupRef = useRef();

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (!groupRef.current) return;
    
    // Animate orbits (Planets are children 1 to N)
    groupRef.current.children.forEach((child, i) => {
      if (child.userData && child.userData.type === "planet") {
        const p = child.userData;
        const speed = p.speed ?? 0.01;
        const dist = p.dist ?? 10;
        const angle = t * speed + (i * 0.5); // Offset initial positions
        child.position.x = Math.cos(angle) * dist;
        child.position.z = Math.sin(angle) * dist;
        child.rotation.y += 0.01;
      }
    });
  });

  if (!PLANETS || PLANETS.length === 0) return null;

  return (
    <group ref={groupRef}>
      {/* Sun - The Source */}
      <mesh 
        userData={{ type: "sun" }} 
        onClick={(e) => { 
          e.stopPropagation(); 
          onSelect({ 
            name: lang === "TR" ? "Güneş" : "Sun", 
            tier: "protected", 
            code: "SOL-00", 
            constellation: "Solar System",
            description: lang === "TR" ? "Egemenlik Protokolü: Aile Mirası Çekirdeği." : "Sovereign Protocol: Family Legacy Core." 
          }); 
        }}
      >
        <sphereGeometry args={[4, 32, 32]} />
        <meshBasicMaterial color="#f59e0b" />
      </mesh>

      {PLANETS.map((p, i) => (
        <React.Fragment key={p.name}>
          {/* Energy Path (Orbit) */}
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[p.dist - 0.05, p.dist + 0.05, 128]} />
            <meshBasicMaterial color="#1e293b" transparent opacity={0.15} />
          </mesh>

          {/* Planet */}
          <mesh 
            userData={{ type: "planet", ...p }}
            onClick={(e) => { 
              e.stopPropagation(); 
              onSelect({ 
                ...p, 
                tier: p.isProtected ? "protected" : "standard",
                code: `SOL-0${i+1}`,
                constellation: "Solar System",
                description: p.isProtected ? (lang === "TR" ? "PROHIBITED: Sovereign Territory" : "PROHIBITED: Sovereign Territory") : ""
              }); 
            }}
          >
            <sphereGeometry args={[p.size, 32, 32]} />
            <meshStandardMaterial color={p.color} roughness={0.6} metalness={0.4} />
          </mesh>
        </React.Fragment>
      ))}
    </group>
  );
}
