const TIER_META = {
  legendary: { label: 'Efsanevi', labelEn: 'Legendary', tone: 'gold', accent: 'text-sc-gold border-sc-gold/30 bg-sc-gold/10' },
  supernova: { label: 'Supernova', labelEn: 'Supernova', tone: 'purple', accent: 'text-purple-300 border-purple-400/30 bg-purple-400/10' },
  nova: { label: 'Nova', labelEn: 'Nova', tone: 'blue', accent: 'text-sc-blue border-sc-blue/30 bg-sc-blue/10' },
  zodiac: { label: 'Zodyak', labelEn: 'Zodiac', tone: 'emerald', accent: 'text-emerald-300 border-emerald-400/30 bg-emerald-400/10' },
  standard: { label: 'Standart', labelEn: 'Standard', tone: 'slate', accent: 'text-slate-300 border-white/10 bg-white/5' },
};

export function getTierMeta(tier, isTR = true) {
  const key = String(tier || 'standard').toLowerCase();
  const meta = TIER_META[key] || TIER_META.standard;
  return {
    ...meta,
    label: isTR ? meta.label : meta.labelEn,
  };
}

export function getFeaturedStars(stars = [], count = 6) {
  if (!Array.isArray(stars)) return [];

  return [...stars]
    .filter(Boolean)
    .sort((a, b) => {
      const tierRank = (tier) => ({ legendary: 0, supernova: 1, nova: 2, zodiac: 3, standard: 4 }[tier] ?? 4);
      const aTier = tierRank(String(a.tier || 'standard').toLowerCase());
      const bTier = tierRank(String(b.tier || 'standard').toLowerCase());
      if (aTier !== bTier) return aTier - bTier;

      const aBrightness = Number(a.magnitude ?? 99);
      const bBrightness = Number(b.magnitude ?? 99);
      if (aBrightness !== bBrightness) return aBrightness - bBrightness;

      const aPrice = Number(a.price || 0);
      const bPrice = Number(b.price || 0);
      if (aPrice !== bPrice) return bPrice - aPrice;

      return String(a.name || '').localeCompare(String(b.name || ''));
    })
    .slice(0, count);
}

export function getNearbyStars(stars = [], count = 3) {
  if (!Array.isArray(stars)) return [];

  return [...stars]
    .filter(Boolean)
    .filter((star) => Number.isFinite(Number(star.distance ?? star.distanceParsec)))
    .sort((a, b) => Number(a.distance ?? a.distanceParsec ?? 9999) - Number(b.distance ?? b.distanceParsec ?? 9999))
    .slice(0, count);
}
