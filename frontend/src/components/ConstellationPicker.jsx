import React, { useState, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { Stars, OrbitControls, Line } from "@react-three/drei";
import * as THREE from "three";
import { generateConstellationHash } from "../lib/crypto";

function StarField({ onStarClick, selectedStars }) {
  // Generate random stable stars for selection
  const stars = useMemo(() => {
    return Array.from({ length: 50 }, (_, i) => ({
      id: `star-${i}`,
      pos: [
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 20
      ],
      size: Math.random() * 0.15 + 0.05
    }));
  }, []);

  return (
    <group>
      {stars.map((s) => (
        <mesh 
          key={s.id} 
          position={s.pos} 
          onClick={(e) => {
            e.stopPropagation();
            onStarClick(s);
          }}
        >
          <sphereGeometry args={[s.size, 16, 16]} />
          <meshBasicMaterial 
            color={selectedStars.find(st => st.id === s.id) ? "#00f2ff" : "#ffffff"} 
            toneMapped={false}
          />
          {selectedStars.find(st => st.id === s.id) && (
             <pointLight intensity={1} color="#00f2ff" distance={2} />
          )}
        </mesh>
      ))}
    </group>
  );
}

function ConstellationLines({ selectedStars }) {
  if (selectedStars.length < 2) return null;
  const points = selectedStars.map(s => s.pos);
  
  return (
    <Line
      points={points}
      color="#00f2ff"
      lineWidth={1.5}
      transparent
      opacity={0.6}
    />
  );
}

export default function ConstellationPicker({ onHashGenerated }) {
  const [selectedStars, setSelectedStars] = useState([]);
  const [zoom, setZoom] = useState(10);
  const [sector] = useState("ORION-B"); // Mock sector

  const handleStarClick = (star) => {
    if (selectedStars.find(s => s.id === star.id)) {
      setSelectedStars(selectedStars.filter(s => s.id !== star.id));
    } else {
      setSelectedStars([...selectedStars, star]);
    }
  };

  const handleFinish = async () => {
    if (selectedStars.length < 3) {
      alert("Please select at least 3 stars to form a secure constellation.");
      return;
    }
    const hash = await generateConstellationHash(
      selectedStars.map(s => ({ x: s.pos[0], y: s.pos[1], z: s.pos[2] })),
      sector,
      zoom
    );
    onHashGenerated(hash);
  };

  return (
    <div className="relative w-full h-[500px] bg-sc-deep rounded-2xl overflow-hidden border border-sc-gold/20">
      <Canvas camera={{ position: [0, 0, 10], fov: 60 }}>
        <color attach="background" args={["#050b1a"]} />
        <ambientLight intensity={0.4} />
        
        <Stars radius={100} depth={50} count={3000} factor={4} saturation={0} fade speed={1} />
        
        <StarField onStarClick={handleStarClick} selectedStars={selectedStars} />
        <ConstellationLines selectedStars={selectedStars} />

        <OrbitControls 
          enablePan={false}
          onEnd={(e) => {
            // Update zoom state based on camera position
            const dist = new THREE.Vector3().copy(e.target.object.position).length();
            setZoom(dist);
          }}
        />
      </Canvas>

      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
        <div className="px-3 py-1 bg-sc-gold/10 border border-sc-gold/30 rounded text-[10px] text-sc-gold tracking-widest uppercase">
          Sector: ORION-B
        </div>
        <div className="px-3 py-1 bg-sc-blue/10 border border-sc-blue/30 rounded text-[10px] text-sc-blue tracking-widest uppercase">
          Nodes: {selectedStars.length}
        </div>
      </div>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex gap-4">
        <button 
          onClick={() => setSelectedStars([])}
          className="px-6 py-2 bg-white/5 hover:bg-white/10 border border-white/20 text-white text-xs uppercase tracking-widest rounded-lg transition-colors"
        >
          Reset
        </button>
        <button 
          onClick={handleFinish}
          disabled={selectedStars.length < 3}
          className="px-8 py-2 bg-sc-gold/20 hover:bg-sc-gold/40 border border-sc-gold/50 text-sc-gold text-xs uppercase tracking-widest rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Generate Key
        </button>
      </div>

      <div className="absolute top-1/2 right-6 -translate-y-1/2 pointer-events-none opacity-20 hidden md:block">
        <div className="text-[8px] text-sc-gold vertical-text tracking-[0.5em] uppercase">
          Constellation Protocol v4.2
        </div>
      </div>
    </div>
  );
}
