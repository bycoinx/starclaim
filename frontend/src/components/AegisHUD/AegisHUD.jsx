import React, { Suspense, useState, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera, Stars } from "@react-three/drei";
import { EffectComposer, Bloom, ChromaticAberration, Noise } from "@react-three/postprocessing";
import * as THREE from "three";

import HolographicRings from "./HolographicRings";
import TelemetryOverlay from "./TelemetryOverlay";
import "./AegisHUD.css";

function SpatialGazeController({ motionData }) {
  const { camera } = useThree();
  useFrame(() => {
    if (motionData && camera) {
      const targetX = (motionData.beta - Math.PI / 2) * 0.5;
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
  const [canvasError, setCanvasError] = useState(null);

  useEffect(() => {
    console.log("AegisHUD: Initializing system...");
    const wsUrl = `wss://starclaim-api.onrender.com/ws/bridge/${sessionID}`;
    let ws;

    try {
      ws = new WebSocket(wsUrl);
      ws.onopen = () => {
        console.log("AegisHUD: Neural Link socket open.");
        setLinkStatus("waiting");
      };
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "motion") {
            setMotionData(data);
            setLinkStatus("connected");
          }
        } catch (e) {
          console.error("AegisHUD: WS Parse error:", e);
        }
      };
      ws.onerror = (e) => console.error("AegisHUD: WS Connection error.");
      ws.onclose = () => setLinkStatus("disconnected");
    } catch (err) {
      console.error("AegisHUD: WebSocket setup failed.", err);
    }

    return () => {
      if (ws) ws.close();
    };
  }, [sessionID]);

  if (canvasError) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#050A1A] text-center p-6">
        <h2 className="text-[#C9A84C] font-display text-2xl mb-4">Neural Link Calibration Failure</h2>
        <p className="text-[#8899BB] mb-8">Hardware acceleration required for holographic HUD.</p>
        <button onClick={onComplete} className="btn-gold">Enter StarClaim Directly</button>
      </div>
    );
  }

  return (
    <div className="aegis-hud-container">
      <div className="aegis-scanline" />
      
      {/* Session ID UI */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 z-[10000] flex flex-col items-center gap-2 pointer-events-none">
        <div className="text-[10px] tracking-[0.4em] uppercase text-[#4DA6FF] opacity-60">Neural Link Session</div>
        <div className="px-6 py-2 bg-[#4DA6FF]/10 border border-[#4DA6FF]/30 rounded-xl font-mono text-xl text-[#4DA6FF] shadow-[0_0_15px_rgba(0,204,255,0.2)]">
          {sessionID}
        </div>
        <div className="flex items-center gap-2 mt-1">
          <div className={`w-1.5 h-1.5 rounded-full ${linkStatus === 'connected' ? 'bg-[#2DD4A0] animate-pulse' : 'bg-[#E24B4A]'}`} />
          <span className="text-[9px] uppercase tracking-widest text-white/40">
            {linkStatus === 'connected' ? 'Neural Link: Synchronized' : 'Waiting for Mobile Link...'}
          </span>
        </div>
      </div>

      <div className="w-full h-full relative z-[100]">
        <Canvas 
          shadows 
          camera={{ position: [0, 0, 8], fov: 50 }}
          onCreated={({ gl }) => {
            console.log("AegisHUD: Canvas created.");
            gl.setClearColor("#050A1A");
          }}
          onError={(e) => {
            console.error("AegisHUD: Canvas critical error.", e);
            setCanvasError(true);
          }}
        >
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} intensity={1} color="#00f2ff" />
          <SpatialGazeController motionData={motionData} />
          <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
          
          <Suspense fallback={null}>
            <HolographicRings />
            <EffectComposer>
              <Bloom intensity={1.5} luminanceThreshold={0.2} luminanceSmoothing={0.9} height={300} />
              <ChromaticAberration offset={[0.002, 0.002]} />
              <Noise opacity={0.05} />
            </EffectComposer>
          </Suspense>

          <OrbitControls enableZoom={false} enablePan={false} maxPolarAngle={Math.PI / 1.5} minPolarAngle={Math.PI / 3} />
        </Canvas>
      </div>

      <TelemetryOverlay linkStatus={linkStatus} />

      <button
        onClick={onComplete}
        className="absolute bottom-32 left-1/2 -translate-x-1/2 z-[10000] px-12 py-4 bg-[#00f2ff]/10 border border-[#00f2ff]/40 text-[#00f2ff] text-sm tracking-[0.5em] font-bold uppercase backdrop-blur-md rounded-lg hover:bg-[#00f2ff]/20 transition-all"
      >
        Initialize Vault Access
      </button>
    </div>
  );
}
