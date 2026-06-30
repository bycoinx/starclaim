import React from "react";
import { Shield, Globe } from "lucide-react";
import { StarRepository } from "../../lib/StarRepository";
import { formatDistance, formatMagnitude, formatSpectralType, formatTemperature, formatOwnershipStatus } from "../../lib/formatters";
import StarAssetImage from "./StarAssetImage";
import ActionBar from "./ActionBar";

export default function DetailDrawer({ 
  selectedStarId, 
  onClose,
  onReadStory = null
}) {
  const star = StarRepository.getStarById(selectedStarId);
  if (!star) return null;

  return (
    <div className="w-full lg:w-96 shrink-0 bg-[#050814]/95 border-l border-white/5 h-[calc(100vh-8.5rem)] sticky top-28 overflow-y-auto flex flex-col z-20 custom-scrollbar animate-slide-in-right">
      {/* Detail Header */}
      <div className="flex items-center justify-between p-5 border-b border-white/5 bg-[#030612]/60">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-sc-gold" />
          <span className="font-display font-medium text-xs tracking-wider uppercase">Yıldız Detayları</span>
        </div>
        <button 
          onClick={onClose} 
          className="p-1 rounded-lg hover:bg-white/5 text-white/40 hover:text-white transition-colors font-mono"
        >
          ✕
        </button>
      </div>

      <div className="p-6 flex flex-col gap-6">
        {/* Large Visual Render */}
        <div className="flex justify-center py-4 bg-[#030615] rounded-2xl border border-white/5 relative overflow-hidden group">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(99,102,241,0.05),_transparent)]" />
          <div className="w-48 h-48">
            <StarAssetImage star={star} variant="hero" />
          </div>
        </div>

        {/* Title and Constellation */}
        <div>
          <h2 className="font-display text-3xl font-semibold text-white tracking-tight">{star.name}</h2>
          <div className="text-xs text-sc-gold font-mono uppercase mt-1 tracking-wider">
            {star.constellation} Takımyıldızı
          </div>
        </div>

        {/* Metric Parameters */}
        <div className="flex flex-col gap-2.5">
          <div className="text-[10px] text-[#8fa0c4]/60 uppercase font-mono tracking-widest font-bold border-b border-white/5 pb-1">
            Astronomik Veriler
          </div>
          <div className="flex flex-col gap-2 font-mono text-xs">
            {[
              { label: "Parlaklık (Kadirm)", value: formatMagnitude(star.magnitude) },
              { label: "Uzaklık", value: formatDistance(star.distance, true) },
              { label: "Spektral Tip", value: formatSpectralType(star.spectralType) },
              { label: "Kütle", value: star.tier === "legendary" ? "2.02 Güneş" : "1.4 Güneş" },
              { label: "Yarıçap", value: star.tier === "legendary" ? "1.71 Güneş" : "1.2 Güneş" },
              { label: "Sıcaklık", value: formatTemperature(star.tier === "legendary" ? 9940 : 6200) },
              { label: "Katalog Kodu", value: star.code || "N/A" }
            ].map((metric, index) => (
              <div key={index} className="flex justify-between py-1.5 border-b border-white/[0.03]">
                <span className="text-[#8fa0c4]/70">{metric.label}</span>
                <span className="text-white font-medium">{metric.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* About section */}
        <div className="flex flex-col gap-2.5">
          <div className="text-[10px] text-[#8fa0c4]/60 uppercase font-mono tracking-widest font-bold border-b border-white/5 pb-1">
            Hakkında
          </div>
          <p className="text-xs text-[#a9b6d6] leading-relaxed font-sans">
            {star.description || `${star.name}, ${star.constellation} takımyıldızında yer alan ${star.tierLabel} sınıfı bir yıldızdır. Antik çağlardan beri astronomi kataloglarında özel bir öneme sahip olan bu kozmik oluşum, olağanüstü parlaklığı ve benzersiz spektral yapısıyla bilinmektedir.`}
          </p>
        </div>

        {/* Ownership Status Card */}
        <div className="bg-[#0b1026]/80 border border-white/5 rounded-2xl p-4 flex flex-col gap-3">
          <div className="text-[10px] text-[#8fa0c4]/60 uppercase font-mono tracking-widest font-bold">
            Sahiplik Durumu
          </div>
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${star.isClaimed ? "bg-sc-blue animate-pulse" : "bg-emerald-400 animate-pulse"}`} />
            <span className="text-xs text-white font-mono">
              {formatOwnershipStatus(star.isClaimed, star.ownerName, true)}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#8fa0c4]/60 mt-1">
            <Shield className="w-3.5 h-3.5 text-sc-gold" />
            <span>StarClaim Registry ve Solana Blockchain Güvenceli</span>
          </div>
        </div>
      </div>

      {/* CTA Buttons Sticky to Bottom of panel - Decoupled to ActionBar */}
      <div className="mt-auto p-5 border-t border-white/5 bg-[#030612]/90 flex flex-col gap-3">
        <ActionBar starId={star.starId} layout="drawer" onReadStory={onReadStory} />
      </div>
    </div>
  );
}
