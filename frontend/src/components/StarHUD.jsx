import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, MapPin, Target, Shield, Info } from "lucide-react";
import { useT } from "../lib/i18n";

export default function StarHUD({ star, onClaim, onClose }) {
  const { t, lang } = useT();

  if (!star) return null;

  const displayName = star.isLandmark && lang === "TR" ? star.nameTr : star.name;
  const logText = star.isLandmark
    ? (lang === "TR" ? star.descriptionTr : star.description)
    : lang === "TR"
      ? `${star.name}, ${star.constellation} derinliklerinde parlayan kadim bir ruhu temsil ediyor. Bu yıldız, evrenin sessiz tanıklarından biridir.`
      : `${star.name} represents an ancient soul glowing in the depths of ${star.constellation}. This star is one of the silent witnesses of the universe.`;

  return (
    <div className="absolute top-1/2 right-10 -translate-y-1/2 z-50 pointer-events-none">
      <AnimatePresence mode="wait">
        <motion.div
          key={star.star_id || star.code}
          initial={{ opacity: 0, x: 50, scale: 0.9, filter: "blur(10px)" }}
          animate={{ opacity: 1, x: 0, scale: 1, filter: "blur(0px)" }}
          exit={{ opacity: 0, x: 50, scale: 0.9, filter: "blur(10px)" }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="glass-dark border border-cyan-500/20 rounded-3xl p-8 w-80 md:w-96 backdrop-blur-3xl shadow-[0_0_50px_rgba(6,182,212,0.15)] pointer-events-auto relative overflow-hidden"
        >
          {/* Scanline Effect */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-400/5 to-transparent h-[200%] -translate-y-1/2 animate-scanline pointer-events-none" />
          
          {/* Top Accent Line */}
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-40" />

          <div className="flex justify-between items-start mb-6 relative z-10">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                <div className="text-[10px] tracking-[0.4em] uppercase text-cyan-400 font-display font-bold">Target Locked</div>
              </div>
              <h2 className="font-display text-3xl text-white tracking-tight">{displayName}</h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-red-500/20 hover:border-red-500/40 transition-all text-white/40 hover:text-red-400 group"
            >
              <X className="w-5 h-5 group-hover:rotate-90 transition-transform" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-8 relative z-10">
            <div className="bg-cyan-950/20 border border-cyan-500/10 rounded-2xl p-4 hover:border-cyan-500/30 transition-colors">
              <div className="text-[9px] uppercase tracking-widest text-cyan-400/60 mb-1.5 flex items-center gap-1.5">
                <MapPin className="w-3 h-3" /> RA / DEC
              </div>
              <div className="text-xs font-mono text-cyan-50">{star.ra} / {star.dec}</div>
            </div>
            <div className="bg-cyan-950/20 border border-cyan-500/10 rounded-2xl p-4 hover:border-cyan-500/30 transition-colors">
              <div className="text-[9px] uppercase tracking-widest text-cyan-400/60 mb-1.5 flex items-center gap-1.5">
                <Target className="w-3 h-3" /> {star.isLandmark ? "LANDMARK" : "NASA ID"}
              </div>
              <div className="text-xs font-mono text-cyan-50">{star.code.toUpperCase()}</div>
            </div>
          </div>

          <div className="space-y-4 mb-8 relative z-10">
            <div className="flex items-center justify-between text-xs">
              <span className="text-sc-text-muted flex items-center gap-2">
                <Shield className="w-3.5 h-3.5 text-cyan-400/50" /> {lang === "TR" ? "Takımyıldız" : "Constellation"}
              </span>
              <span className="text-white font-display italic tracking-wide">{star.constellation}</span>
            </div>
            {star.isLandmark && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-sc-text-muted flex items-center gap-2">
                  <Info className="w-3.5 h-3.5 text-cyan-400/50" /> {lang === "TR" ? "Katalog" : "Catalog"}
                </span>
                <span className="text-white font-mono text-[11px]">{star.catalog}</span>
              </div>
            )}
            {star.isLandmark && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-sc-text-muted flex items-center gap-2">
                  <Target className="w-3.5 h-3.5 text-cyan-400/50" /> {lang === "TR" ? "Uzaklık" : "Distance"}
                </span>
                <span className="text-white font-mono text-[11px]">{Number(star.distanceLy).toLocaleString()} ly</span>
              </div>
            )}
            <div className="flex items-center justify-between text-xs">
              <span className="text-sc-text-muted flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400/50" /> {lang === "TR" ? "Kademe" : "Tier"}
              </span>
              <span className={`px-2 py-0.5 rounded-md border text-[10px] uppercase tracking-widest font-bold ${
                star.tier === "legendary" ? "border-sc-gold bg-sc-gold/10 text-sc-gold shadow-[0_0_10px_rgba(251,191,36,0.2)]" : "border-cyan-400 bg-cyan-400/10 text-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.2)]"
              }`}>
                {star.tier}
              </span>
            </div>
          </div>

          <div className="bg-black/30 rounded-2xl p-5 mb-8 border border-white/5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-3 opacity-20 group-hover:opacity-100 transition-opacity">
              <Info className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-[10px] uppercase tracking-[0.25em] text-cyan-400/40 mb-3 font-display font-bold italic">Star Log v5.0</div>
            <p className="text-xs leading-relaxed text-sc-text-muted italic">{logText}</p>
            {star.isLandmark && (
              <div className="mt-4 flex flex-wrap gap-2">
                {star.spectralModes.map((mode) => (
                  <span key={mode} className="rounded-md border border-cyan-400/20 bg-cyan-400/5 px-2 py-1 text-[9px] uppercase tracking-widest text-cyan-200 font-mono">
                    {mode}
                  </span>
                ))}
              </div>
            )}
          </div>

          {!star.isLandmark && (
            <button
              type="button"
              onClick={() => onClaim(star)}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-sc-gold to-yellow-500 text-sc-deep font-display font-black uppercase tracking-[0.25em] text-[10px] shadow-[0_10px_30px_rgba(251,191,36,0.3)] hover:shadow-[0_15px_40px_rgba(251,191,36,0.5)] transition-all transform hover:-translate-y-1 active:scale-95 relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out" />
              <span className="relative z-10">{t("picker_claim")}</span>
            </button>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
