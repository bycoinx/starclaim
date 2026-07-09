/**
 * P0.6 - Deep Sky Object (DSO) Catalog Loader
 * 
 * Loads Messier + NGC objects for 2D sky map
 * Implements zoom-based visibility filtering
 */

export class DSOLoader {
  constructor(baseUrl = '') {
    this.baseUrl = baseUrl || '';
    this.allDSOs = null;
    this.cache = new Map(); // zoom→quality→dsos
  }

  /**
   * Fetch complete DSO catalog
   */
  async loadCatalog() {
    if (this.allDSOs) return this.allDSOs;

    try {
      const url = `${this.baseUrl}/api/dso/catalog`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} loading DSO catalog`);
      }

      const data = await response.json();
      this.allDSOs = data.objects || [];
      console.log(`[P0.6] Loaded ${this.allDSOs.length} DSO objects`);
      
      return this.allDSOs;
    } catch (error) {
      console.error('[P0.6] Failed to load DSO catalog:', error);
      throw error;
    }
  }

  /**
   * Get DSOs visible at specific zoom level
   */
  async getVisibleDSOs(zoom, quality = 'medium') {
    // Check cache
    const cacheKey = `${zoom}:${quality}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const url = `${this.baseUrl}/api/dso/by-zoom?zoom=${zoom}&quality=${quality}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      const dsos = data.objects || [];
      
      this.cache.set(cacheKey, dsos);
      console.log(`[P0.6] Loaded ${dsos.length} DSOs for zoom ${zoom}, quality ${quality}`);
      
      return dsos;
    } catch (error) {
      console.error(`[P0.6] Failed to load DSOs for zoom ${zoom}:`, error);
      return [];
    }
  }

  /**
   * Search DSOs by name, Messier number, NGC number
   */
  async searchDSOs(query, limit = 20) {
    if (!query || query.trim().length < 1) {
      return [];
    }

    try {
      const url = `${this.baseUrl}/api/dso/search?q=${encodeURIComponent(query)}&limit=${limit}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      return data.objects || [];
    } catch (error) {
      console.error(`[P0.6] Search failed for "${query}":`, error);
      return [];
    }
  }

  /**
   * Format DSO for rendering
   */
  formatForRender(dso) {
    return {
      id: dso.catalogId,
      type: 'dso',
      name: dso.commonName || `${dso.messierNumber ? 'M' + dso.messierNumber : 'NGC' + dso.ngcNumber}`,
      objectType: dso.objectType,
      
      raDegrees: dso.raDegrees,
      decDegrees: dso.decDegrees,
      
      // Physical properties
      majorAxisArcmin: dso.majorAxisArcmin,
      minorAxisArcmin: dso.minorAxisArcmin,
      positionAngleDegrees: dso.positionAngleDegrees,
      magnitude: dso.magnitude,
      surfaceBrightness: dso.surfaceBrightness,
      
      // Metadata
      constellation: dso.constellation,
      notes: dso.notes,
      discoverer: dso.discoverer,
      discoveryYear: dso.discoveryYear,
      
      // Messier + NGC cross-reference
      messierNumber: dso.messierNumber,
      ngcNumber: dso.ngcNumber,
    };
  }

  /**
   * Calculate rendering properties for a DSO
   * 
   * Returns: {radius, opacity, color}
   */
  getRenderProperties(dso, zoom, quality = 'medium') {
    // Base opacity by object type
    const typeOpacity = {
      'galaxy': 0.6,
      'nebula': 0.7,
      'emission_nebula': 0.75,
      'planetary_nebula': 0.8,
      'supernova_remnant': 0.7,
      'cluster': 0.65,
      'open_cluster': 0.6,
      'globular_cluster': 0.7,
      'unknown': 0.5,
    };

    // Color by object type
    const typeColor = {
      'galaxy': '#B8B8FF',
      'nebula': '#66DD66',
      'emission_nebula': '#66DD66',
      'planetary_nebula': '#88FF88',
      'supernova_remnant': '#FFAA66',
      'cluster': '#DDDDDD',
      'open_cluster': '#DDDDDD',
      'globular_cluster': '#FFCCFF',
      'unknown': '#AAAAAA',
    };

    // Size based on angular size and zoom
    // Major axis in arcmin, convert to screen pixels
    const arcminPerPixel = 90 / (zoom * 64); // Approximate
    const majorPixels = dso.majorAxisArcmin / arcminPerPixel;
    const radius = Math.max(2, Math.min(60, majorPixels / 2));

    // Opacity depends on surface brightness and zoom
    let opacity = typeOpacity[dso.objectType] || 0.5;
    
    if (dso.surfaceBrightness) {
      // Fainter objects need zoom to be visible
      opacity *= Math.max(0.3, Math.min(1.0, zoom / 2));
    }

    // Quality profile affects detail
    if (quality === 'low') {
      opacity *= 0.8;
    } else if (quality === 'high') {
      opacity *= 1.1;
    }

    return {
      radius: Math.round(radius * 10) / 10,
      opacity: Math.min(1.0, Math.max(0.1, opacity)),
      color: typeColor[dso.objectType] || typeColor.unknown,
    };
  }

  /**
   * Clear caches
   */
  clear() {
    this.cache.clear();
    this.allDSOs = null;
  }
}

/**
 * Global DSO loader instance
 */
let globalDSOLoader = null;

export function initDSOLoader(baseUrl = '') {
  if (!globalDSOLoader) {
    globalDSOLoader = new DSOLoader(baseUrl);
  }
  return globalDSOLoader;
}

export function getDSOLoader() {
  if (!globalDSOLoader) {
    globalDSOLoader = new DSOLoader();
  }
  return globalDSOLoader;
}

export default DSOLoader;
