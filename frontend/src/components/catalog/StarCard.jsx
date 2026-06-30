import React from "react";
import { Shield, Eye } from "lucide-react";
import { StarRepository } from "../../lib/StarRepository";
import { formatDistance, formatMagnitude, formatPrice } from "../../lib/formatters";
import StarAssetImage from "./StarAssetImage";
import ActionBar from "./ActionBar";

const TIER_COLORS = {
  legendary: "text-sc-gold border-sc-gold/30",
  zodiac: "text-purple-400 border-purple-500/20",
  supernova: "text-blue-400 border-blue-500/20",
  nova: "text-emerald-400 border-emerald-500/20",
  standard: "text-white/40 border-white/5"
};

// 1. StarHeader Component
export function StarHeader({ star }) {
  const colorStyle = TIER_COLORS[star.tier] || TIER_COLORS.standard;
  return (
    <div className="flex items-center justify-between select-none">
      <div className="flex items-center gap-1.5">
        <span className={`w-1.5 h-1.5 rounded-full ${star.isClaimed ? "bg-sc-blue" : "bg-emerald-400"} animate-pulse`} />
        <span className="text-[9px] font-mono font-bold tracking-widest text-[#8fa0c4] uppercase">
          {star.isClaimed ? "SAHİPLENİLEN" : "MEVCUT"}
        </span>
      </div>
      <div className="flex items-center">
        <span className={`text-[9px] font-mono font-bold uppercase tracking-wider ${colorStyle}`}>
          {star.tierLabel}
        </span>
      </div>
    </div>
  );
}

// 2. StarMetadata Component
export function StarMetadata({ star }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="font-display text-lg text-white font-medium group-hover:text-sc-gold transition-colors truncate">
          {star.name}
        </h3>
        <span className="text-[9px] font-mono text-white/40 uppercase tracking-tight">
          {star.code}
        </span>
      </div>
      
      <div className="flex justify-between items-center text-[11px] text-[#8fa0c4]">
        <span>{star.constellation} Takımyıldızı</span>
        <span className="font-mono text-white/60">{formatMagnitude(star.magnitude)}</span>
      </div>

      <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-white/5 text-[10px] text-[#8fa0c4] font-mono">
        <div>
          <span className="block text-white/30 text-[8px] uppercase">Uzaklık</span>
          <span className="text-white/80">{formatDistance(star.distance, true)}</span>
        </div>
        <div>
          <span className="block text-white/30 text-[8px] uppercase">Sertifika</span>
          <span className="text-white/80 flex items-center gap-1">
            <Shield className="w-2.5 h-2.5 text-sc-gold" /> SC_SECURE
          </span>
        </div>
      </div>
    </div>
  );
}

// 3. CardFooter Component
export function CardFooter({ star, onDetailClick }) {
  return (
    <div className="flex items-center justify-between gap-3 pt-3 border-t border-white/5 mt-auto">
      <div>
        <span className="block text-[8px] font-mono text-[#8fa0c4]/60 uppercase tracking-widest">
          {star.isClaimed ? "SAHİBİ" : "BEDEL"}
        </span>
        <span className="font-display font-bold text-base text-sc-gold truncate max-w-[120px] block">
          {star.isClaimed ? (star.ownerName || "Pilot") : formatPrice(star.price)}
        </span>
      </div>

      <div className="flex items-center gap-2">
        {/* Detail Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDetailClick();
          }}
          className="p-2 rounded-lg border border-white/10 hover:border-white/30 hover:bg-white/5 text-white/60 hover:text-white transition-all"
          title="Yıldız Detayını İncele"
        >
          <Eye className="w-3.5 h-3.5" />
        </button>

        {/* Decoupled ActionBar Component for primary buttons */}
        <ActionBar starId={star.starId} layout="card" />
      </div>
    </div>
  );
}

// Main StarCard Orchestrator
export default function StarCard({ 
  starId,
  star: propStar,
  onSelect = () => {} 
}) {
  // Resolve data via StarRepository cache lookup if starId is passed
  const star = propStar || StarRepository.getStarById(starId);
  if (!star) return null;
  
  return (
    <div
      onClick={onSelect}
      className="group bg-[#070b20]/40 border border-white/5 rounded-2xl p-4 flex flex-col gap-4 transition-all duration-300 hover:-translate-y-1 hover:bg-[#0a0f2b]/70 cursor-pointer relative overflow-hidden"
    >
      {/* Scanline decoration */}
      <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="w-full h-[1px] bg-sc-gold/20 animate-[scanline_2s_linear_infinite]" />
      </div>

      <StarHeader star={star} />
      
      {/* Decoupled star image handler */}
      <StarAssetImage star={star} variant="preview" />

      <StarMetadata star={star} />

      <CardFooter 
        star={star} 
        onDetailClick={onSelect} 
      />
    </div>
  );
}
