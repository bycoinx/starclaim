/**
 * P0.8.2 - Star Rendering: Size Calculator
 * 
 * Converts astronomical magnitude to display sizes
 * accounting for LOD level and distance.
 */

/**
 * Get star size from magnitude and LOD level
 * 
 * Formula: size = baseSize * 10^(-magnitude / 2.5)
 * 
 * Rationale:
 * - Magnitude scale: each +2.5 steps = 10x dimmer = 3.16x smaller
 * - Sirius (m=-1.46) vs Polaris (m=+1.97): diff=3.43 → ~26x brighter → ~5x larger
 * - Clamped to [minSize, maxSize] to prevent extreme values
 */
export function getMagnitudeSize(magnitude, lodLevel) {
  if (typeof magnitude !== 'number' || isNaN(magnitude)) {
    magnitude = 5; // Default to average star
  }
  
  // Base sizes by LOD (in pixels for far/medium/near, world-units for detail)
  const baseSizes = {
    detail: 12,     // Full 3D sphere at < 2 pc
    near: 6,        // Billboard at 2-10 pc
    medium: 3,      // Sprite at 10-100 pc
    far: 1.5,       // Points at 100-500 pc
    skip: 0,        // Not rendered
  };
  
  const baseSize = baseSizes[lodLevel] || 3;
  if (baseSize === 0) return 0;
  
  // Apply magnitude scaling
  // 10^(-m/2.5): negative magnitude (bright) = larger
  const magnitudeScale = Math.pow(10, -magnitude / 2.5);
  let size = baseSize * magnitudeScale;
  
  // Clamp to reasonable range
  const minSize = lodLevel === 'skip' ? 0 : 0.5;
  const maxSize = 16;
  
  size = Math.max(minSize, Math.min(maxSize, size));
  
  return size;
}

/**
 * Get brightness/opacity for star
 * 
 * - Brighter (negative magnitude) → higher opacity/brightness
 * - Dimmer (positive magnitude) → lower opacity, may fade out
 * 
 * Used for alpha blending in shaders
 */
export function getMagnitudeBrightness(magnitude, lodLevel) {
  if (typeof magnitude !== 'number' || isNaN(magnitude)) {
    magnitude = 5;
  }
  
  // Base brightness by LOD
  const baseBrightness = {
    detail: 1.0,    // Full brightness when close
    near: 0.95,
    medium: 0.9,
    far: 0.8,       // Dimmer when far
    skip: 0,
  };
  
  let brightness = baseBrightness[lodLevel] || 0.9;
  
  // Apply magnitude scaling
  // Bright stars: additional brightness boost
  // Dim stars: fade out gradually
  const magnitudeScale = Math.pow(10, -magnitude / 2.5);
  brightness *= Math.min(1.0, magnitudeScale * 2); // *2 for extra glow on bright stars
  
  return Math.max(0, Math.min(1, brightness));
}

/**
 * Get glow/bloom intensity for star
 * 
 * Used for post-processing bloom effect
 * Bright stars → intense glow
 * Dim stars → minimal glow
 */
export function getMagnitudeGlow(magnitude) {
  if (typeof magnitude !== 'number' || isNaN(magnitude)) {
    magnitude = 5;
  }
  
  // Glow intensity scale
  // Sirius (m=-1.46) → very bright glow
  // Average star (m=5) → subtle glow
  const magnitudeScale = Math.pow(10, -magnitude / 2.5);
  
  // Map to [0, 1]
  let glow = Math.log(1 + magnitudeScale * 10) / Math.log(11);
  glow = Math.max(0, Math.min(1, glow));
  
  return glow;
}

/**
 * Get halo/corona size for star
 * 
 * Larger for bright stars to create "shine" effect
 * Used in shader for bloom/glow calculation
 */
export function getMagnitudeHaloSize(magnitude) {
  if (typeof magnitude !== 'number' || isNaN(magnitude)) {
    magnitude = 5;
  }
  
  const baseHalo = 1.2; // Base halo multiplier on star size
  const magnitudeScale = Math.pow(10, -magnitude / 2.5);
  
  // Halo grows with brightness
  const haloSize = baseHalo * (1 + magnitudeScale);
  
  return Math.max(1, Math.min(3, haloSize)); // Clamp [1, 3]
}

/**
 * Get complete star rendering parameters
 * 
 * Combines all calculations for convenience
 */
export function getStarRenderingParams(star, lodLevel) {
  const magnitude = star.magnitude || 5;
  
  return {
    size: getMagnitudeSize(magnitude, lodLevel),
    brightness: getMagnitudeBrightness(magnitude, lodLevel),
    glow: getMagnitudeGlow(magnitude),
    haloSize: getMagnitudeHaloSize(magnitude),
    lodLevel,
  };
}

/**
 * Validate magnitude range
 * 
 * Returns { valid, message, clampedMagnitude }
 */
export function validateMagnitude(magnitude) {
  if (typeof magnitude !== 'number') {
    return {
      valid: false,
      message: `Magnitude must be number, got ${typeof magnitude}`,
      clampedMagnitude: 5,
    };
  }
  
  if (isNaN(magnitude)) {
    return {
      valid: false,
      message: `Magnitude is NaN`,
      clampedMagnitude: 5,
    };
  }
  
  // Valid range: -2 to +20 (covers all stars)
  const minMag = -2;
  const maxMag = 20;
  
  if (magnitude < minMag || magnitude > maxMag) {
    return {
      valid: false,
      message: `Magnitude ${magnitude} outside range [${minMag}, ${maxMag}]`,
      clampedMagnitude: Math.max(minMag, Math.min(maxMag, magnitude)),
    };
  }
  
  return {
    valid: true,
    message: 'OK',
    clampedMagnitude: magnitude,
  };
}

/**
 * Test reference magnitudes and expected sizes
 */
export const REFERENCE_STAR_SIZES = {
  sirius: { // m = -1.46
    magnitude: -1.46,
    medium: { expectedRange: [2.5, 4] },
    far: { expectedRange: [1, 2] },
  },
  vega: { // m = 0.03
    magnitude: 0.03,
    medium: { expectedRange: [2.5, 3.5] },
    far: { expectedRange: [1, 1.5] },
  },
  polaris: { // m = 1.97
    magnitude: 1.97,
    medium: { expectedRange: [1.5, 2.5] },
    far: { expectedRange: [0.8, 1.2] },
  },
  limit: { // Naked eye limit
    magnitude: 6.0,
    medium: { expectedRange: [1, 1.5] },
    far: { expectedRange: [0.5, 0.8] },
  },
};
