import React, { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera, Stars } from "@react-three/drei";
import { EffectComposer, Bloom, ChromaticAberration, Noise } from "@react-three/postprocessing";
import { motion } from "framer-motion";

import HolographicRings from "./HolographicRings";
import TelemetryOverlay from "./TelemetryOverlay";
import "./AegisHUD.css";

export default function AegisHUD({ onComplete }) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="aegis-hud-container"
    >
      <div className="aegis-scanline" />
      
      <Canvas shadows>
        <PerspectiveCamera makeDefault position={[0, 0, 8]} fov={50} />
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} color="#00f2ff" />
        
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
        
        <Suspense fallback={null}>
          <HolographicRings />
          
          <EffectComposer>
            <Bloom 
              intensity={1.5} 
              luminanceThreshold={0.2} 
              luminanceSmoothing={0.9} 
              height={300} 
            />
            <ChromaticAberration offset={[0.002, 0.002]} />
            <Noise opacity={0.05} />
          </EffectComposer>
        </Suspense>

        <OrbitControls 
          enableZoom={false} 
          enablePan={false} 
          maxPolarAngle={Math.PI / 1.5} 
          minPolarAngle={Math.PI / 3} 
        />
      </Canvas>

      <TelemetryOverlay />

      <motion.button
        whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(0, 242, 255, 0.5)" }}
        whileTap={{ scale: 0.95 }}
        onClick={onComplete}
        className="absolute bottom-32 left-1/2 -translate-x-1/2 z-50 px-12 py-4 bg-[#00f2ff]/10 border border-[#00f2ff]/40 text-[#00f2ff] text-sm tracking-[0.5em] font-bold uppercase backdrop-blur-md rounded-lg"
      >
        Initialize Neural Link
      </motion.button>
    </motion.div>
  );
}
