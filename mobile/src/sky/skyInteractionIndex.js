export const TAP_CELL_SIZE = 56;

export function getTapCellKey(x, y, cellSize = TAP_CELL_SIZE) {
  return `${Math.floor(x / cellSize)}:${Math.floor(y / cellSize)}`;
}

export function getNeighborTapCellKeys(x, y, cellSize = TAP_CELL_SIZE) {
  const cellX = Math.floor(x / cellSize);
  const cellY = Math.floor(y / cellSize);
  const keys = [];
  for (let dx = -1; dx <= 1; dx += 1) {
    for (let dy = -1; dy <= 1; dy += 1) {
      keys.push(`${cellX + dx}:${cellY + dy}`);
    }
  }
  return keys;
}

export function buildTapStarIndex({
  stars = [],
  projectStar,
  width,
  height,
  hideBelowHorizon = false,
  cellSize = TAP_CELL_SIZE,
}) {
  const cells = new Map();
  const projectedStars = [];

  if (typeof projectStar !== 'function' || !width || !height) {
    return { cells, projectedStars };
  }

  stars.forEach((star) => {
    const projected = projectStar(star);
    if (!projected) return;

    const isVisible = projected.x > -cellSize
      && projected.x < width + cellSize
      && projected.y > -cellSize
      && projected.y < height + cellSize
      && (!hideBelowHorizon || projected.skyAltitude == null || projected.skyAltitude >= 0);

    if (!isVisible) return;

    const item = { star, x: projected.x, y: projected.y };
    projectedStars.push(item);
    const key = getTapCellKey(projected.x, projected.y, cellSize);
    const bucket = cells.get(key);
    if (bucket) bucket.push(item);
    else cells.set(key, [item]);
  });

  return { cells, projectedStars };
}

export function findNearestIndexedStar(index, x, y, {
  maxDistance = 25,
  cellSize = TAP_CELL_SIZE,
} = {}) {
  if (!index) return null;

  const candidates = [];
  getNeighborTapCellKeys(x, y, cellSize).forEach((key) => {
    const bucket = index.cells?.get(key);
    if (bucket) candidates.push(...bucket);
  });

  const searchSet = candidates.length ? candidates : (index.projectedStars || []);
  let closestStar = null;
  let minDistance = maxDistance;

  searchSet.forEach((item) => {
    const dist = Math.sqrt(Math.pow(item.x - x, 2) + Math.pow(item.y - y, 2));
    if (dist < minDistance) {
      minDistance = dist;
      closestStar = item.star;
    }
  });

  return closestStar;
}
