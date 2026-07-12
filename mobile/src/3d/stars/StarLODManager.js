/**
 * P0.8.2 - Star Rendering: LOD Manager
 * 
 * Manages level-of-detail transitions for stars based on distance
 * from camera and rendering performance budgets.
 */

/**
 * Star LOD Manager
 * 
 * Determines which rendering strategy to use and tracks
 * performance metrics for adaptive quality
 */
export class StarLODManager {
  constructor(options = {}) {
    // Distance thresholds (parsecs)
    this.thresholds = {
      detail: 2.0,      // < 2 pc: Full 3D sphere
      near: 10.0,       // 2-10 pc: Billboard
      medium: 100.0,    // 10-100 pc: Sprite
      far: 500.0,       // 100-500 pc: Point
      skip: Infinity,   // > 500 pc: Not rendered
    };
    
    // Star count budgets per LOD (for adaptive quality)
    this.budgets = {
      detail: options.detailBudget || 100,      // Max 100 full-detail stars
      near: options.nearBudget || 500,          // Max 500 billboard stars
      medium: options.mediumBudget || 5000,     // Max 5000 sprite stars
      far: options.farBudget || 50000,          // Max 50k point stars
    };
    
    // Current star counts (for monitoring)
    this.counts = {
      detail: 0,
      near: 0,
      medium: 0,
      far: 0,
      skipped: 0,
    };
    
    // Performance tracking
    this.frameTimeMs = 0;
    this.targetFrameTimeMs = 16.67; // 60 FPS
    this.qualityFactor = 1.0; // 0-1, reduce for lower-end devices
  }
  
  /**
   * Determine LOD level for a star
   * 
   * Args:
   *   distancePc: Distance from camera in parsecs
   *   skipIfOver budget: Optional, skip if budget exceeded
   *   
   * Returns: 'detail', 'near', 'medium', 'far', or 'skip'
   */
  getLODLevel(distancePc, lodLevel = null) {
    if (typeof distancePc !== 'number' || distancePc < 0) {
      return 'skip';
    }
    
    // Determine LOD based on distance
    if (distancePc < this.thresholds.detail) {
      return 'detail';
    } else if (distancePc < this.thresholds.near) {
      return 'near';
    } else if (distancePc < this.thresholds.medium) {
      return 'medium';
    } else if (distancePc < this.thresholds.far) {
      return 'far';
    } else {
      return 'skip';
    }
  }
  
  /**
   * Check if a star is within budget for its LOD level
   * 
   * Returns: { withinBudget, priority }
   * Priority: 0 (high/nearest) to 1 (low/farthest)
   */
  checkBudget(distancePc, lodLevel) {
    const budget = this.budgets[lodLevel];
    const count = this.counts[lodLevel];
    
    if (!budget) {
      return { withinBudget: false, priority: 0 };
    }
    
    // Calculate priority: nearer stars have higher priority
    const maxDistance = this.thresholds[lodLevel] || 500;
    const priority = distancePc / maxDistance;
    
    return {
      withinBudget: count < budget,
      priority,
      count,
      budget,
    };
  }
  
  /**
   * Increment count for a LOD level
   */
  addStar(lodLevel) {
    if (this.counts[lodLevel] !== undefined) {
      this.counts[lodLevel]++;
    }
  }
  
  /**
   * Reset counts (called at start of each frame)
   */
  resetCounts() {
    this.counts = {
      detail: 0,
      near: 0,
      medium: 0,
      far: 0,
      skipped: 0,
    };
  }
  
  /**
   * Update frame timing and adjust quality if needed
   * 
   * Called after rendering each frame
   */
  updateFrameTiming(frameTimeMs) {
    this.frameTimeMs = frameTimeMs;
    
    // If consistently over budget, reduce quality
    if (frameTimeMs > this.targetFrameTimeMs) {
      this.qualityFactor = Math.max(0.5, this.qualityFactor - 0.1);
    }
    // If consistently under budget, increase quality
    else if (frameTimeMs < this.targetFrameTimeMs * 0.8) {
      this.qualityFactor = Math.min(1.0, this.qualityFactor + 0.05);
    }
  }
  
  /**
   * Get adaptive budget based on frame performance
   * 
   * Returns: { detail, near, medium, far }
   */
  getAdaptiveBudgets() {
    return {
      detail: Math.floor(this.budgets.detail * this.qualityFactor),
      near: Math.floor(this.budgets.near * this.qualityFactor),
      medium: Math.floor(this.budgets.medium * this.qualityFactor),
      far: Math.floor(this.budgets.far * this.qualityFactor),
    };
  }
  
  /**
   * Get statistics for HUD display
   */
  getStats() {
    const total = Object.values(this.counts).reduce((a, b) => a + b, 0);
    
    return {
      totalStars: total,
      detail: this.counts.detail,
      near: this.counts.near,
      medium: this.counts.medium,
      far: this.counts.far,
      skipped: this.counts.skipped,
      frameTimeMs: this.frameTimeMs.toFixed(2),
      qualityFactor: (this.qualityFactor * 100).toFixed(0) + '%',
    };
  }
  
  /**
   * Get distance threshold for LOD level
   */
  getThreshold(lodLevel) {
    return this.thresholds[lodLevel];
  }
  
  /**
   * Set custom thresholds (useful for testing)
   */
  setThresholds(thresholds) {
    Object.assign(this.thresholds, thresholds);
  }
  
  /**
   * Set custom budgets (useful for testing)
   */
  setBudgets(budgets) {
    Object.assign(this.budgets, budgets);
  }
}

/**
 * Factory function for different device profiles
 */
export function createLODManagerForProfile(profile) {
  const profiles = {
    low: {
      detailBudget: 10,
      nearBudget: 50,
      mediumBudget: 500,
      farBudget: 5000,
    },
    medium: {
      detailBudget: 100,
      nearBudget: 500,
      mediumBudget: 5000,
      farBudget: 50000,
    },
    high: {
      detailBudget: 500,
      nearBudget: 2000,
      mediumBudget: 20000,
      farBudget: 100000,
    },
  };
  
  const config = profiles[profile] || profiles.medium;
  return new StarLODManager(config);
}
