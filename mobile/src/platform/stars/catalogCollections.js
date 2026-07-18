function identityKeys(record = {}) {
  return [
    record.canonicalId, record.canonical_id, record.starId, record.star_id,
    record.id, record.hip && `hip:${record.hip}`, record.hip, record.code,
    record.starClaimCode,
  ].filter(Boolean).map(String);
}

export function buildCatalogCollections(stars = [], ownershipRecords = []) {
  const ownedKeys = new Set(ownershipRecords.flatMap(identityKeys));
  const constellationMap = new Map();
  const asterismMap = new Map();
  stars.forEach((star) => {
    const owned = Boolean(star.isOwnedByViewer || identityKeys(star).some((key) => ownedKeys.has(key)));
    const claimed = Boolean(star.isClaimed || star.ownershipStatus === 'claimed' || owned);
    const availabilityState = star.availabilityState || (claimed ? 'owned' : star.claimable === false ? 'unlisted' : 'available');
    const iauCode = star.iauCode || star.constellationCode || star.constellation || 'Unknown';
    const name = star.constellation || iauCode;
    const constellation = constellationMap.get(iauCode) || { key: iauCode, iauCode, name, stars: [] };
    constellation.stars.push({ ...star, isOwnedByViewer: owned, availabilityState });
    constellationMap.set(iauCode, constellation);
    (star.asterisms || []).forEach((asterismName) => {
      const asterism = asterismMap.get(asterismName) || { key: asterismName, name: asterismName, stars: [] };
      asterism.stars.push({ ...star, isOwnedByViewer: owned, availabilityState });
      asterismMap.set(asterismName, asterism);
    });
  });
  const summarize = (group) => {
    const total = group.stars.length;
    const owned = group.stars.filter((star) => star.isOwnedByViewer).length;
    const claimed = group.stars.filter((star) => star.isClaimed || star.ownershipStatus === 'claimed').length;
    const available = group.stars.filter((star) => star.availabilityState === 'available').length;
    const unlisted = group.stars.filter((star) => star.availabilityState === 'unlisted').length;
    return { ...group, total, owned, claimed, available, unlisted,
      completionPercent: total ? Math.round((owned / total) * 100) : 0,
      isComplete: total > 0 && owned === total };
  };
  return {
    constellations: [...constellationMap.values()].map(summarize).sort((a, b) => a.name.localeCompare(b.name)),
    asterisms: [...asterismMap.values()].map(summarize).sort((a, b) => a.name.localeCompare(b.name)),
  };
}
