import React from "react";
import { Star, Sparkles, Crown, Gem } from "lucide-react";
import { useT } from "../lib/i18n";

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
      className={`group glass rounded-2xl p-6 border ${tier.cls} transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_50px_-15px_rgba(201,168,76,0.25)] relative overflow-hidden`}
    >
      <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full opacity-20 blur-3xl bg-gradient-to-br from-sc-gold/40 to-transparent" />

      <div className="flex items-start justify-between mb-4 relative">
        <div className="flex items-center gap-2">
          <Icon className={`w-4 h-4 ${tier.color}`} strokeWidth={1.5} />
          <span className={`text-[10px] tracking-[0.2em] uppercase ${tier.color}`}>{tierLabel}</span>
        </div>
        {available ? (
          <span className="text-[10px] tracking-[0.2em] uppercase text-sc-green flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-sc-green animate-pulse" /> {t("picker_available")}
          </span>
        ) : (
          <span className="text-[10px] tracking-[0.2em] uppercase text-sc-blue/80">Sahiplenildi</span>
        )}
      </div>

      <h3 className={`font-display text-2xl mb-1 ${star.tier === "legendary" ? "gold-gradient-text" : "text-sc-text"}`}>
        {star.name}
      </h3>
      <div className="text-xs text-sc-text-muted tracking-wide mb-5">{star.constellation}</div>

      <div className="grid grid-cols-2 gap-2 text-[11px] text-sc-text-muted mb-5 font-mono">
        <div className="rounded-lg bg-sc-deep/35 p-2"><span className="block text-sc-text">Parcel</span>{star.code}</div>
        <div className="rounded-lg bg-sc-deep/35 p-2"><span className="block text-sc-text">Rarity</span>{tier.rarity}</div>
        <div className="rounded-lg bg-sc-deep/35 p-2"><span className="block text-sc-text">RA</span>{star.ra}</div>
        <div className="rounded-lg bg-sc-deep/35 p-2"><span className="block text-sc-text">Dec</span>{star.dec}</div>
        <div className="rounded-lg bg-sc-deep/35 p-2"><span className="block text-sc-text">Mag</span>{star.magnitude ?? "-"}</div>
        <div className="rounded-lg bg-sc-deep/35 p-2"><span className="block text-sc-text">Asset</span>NFT Ready</div>
      </div>

      <div className="flex items-end justify-between">
        <div>
          <div className="text-[10px] tracking-widest text-sc-text-muted uppercase">
            {available ? (lang === "TR" ? "Fiyat" : "Price") : t("picker_owned_by")}
          </div>
          <div className={`font-display text-2xl ${available ? "text-sc-gold" : "text-sc-blue"}`}>
            {available ? `$${star.price}` : star.owner_name || "-"}
          </div>
        </div>
        {available ? (
          <button
            onClick={() => onClaim(star)}
            data-testid={`claim-${star.code}`}
            className="btn-gold text-xs py-2 px-5"
          >
            {lang === "TR" ? "Buy / Mint" : "Buy / Mint"}
          </button>
        ) : (
          <button
            disabled
            className="btn-ghost text-xs py-2 px-4 opacity-60"
            data-testid={`view-market-${star.code}`}
          >
            {t("picker_view")}
          </button>
        )}
      </div>
    </div>
  );
}
