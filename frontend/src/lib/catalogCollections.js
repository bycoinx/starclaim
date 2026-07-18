function identityKeys(record = {}) {
  return [
    record.canonicalId, record.canonical_id, record.starId, record.star_id,
    record.id, record.hip && `hip:${record.hip}`, record.hip, record.code,
    record.starClaimCode,
  ].filter(Boolean).map(String);
}

function ownershipIndex(records = []) {
  return new Set(records.flatMap(identityKeys));
}

export function buildCatalogCollections(stars = [], ownershipRecords = []) {
  const ownedKeys = ownershipIndex(ownershipRecords);
  const constellations = new Map();
  const asterisms = new Map();

  stars.forEach((star) => {
    const keys = identityKeys(star);
    const owned = Boolean(star.isOwnedByViewer || keys.some((key) => ownedKeys.has(key)));
    const claimed = Boolean(star.isClaimed || star.ownershipStatus === "claimed" || owned);
    const state = star.availabilityState || (claimed ? "owned" : star.claimable === false ? "unlisted" : "available");
    const code = star.iauCode || star.constellationCode || star.raw?.constellation?.iau_code || star.constellation || "Unknown";
    const name = star.constellation || star.raw?.constellation?.name || code;
    const group = constellations.get(code) || { key: code, iauCode: code, name, stars: [] };
    group.stars.push({ ...star, isOwnedByViewer: owned, availabilityState: state });
    constellations.set(code, group);

    (star.asterisms || star.raw?.asterisms || []).forEach((asterism) => {
      const asterismGroup = asterisms.get(asterism) || { key: asterism, name: asterism, stars: [] };
      asterismGroup.stars.push({ ...star, isOwnedByViewer: owned, availabilityState: state });
      asterisms.set(asterism, asterismGroup);
    });
  });

  const summarize = (group) => {
    const total = group.stars.length;
    const owned = group.stars.filter((star) => star.isOwnedByViewer).length;
    const claimed = group.stars.filter((star) => star.isClaimed || star.ownershipStatus === "claimed").length;
    const available = group.stars.filter((star) => star.availabilityState === "available").length;
    const unlisted = group.stars.filter((star) => star.availabilityState === "unlisted").length;
    return {
      ...group, total, owned, claimed, available, unlisted,
      completionPercent: total ? Math.round((owned / total) * 100) : 0,
      isComplete: total > 0 && owned === total,
    };
  };

  return {
    constellations: [...constellations.values()].map(summarize).sort((a, b) => a.name.localeCompare(b.name)),
    asterisms: [...asterisms.values()].map(summarize).sort((a, b) => a.name.localeCompare(b.name)),
  };
}
