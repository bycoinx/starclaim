/**
 * P0.8.4 - DSO LOD Manager
 * 
 * Distance-based level-of-detail for Deep Sky Objects
 */

export class DSOLODManager {
  constructor(options = {}) {
    // Distance thresholds (parsecs)
    this.billboardDistance = options.billboardDistance || 1000;
    this.pointDistance = options.pointDistance || 5000;
    this.skipDistance = options.skipDistance || 10000;
    
    // Magnitude thresholds
    this.minVisibleMagnitude = options.minVisibleMagnitude || 15;
    
    // Rendering budgets
    this.billboardBudget = options.billboardBudget || 100;
    this.pointBudget = options.pointBudget || 50;
    
    // Frame timing adaptation
    this.frameTimeTarget = 16.67; // 60 FPS
    this.adaptiveQuality = 1.0;   // 0.5 - 1.0 range
  }
  
  /**
   * Determine LOD level for a DSO
   * 
   * Levels:
   * - skip: Don't render
   * - point: Single vertex
   * - billboard: Textured quad
   */
  getLODLevel(dso, cameraDistance) {
    if (!dso) return 'skip';
    
    // Check magnitude visibility
    if (dso.magnitude && dso.magnitude > this.minVisibleMagnitude) {
      return 'skip';
    }
    
    // Check distance visibility
    if (dso.visibility) {
      if (cameraDistance < dso.visibility.minDistance) return 'skip';
      if (cameraDistance > dso.visibility.maxDistance) return 'skip';
    }
    
    // LOD by distance
    if (cameraDistance < this.billboardDistance) {
      return 'billboard';
    } else if (cameraDistance < this.pointDistance) {
      return 'point';
    }
    
    return 'skip';
  }
  
  /**
   * Get screen size for DSO
   */
  getDSOScreenSize(dso, cameraDistance, viewportHeight, fov = 45) {
    if (!dso.sizeArcmin) return 2;
    
    // Convert angular size to screen pixels
    // fov is vertical field of view
    const degreesPerPixel = fov / viewportHeight;
    const degreesPerArcmin = 1 / 60;
    
    // Size in degrees
    const sizeDegrees = dso.sizeArcmin * degreesPerArcmin;
    
    // Screen pixels (with 50% base scale)
    const pixelSize = (sizeDegrees / degreesPerPixel) * 0.5;
    
    // Clamp to reasonable range
    return Math.max(1, Math.min(64, pixelSize));
  }
  
  /**
   * Get brightness of DSO (for opacity/color)
   */
  getDSOBrightness(dso, cameraDistance) {
    if (!dso.luminosityL_sun) return 0.5;
    
    // Inverse square law: brightness ~ L / d²
    // Simplified: use magnitude which already accounts for distance
    
    if (dso.magnitude === undefined) return 0.5;
    
    // Map magnitude (smaller = brighter)
    // Bright object: mag = 0 → brightness = 1.0
    // Dim object: mag = 15 → brightness = 0.1
    const brightness = Math.pow(10, -dso.magnitude / 2.5);
    
    return Math.max(0.1, Math.min(1.0, brightness));
  }
  
  /**
   * Get glow intensity for DSO (post-processing bloom)
   */
  getDSOGlow(dso, lodLevel) {
    if (lodLevel === 'skip') return 0;
    
    const brightness = this.getDSOBrightness(dso, 1000);
    
    if (lodLevel === 'billboard') {
      return brightness * 0.3;
    } else if (lodLevel === 'point') {
      return brightness * 0.1;
    }
    
    return 0;
  }
  
  /**
   * Get halo size for DSO (corona around object)
   */
  getDSOHaloSize(dso, lodLevel) {
    if (lodLevel === 'skip' || lodLevel === 'point') return 0;
    
    if (!dso.sizeArcmin) return 0;
    
    // Billboard: add halo equal to 1.5x object size
    return dso.sizeArcmin * 1.5;
  }
  
  /**
   * Get complete rendering parameters
   */
  getDSORenderingParams(dso, cameraDistance, viewportHeight) {
    const lodLevel = this.getLODLevel(dso, cameraDistance);
    const screenSize = this.getDSOScreenSize(dso, cameraDistance, viewportHeight);
    const brightness = this.getDSOBrightness(dso, cameraDistance);
    const glow = this.getDSOGlow(dso, lodLevel);
    const haloSize = this.getDSOHaloSize(dso, lodLevel);
    
    return {
      lodLevel,
      screenSize,
      brightness,
      glow,
      haloSize,
      color: dso.color || [0.7, 0.7, 1.0],
    };
  }
  
  /**
   * Check if DSO should be rendered given budget
   */
  shouldRender(dso, lodLevel, renderedCount) {
    if (lodLevel === 'skip') return false;
    if (lodLevel === 'billboard') {
      return renderedCount.billboard < this.billboardBudget;
    } else if (lodLevel === 'point') {
      return renderedCount.point < this.pointBudget;
    }
    return true;
  }
  
  /**
   * Update adaptive quality based on frame time
   */
  updateFrameTiming(frameTimeMs) {
    if (frameTimeMs > 18) {  // > 55 FPS (conservative)
      // Reduce quality
      this.adaptiveQuality = Math.max(0.5, this.adaptiveQuality * 0.95);
      this.billboardBudget = Math.floor(100 * this.adaptiveQuality);
      this.pointBudget = Math.floor(50 * this.adaptiveQuality);
    } else if (frameTimeMs < 14) {  // < 71 FPS (plenty of headroom)
      // Increase quality
      this.adaptiveQuality = Math.min(1.0, this.adaptiveQuality * 1.05);
      this.billboardBudget = Math.floor(100 * this.adaptiveQuality);
      this.pointBudget = Math.floor(50 * this.adaptiveQuality);
    }
  }
  
  /**
   * Get current adaptive budgets
   */
  getAdaptiveBudgets() {
    return {
      quality: this.adaptiveQuality,
      billboard: this.billboardBudget,
      point: this.pointBudget,
    };
  }
  
  /**
   * Create LOD manager for device profile
   */
  static createForProfile(profile = 'medium') {
    const profiles = {
      low: {
        billboardDistance: 500,
        pointDistance: 2000,
        skipDistance: 5000,
        billboardBudget: 30,
        pointBudget: 15,
        minVisibleMagnitude: 12,
      },
      medium: {
        billboardDistance: 1000,
        pointDistance: 5000,
        skipDistance: 10000,
        billboardBudget: 100,
        pointBudget: 50,
        minVisibleMagnitude: 15,
      },
      high: {
        billboardDistance: 2000,
        pointDistance: 10000,
        skipDistance: 50000,
        billboardBudget: 200,
        pointBudget: 100,
        minVisibleMagnitude: 18,
      },
    };
    
    const config = profiles[profile] || profiles.medium;
    return new DSOLODManager(config);
  }
}
