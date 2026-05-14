import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Activity, Zap, Cpu, Lock, Globe } from "lucide-react";

export default function TelemetryOverlay() {
  const [cpuLoad, setCpuLoad] = useState(12);
  const [memUsage, setMemUsage] = useState(4.2);
  const [spaceWeather, setSpaceWeather] = useState("CALM");
  const [zkpStatus, setZkpStatus] = useState("INITIALIZING");

  useEffect(() => {
    const interval = setInterval(() => {
      setCpuLoad(prev => Math.min(Math.max(prev + (Math.random() - 0.5) * 5, 5), 45).toFixed(1));
      setMemUsage(prev => Math.min(Math.max(prev + (Math.random() - 0.5) * 0.2, 3.8), 5.1).toFixed(2));
    }, 2000);

    const zkpSteps = ["INITIALIZING", "GENERATING PROOF", "LOCAL ENCRYPTION", "VERIFYING", "READY"];
    let step = 0;
    const zkpInterval = setInterval(() => {
      if (step < zkpSteps.length - 1) {
        step++;
        setZkpStatus(zkpSteps[step]);
      }
    }, 3000);

    return () => {
      clearInterval(interval);
      clearInterval(zkpInterval);
    };
  }, []);

  return (
    <div className="hud-overlay">
      {/* Top Left: System Stats */}
      <div className="flex flex-col gap-4">
        <motion.div 
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="telemetry-block"
        >
          <div className="flex items-center gap-2 mb-2">
            <Cpu className="w-4 h-4" />
            <span className="telemetry-label">Aegis Core OS</span>
          </div>
          <div className="telemetry-value text-sc-gold">v8.5.0-MARK85</div>
        </motion.div>

        <div className="grid grid-cols-2 gap-2">
          <div className="glass-panel text-center">
            <div className="telemetry-label">CPU LOAD</div>
            <div className="telemetry-value">{cpuLoad}%</div>
          </div>
          <div className="glass-panel text-center">
            <div className="telemetry-label">MEM USAGE</div>
            <div className="telemetry-value">{memUsage}GB</div>
          </div>
        </div>
      </div>

      {/* Top Right: NASA Space Weather */}
      <motion.div 
        initial={{ x: 100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="absolute top-8 right-8 text-right"
      >
        <div className="glass-panel border-sc-gold/30">
          <div className="flex items-center justify-end gap-2 mb-2">
            <Globe className="w-4 h-4 text-sc-gold" />
            <span className="telemetry-label">NASA LANDMARK TELEMETRY</span>
          </div>
          <div className="telemetry-value text-sc-gold glitch-text">WEATHER: {spaceWeather}</div>
          <div className="text-[9px] opacity-40 mt-1 uppercase">Solar Radiation: 0.04 mSv/h</div>
          <div className="text-[9px] opacity-40 uppercase">Magnetic Field: 48.2 nT</div>
        </div>
      </motion.div>

      {/* Center Bottom: ZKP & Assurance */}
      <div className="flex flex-col items-center gap-6 mb-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={zkpStatus}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            className="flex items-center gap-3 px-6 py-2 bg-sc-blue/10 border border-sc-blue/40 rounded-full"
          >
            <Lock className="w-4 h-4 text-sc-blue" />
            <span className="text-xs tracking-[0.3em] font-bold text-sc-blue">ZKP: {zkpStatus}</span>
          </motion.div>
        </AnimatePresence>

        <div className="flex items-center gap-10">
          <div className="flex flex-col items-end">
            <div className="telemetry-label">Assurance Shield</div>
            <div className="telemetry-value text-sc-green">70% ACTIVE</div>
            <div className="text-[9px] opacity-40 uppercase">24-Month Lock</div>
          </div>
          
          <div className="assurance-shield">
            <Shield className="w-12 h-12 text-[#00f2ff] drop-shadow-[0_0_10px_#00f2ff]" />
          </div>

          <div className="flex flex-col items-start">
            <div className="telemetry-label">Constellation Key</div>
            <div className="telemetry-value">READY</div>
            <div className="text-[9px] opacity-40 uppercase">SHA-256 Latency: 4ms</div>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="flex justify-between items-end text-[10px] opacity-30 tracking-widest">
        <div>COORDINATES: RA 18h 36m 56s | DEC +38° 47′ 01″</div>
        <div>STARK INDUSTRIES · AEGIS PROTOCOL · 2026</div>
      </div>
    </div>
  );
}
