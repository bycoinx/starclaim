import React from "react";
import { Star, Sparkles, Crown, Gem, Activity, Globe } from "lucide-react";
import { useT } from "../lib/i18n";
import "../pages/Console.css";

const tierMap = {
  legendary: { cls: "tier-legendary", color: "text-sc-gold", Icon: Crown, rarity: "Tier 1" },
  zodiac: { cls: "tier-zodiac", color: "text-sc-purple", Icon: Gem, rarity: "Tier 1" },
  named: { cls: "tier-named", color: "text-sc-blue", Icon: Sparkles, rarity: "Tier 2" },
  constellation: { cls: "tier-constellation", color: "text-sc-green", Icon: Star, rarity: "Tier 2" },
  standard: { cls: "tier-standard", color: "text-sc-text-muted", Icon: Star, rarity: "Tier 3" },
};

export default function StarCard({ star, onClaim }) {
  const { t, lang } = useT();
  const tier = tierMap[star.tier] || tierMap.standard;
  const { Icon } = tier;
  const available = !star.owner_id && !star.owner_name;
  const tierLabel = t(`tier_${star.tier}`);

  return (
    <div
      data-testid={`star-card-${star.code}`}
      className={`group terminal-frame p-6 border ${tier.cls} transition-all duration-500 hover:-translate-y-1 relative overflow-hidden`}
    >
      <div className="terminal-scanline" />
      <div className="terminal-header" />

      <div className="flex items-start justify-between mb-4 mt-2 relative">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <Icon className={`w-3.5 h-3.5 ${tier.color}`} strokeWidth={2} />
            <span className={`text-[9px] tracking-[0.3em] uppercase font-bold ${tier.color}`}>{tierLabel}</span>
          </div>
          <span className="text-[8px] text-sc-text-muted font-mono mt-1">PARCEL: {star.code}</span>
        </div>
        {available ? (
          <span className="text-[9px] tracking-[0.2em] uppercase text-sc-green flex items-center gap-1.5 font-bold">
            <Activity size={10} className="animate-pulse" /> {t("picker_available")}
          </span>
        ) : (
          <span className="text-[9px] tracking-[0.2em] uppercase text-sc-blue/80 font-bold font-mono">OWNED_BY_PILOT</span>
        )}
      </div>

      <h3 className={`font-display text-2xl mb-1 tracking-tight ${star.tier === "legendary" ? "gold-gradient-text" : "text-white"}`}>
        {star.name}
      </h3>
      <div className="text-[10px] text-sc-text-muted font-mono tracking-wider flex items-center gap-1 mb-6">
        <Globe size={10} /> {star.constellation.toUpperCase()}
      </div>

      <div className="telemetry-grid mb-6">
        <div className="telemetry-item-box">
          <div className="telemetry-label">Right Ascension</div>
          <div className="telemetry-value text-[10px]">{star.ra}</div>
        </div>
        <div className="telemetry-item-box">
          <div className="telemetry-label">Declination</div>
          <div className="telemetry-value text-[10px]">{star.dec}</div>
        </div>
        <div className="telemetry-item-box">
          <div className="telemetry-label">Magnitude</div>
          <div className="telemetry-value text-[10px]">{star.magnitude ?? "N/A"}</div>
        </div>
        <div className="telemetry-item-box">
          <div className="telemetry-label">Asset Class</div>
          <div className="telemetry-value text-[10px]">NFT_READY</div>
        </div>
      </div>

      <div className="flex items-end justify-between border-t border-white/5 pt-5">
        <div>
          <div className="text-[8px] tracking-widest text-sc-text-muted uppercase font-bold mb-1">
            {available ? (lang === "TR" ? "Valuation" : "Valuation") : t("picker_owned_by")}
          </div>
          <div className={`font-display text-2xl ${available ? "text-sc-gold" : "text-sc-blue"}`}>
            {available ? `$${star.price}` : star.owner_name?.toUpperCase() || "ADMIN"}
          </div>
        </div>
        {available ? (
          <button
            onClick={() => onClaim(star)}
            data-testid={`claim-${star.code}`}
            className="px-6 py-2.5 rounded-lg bg-sc-gold text-sc-deep text-[10px] uppercase tracking-[0.2em] font-bold hover:shadow-[0_0_15px_rgba(251,191,36,0.3)] transition-all"
          >
            BUY_MINT
          </button>
        ) : (
          <button
            disabled
            className="px-5 py-2.5 rounded-lg border border-white/10 text-white/30 text-[9px] uppercase tracking-widest font-bold"
            data-testid={`view-market-${star.code}`}
          >
            {t("picker_view")}
          </button>
        )}
      </div>
    </div>
  );
}
