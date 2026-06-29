import React from "react";
import { Eye, Shield } from "lucide-react";
import { StarAssetManager } from "../../lib/StarAssetManager";
import StarAssetImage from "./StarAssetImage";

const TIER_COLORS = {
  legendary: "text-sc-gold border-sc-gold/30",
  zodiac: "text-purple-400 border-purple-500/20",
  supernova: "text-blue-400 border-blue-500/20",
  nova: "text-emerald-400 border-emerald-500/20",
  standard: "text-white/40 border-white/5"
};

// 1. StarHeader
export function StarHeader({ asset }) {
  const colorStyle = TIER_COLORS[asset.tier] || TIER_COLORS.standard;
  return (
    <div className="flex items-center justify-between select-none">
      <div className="flex items-center gap-1.5">
        <span className={`w-1.5 h-1.5 rounded-full ${asset.isClaimed ? "bg-sc-blue" : "bg-emerald-400"} animate-pulse`} />
        <span className="text-[9px] font-mono font-bold tracking-widest text-[#8fa0c4] uppercase">
          {asset.isClaimed ? "SAHİPLENİLEN" : "MEVCUT"}
        </span>
      </div>
      <div className="flex items-center">
        <span className={`text-[9px] font-mono font-bold uppercase tracking-wider ${colorStyle}`}>
          {asset.tierLabel}
        </span>
      </div>
    </div>
  );
}

// 2. StarMetadata
export function StarMetadata({ asset }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="font-display text-lg text-white font-medium group-hover:text-sc-gold transition-colors truncate">
          {asset.name}
        </h3>
        <span className="text-[9px] font-mono text-white/40 uppercase tracking-tight">
          {asset.code}
        </span>
      </div>
      
      <div className="flex justify-between items-center text-[11px] text-[#8fa0c4]">
        <span>{asset.constellation} Takımyıldızı</span>
        <span className="font-mono text-white/60">{asset.magnitude ? `${asset.magnitude.toFixed(2)} mag` : ""}</span>
      </div>

      <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-white/5 text-[10px] text-[#8fa0c4] font-mono">
        <div>
          <span className="block text-white/30 text-[8px] uppercase">Uzaklık</span>
          <span className="text-white/80">{asset.distance ? `${asset.distance.toLocaleString()} ly` : "N/A"}</span>
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

// 3. CardFooter
export function CardFooter({ asset, onClaimClick, onDetailClick }) {
  return (
    <div className="flex items-center justify-between gap-3 pt-3 border-t border-white/5 mt-auto">
      <div>
        <span className="block text-[8px] font-mono text-[#8fa0c4]/60 uppercase tracking-widest">
          {asset.isClaimed ? "SAHİBİ" : "BEDEL"}
        </span>
        <span className="font-display font-bold text-base text-sc-gold truncate max-w-[120px] block">
          {asset.isClaimed ? (asset.ownerName || "Pilot") : `$${asset.price.toLocaleString()}`}
        </span>
      </div>

      <div className="flex items-center gap-2">
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

        {!asset.isClaimed ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClaimClick();
            }}
            className="px-4 py-2 rounded-lg bg-sc-gold hover:bg-sc-gold/90 text-[#050814] text-[10px] font-mono font-bold uppercase tracking-widest hover:shadow-[0_0_15px_rgba(201,168,76,0.3)] transition-all"
          >
            Sahiplen
          </button>
        ) : (
          <button
            disabled
            className="px-4 py-2 rounded-lg border border-white/5 bg-white/[0.02] text-white/30 text-[10px] font-mono uppercase tracking-widest cursor-not-allowed"
          >
            Sahipli
          </button>
        )}
      </div>
    </div>
  );
}

// Main StarCard
export default function StarCard({ 
  star, 
  onClaim = () => {}, 
  onSelect = () => {} 
}) {
  const asset = StarAssetManager.getStarAsset(star);
  if (!asset) return null;
  
  return (
    <div
      onClick={onSelect}
      className={`group bg-[#070b20]/40 border border-white/5 rounded-2xl p-4 flex flex-col gap-4 transition-all duration-300 hover:-translate-y-1 hover:bg-[#0a0f2b]/70 cursor-pointer relative overflow-hidden`}
    >
      {/* Decorative scanline micro-animation */}
      <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="w-full h-[1px] bg-sc-gold/20 animate-[scanline_2s_linear_infinite]" />
      </div>

      <StarHeader asset={asset} />
      
      {/* Decoupled StarAssetImage component usage */}
      <StarAssetImage star={star} variant="preview" />

      <StarMetadata asset={asset} />

      <CardFooter 
        asset={asset} 
        onClaimClick={() => onClaim(star)} 
        onDetailClick={onSelect} 
      />
    </div>
  );
}
