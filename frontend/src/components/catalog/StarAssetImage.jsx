import React from "react";
import { StarAssetManager } from "../../lib/StarAssetManager";

// Spectral type glow mapping based on primary class letters
const SPECTRAL_GLOWS = {
  O: "from-cyan-500/25 to-blue-600/25 shadow-[0_0_30px_rgba(6,182,212,0.45)] border-cyan-400/20",
  B: "from-blue-400/25 to-indigo-600/25 shadow-[0_0_30px_rgba(59,130,246,0.45)] border-blue-400/20",
  A: "from-sky-300/25 to-blue-400/25 shadow-[0_0_25px_rgba(186,230,253,0.4)] border-sky-300/20",
  F: "from-yellow-100/20 to-amber-200/20 shadow-[0_0_25px_rgba(254,243,199,0.35)] border-yellow-200/20",
  G: "from-amber-300/25 to-yellow-500/25 shadow-[0_0_30px_rgba(245,158,11,0.45)] border-amber-400/20",
  K: "from-orange-400/25 to-red-500/25 shadow-[0_0_30px_rgba(251,146,60,0.4)] border-orange-400/20",
  M: "from-red-500/25 to-rose-700/25 shadow-[0_0_35px_rgba(239,68,68,0.5)] border-red-500/20",
  default: "from-indigo-400/20 to-purple-600/20 shadow-[0_0_20px_rgba(129,140,248,0.3)] border-indigo-400/10"
};

export default function StarAssetImage({ 
  star, 
  variant = "preview", 
  className = "",
  showDecorations = true
}) {
  const asset = StarAssetManager.getStarAsset(star);
  if (!asset) return null;

  const firstLetter = asset.spectralType ? asset.spectralType.charAt(0).toUpperCase() : "G";
  const glowStyle = SPECTRAL_GLOWS[firstLetter] || SPECTRAL_GLOWS.default;

  // Decide sizing based on variant
  const isHero = variant === "hero";
  const imageSize = isHero ? "w-28 h-28" : "w-16 h-16";
  const starCoreSize = isHero ? "w-6 h-6" : "w-4 h-4";
  const flareLength = isHero ? "w-44 h-[1px]" : "w-28 h-[1px]";
  const flareHeight = isHero ? "h-44 w-[1px]" : "h-28 w-[1px]";
  const secondaryFlareLength = isHero ? "w-28 h-[1px]" : "w-16 h-[1px]";
  const secondaryFlareHeight = isHero ? "h-28 w-[1px]" : "h-16 w-[1px]";

  return (
    <div className={`relative aspect-square w-full rounded-xl bg-[#030615] overflow-hidden flex items-center justify-center border border-white/5 transition-all duration-300 ${className}`}>
      {/* Background Reticle grid lines */}
      {showDecorations && (
        <>
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:16px_16px]" />
          <div className="absolute w-5/6 h-5/6 border border-white/[0.01] rounded-full" />
          <div className="absolute w-2/3 h-2/3 border border-white/[0.015] border-dashed rounded-full animate-[spin_120s_linear_infinite]" />
          <div className="absolute w-full h-[1px] bg-white/[0.015]" />
          <div className="absolute h-full w-[1px] bg-white/[0.015]" />
        </>
      )}

      {/* Dynamic Glow and Flares based on Spectral properties */}
      <div className={`relative ${imageSize} rounded-full bg-gradient-to-br ${glowStyle} flex items-center justify-center transition-transform duration-500`}>
        {/* Core Center Hotspot */}
        <div className={`rounded-full bg-white shadow-[0_0_15px_rgba(255,255,255,1)] ${starCoreSize}`} />
        
        {/* Flare Lines (horizontal/vertical) */}
        <div className={`absolute bg-white/30 blur-[0.5px] ${flareLength}`} />
        <div className={`absolute bg-white/30 blur-[0.5px] ${flareHeight}`} />
        
        {/* Sub-flares (thicker but shorter) */}
        <div className={`absolute bg-white/45 ${secondaryFlareLength}`} />
        <div className={`absolute bg-white/45 ${secondaryFlareHeight}`} />
      </div>

      {showDecorations && (
        <div className="absolute bottom-2.5 left-3 text-[8px] font-mono text-white/20 tracking-widest uppercase">
          {asset.spectralType}{" // "}{asset.code}
        </div>
      )}
    </div>
  );
}
