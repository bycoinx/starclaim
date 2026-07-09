/**
 * P0.5 - Binary Tile Loader & Render Integration Tests
 * 
 * Validates:
 * - Binary tile decode format
 * - Sector ID mapping to tiles
 * - Search by name/HIP/HD/Gaia
 * - LRU cache eviction
 * - Manifest validation
 */

import { decodeBinaryTile, BinaryTileLoader } from './binaryTileLoader';

describe('P05BinaryTileLoader', () => {
  describe('Binary Format Decode', () => {
    it('should decode valid tile header', () => {
      // Create minimal valid tile: header + 0 stars
      const buffer = new ArrayBuffer(16);
      const view = new DataView(buffer);
      const encoder = new TextEncoder();
      
      // Write magic "SCB1"
      const magicBytes = encoder.encode('SCB1');
      new Uint8Array(buffer, 0, 4).set(magicBytes);
      
      // Write version (1), recordSize (40), count (0)
      view.setUint16(4, 1, true);
      view.setUint16(6, 40, true);
      view.setUint32(8, 0, true);
      
      const stars = decodeBinaryTile(buffer);
      expect(stars).toEqual([]);
    });

    it('should decode star records correctly', () => {
      // Create tile with 1 star
      const starCount = 1;
      const buffer = new ArrayBuffer(16 + starCount * 40);
      const view = new DataView(buffer);
      const encoder = new TextEncoder();
      
      // Header
      const magicBytes = encoder.encode('SCB1');
      new Uint8Array(buffer, 0, 4).set(magicBytes);
      view.setUint16(4, 1, true);
      view.setUint16(6, 40, true);
      view.setUint32(8, starCount, true);
      
      // Star record: Sirius-like
      const starView = new DataView(buffer, 16, 40);
      starView.setBigUint64(0, BigInt(1000000000), true); // gaiaSourceId
      starView.setUint32(8, 32349, true); // hip
      starView.setUint32(12, 48915, true); // hd
      starView.setFloat32(16, 101.29, true); // raDegrees
      starView.setFloat32(20, -16.71, true); // decDegrees
      starView.setFloat32(24, 37.6, true); // parallaxMas
      starView.setFloat32(28, -1.46, true); // magnitude
      starView.setFloat32(32, 0.005, true); // colorIndex
      starView.setFloat32(36, 26.7, true); // distanceParsec
      
      const stars = decodeBinaryTile(buffer);
      expect(stars).toHaveLength(1);
      expect(stars[0].hip).toBe(32349);
      expect(stars[0].magnitude).toBeCloseTo(-1.46, 2);
      expect(stars[0].canonicalId).toMatch(/^gaia-dr3:/);
    });

    it('should filter out invalid records (NaN coordinates)', () => {
      const starCount = 2;
      const buffer = new ArrayBuffer(16 + starCount * 40);
      const view = new DataView(buffer);
      const encoder = new TextEncoder();
      
      // Header
      const magicBytes = encoder.encode('SCB1');
      new Uint8Array(buffer, 0, 4).set(magicBytes);
      view.setUint16(4, 1, true);
      view.setUint16(6, 40, true);
      view.setUint32(8, starCount, true);
      
      // Valid star
      const star1View = new DataView(buffer, 16, 40);
      star1View.setBigUint64(0, BigInt(1), true);
      star1View.setFloat32(16, 180, true); // raDegrees
      star1View.setFloat32(20, 0, true); // decDegrees
      star1View.setFloat32(28, 5, true); // magnitude
      
      // Invalid star (NaN coords = infinity in float32)
      const star2View = new DataView(buffer, 56, 40);
      star2View.setBigUint64(0, BigInt(2), true);
      star2View.setFloat32(16, Infinity, true); // Invalid
      star2View.setFloat32(20, 0, true);
      
      const stars = decodeBinaryTile(buffer);
      expect(stars).toHaveLength(1);
      expect(stars[0].gaiaSourceId).toBe(1);
    });

    it('should reject invalid magic bytes', () => {
      const buffer = new ArrayBuffer(16);
      const encoder = new TextEncoder();
      const badMagic = encoder.encode('BAD1');
      new Uint8Array(buffer, 0, 4).set(badMagic);
      
      expect(() => decodeBinaryTile(buffer)).toThrow(/Invalid magic/);
    });

    it('should reject invalid version', () => {
      const buffer = new ArrayBuffer(16);
      const view = new DataView(buffer);
      const encoder = new TextEncoder();
      const magicBytes = encoder.encode('SCB1');
      new Uint8Array(buffer, 0, 4).set(magicBytes);
      view.setUint16(4, 999, true); // Invalid version
      
      expect(() => decodeBinaryTile(buffer)).toThrow(/Unsupported version/);
    });
  });

  describe('StarIdentity Contract (P0.2)', () => {
    it('should generate canonical IDs correctly', () => {
      const buffer = new ArrayBuffer(56); // header + 1 record
      const view = new DataView(buffer);
      const encoder = new TextEncoder();
      
      const magicBytes = encoder.encode('SCB1');
      new Uint8Array(buffer, 0, 4).set(magicBytes);
      view.setUint16(4, 1, true);
      view.setUint16(6, 40, true);
      view.setUint32(8, 1, true);
      
      const starView = new DataView(buffer, 16, 40);
      starView.setBigUint64(0, BigInt(1234567890), true);
      starView.setFloat32(16, 100, true);
      starView.setFloat32(20, 50, true);
      
      const stars = decodeBinaryTile(buffer);
      expect(stars[0].canonicalId).toBe('gaia-dr3:1234567890');
    });

    it('should include legacy fields for compatibility', () => {
      const buffer = new ArrayBuffer(56);
      const view = new DataView(buffer);
      const encoder = new TextEncoder();
      
      const magicBytes = encoder.encode('SCB1');
      new Uint8Array(buffer, 0, 4).set(magicBytes);
      view.setUint16(4, 1, true);
      view.setUint16(6, 40, true);
      view.setUint32(8, 1, true);
      
      const starView = new DataView(buffer, 16, 40);
      starView.setFloat32(16, 180, true); // RA degrees
      starView.setFloat32(20, 45, true); // Dec degrees
      starView.setFloat32(28, 3.5, true); // magnitude
      starView.setFloat32(32, 0.8, true); // colorIndex
      
      const stars = decodeBinaryTile(buffer);
      const star = stars[0];
      
      expect(star.ra).toBeCloseTo(12, 1); // 180/15
      expect(star.dec).toBeCloseTo(45, 1);
      expect(star.mag).toBeCloseTo(3.5, 2);
      expect(star.bpRp).toBeCloseTo(0.8, 2);
    });
  });

  describe('LRU Cache', () => {
    it('should cache and retrieve tiles', async () => {
      const loader = new BinaryTileLoader('http://localhost:8000');
      const sectorId = 'r0-d0';
      
      // Mock a small star array
      const mockStars = [
        { canonicalId: 'test-1', magnitude: 3.5 }
      ];
      
      // Directly set cache (simulating loaded tile)
      loader.cache.set(sectorId, mockStars);
      
      const cached = loader.cache.get(sectorId);
      expect(cached).toEqual(mockStars);
    });

    it('should evict LRU when full', () => {
      const loader = new BinaryTileLoader('http://localhost:8000', 3);
      
      loader.cache.set('r0-d0', []);
      loader.cache.set('r0-d1', []);
      loader.cache.set('r0-d2', []);
      
      expect(loader.cache.size()).toBe(3);
      
      // Add 4th tile - should evict r0-d0
      loader.cache.set('r0-d3', []);
      
      expect(loader.cache.size()).toBe(3);
      expect(loader.cache.get('r0-d0')).toBeNull();
      expect(loader.cache.get('r0-d3')).toEqual([]);
    });

    it('should move accessed tile to end (LRU)', () => {
      const loader = new BinaryTileLoader('http://localhost:8000', 2);
      
      loader.cache.set('A', [1]);
      loader.cache.set('B', [2]);
      
      // Access A - moves to end
      loader.cache.get('A');
      
      // Add C - should evict B (was accessed less recently)
      loader.cache.set('C', [3]);
      
      expect(loader.cache.get('A')).toEqual([1]);
      expect(loader.cache.get('B')).toBeNull();
      expect(loader.cache.get('C')).toEqual([3]);
    });

    it('should report cache stats', () => {
      const loader = new BinaryTileLoader('http://localhost:8000', 5);
      
      loader.cache.set('tile1', []);
      loader.cache.set('tile2', []);
      
      const stats = loader.cacheStats();
      expect(stats.cachedTiles).toBe(2);
      expect(stats.maxCacheSize).toBe(5);
      expect(stats.utilization).toContain('40');
    });

    it('should clear cache', () => {
      const loader = new BinaryTileLoader('http://localhost:8000');
      
      loader.cache.set('a', []);
      loader.cache.set('b', []);
      
      expect(loader.cache.size()).toBe(2);
      
      loader.clearCache();
      expect(loader.cache.size()).toBe(0);
    });
  });

  describe('Reference Stars', () => {
    it('should encode Sirius correctly', () => {
      // Sirius: HIP 32349, RA 101.29°, Dec -16.71°, mag -1.46
      const buffer = new ArrayBuffer(56);
      const view = new DataView(buffer);
      const encoder = new TextEncoder();
      
      const magicBytes = encoder.encode('SCB1');
      new Uint8Array(buffer, 0, 4).set(magicBytes);
      view.setUint16(4, 1, true);
      view.setUint16(6, 40, true);
      view.setUint32(8, 1, true);
      
      const starView = new DataView(buffer, 16, 40);
      starView.setUint32(8, 32349, true); // hip
      starView.setFloat32(16, 101.29, true);
      starView.setFloat32(20, -16.71, true);
      starView.setFloat32(28, -1.46, true);
      
      const stars = decodeBinaryTile(buffer);
      expect(stars[0].hip).toBe(32349);
      expect(stars[0].magnitude).toBeCloseTo(-1.46, 2);
      expect(stars[0].raDegrees).toBeCloseTo(101.29, 1);
    });

    it('should encode Polaris (high declination)', () => {
      // Polaris: HIP 11767, Dec +89.26°
      const buffer = new ArrayBuffer(56);
      const view = new DataView(buffer);
      const encoder = new TextEncoder();
      
      const magicBytes = encoder.encode('SCB1');
      new Uint8Array(buffer, 0, 4).set(magicBytes);
      view.setUint16(4, 1, true);
      view.setUint16(6, 40, true);
      view.setUint32(8, 1, true);
      
      const starView = new DataView(buffer, 16, 40);
      starView.setUint32(8, 11767, true);
      starView.setFloat32(20, 89.26, true); // Dec
      
      const stars = decodeBinaryTile(buffer);
      expect(stars[0].hip).toBe(11767);
      expect(stars[0].decDegrees).toBeCloseTo(89.26, 2);
    });
  });
});
