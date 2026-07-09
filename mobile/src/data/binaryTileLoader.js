/**
 * P0.5 - Binary Tile Loader
 * 
 * Loads binary sector tiles from backend and decodes to StarIdentity objects.
 * Implements streaming tile cache with LRU eviction.
 */

// Binary format constants (match backend binary_star_catalog.py)
const MAGIC = 'SCB1';
const FORMAT_VERSION = 1;
const HEADER_BYTES = 16;
const RECORD_BYTES = 40;

/**
 * Parse binary tile header
 * Format: magic(4) + version(2) + recordSize(2) + count(4) + reserved(4)
 */
function parseTileHeader(buffer) {
  if (buffer.byteLength < HEADER_BYTES) {
    throw new Error(`Invalid header: buffer too small (${buffer.byteLength})`);
  }

  const view = new DataView(buffer, 0, HEADER_BYTES);
  
  // Read magic as ASCII
  const magicBytes = new Uint8Array(buffer, 0, 4);
  const magic = String.fromCharCode(...magicBytes);
  
  if (magic !== MAGIC) {
    throw new Error(`Invalid magic: expected "${MAGIC}", got "${magic}"`);
  }

  const version = view.getUint16(4, true);
  const recordSize = view.getUint16(6, true);
  const count = view.getUint32(8, true);
  
  if (version !== FORMAT_VERSION) {
    throw new Error(`Unsupported version: ${version}`);
  }

  if (recordSize !== RECORD_BYTES) {
    throw new Error(`Unexpected record size: ${recordSize}`);
  }

  return { magic, version, recordSize, count };
}

/**
 * Decode single star record from binary format
 * Fields: gaiaSourceId(uint64) + hip(uint32) + hd(uint32) + 
 *         raDegrees(float32) + decDegrees(float32) + parallaxMas(float32) +
 *         magnitude(float32) + colorIndex(float32) + distanceParsec(float32)
 */
function decodeStarRecord(buffer, offset) {
  const view = new DataView(buffer, offset, RECORD_BYTES);
  
  // Note: JavaScript doesn't have native uint64, so we read as BigInt
  // For practical purposes, we can use Number if the values fit
  const gaiaSourceId = Number(view.getBigUint64(0, true));
  const hip = view.getUint32(8, true);
  const hd = view.getUint32(12, true);
  const raDegrees = view.getFloat32(16, true);
  const decDegrees = view.getFloat32(20, true);
  const parallaxMas = view.getFloat32(24, true);
  const magnitude = view.getFloat32(28, true);
  const colorIndex = view.getFloat32(32, true);
  const distanceParsec = view.getFloat32(36, true);

  return {
    gaiaSourceId: gaiaSourceId || null,
    hip: hip || null,
    hd: hd || null,
    raDegrees: isFinite(raDegrees) ? raDegrees : null,
    decDegrees: isFinite(decDegrees) ? decDegrees : null,
    parallaxMas: isFinite(parallaxMas) ? parallaxMas : null,
    magnitude: isFinite(magnitude) ? magnitude : null,
    colorIndex: isFinite(colorIndex) ? colorIndex : null,
    distanceParsec: isFinite(distanceParsec) ? distanceParsec : null,
  };
}

/**
 * Decode entire binary tile to star array
 */
export function decodeBinaryTile(buffer) {
  const header = parseTileHeader(buffer);
  
  if (buffer.byteLength < HEADER_BYTES + header.count * RECORD_BYTES) {
    throw new Error(
      `Buffer size mismatch: expected ${HEADER_BYTES + header.count * RECORD_BYTES}, ` +
      `got ${buffer.byteLength}`
    );
  }

  const stars = [];
  for (let i = 0; i < header.count; i++) {
    const offset = HEADER_BYTES + i * RECORD_BYTES;
    const star = decodeStarRecord(buffer, offset);
    
    // Only include stars with valid coordinates
    if (star.raDegrees != null && star.decDegrees != null) {
      stars.push({
        // P0.2 StarIdentity contract
        canonicalId: star.gaiaSourceId 
          ? `gaia-dr3:${star.gaiaSourceId}` 
          : (star.hip ? `hip:${star.hip}` : `hd:${star.hd}`),
        gaiaSourceId: star.gaiaSourceId,
        hip: star.hip,
        hd: star.hd,
        raDegrees: star.raDegrees,
        decDegrees: star.decDegrees,
        parallaxMas: star.parallaxMas,
        magnitude: star.magnitude,
        colorIndex: star.colorIndex,
        distanceParsec: star.distanceParsec,
        // Legacy fields for compatibility
        ra: star.raDegrees / 15, // Convert to hours
        dec: star.decDegrees,
        mag: star.magnitude,
        bpRp: star.colorIndex,
      });
    }
  }

  return stars;
}

/**
 * LRU cache for decoded tiles
 */
class TileCache {
  constructor(maxSize = 32) {
    this.maxSize = maxSize;
    this.cache = new Map(); // sectorId → decoded stars
  }

  get(sectorId) {
    if (!this.cache.has(sectorId)) return null;
    
    // Move to end (LRU)
    const value = this.cache.get(sectorId);
    this.cache.delete(sectorId);
    this.cache.set(sectorId, value);
    
    return value;
  }

  set(sectorId, stars) {
    if (this.cache.has(sectorId)) {
      this.cache.delete(sectorId);
    }
    
    this.cache.set(sectorId, stars);

    // Evict LRU if over capacity
    if (this.cache.size > this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
  }

  clear() {
    this.cache.clear();
  }

  size() {
    return this.cache.size;
  }
}

/**
 * Binary Tile Loader - P0.5 main implementation
 * 
 * Manages manifest fetching, tile decoding, caching and searches
 */
export class BinaryTileLoader {
  constructor(baseUrl = null, maxCacheSize = 32) {
    this.baseUrl = baseUrl || '';
    this.cache = new TileCache(maxCacheSize);
    this.manifest = null;
    this.names = null;
    this.searchIndex = null;
    this.loading = false;
  }

  async fetchManifest() {
    if (this.manifest) return this.manifest;

    try {
      const url = `${this.baseUrl}/api/catalog/2d/manifest`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} fetching manifest`);
      }

      this.manifest = await response.json();
      console.log(
        `[P0.5] Loaded manifest: ${this.manifest.tileCount} tiles, ` +
        `${this.manifest.starCount} stars, ${(this.manifest.tileBytes / 1024 / 1024).toFixed(1)} MB`
      );
      
      return this.manifest;
    } catch (error) {
      console.error('[P0.5] Failed to fetch manifest:', error);
      throw error;
    }
  }

  async fetchNames() {
    if (this.names) return this.names;

    try {
      const url = `${this.baseUrl}/api/catalog/2d/names`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} fetching names index`);
      }

      this.names = await response.json();
      console.log(`[P0.5] Loaded ${Object.keys(this.names).length} star names`);
      
      return this.names;
    } catch (error) {
      console.error('[P0.5] Failed to fetch names:', error);
      throw error;
    }
  }

  async fetchSearchIndex() {
    if (this.searchIndex) return this.searchIndex;

    try {
      const url = `${this.baseUrl}/api/catalog/2d/search-index`;
      const response = await fetch(url);
      
      if (!response.ok) {
        // Search index is optional
        console.warn(`[P0.5] Search index not available (HTTP ${response.status})`);
        return {};
      }

      this.searchIndex = await response.json();
      console.log('[P0.5] Loaded search index');
      
      return this.searchIndex;
    } catch (error) {
      console.warn('[P0.5] Search index fetch failed (optional):', error);
      return {};
    }
  }

  async loadTile(sectorId) {
    // Check cache first
    const cached = this.cache.get(sectorId);
    if (cached) {
      return cached;
    }

    try {
      const url = `${this.baseUrl}/api/catalog/2d/tiles/${sectorId}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} loading tile ${sectorId}`);
      }

      const buffer = await response.arrayBuffer();
      const stars = decodeBinaryTile(buffer);
      
      this.cache.set(sectorId, stars);
      console.log(`[P0.5] Loaded tile ${sectorId}: ${stars.length} stars`);
      
      return stars;
    } catch (error) {
      console.error(`[P0.5] Failed to load tile ${sectorId}:`, error);
      return [];
    }
  }

  async loadAllTiles() {
    const manifest = await this.fetchManifest();
    const sectors = manifest.sectors || [];
    
    console.log(`[P0.5] Loading ${sectors.length} tiles...`);
    
    const allStars = [];
    for (const sector of sectors) {
      try {
        const stars = await this.loadTile(sector.id);
        allStars.push(...stars);
      } catch (error) {
        console.error(`[P0.5] Failed to load sector ${sector.id}:`, error);
      }
    }

    console.log(`[P0.5] Loaded ${allStars.length} stars from all tiles`);
    return allStars;
  }

  /**
   * Search stars by name, HIP, HD or Gaia ID
   * Returns canonical stars with names merged from names index
   */
  searchByName(query) {
    if (!this.names) {
      console.warn('[P0.5] Search index not loaded');
      return [];
    }

    const normalized = query.toLowerCase().trim();
    const results = [];

    for (const [gaiaSourceId, nameData] of Object.entries(this.names)) {
      if (nameData.properName && 
          nameData.properName.toLowerCase().includes(normalized)) {
        results.push({
          ...nameData,
          gaiaSourceId: parseInt(gaiaSourceId),
          canonicalId: `gaia-dr3:${gaiaSourceId}`,
        });
      }
    }

    return results;
  }

  cacheStats() {
    return {
      cachedTiles: this.cache.size(),
      maxCacheSize: this.cache.maxSize,
      utilization: `${(this.cache.size() / this.cache.maxSize * 100).toFixed(1)}%`,
    };
  }

  clearCache() {
    this.cache.clear();
  }
}

/**
 * Global tile loader instance (P0.5 integration point)
 */
let globalLoader = null;

export function initBinaryTileLoader(baseUrl = '') {
  if (!globalLoader) {
    globalLoader = new BinaryTileLoader(baseUrl);
  }
  return globalLoader;
}

export function getBinaryTileLoader() {
  if (!globalLoader) {
    globalLoader = new BinaryTileLoader();
  }
  return globalLoader;
}

export default BinaryTileLoader;
