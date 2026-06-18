import { getNeighborSectorIds, getStarSectorId } from './starSectorCatalog';

function sortByMagnitude(stars) {
  return stars.sort((left, right) => {
    const leftMagnitude = Number(left.magnitude ?? left.mag);
    const rightMagnitude = Number(right.magnitude ?? right.mag);
    return leftMagnitude - rightMagnitude;
  });
}

export function createStarSectorTileStore(stars = []) {
  const tiles = new Map();
  stars.forEach((star) => {
    const sectorId = star.sectorId || getStarSectorId(star);
    const normalizedStar = star.sectorId ? star : { ...star, sectorId };
    const tile = tiles.get(sectorId);
    if (tile) tile.push(normalizedStar);
    else tiles.set(sectorId, [normalizedStar]);
  });
  tiles.forEach(sortByMagnitude);

  const getBrightest = (limit = 3500) => ({
    stars: sortByMagnitude([...stars]).slice(0, limit),
    sectorIds: [],
    mode: 'core',
  });

  const getWindow = (targetStar, options = {}) => {
    if (!targetStar) return getBrightest(options.maxStars);
    const minStars = options.minStars ?? 500;
    const maxStars = options.maxStars ?? 10000;
    const maxRadius = options.maxRadius ?? 3;
    let activeSectorIds = [];
    let requestedSectorIds = [];
    let windowStars = [];

    for (let radius = 0; radius <= maxRadius; radius += 1) {
      requestedSectorIds = getNeighborSectorIds(targetStar, radius);
      activeSectorIds = requestedSectorIds.filter((sectorId) => tiles.has(sectorId));
      windowStars = activeSectorIds.flatMap((sectorId) => tiles.get(sectorId) || []);
      if (windowStars.length >= minStars || radius === maxRadius) break;
    }

    const targetId = String(targetStar.id);
    const seen = new Set();
    const deduplicated = [];
    [targetStar, ...sortByMagnitude(windowStars)].forEach((star) => {
      const id = String(star.id);
      if (seen.has(id)) return;
      seen.add(id);
      deduplicated.push(star);
    });

    return {
      stars: deduplicated.slice(0, maxStars),
      sectorIds: activeSectorIds,
      requestedSectorIds,
      targetIncluded: seen.has(targetId),
      mode: 'sector',
    };
  };

  return {
    tileCount: tiles.size,
    starCount: stars.length,
    getTile: (sectorId) => tiles.get(sectorId) || [],
    getBrightest,
    getWindow,
  };
}
