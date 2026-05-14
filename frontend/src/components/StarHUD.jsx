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
          className="glass-dark border border-white/10 rounded-3xl p-8 w-80 md:w-96 backdrop-blur-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] pointer-events-auto"
        >
          <div className="flex justify-between items-start mb-6">
            <div>
              <div className="text-[10px] tracking-[0.4em] uppercase text-sc-gold/60 mb-2 font-display">Target Locked</div>
              <h2 className="font-display text-3xl text-white">{displayName}</h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/5 transition-colors text-white/40 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="glass-gold/10 border border-sc-gold/20 rounded-2xl p-4">
              <div className="text-[9px] uppercase tracking-widest text-sc-gold/60 mb-1 flex items-center gap-1.5">
                <MapPin className="w-3 h-3" /> RA / DEC
              </div>
              <div className="text-xs font-mono text-white/90">{star.ra} / {star.dec}</div>
            </div>
            <div className="glass-gold/10 border border-sc-gold/20 rounded-2xl p-4">
              <div className="text-[9px] uppercase tracking-widest text-sc-gold/60 mb-1 flex items-center gap-1.5">
                <Target className="w-3 h-3" /> {star.isLandmark ? "LANDMARK" : "NASA ID"}
              </div>
              <div className="text-xs font-mono text-white/90">{star.code.toUpperCase()}</div>
            </div>
          </div>

          <div className="space-y-4 mb-8">
            <div className="flex items-center justify-between text-xs">
              <span className="text-sc-text-muted flex items-center gap-2">
                <Shield className="w-3.5 h-3.5" /> {lang === "TR" ? "Takımyıldız" : "Constellation"}
              </span>
              <span className="text-white font-display italic">{star.constellation}</span>
            </div>
            {star.isLandmark && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-sc-text-muted flex items-center gap-2">
                  <Info className="w-3.5 h-3.5" /> {lang === "TR" ? "Katalog" : "Catalog"}
                </span>
                <span className="text-white font-mono text-[11px]">{star.catalog}</span>
              </div>
            )}
            {star.isLandmark && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-sc-text-muted flex items-center gap-2">
                  <Target className="w-3.5 h-3.5" /> {lang === "TR" ? "Uzaklık" : "Distance"}
                </span>
                <span className="text-white font-mono text-[11px]">{Number(star.distanceLy).toLocaleString()} ly</span>
              </div>
            )}
            <div className="flex items-center justify-between text-xs">
              <span className="text-sc-text-muted flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5" /> {lang === "TR" ? "Kademe" : "Tier"}
              </span>
              <span className={`px-2 py-0.5 rounded-full border text-[10px] uppercase tracking-widest ${
                star.tier === "legendary" ? "border-sc-gold text-sc-gold" : "border-sc-blue text-sc-blue"
              }`}>
                {star.tier}
              </span>
            </div>
          </div>

          <div className="bg-white/5 rounded-2xl p-5 mb-8 border border-white/5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-3 opacity-20 group-hover:opacity-100 transition-opacity">
              <Info className="w-4 h-4 text-sc-gold" />
            </div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-sc-gold/40 mb-3 font-display">Star Log v4.5</div>
            <p className="text-xs leading-relaxed text-sc-text-muted italic">{logText}</p>
            {star.isLandmark && (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {star.spectralModes.map((mode) => (
                  <span key={mode} className="rounded-full border border-cyan-300/20 px-2 py-1 text-[9px] uppercase tracking-widest text-cyan-100">
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
              className="w-full py-4 rounded-2xl bg-sc-gold text-sc-deep font-display font-bold uppercase tracking-[0.2em] text-xs shadow-[0_0_30px_rgba(251,191,36,0.2)] hover:shadow-[0_0_50px_rgba(251,191,36,0.4)] transition-all transform hover:-translate-y-1 active:scale-95"
            >
              {t("picker_claim")}
            </button>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
