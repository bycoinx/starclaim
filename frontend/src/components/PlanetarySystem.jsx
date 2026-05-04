import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useT } from '../lib/i18n';

const PLANETS = [
  { 
    name: "Mercury", 
    nameTr: "Merkür",
    dist: 12, 
    size: 0.4, 
    speed: 0.047, 
    color: "#9ca3af",
    detail: "Kraterli, grimsi kahverengi, atmosferi olmayan taşlı yüzey.",
    detailEn: "Cratered, grayish-brown, rocky surface without atmosphere."
  },
  { 
    name: "Venus", 
    nameTr: "Venüs",
    dist: 18, 
    size: 0.9, 
    speed: 0.035, 
    color: "#fbbf24",
    detail: "Kalın, sülfürik asit bulutları nedeniyle mat sarı-turuncu tonlarında yoğun atmosfer.",
    detailEn: "Thick yellow-orange atmosphere due to sulfuric acid clouds."
  },
  { 
    name: "Earth", 
    nameTr: "Dünya",
    dist: 26, 
    size: 1.0, 
    speed: 0.029, 
    color: "#3b82f6",
    detail: "Mavi okyanuslar, beyaz bulutlar ve yeşil-kahverengi kıtaların seçilebildiği dinamik yüzey.",
    detailEn: "Dynamic surface with blue oceans, white clouds, and green-brown continents.",
    moons: [
      { name: "Moon", nameTr: "Ay", dist: 2.2, size: 0.27, speed: 0.08, color: "#d1d5db", detail: "Dünya'nın uydusu, gümüşi gri kraterli yüzey.", detailEn: "Earth's satellite, silvery-gray cratered surface." }
    ]
  },
  { 
    name: "Mars", 
    nameTr: "Mars",
    dist: 34, 
    size: 0.53, 
    speed: 0.024, 
    color: "#ef4444",
    detail: "Pas kırmızısı yüzey, kutup bölgelerinde beyaz buz takkeleri.",
    detailEn: "Rust red surface, white polar caps."
  },
  { 
    name: "Jupiter", 
    nameTr: "Jüpiter",
    dist: 48, 
    size: 2.2, 
    speed: 0.013, 
    color: "#d97706",
    detail: "Büyük Kırmızı Leke'nin seçilebildiği gaz bantlarından oluşan dev yapı.",
    detailEn: "Gas giant with visible bands and the Great Red Spot."
  },
  { 
    name: "Saturn", 
    nameTr: "Satürn",
    dist: 68, 
    size: 1.8, 
    speed: 0.009, 
    color: "#fcd34d",
    hasRings: true,
    detail: "Altın sarısı gaz kütlesi ve yüksek çözünürlüklü halka sistemi.",
    detailEn: "Golden gas giant with a high-resolution ring system."
  },
  { 
    name: "Uranus", 
    nameTr: "Uranüs",
    dist: 88, 
    size: 1.1, 
    speed: 0.006, 
    color: "#60a5fa",
    detail: "Soluk camgöbeği rengi, pürüzsüz gaz katmanı.",
    detailEn: "Pale cyan color, smooth gas layer."
  },
  { 
    name: "Neptune", 
    nameTr: "Neptün",
    dist: 105, 
    size: 1.1, 
    speed: 0.005, 
    color: "#312e81",
    detail: "Derin okyanus mavisi, metan gazı kaynaklı koyu tonlar.",
    detailEn: "Deep ocean blue, dark tones from methane gas."
  },
];

export default function PlanetarySystem({ onSelect }) {
  const { lang } = useT();
  const groupRef = useRef();

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (!groupRef.current) return;
    
    groupRef.current.children.forEach((child) => {
      if (child.userData && child.userData.type === "planet") {
        const p = child.userData;
        const speed = p.speed || 0.01;
        const dist = p.dist || 10;
        const angle = t * speed + (p.index * 0.5);
        child.position.x = Math.cos(angle) * dist;
        child.position.z = Math.sin(angle) * dist;
        child.rotation.y += 0.005;

        // Animate Moons if any
        if (child.children.length > 0) {
          child.children.forEach(sub => {
            if (sub.userData && sub.userData.type === "moon") {
              const m = sub.userData;
              const mSpeed = m.speed || 0.05;
              const mDist = m.dist || 2;
              const mAngle = t * mSpeed;
              sub.position.x = Math.cos(mAngle) * mDist;
              sub.position.z = Math.sin(mAngle) * mDist;
            }
          });
        }
      }
    });
  });

  const getCommonData = (p) => ({
    name: lang === "TR" ? p.nameTr : p.name,
    tier: "protected",
    code: p.code || "SOL-SYS",
    constellation: "Solar System",
    ownershipStatus: "Sovereign Asset - Verified Record",
    protocol: "Privacy Protocol: Encrypted Custody",
    description: lang === "TR" 
      ? "Bu kozmik koordinat ve ilişkili veri seti, StarClaim merkeziyetsiz ağı üzerinde yüksek güvenlikli şifreleme ile korunmaktadır."
      : "This cosmic coordinate and associated data set is protected by high-security encryption on the StarClaim decentralized network."
  });

  if (!PLANETS || PLANETS.length === 0) return null;

  return (
    <group ref={groupRef}>
      {/* Sun - The Source */}
      <mesh 
        userData={{ type: "sun" }} 
        onClick={(e) => { 
          e.stopPropagation(); 
          onSelect(getCommonData({ nameTr: "Güneş", name: "Sun", code: "SOL-00" })); 
        }}
      >
        <sphereGeometry args={[4.5, 64, 64]} />
        <meshStandardMaterial 
          color="#fff7ed" 
          emissive="#f59e0b" 
          emissiveIntensity={2} 
          metalness={0}
          roughness={0}
        />
        <pointLight intensity={5} distance={300} color="#fbbf24" />
      </mesh>

      {PLANETS.map((p, i) => (
        <React.Fragment key={p.name}>
          {/* Energy Path (Orbit) */}
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[p.dist - 0.1, p.dist + 0.1, 128]} />
            <meshBasicMaterial color="#1e293b" transparent opacity={0.2} />
          </mesh>

          {/* Planet Group */}
          <group 
            userData={{ type: "planet", index: i, ...p }}
            onClick={(e) => { 
              e.stopPropagation(); 
              onSelect({
                ...getCommonData(p),
                code: `SOL-0${i+1}`,
                planetDetail: lang === "TR" ? p.detail : p.detailEn
              }); 
            }}
          >
            <mesh>
              <sphereGeometry args={[p.size, 32, 32]} />
              <meshStandardMaterial color={p.color} roughness={0.7} metalness={0.3} />
            </mesh>

            {/* Saturn Rings */}
            {p.hasRings && (
              <mesh rotation={[Math.PI / 2.5, 0, 0]}>
                <ringGeometry args={[p.size * 1.4, p.size * 2.2, 64]} />
                <meshStandardMaterial color="#d4af37" transparent opacity={0.6} side={THREE.DoubleSide} />
              </mesh>
            )}

            {/* Moons */}
            {p.moons?.map((m) => (
              <mesh key={m.name} userData={{ type: "moon", ...m }}>
                <sphereGeometry args={[m.size, 16, 16]} />
                <meshStandardMaterial color={m.color} />
              </mesh>
            ))}
          </group>
        </React.Fragment>
      ))}
    </group>
  );
}
