const TIER_META = {
  legendary: { label: 'Efsanevi', labelEn: 'Legendary', tone: 'gold', accent: ['#E6BC4A', '#F2D98B'] },
  supernova: { label: 'Supernova', labelEn: 'Supernova', tone: 'purple', accent: ['#7868D8', '#A59BFF'] },
  nova: { label: 'Nova', labelEn: 'Nova', tone: 'blue', accent: ['#77BFFF', '#A6D8FF'] },
  zodiac: { label: 'Zodyak', labelEn: 'Zodiac', tone: 'emerald', accent: ['#30C2A2', '#7CE8DA'] },
  standard: { label: 'Standart', labelEn: 'Standard', tone: 'slate', accent: ['#6B7280', '#9CA3AF'] },
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
