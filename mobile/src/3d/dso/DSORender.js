import { DSOLODManager } from './DSOLODManager';

/**
 * P0.8.4 - DSO Rendering System
 * 
 * Renders Deep Sky Objects as billboards or points based on LOD
 */

export class DSORender {
  constructor(options = {}) {
    this.lodManager = options.lodManager || new DSOLODManager(options);
    this.renderer = options.renderer;          // Three.js/Babylon renderer
    this.renderables = new Map();              // DSO ID → render object
    this.visibleDSOs = [];
    this.renderedCount = { billboard: 0, point: 0 };
  }
  
  /**
   * Create billboard geometry (quad)
   */
  createBillboard(dso, screenSize, brightness, color) {
    // In production, this would create a Three.js sprite or plane
    // For now, return abstract render object
    
    const size = screenSize / 100 * 10;  // Normalize to world scale
    
    return {
      type: 'billboard',
      dsoId: dso._id,
      position: { x: dso.voyageX, y: dso.voyageY, z: dso.voyageZ },
      size,
      brightness,
      color,
      rotation: 0,  // Billboards face camera
      texture: this.getTextureForDSO(dso),
      glow: this.lodManager.getDSOGlow(dso, 'billboard'),
    };
  }
  
  /**
   * Create point geometry
   */
  createPoint(dso, brightness, color) {
    // Single vertex point
    return {
      type: 'point',
      dsoId: dso._id,
      position: { x: dso.voyageX, y: dso.voyageY, z: dso.voyageZ },
      brightness,
      color,
      pointSize: 2,
      glow: this.lodManager.getDSOGlow(dso, 'point'),
    };
  }
  
  /**
   * Get texture/material for DSO based on type
   */
  getTextureForDSO(dso) {
    // Map DSO type to texture category
    const typeTextures = {
      'Nebula': 'nebula_diffuse.png',
      'Galaxy': 'galaxy_spiral.png',
      'Globular Cluster': 'cluster_globe.png',
      'Planetary Nebula': 'nebula_ring.png',
      'Supernova Remnant': 'nebula_crab.png',
      'Open Cluster': 'cluster_open.png',
    };
    
    return typeTextures[dso.type] || 'default_dso.png';
  }
  
  /**
   * Render single DSO based on LOD
   */
  renderDSO(dso, cameraDistance, viewportHeight) {
    const params = this.lodManager.getDSORenderingParams(
      dso,
      cameraDistance,
      viewportHeight
    );
    
    // Check if we should render based on budget
    if (!this.lodManager.shouldRender(dso, params.lodLevel, this.renderedCount)) {
      return null;
    }
    
    let renderObject = null;
    
    switch (params.lodLevel) {
      case 'billboard':
        renderObject = this.createBillboard(
          dso,
          params.screenSize,
          params.brightness,
          params.color
        );
        this.renderedCount.billboard++;
        break;
        
      case 'point':
        renderObject = this.createPoint(
          dso,
          params.brightness,
          params.color
        );
        this.renderedCount.point++;
        break;
        
      case 'skip':
      default:
        return null;
    }
    
    this.renderables.set(dso._id, renderObject);
    return renderObject;
  }
  
  /**
   * Render all visible DSOs for current frame
   */
  renderFrame(visibleDSOs, cameraDistance, viewportHeight) {
    // Reset counters
    this.renderedCount = { billboard: 0, point: 0 };
    this.renderables.clear();
    
    // Sort by brightness (brightest first)
    const sorted = [...visibleDSOs].sort((a, b) => {
      const brightnessA = this.lodManager.getDSOBrightness(a, cameraDistance);
      const brightnessB = this.lodManager.getDSOBrightness(b, cameraDistance);
      return brightnessB - brightnessA;
    });
    
    // Render each DSO
    const rendered = [];
    for (const dso of sorted) {
      const renderObj = this.renderDSO(dso, cameraDistance, viewportHeight);
      if (renderObj) {
        rendered.push(renderObj);
      }
    }
    
    return rendered;
  }
  
  /**
   * Get rendered object by DSO ID
   */
  getRenderable(dsoId) {
    return this.renderables.get(dsoId) || null;
  }
  
  /**
   * Get all currently rendered objects
   */
  getAllRenderables() {
    return Array.from(this.renderables.values());
  }
  
  /**
   * Calculate billboards per type (for debug info)
   */
  getTypeBreakdown() {
    const breakdown = {};
    
    for (const renderObj of this.renderables.values()) {
      const type = renderObj.type;
      breakdown[type] = (breakdown[type] || 0) + 1;
    }
    
    return breakdown;
  }
  
  /**
   * Update frame timing (adaptive quality)
   */
  updateFrameTiming(frameTimeMs) {
    this.lodManager.updateFrameTiming(frameTimeMs);
  }
  
  /**
   * Get rendering stats for debug
   */
  getStats() {
    return {
      renderedCount: this.renderedCount,
      totalRenderable: this.renderables.size,
      budgets: this.lodManager.getAdaptiveBudgets(),
      typeBreakdown: this.getTypeBreakdown(),
    };
  }
}

/**
 * DSO Manager - High-level orchestration
 * 
 * Handles:
 * - Loading DSO data from backend
 * - Caching for performance
 * - Updating visibility based on camera
 * - Delegating to render system
 */
export class DSOManager {
  constructor(options = {}) {
    this.camera = options.camera;
    this.dsoRender = options.renderer || new DSORender(options);
    this.catalog = null;
    this.selectedDSO = null;
    this.viewportHeight = 600;
    this.loadingPromise = null;
  }
  
  /**
   * Load DSOs from backend
   */
  async loadNearby(camera) {
    if (this.loadingPromise) {
      return this.loadingPromise;
    }
    
    try {
      const response = await fetch(
        `/api/voyage/dsos?ra=${camera.raDegrees}&dec=${camera.decDegrees}&distance=${camera.distance}`
      );
      
      const data = await response.json();
      
      // Import DSOCatalog if not already imported
      const { DSOCatalog } = await import('./DSOCatalog');
      this.catalog = new DSOCatalog(data.dsos || []);
      
      return this.catalog;
    } catch (error) {
      console.error('Failed to load DSOs:', error);
      return null;
    }
  }
  
  /**
   * Update rendered DSOs for current frame
   */
  update(camera, frameTime) {
    if (!this.catalog) return [];
    
    // Get visible DSOs from catalog
    const visibleDSOs = this.catalog.getVisible(
      camera.position.x,
      camera.position.y,
      camera.position.z,
      camera.distance
    );
    
    // Render visible DSOs
    const rendered = this.dsoRender.renderFrame(
      visibleDSOs,
      camera.distance,
      this.viewportHeight
    );
    
    // Update adaptive quality
    if (frameTime) {
      this.dsoRender.updateFrameTiming(frameTime);
    }
    
    return rendered;
  }
  
  /**
   * Find DSOs near ray (for selection)
   */
  findDSOsNearRay(ray, maxCount = 5) {
    if (!this.catalog) return [];
    
    const results = [];
    const visibleDSOs = this.catalog.dsos;
    
    for (const dso of visibleDSOs) {
      if (!dso.voyageX || !dso.voyageY || !dso.voyageZ) continue;
      
      // Vector from ray origin to DSO
      const toObj = {
        x: dso.voyageX - ray.origin.x,
        y: dso.voyageY - ray.origin.y,
        z: dso.voyageZ - ray.origin.z,
      };
      
      // Project onto ray
      const projLength = toObj.x * ray.direction.x + 
                         toObj.y * ray.direction.y + 
                         toObj.z * ray.direction.z;
      
      if (projLength < 0) continue;
      
      // Closest point on ray
      const closest = {
        x: ray.origin.x + ray.direction.x * projLength,
        y: ray.origin.y + ray.direction.y * projLength,
        z: ray.origin.z + ray.direction.z * projLength,
      };
      
      // Distance from DSO to ray
      const dx = dso.voyageX - closest.x;
      const dy = dso.voyageY - closest.y;
      const dz = dso.voyageZ - closest.z;
      const distToRay = Math.sqrt(dx*dx + dy*dy + dz*dz);
      
      // Accept if within 2x angular size
      const tolerance = (dso.sizeArcmin || 5) * 2;
      if (distToRay < tolerance) {
        results.push({
          dso,
          distToRay,
          distance3D: projLength,
        });
      }
    }
    
    // Sort by distance to ray
    results.sort((a, b) => a.distToRay - b.distToRay);
    return results.slice(0, maxCount);
  }
  
  /**
   * Select DSO
   */
  selectDSO(dso) {
    this.selectedDSO = dso;
  }
  
  /**
   * Get selected DSO
   */
  getSelectedDSO() {
    return this.selectedDSO;
  }
  
  /**
   * Clear selection
   */
  clearSelection() {
    this.selectedDSO = null;
  }
  
  /**
   * Get rendering stats
   */
  getStats() {
    return {
      catalogSize: this.catalog ? this.catalog.dsos.length : 0,
      renderStats: this.dsoRender.getStats(),
    };
  }
}
