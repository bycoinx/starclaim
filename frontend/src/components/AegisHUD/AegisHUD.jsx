import React, { Suspense, useState, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera, Stars } from "@react-three/drei";
import { EffectComposer, Bloom, ChromaticAberration, Noise } from "@react-three/postprocessing";
import { motion } from "framer-motion";
import * as THREE from "three";

import HolographicRings from "./HolographicRings";
import TelemetryOverlay from "./TelemetryOverlay";
import "./AegisHUD.css";

function SpatialGazeController({ motionData }) {
  const { camera } = useThree();
  useFrame(() => {
    if (motionData) {
      // Map mobile rotation (beta/pitch, alpha/yaw) to PC camera
      // We use lerp for smooth motion
      const targetX = (motionData.beta - Math.PI / 2) * 0.5; // Offset for holding phone upright
      const targetY = -motionData.alpha * 0.5;
      
      camera.rotation.x = THREE.MathUtils.lerp(camera.rotation.x, targetX, 0.1);
      camera.rotation.y = THREE.MathUtils.lerp(camera.rotation.y, targetY, 0.1);
    }
  });
  return null;
}

export default function AegisHUD({ onComplete }) {
  const [sessionID] = useState(() => Math.random().toString(36).substring(7).toUpperCase());
  const [motionData, setMotionData] = useState(null);
  const [linkStatus, setLinkStatus] = useState("disconnected");

  useEffect(() => {
    const wsUrl = `wss://starclaim-api.onrender.com/ws/bridge/${sessionID}`;
    let ws;

    try {
      ws = new WebSocket(wsUrl);
      ws.onopen = () => setLinkStatus("waiting");
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === "motion") {
          setMotionData(data);
          setLinkStatus("connected");
        }
      };
      ws.onclose = () => setLinkStatus("disconnected");
    } catch (err) {
      console.error("Neural Link WS error:", err);
    }

    return () => ws?.close();
  }, [sessionID]);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="aegis-hud-container"
    >
      <div className="aegis-scanline" />
      
      <div className="absolute top-10 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2">
        <div className="text-[10px] tracking-[0.4em] uppercase text-sc-blue opacity-60">Neural Link Session</div>
        <div className="px-6 py-2 bg-sc-blue/10 border border-sc-blue/30 rounded-xl font-mono text-xl text-sc-blue shadow-[0_0_15px_rgba(0,204,255,0.2)]">
          {sessionID}
        </div>
        <div className="flex items-center gap-2 mt-1">
          <div className={`w-1.5 h-1.5 rounded-full ${linkStatus === 'connected' ? 'bg-sc-green animate-pulse' : 'bg-sc-red'}`} />
          <span className="text-[9px] uppercase tracking-widest text-white/40">
            {linkStatus === 'connected' ? 'Neural Link: Synchronized' : 'Waiting for Mobile Link...'}
          </span>
        </div>
      </div>

      <Canvas shadows>
        <PerspectiveCamera makeDefault position={[0, 0, 8]} fov={50} />
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} color="#00f2ff" />
        
        <SpatialGazeController motionData={motionData} />

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

      <TelemetryOverlay linkStatus={linkStatus} />

      <motion.button
        whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(0, 242, 255, 0.5)" }}
        whileTap={{ scale: 0.95 }}
        onClick={onComplete}
        className="absolute bottom-32 left-1/2 -translate-x-1/2 z-50 px-12 py-4 bg-[#00f2ff]/10 border border-[#00f2ff]/40 text-[#00f2ff] text-sm tracking-[0.5em] font-bold uppercase backdrop-blur-md rounded-lg"
      >
        Initialize Vault Access
      </motion.button>
    </motion.div>
  );
}
