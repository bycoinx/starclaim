import AsyncStorage from '@react-native-async-storage/async-storage';
import { CONFIG } from '../../constants/Config';
import { getNeighborSectorIds } from './starSectorCatalog';

const MANIFEST_CACHE_KEY = '@star_tile_manifest_v1';
const DISK_LRU_KEY = '@star_tile_disk_lru_v1';
const OFFLINE_MODE_KEY = '@star_tile_offline_mode_v1';
const TILE_CACHE_PREFIX = '@star_tile_v1:';
const MEMORY_TILE_LIMIT = 24;
const DISK_TILE_LIMIT = 96;
const REQUEST_CONCURRENCY = 4;
const FAILURE_COOLDOWN_MS = 60000;

const memoryTiles = new Map();
let apiUrlPromise = null;
let manifestPromise = null;
let manifestValue = null;
let diskLruPromise = Promise.resolve();
let failureCooldownUntil = 0;

function touchMemoryTile(key, stars) {
  memoryTiles.delete(key);
  memoryTiles.set(key, stars);
  while (memoryTiles.size > MEMORY_TILE_LIMIT) {
    memoryTiles.delete(memoryTiles.keys().next().value);
  }
}

async function resolveApiUrl() {
  if (!apiUrlPromise) apiUrlPromise = CONFIG.getAPIUrl();
  return apiUrlPromise;
}

async function readCachedManifest() {
  const raw = await AsyncStorage.getItem(MANIFEST_CACHE_KEY);
  return raw ? JSON.parse(raw) : null;
}

async function loadManifest(cacheOnly = false) {
  if (cacheOnly) return readCachedManifest();
  if (Date.now() < failureCooldownUntil) return readCachedManifest();
  const baseUrl = await resolveApiUrl();
  try {
    const response = await fetch(`${baseUrl}/api/catalog/3d/manifest`);
    if (!response.ok) throw new Error(`3D manifest request failed: ${response.status}`);
    const manifest = await response.json();
    if (!manifest?.catalogVersion || !Array.isArray(manifest.sectors)) {
      throw new Error('3D manifest payload is invalid');
    }
    try {
      await AsyncStorage.setItem(MANIFEST_CACHE_KEY, JSON.stringify(manifest));
    } catch (cacheError) {
      console.warn('Remote star manifest cache write failed', cacheError);
    }
    return manifest;
  } catch (error) {
    failureCooldownUntil = Date.now() + FAILURE_COOLDOWN_MS;
    console.warn('Remote star manifest unavailable', error);
    return readCachedManifest();
  }
}

async function getManifest(cacheOnly = false) {
  if (manifestValue) return manifestValue;
  if (cacheOnly) {
    const cached = await readCachedManifest();
    if (cached) manifestValue = cached;
    return cached;
  }
  if (!manifestPromise) {
    manifestPromise = loadManifest()
      .then((manifest) => {
        manifestValue = manifest;
        return manifest;
      })
      .finally(() => {
        manifestPromise = null;
      });
  }
  return manifestPromise;
}

function getTileCacheKey(catalogVersion, sectorId) {
  return `${TILE_CACHE_PREFIX}${catalogVersion}:${sectorId}`;
}

function touchDiskTile(cacheKey) {
  diskLruPromise = diskLruPromise.then(async () => {
    try {
      const raw = await AsyncStorage.getItem(DISK_LRU_KEY);
      const current = raw ? JSON.parse(raw) : [];
      const next = [cacheKey, ...current.filter((key) => key !== cacheKey)];
      const evicted = next.splice(DISK_TILE_LIMIT);
      await AsyncStorage.setItem(DISK_LRU_KEY, JSON.stringify(next));
      if (evicted.length) await AsyncStorage.multiRemove(evicted);
    } catch (error) {
      console.warn('Star tile disk cache update failed', error);
    }
  });
  return diskLruPromise;
}

async function loadTile(baseUrl, manifest, sectorId, cacheOnly = false) {
  const cacheKey = getTileCacheKey(manifest.catalogVersion, sectorId);
  if (memoryTiles.has(cacheKey)) {
    const stars = memoryTiles.get(cacheKey);
    touchMemoryTile(cacheKey, stars);
    return stars;
  }

  try {
    const cached = await AsyncStorage.getItem(cacheKey);
    if (cached) {
      const stars = JSON.parse(cached);
      if (Array.isArray(stars)) {
        touchMemoryTile(cacheKey, stars);
        touchDiskTile(cacheKey);
        return stars;
      }
    }
  } catch (error) {
    console.warn(`Star tile cache read failed: ${sectorId}`, error);
  }

  if (cacheOnly) return null;

  const response = await fetch(`${baseUrl}/api/catalog/3d/tiles/${encodeURIComponent(sectorId)}`);
  if (!response.ok) throw new Error(`Star tile request failed (${sectorId}): ${response.status}`);
  const stars = await response.json();
  if (!Array.isArray(stars)) throw new Error(`Star tile payload is invalid: ${sectorId}`);
  touchMemoryTile(cacheKey, stars);
  try {
    await AsyncStorage.setItem(cacheKey, JSON.stringify(stars));
    await touchDiskTile(cacheKey);
  } catch (error) {
    console.warn(`Star tile cache write failed: ${sectorId}`, error);
  }
  return stars;
}

async function mapWithConcurrency(items, mapper, concurrency = REQUEST_CONCURRENCY) {
  const results = new Array(items.length);
  let cursor = 0;
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      try {
        results[index] = await mapper(items[index]);
      } catch (error) {
        console.warn(`Remote star tile skipped: ${items[index]}`, error);
        results[index] = null;
      }
    }
  });
  await Promise.all(workers);
  return results;
}

export async function loadRemoteStarSectorWindow(targetStar, options = {}) {
  if (!targetStar) return { stars: [], sectorIds: [], catalogVersion: null };
  const cacheOnly = options.cacheOnly ?? await getStarTileOfflineMode();
  const manifest = await getManifest(cacheOnly);
  if (!manifest) return { stars: [], sectorIds: [], catalogVersion: null };

  const minimumStars = options.minStars ?? 700;
  const maximumStars = options.maxStars ?? 10000;
  const maximumRadius = options.maxRadius ?? 2;
  const sectorMap = new Map(manifest.sectors.map((sector) => [sector.id, sector]));
  let sectorIds = [];
  for (let radius = 0; radius <= maximumRadius; radius += 1) {
    sectorIds = getNeighborSectorIds(targetStar, radius).filter((sectorId) => sectorMap.has(sectorId));
    const estimatedCount = sectorIds.reduce(
      (count, sectorId) => count + Number(sectorMap.get(sectorId)?.count || 0),
      0,
    );
    if (estimatedCount >= minimumStars || radius === maximumRadius) break;
  }

  const baseUrl = cacheOnly ? null : await resolveApiUrl();
  const tiles = await mapWithConcurrency(
    sectorIds,
    (sectorId) => loadTile(baseUrl, manifest, sectorId, cacheOnly),
  );
  const seen = new Set();
  const stars = [];
  tiles.flatMap((tile) => tile || [])
    .sort((left, right) => Number(left.magnitude ?? left.mag) - Number(right.magnitude ?? right.mag))
    .some((star) => {
      const id = String(star.id);
      if (!seen.has(id)) {
        seen.add(id);
        stars.push(star);
      }
      return stars.length >= maximumStars;
    });

  return {
    stars,
    sectorIds: sectorIds.filter((_, index) => Array.isArray(tiles[index])),
    catalogVersion: manifest.catalogVersion,
  };
}

export async function getStarTileOfflineMode() {
  try {
    return await AsyncStorage.getItem(OFFLINE_MODE_KEY) === 'true';
  } catch (error) {
    console.warn('Offline mode preference read failed', error);
    return false;
  }
}

export async function setStarTileOfflineMode(enabled) {
  await AsyncStorage.setItem(OFFLINE_MODE_KEY, enabled ? 'true' : 'false');
  return enabled;
}

export async function getRemoteStarTileCacheStats() {
  try {
    const [lruRaw, manifest] = await Promise.all([
      AsyncStorage.getItem(DISK_LRU_KEY),
      readCachedManifest(),
    ]);
    const cacheKeys = lruRaw ? JSON.parse(lruRaw) : [];
    const validKeys = Array.isArray(cacheKeys) ? cacheKeys : [];
    const values = validKeys.length ? await AsyncStorage.multiGet(validKeys) : [];
    const byteSize = values.reduce(
      (total, [, value]) => total + (value ? value.length * 2 : 0),
      0,
    );
    return {
      tileCount: values.filter(([, value]) => Boolean(value)).length,
      byteSize,
      catalogVersion: manifest?.catalogVersion || null,
    };
  } catch (error) {
    console.warn('Star tile cache stats read failed', error);
    return { tileCount: 0, byteSize: 0, catalogVersion: null };
  }
}

export async function clearRemoteStarTileDiskCache() {
  const raw = await AsyncStorage.getItem(DISK_LRU_KEY);
  const cacheKeys = raw ? JSON.parse(raw) : [];
  const keysToRemove = Array.isArray(cacheKeys) ? cacheKeys : [];
  if (keysToRemove.length) await AsyncStorage.multiRemove(keysToRemove);
  await AsyncStorage.removeItem(DISK_LRU_KEY);
  memoryTiles.clear();
}

export function clearRemoteStarTileMemoryCache() {
  memoryTiles.clear();
}
