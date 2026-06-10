import React from "react";
import GalaxyScene from "../components/GalaxyScene/GalaxyScene";

export default function Cosmos({ onClaim }) {
  return (
    <main className="w-full h-screen bg-black overflow-hidden relative">
      <GalaxyScene onStarClick={onClaim} />
      <div className="absolute top-32 left-10 z-20 pointer-events-none">
        <div className="text-[10px] tracking-[0.4em] uppercase text-sc-gold mb-2 font-bold opacity-60">
          COSMOS_EXPLORER // VOYAGER_MODE_ACTIVE
        </div>
        <h1 className="font-display text-4xl tracking-tight text-white uppercase">
          Deep <span className="gold-gradient-text">Space</span>
        </h1>
        <p className="text-sc-text-muted max-w-xs mt-4 text-[10px] font-mono opacity-50 uppercase tracking-widest leading-relaxed">
          Evrenin derinliklerini 3D olarak keşfedin. Yıldızlara dokunun ve ebedi mirasınızı seçin.
        </p>
      </div>
    </main>
  );
}
