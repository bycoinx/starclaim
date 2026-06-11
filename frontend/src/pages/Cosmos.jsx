import React, { useState } from "react";
import GalaxyScene from "../components/GalaxyScene/GalaxyScene";
import { QRCodeSVG } from "qrcode.react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Cpu, ChevronRight, X, Smartphone } from "lucide-react";

export default function Cosmos({ onClaim }) {
  const [selectedStar, setSelectedStar] = useState(null);

  const handleStarSelect = (star) => {
    setSelectedStar(star);
  };

  return (
    <main className="w-full h-screen bg-black overflow-hidden relative">
      {/* 3D Space Engine */}
      <GalaxyScene onStarClick={handleStarSelect} />

      {/* Main HUD Overlays */}
      <div className="absolute top-28 left-10 z-20 pointer-events-none">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3 text-[10px] tracking-[0.4em] uppercase text-sc-gold mb-2 font-bold"
        >
          <div className="w-2 h-2 rounded-full bg-sc-gold animate-pulse" />
          STRATEGIC_OBSERVER_TERMINAL // v2.0
        </motion.div>
        <h1 className="font-display text-5xl tracking-tight text-white uppercase">
          Cosmos <span className="gold-gradient-text">Engine</span>
        </h1>
      </div>

      {/* Bottom Telemetry Feed */}
      <div className="absolute bottom-10 left-10 right-10 z-20 flex justify-between items-end pointer-events-none">
         <div className="flex gap-8">
            <div className="opacity-40">
               <div className="text-[8px] text-sc-text-muted mb-1 font-mono uppercase tracking-widest font-bold">System Status</div>
               <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1 text-[10px] text-sc-green font-mono font-bold"><Shield size={10} /> AEGIS_SAFE</div>
                  <div className="flex items-center gap-1 text-[10px] text-sc-blue font-mono font-bold"><Cpu size={10} /> CORE_STABLE</div>
               </div>
            </div>
            <div className="opacity-40 hidden md:block border-l border-white/10 pl-8">
               <div className="text-[8px] text-sc-text-muted mb-1 font-mono uppercase tracking-widest font-bold">Star Density</div>
               <div className="text-[12px] text-white font-mono font-bold tracking-widest">48,208 NODES_ACTIVE</div>
            </div>
         </div>
         
         <div className="text-right opacity-30">
            <div className="text-[8px] text-sc-text-muted mb-1 font-mono uppercase tracking-widest font-bold">Observer Coordinates</div>
            <div className="text-[10px] text-white font-mono tracking-widest">RA 18h 36m 56s | DEC +38° 47′ 01″</div>
         </div>
      </div>

      {/* Selection Observer Panel (Side Terminal) */}
      <AnimatePresence>
        {selectedStar && (
          <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            className="absolute top-28 right-10 bottom-10 w-96 z-30 pointer-events-auto"
          >
            <div className="terminal-frame h-full flex flex-col p-8 border-sc-gold/30 bg-sc-deep/80 backdrop-blur-2xl">
              <div className="terminal-scanline" />
              <div className="flex justify-between items-start mb-8">
                <div>
                   <div className="text-[9px] uppercase tracking-[0.2em] text-sc-gold font-bold mb-1">Star Profile // {selectedStar.code || 'NULL'}</div>
                   <h2 className="font-display text-3xl gold-gradient-text uppercase tracking-tight">{selectedStar.proper || selectedStar.name}</h2>
                </div>
                <button 
                  onClick={() => setSelectedStar(null)}
                  className="p-2 hover:bg-white/5 rounded-full transition-colors text-sc-text-muted hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                <div className="space-y-6">
                  {/* Telemetry Data Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="telemetry-item-box bg-white/2 border-white/5 p-4">
                      <div className="text-[8px] text-sc-text-muted uppercase font-bold tracking-widest mb-2">Distance</div>
                      <div className="text-sm text-white font-mono font-bold tracking-wide">{selectedStar.dist ? `${selectedStar.dist.toFixed(2)} LY` : 'UNCERTAIN'}</div>
                    </div>
                    <div className="telemetry-item-box bg-white/2 border-white/5 p-4">
                      <div className="text-[8px] text-sc-text-muted uppercase font-bold tracking-widest mb-2">Magnitude</div>
                      <div className="text-sm text-sc-gold font-mono font-bold tracking-wide">{selectedStar.mag !== undefined ? selectedStar.mag.toFixed(2) : 'N/A'}</div>
                    </div>
                  </div>

                  {/* Scientific Specs */}
                  <div className="p-4 bg-white/2 border border-white/5 rounded-lg space-y-3 font-mono">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-sc-text-muted uppercase">Spectral Type</span>
                      <span className="text-sc-blue font-bold">{selectedStar.spect || 'Unknown'}</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-sc-text-muted uppercase">Constellation</span>
                      <span className="text-white font-bold">{selectedStar.constellation || 'General Deep Space'}</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-sc-text-muted uppercase">Coordinates</span>
                      <span className="text-white/60">{(selectedStar.ra || 0).toFixed(4)}h / {(selectedStar.dec || 0).toFixed(4)}°</span>
                    </div>
                  </div>

                  {/* Bridge to Mobile Section */}
                  <div className="mt-10 pt-10 border-t border-white/5 text-center">
                    <div className="inline-flex items-center gap-2 text-sc-blue text-[9px] uppercase tracking-[0.3em] font-black mb-6">
                      <Smartphone size={12} /> Bridge_to_Mobile
                    </div>
                    
                    <div className="mx-auto p-4 bg-white rounded-2xl w-48 h-48 flex items-center justify-center shadow-[0_0_40px_rgba(255,255,255,0.1)] border border-sc-gold/20">
                      <QRCodeSVG 
                        value={`starclaim://star/${selectedStar.id || selectedStar.hip || selectedStar.code}`} 
                        size={160}
                        bgColor="#ffffff"
                        fgColor="#050A1A"
                        level="H"
                        includeMargin={false}
                      />
                    </div>
                    <p className="mt-6 text-[10px] text-sc-text-muted font-mono px-4 leading-relaxed uppercase tracking-wider">
                      Mobil uygulamayı açın ve bu yıldızı anında kokpitinize aktararak tescil işlemlerini başlatın.
                    </p>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => onClaim(selectedStar)}
                className="mt-8 btn-gold w-full py-4 uppercase tracking-[0.3em] text-[10px] font-black group shadow-lg"
              >
                <span className="inline-flex items-center gap-2">
                  Initialize_Claim_Protocol <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
